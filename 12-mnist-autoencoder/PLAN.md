# MNIST Autoencoder - Implementation Plan

## Project Goal

Build a functional autoencoder that compresses 28×28 digit images to a 32-dimensional latent space and reconstructs them, demonstrating unsupervised feature learning.

## V1 Scope (Tight Focus)

### Core Features

1. **Synthetic Data Generation** (`src/data.ts`)
   - Generate 28×28 grayscale images for digits 0, 1, 2
   - Simple geometric shapes (circle, line, bars)
   - Randomized positioning + slight noise
   - ~400 images total (300 train, 100 test)
   - Return as Float32Array normalized to [0, 1]

2. **Autoencoder Model** (`src/model.ts`)
   - **Encoder**: 784 → 128 (ReLU) → 64 (ReLU) → 32 (latent)
   - **Decoder**: 32 → 64 (ReLU) → 128 (ReLU) → 784 (sigmoid)
   - Binary cross-entropy loss (better for [0,1] pixel probabilities)
   - Adam optimizer (lr=0.001)
   - Well-commented explaining each layer's purpose

3. **Training Loop** (`src/train.ts`)
   - Train for 15 epochs (enough to see convergence, fast on CPU)
   - Log reconstruction loss per epoch
   - Return training history

4. **Visualization** (`src/visualize.ts`)
   - ASCII art renderer for 28×28 images
   - Side-by-side original vs reconstructed display
   - Show latent vector encoding for sample digit

5. **Demo Script** (`src/demo.ts`)
   - Generate synthetic data
   - Build and train autoencoder
   - Print loss curve (epoch-by-epoch)
   - Reconstruct 3 test images with ASCII visualization
   - Show latent encoding for one digit
   - Report final reconstruction error (MSE)

### Testing Strategy (`tests/`)

1. **Model Architecture Test** (`model.test.ts`)
   - Verify encoder output shape: [batch, 32]
   - Verify decoder output shape: [batch, 784]
   - Verify full autoencoder: input [batch, 784] → output [batch, 784]

2. **Training Smoke Test** (`train.test.ts`)
   - Generate small dataset (50 images)
   - Train for 3 epochs
   - Assert final loss < initial loss (learning is happening)
   - Should complete in a few seconds

3. **Data Generation Test** (`data.test.ts`)
   - Verify output shape [n, 784]
   - Verify values in range [0, 1]
   - Verify deterministic generation (same seed → same data)

## File Layout

```
12-mnist-autoencoder/
├── src/
│   ├── data.ts          # Synthetic digit image generation
│   ├── model.ts         # Autoencoder architecture (encoder + decoder)
│   ├── train.ts         # Training loop with history tracking
│   ├── visualize.ts     # ASCII art image rendering
│   └── demo.ts          # Main demo: train + reconstruct + visualize
├── tests/
│   ├── data.test.ts     # Data generation tests
│   ├── model.test.ts    # Architecture shape tests
│   └── train.test.ts    # Training smoke test
├── RESEARCH.md          # Concept background + stack decision
├── PLAN.md              # This file
├── README.md            # How to run, example output
├── package.json         # Dependencies + scripts
├── tsconfig.json        # TypeScript config (ESM)
├── vitest.config.ts     # Test config
├── .gitignore           # node_modules, .env, etc.
└── .env.example         # (Empty - no env vars needed)
```

## Commands

```bash
npm install          # Install dependencies
npm run demo         # Train autoencoder + show reconstructions
npm test             # Run all vitest tests
```

## Expected Demo Output

```
=== Generating Synthetic Digit Data ===
Generated 300 training images, 100 test images

=== Building Autoencoder ===
Encoder: 784 → 128 → 64 → 32
Decoder: 32 → 64 → 128 → 784

=== Training (15 epochs) ===
Epoch  1/15 - loss: 0.3245
Epoch  2/15 - loss: 0.2103
...
Epoch 15/15 - loss: 0.0821

=== Training Complete ===

=== Reconstructing Test Images ===

Original (Digit 0):
[ASCII art circle]

Reconstructed:
[ASCII art circle - slightly blurry]

Reconstruction Error: 0.0234

[... 2 more examples ...]

=== Latent Space Encoding ===
Input: Digit 1
Latent Vector (32 dims): [0.12, -0.45, 0.78, ...]
```

## Implementation Order

1. RESEARCH.md (done)
2. PLAN.md (this file)
3. Setup: package.json, tsconfig.json, vitest.config.ts, .gitignore, .env.example
4. Implement: data.ts (test-driven)
5. Implement: model.ts (test-driven)
6. Implement: visualize.ts
7. Implement: train.ts (test-driven)
8. Implement: demo.ts
9. Run feedback loop: `npm install → npm run demo → npm test` until passing
10. Write README.md with actual output

## Stretch Ideas (NOT v1 - document only)

- Compare reconstruction quality with different bottleneck sizes (16, 32, 64, 128)
- Add batch normalization to stabilize training
- Implement a convolutional autoencoder (better for images)
- Variational autoencoder (VAE) for generative modeling
- t-SNE visualization of latent space clustering
- Anomaly detection: train on digits 0-2, test on digit 3 (high reconstruction error)
- Add more complex synthetic digits (3-9) with curves and angles
- Save/load trained model weights to disk
- Interactive web demo with real drawing input

## Key Learning Outcomes

After completing this project, a learner will understand:
1. How autoencoders compress and reconstruct data
2. The role of the bottleneck/latent space in forcing feature learning
3. Reconstruction loss as a self-supervised learning signal
4. Encoder-decoder symmetry in architecture design
5. Trade-offs between compression ratio and reconstruction quality
6. Practical TensorFlow.js model building (Sequential API, layers, compilation, training)
