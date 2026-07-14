# 12 · MNIST Autoencoder

An autoencoder is a network that learns to copy its input to its output - but through a bottleneck too small to fit the input. To reconstruct a 784-pixel image after squeezing it down to 32 numbers, the network has no choice but to learn which structure in the data is worth keeping. That forced compression, learned without any labels, is the whole idea.

This is the last project in the series and the only one that trains a model with no labels at all - unsupervised learning. (Projects 06 and 11 trained against labels; project 03 worked with unlabeled text but used a pretrained embedding model rather than training one.) Everything runs offline on synthetic digits - no MNIST download, no API key.

## Run it

```bash
npm install
npm run demo    # generate data, train 15 epochs, show reconstructions + a latent vector
npm test        # vitest, offline
```

The demo prints each digit as ASCII art (` .:-=+*#%@█` mapped over pixel intensity) with the original on the left and the reconstruction on the right, so you can see the network learning shape before it learns sharpness.

## The one idea

Supervised learning needs a target that is different from the input (an image and its label). An autoencoder makes the input its own target:

```
image (784) -> encoder -> latent (32) -> decoder -> reconstruction (784)
                          ^^^^^^^^^^^^
                          the bottleneck
loss = how different is the reconstruction from the original image?
```

If the latent layer were 784-wide, the network could learn the identity function and "reconstruct" perfectly by memorising. The 32-wide bottleneck makes that impossible: 752 dimensions of information have to be thrown away and then guessed back. The only way to keep reconstruction error low is to throw away the *redundant* dimensions and keep the *informative* ones. Those 32 numbers are the learned representation.

No labels appear anywhere in training. The digit classes (0, 1, 2) are used only to *generate* varied images and to caption the demo output - the model never sees them.

## What the demo actually shows

- **Reconstruction loss falls steeply, then flattens.** Binary cross-entropy starts near 0.67 and lands around 0.20 after 15 epochs (~70% reduction); test loss tracks it (~0.22), which is the point - similar train and test error means the network learned the digit *structure*, not the training pixels.
- **Reconstructions are blurry, and that is correct.** The output layer is sigmoid, and 32 dimensions cannot carry the exact noise pattern of every image. You get the smooth "average" shape of each digit - a filled ring for 0, a bar for 1 - with the per-image speckle averaged away. Blur is the compression showing through, not a bug.
- **The latent vector is 32 real numbers.** The demo encodes one test image and prints the vector plus its min/mean/max. There is nothing human-readable in it; it is just the coordinates the encoder chose. The teachable fact is only that 784 numbers went in and 32 came out with enough retained to rebuild the image.

Exact numbers drift run to run: the dataset is seeded (`generateDataset(..., seed=42)`) but tfjs weight initialisation and the per-epoch batch shuffle are not, so treat the values above as ballpark, not fixed. (Project 06 in this series has the same property and a longer note on why "seeded" does not mean "reproducible".)

## The gotcha this project was built to teach

A real bug lived in the demo and is worth understanding, because it is the kind of mistake that produces convincing-but-meaningless output.

The demo used to build a standalone encoder with `buildEncoder()`, then separately build and train the autoencoder. Those are **independent networks with independent weights**. Training updated the autoencoder; the standalone encoder kept its random initial weights. The "latent space encoding" the demo proudly displayed was therefore computed by an *untrained* encoder - random projections of the image, presented as "what the model learned."

The fix is a one-liner in principle and a real lesson in practice: the encoder you visualise must be the *same layer objects* that got trained. `buildAutoencoderWithEncoder()` now composes the autoencoder from a shared encoder/decoder and hands both back, so training the autoencoder trains the encoder in place. The regression test in `tests/train.test.ts` encodes one image before and after training and asserts the latent vector moved - if the demo ever reads an untrained encoder again, that test fails.

(The old code also shipped an `extractEncoder()` helper meant to slice the encoder out of a trained autoencoder. It never worked - reusing a layer in a `Sequential` model gives its output multiple inbound nodes, and tfjs throws `Layer latent has multiple inbound nodes`. It was dead code and has been removed; sharing the layer instances up front is the approach that actually works.)

Lesson theme: a model that runs and prints plausible numbers is not the same as a model that is wired correctly. Verify that the thing you are *measuring* is the thing you *trained*.

## Files

```
src/
  data.ts       synthetic 28×28 digit images (0, 1, 2) via a seeded LCG - no MNIST download
  model.ts      buildEncoder/buildDecoder and buildAutoencoderWithEncoder (the shared-layer fix)
  train.ts      compile, fit, evaluate, and reconstruct helpers (input is its own target)
  visualize.ts  ASCII-art rendering of images, side-by-side comparison, latent-vector print
  demo.ts       the full workflow - generate, train 15 epochs, reconstruct, show a latent vector
tests/
  data.test.ts    shapes, pixel range, class balance, seeded determinism
  model.test.ts   encoder/decoder/autoencoder shapes, layer count, sigmoid output
  train.test.ts   loss decreases, reconstructions differ from noise, the trained-encoder guard
```

`RESEARCH.md` records why an autoencoder and synthetic digits; `PLAN.md` lists the build order.

## Where to go next

This closes the loop opened in project 06 (a supervised classifier on tfjs) and project 03 (embeddings as learned vectors). An autoencoder's latent space is an embedding you trained yourself, with no labels - the same "data becomes a vector where geometry is meaning" idea from project 03, arrived at through reconstruction instead of a pretrained model.

Natural next steps, if you want to keep going: shrink the bottleneck (16, 8, 4) and watch reconstructions degrade to find where the digits stop being separable; add Gaussian noise to the input but keep the clean image as the target to build a denoising autoencoder; or flag unseen shapes by their high reconstruction error (anomaly detection).
