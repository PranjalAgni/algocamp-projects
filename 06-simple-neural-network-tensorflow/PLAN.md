# Implementation Plan: Simple Neural Network in TensorFlow

## Goal
Build a runnable feed-forward neural network that trains on a synthetic dataset and demonstrates core deep learning concepts: layers, activations, loss, optimizer, training loop, and evaluation.

## Stack
- **Runtime**: Node v22 (TypeScript + ESM)
- **ML Library**: `@tensorflow/tfjs-node` (primary), fallback to pure TS if installation fails
- **Build/Run**: `tsx` for direct TS execution
- **Tests**: `vitest`
- **Dataset**: Two-moons (240 train, 60 test) — generated deterministically, no downloads

## File Structure
```
06-simple-neural-network-tensorflow/
├── RESEARCH.md          (✓ exists)
├── PLAN.md              (this file)
├── README.md
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── src/
│   ├── dataset.ts       # Two-moons data generation + train/test split
│   ├── model.ts         # Neural network definition, compile, train, evaluate
│   └── demo.ts          # Main demo script
└── tests/
    ├── dataset.test.ts  # Dataset shape/split validation
    └── training.test.ts # Smoke test: loss decreases or accuracy threshold
```

## Core Components

### 1. Dataset (`src/dataset.ts`)
- `generateTwoMoons(n, noise, seed)`: Generate synthetic two-moons dataset
- `splitTrainTest(data, labels, testRatio)`: 80/20 split
- Returns: `{ xTrain, yTrain, xTest, yTest }` as TensorFlow tensors (or plain arrays for pure TS)

### 2. Model (`src/model.ts`)
- `createModel()`: Define Sequential model:
  ```
  Dense(8, relu) → Dense(4, relu) → Dense(2, softmax)
  ```
- `trainModel(model, xTrain, yTrain, epochs)`: Fit with logging callbacks
- `evaluateModel(model, xTest, yTest)`: Compute test accuracy
- `predict(model, input)`: Run inference on sample points

### 3. Demo (`src/demo.ts`)
- Generate dataset
- Create and compile model
- Train for 50 epochs (log every 10)
- Evaluate on test set
- Run 3 sample predictions
- Print clear output format:
  ```
  Epoch 10/50 - loss: 0.1234 - accuracy: 0.8900
  ...
  Final Test Accuracy: 96.67%
  Sample Predictions: ...
  ```

## Commands
- `npm install` — install dependencies
- `npm run demo` — train and demo (should complete in <10 seconds)
- `npm test` — run vitest tests

## Tests
1. **Dataset tests** (`tests/dataset.test.ts`):
   - Train/test shapes correct (240/60 samples)
   - Labels are 0 or 1
   - Feature ranges reasonable (-2 to 3 for two-moons)

2. **Training smoke test** (`tests/training.test.ts`):
   - Train for 10 epochs (fast)
   - Assert: final loss < initial loss OR final accuracy > 75%
   - Runtime: <3 seconds

## Success Criteria
- [x] RESEARCH.md complete
- [ ] Code implements all components
- [ ] `npm run demo` trains successfully, prints epoch logs + test accuracy > 90%
- [ ] `npm test` passes all tests
- [ ] README.md shows a short, honest slice of real output (not a full pasted dump)
- [ ] No runtime errors, no warnings

## Stretch Goals (NOT v1)
- Visualization: plot decision boundary or training curves
- Hyperparameter tuning: grid search over learning rates
- Additional datasets: Iris, XOR, spiral
- Model checkpointing: save/load trained weights
- Different architectures: dropout, batch normalization
- Web demo: interactive visualization in browser

## Fallback Plan
If `@tensorflow/tfjs-node` fails to install/run on arm64:
1. Implement pure TypeScript version with manual matrix ops
2. Use simple arrays + loops for forward/backward pass
3. Implement SGD optimizer from scratch
4. Document in RESEARCH.md why fallback was needed
5. All other requirements stay the same
