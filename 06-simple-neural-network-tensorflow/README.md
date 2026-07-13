# 06 · Simple Neural Network in TensorFlow.js

Projects 01-05 called models that someone else trained. This one steps down a layer: it builds a
neural network from scratch and trains it, so the words "layer", "loss", "optimizer", and "epoch"
stop being jargon and become the few lines of code you actually wrote.

The task is deliberately tiny. A network with 70 parameters learns to separate the "two-moons"
dataset - two interleaving crescents that a straight line can't split. If it can bend a boundary
around those crescents, you've seen the one thing that makes a neural network more than linear
regression: stacked non-linear layers learn curved decision boundaries.

## Run it

```bash
npm install
npm run demo     # generate data, build the net, train 50 epochs, evaluate, predict
npm test         # vitest suite (14 tests, deterministic, offline)
```

No API key, no GPU, no network. `@tensorflow/tfjs-node` runs the whole thing on CPU in about a
second.

## The one idea

A neural network is a stack of layers, each doing the same two steps: multiply the input by a
weight matrix, then bend the result through a non-linear function. Reading `src/model.ts` top to
bottom, that's all `createModel` builds:

```
Input (2 features: x, y)
  → Dense(8, relu)     learn 8 intermediate features
  → Dense(4, relu)     combine them into 4
  → Dense(2, softmax)  turn those into 2 class probabilities
```

The `relu` (`max(0, x)`) is the part that matters. Remove the activations and the whole stack
collapses into a single linear map - no matter how many layers, it could only draw straight
boundaries and would never separate the moons. ReLU is the kink that lets the network bend.

Training is then just a loop TensorFlow runs for you inside `model.fit`: predict, measure error with
categorical cross-entropy, compute gradients by backpropagation, nudge every weight a step downhill
with the Adam optimizer, repeat for 50 epochs. Watch the loss fall from ~0.70 to somewhere in the
0.05-0.25 range and test accuracy land at 90-100% - that falling number *is* learning.

## What to watch in the output

- **The architecture summary** prints 70 total params (24 + 36 + 10). That count is small enough to
  reason about: 2×8 weights + 8 biases = 24 in the first layer, and so on. A neural net is just a
  lot of these numbers.
- **Loss and accuracy per epoch.** Loss starts near 0.69 - that's `-ln(0.5)`, exactly what you'd
  expect from a model guessing 50/50 on two classes before it has learned anything. It should fall
  steadily; a plateau means learning stalled.
- **Sample predictions.** The three probe points sit in the unambiguous body of each crescent, so a
  trained net labels them the same way every run (class 0, 1, 0). Points near the tips, where the
  moons interleave, are genuinely ambiguous and a 70-param net can flip them - which is why they
  make poor examples.

## The honest part

The dataset is seeded, but out of the box the *model weights* were not, so earlier versions of this
project trained from a different random starting point every run. Usually that was invisible
(two-moons is easy), but occasionally the net started in a bad spot and got stuck around 37%
accuracy - which made one training test flaky and meant the demo's numbers never reproduced twice.

`createModel` now seeds its kernel initializers (`glorotNormal({ seed })`), so initialization is
reproducible and the stuck-at-37% failure is gone. That is a real lesson, not just housekeeping:
**reproducibility in ML requires seeding every source of randomness - data generation, the
train/test shuffle, *and* weight initialization.** Seed only some of them and your results still
wander.

Note that seeding the weights did not make the demo fully deterministic: the mini-batch shuffle
inside `fit` is still unseeded, so final loss lands in two loose clusters (~0.05 at 100% accuracy,
or ~0.22 at ~90%) from run to run. That leftover source of randomness is exactly why the numbers
above are given as ranges - a concrete reminder that "I seeded it" and "it's reproducible" are not
the same claim until you've found *every* source.

## Files

```
src/
  dataset.ts   two-moons generation (seeded LCG + Box-Muller noise) and train/test split
  model.ts     build, compile, train, evaluate, predict; seeded weight init
  demo.ts      the full workflow, start to finish
tests/
  dataset.test.ts    shape, split ratio, determinism of the data
  training.test.ts   loss decreases, accuracy improves, test accuracy clears 75%
```

`RESEARCH.md` records why two-moons and this architecture were chosen; `PLAN.md` lists the build
steps and stretch ideas.

## Where to go next

- Break it to understand it: change all three activations to `'linear'` and re-run. Accuracy should
  collapse toward chance, because a purely linear stack can't bend a boundary around the crescents.
  Put ReLU back and it recovers - non-linearity shown rather than asserted.
- Turn up `noise` in `prepareTwoMoonsDataset` (try 0.3) and watch the two moons blur together and
  test accuracy fall. That is the data-quality ceiling every model lives under.
- We built and trained a net by hand here. Project 07 goes the other direction - using a large
  pretrained model (Claude) as a coding agent - so you've now seen both ends: the machinery
  underneath, and the high-level tools built on top of it.
