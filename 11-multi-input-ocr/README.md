# 11 · Multi-Input Neural Network

Every model so far took one input: a string, an image, a feature vector. Real problems rarely arrive
that cleanly. A fraud model sees the transaction *and* the account history. A medical model sees the
X-ray *and* the patient's chart. This project builds the smallest architecture that handles two
inputs at once, and shows the one Keras/TensorFlow.js idea that makes it possible.

The task is OCR-flavoured: classify a synthetic digit (0-4) from a 14×14 image **plus** a 5-number
"hint" vector. But the digit-recognition is a prop. The thing to learn is how you wire two inputs
into one model - and, just as importantly, how to tell whether the second input is actually pulling
its weight.

## Run it

```bash
npm install
npm run demo     # generate data, build the two-branch model, train 20 epochs, evaluate, predict
npm test         # vitest suite (22 tests, offline)
```

No API key, no downloads. `@tensorflow/tfjs-node` trains the whole thing on CPU in a few seconds.

## The one idea

A single-input model is a straight line of layers: `input → dense → dense → output`. A multi-input
model is a small graph. You define each input separately, run it through its own layers, then
**concatenate** the two learned representations into one vector and continue:

```
image (14×14×1) → flatten → dense(64, relu) ┐
                                            ├─ concatenate(96) → dense(64) → dropout → dense(5, softmax)
aux (5)         → dense(32, relu) ──────────┘
```

The whole trick lives in three lines of `src/model.ts`:

```ts
const merged = tf.layers.concatenate().apply([imageFeatures, auxFeatures]);
// ...
const model = tf.model({ inputs: [imageInput, auxInput], outputs: output });
```

`inputs` is an **array**, not a single tensor. That one change is what separates the functional API
from the `Sequential` stack you used in project 06. It ripples outward: `fit`, `evaluate`, and
`predict` all now take `[imageData, auxData]` instead of one tensor. Get the order wrong and the
model silently trains on garbage, so the array order is part of the model's contract.

Each branch can be shaped for its input - a convolutional stack for the image, a couple of dense
layers for the tabular hints - and they only have to agree at the concatenation point, where their
outputs become one 96-dimensional vector (64 + 32).

## The honest part: does the second input actually help?

The demo trains, evaluates, and prints **100% test accuracy**. That number is real - it reproduces -
but taken at face value it is misleading, and the interesting lesson is *why*.

Two things make this dataset trivially easy:

1. **The images are fixed templates.** `drawDigit` draws the same shape for every sample of a class,
   with only light random pixel noise. All 100 images of a "1" are nearly identical, so a model can
   memorise five pictures.
2. **The auxiliary vector nearly leaks the label.** Four of the five aux features are honestly
   computed from the image (aspect ratio, fill density, symmetry, horizontal-line count). But feature
   five is a per-label lookup - `[0.8, 0.1, 0.5, 0.9, 0.2][label]` plus ±0.1 noise. Those five values
   are far enough apart that the noise never overlaps them, so that single number almost tells you the
   answer.

The consequence, which you can measure: **each input solves the task on its own.** Training two
single-input models on the same data (a quick ablation, worth doing yourself):

```
image-only test acc: 100.00%
aux-only  test acc:  99.00%
```

So on *this* data the multi-input architecture buys nothing - either branch alone would ace it. The
combined 100% is not evidence that "the model learned to use both inputs"; it's evidence that the
task is too easy to distinguish the architectures. **A headline accuracy number tells you nothing
until you know what the baselines are.** The honest way to prove a second input helps is an ablation:
train with it, train without it, and show the gap. Here there is no gap, and the demo says so rather
than pretending otherwise.

That does not make the code wrong - the wiring, the concatenation, the array-shaped `fit`/`predict`
calls are all exactly how a real multi-input model is built. It makes the *dataset* a teaching prop,
and the ablation the real lesson.

## Files

```
src/
  dataset.ts    synthetic digit images + the 5-feature aux vector (see the honest note on feature 5)
  model.ts      the two-branch model - the ★ file; concatenate + inputs-as-array live here
  train.ts      model.fit with inputs passed as [images, aux]
  evaluate.ts   evaluate + sample predictions + ASCII image visualiser
  demo.ts       the full pipeline start to finish
tests/
  dataset.test.ts    shapes, class balance, tensor conversion
  model.test.ts      two inputs, output shape, param count, single-input predict throws
  training.test.ts   loss decreases, accuracy improves across a short run
```

`RESEARCH.md` records why TensorFlow.js over Python here; `PLAN.md` lists the build order.

## Where to go next

- **Do the ablation for real.** Build a one-input version of the model (drop the aux branch, keep only
  the image input and its dense layer) and compare test accuracy. On this data you'll see it barely
  moves - that null result *is* the lesson about when a second input is worth its complexity.
- **Make the aux input honest.** Delete feature 5 (the label lookup) from `computeAuxFeatures` and
  retrain. Now the aux vector only carries real image-derived signal, the aux-only accuracy drops, and
  the two branches finally have complementary information to merge - which is the case multi-input
  models actually exist for.
- **Harder images.** Turn up the pixel noise in `drawDigit` or add per-sample shifts so the templates
  stop being identical, and the image branch has to generalise instead of memorise.
- Project 12 stays in TensorFlow.js but changes the goal from classification to reconstruction: an
  autoencoder that compresses MNIST digits and rebuilds them, with no labels at all.
```
