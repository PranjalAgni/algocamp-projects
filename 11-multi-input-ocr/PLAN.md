# Multi-Input OCR Model — Implementation Plan

## Goal

Build a **multi-input neural network** that classifies synthetic digit-like images (5 classes: 0-4) using:
1. Image input (14x14 grayscale)
2. Auxiliary feature input (5-dimensional vector)

The learning objective is **understanding multi-input architecture**, not achieving SOTA OCR performance.

## V1 Scope

### Core Deliverables

1. **Synthetic Dataset Generator** (`src/dataset.ts`)
   - Generate 14x14 images for digits 0-4 (simple programmatic patterns)
   - Compute auxiliary features: aspect ratio, fill density, symmetry, line counts, curve presence
   - Create train/test splits (e.g., 500 train, 100 test)
   - Return as tensors ready for training

2. **Multi-Input Model Builder** (`src/model.ts`)
   - **Image branch**: Input(14,14,1) → Flatten → Dense(64, relu) → output
   - **Auxiliary branch**: Input(5) → Dense(32, relu) → output
   - **Merge**: Concatenate both branches → Dense(64, relu)
   - **Head**: Dense(5, softmax)
   - Use `tf.model({ inputs: [imageInput, auxInput], outputs: head })`
   - Heavily commented to explain multi-input wiring

3. **Training Pipeline** (`src/train.ts`)
   - Compile model with Adam optimizer, categorical crossentropy
   - Fit with `[imageData, auxData]` input structure
   - Log epoch-by-epoch loss and accuracy
   - Return trained model and history

4. **Evaluation** (`src/evaluate.ts`)
   - Calculate test accuracy
   - Run sample predictions showing both inputs and predicted class
   - Clear output formatting

5. **Demo Script** (`src/demo.ts`)
   - Generate data → Build model → Train → Evaluate → Sample predictions
   - Print clear section headers and training progress
   - Run in seconds (small dataset, few epochs)

### Testing (`tests/`)

- `dataset.test.ts`: Validate shapes (image and aux), class distribution, value ranges
- `model.test.ts`: Check model accepts two inputs, outputs correct shape, parameter count reasonable
- `training.test.ts`: Smoke test (1-2 epochs, verify loss decreases OR accuracy > random)

### Documentation

- `README.md`: What it is, install, run demo, run tests, and a short, honest slice of real output (not a full pasted training-log dump)
- `.env.example`: Note "No API keys needed for this project"
- `.gitignore`: Standard Node ignores

## File Structure

```
11-multi-input-ocr/
├── RESEARCH.md          # Concept explanation, stack choice
├── PLAN.md              # This file
├── README.md            # User-facing docs
├── package.json         # Scripts: demo, test
├── tsconfig.json        # TypeScript config (ESM)
├── vitest.config.ts     # Test config
├── .env.example         # Empty or note "none needed"
├── .gitignore
├── src/
│   ├── dataset.ts       # Generate synthetic images + aux features
│   ├── model.ts         # Multi-input model builder
│   ├── train.ts         # Training logic
│   ├── evaluate.ts      # Evaluation utilities
│   └── demo.ts          # Main demo script
└── tests/
    ├── dataset.test.ts
    ├── model.test.ts
    └── training.test.ts
```

## Commands

```bash
npm install          # Install dependencies
npm run demo         # Generate data, train, evaluate
npm test             # Run all tests
```

## Success Criteria

- Model trains in < 30 seconds
- Test accuracy significantly above random (20% baseline for 5 classes) — target 60-80%
- Tests pass offline (no downloads)
- Code clearly demonstrates the multi-input pattern with comments

## Stretch Ideas (NOT v1)

- Try conv layers for image branch (instead of just flatten → dense)
- Visualize learned weights
- Add dropout/regularization
- Expand to full 10 digits
- Compare accuracy with vs. without auxiliary features
- Integrate real Tesseract.js for comparison
