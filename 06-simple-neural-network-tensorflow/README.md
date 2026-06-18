# Simple Neural Network in TensorFlow

A learning project demonstrating the fundamentals of feed-forward neural networks using TensorFlow.js for Node. This project trains a neural network on the classic "two-moons" dataset to illustrate core deep learning concepts: layers, activations, loss functions, optimizers, training loops, and evaluation.

## What This Project Demonstrates

- **Model Architecture**: Sequential API with Dense (fully-connected) layers
- **Activation Functions**: ReLU for hidden layers, Softmax for output
- **Loss Function**: Categorical Cross-Entropy for multi-class classification
- **Optimizer**: Adam with adaptive learning rate
- **Training Loop**: Forward pass, loss computation, backpropagation, weight updates
- **Evaluation**: Measuring generalization on held-out test data
- **Dataset**: Two-moons synthetic dataset (two interleaving crescents)

## Architecture

```
Input (2 features)
    ↓
Dense Layer (8 neurons, ReLU)
    ↓
Dense Layer (4 neurons, ReLU)
    ↓
Dense Layer (2 neurons, Softmax)
    ↓
Output (2 classes)
```

Total parameters: 70 (24 + 36 + 10)

## Installation

```bash
cd 06-simple-neural-network-tensorflow
npm install
```

## Usage

### Run the Demo

Train the neural network and see it in action:

```bash
npm run demo
```

This will:
1. Generate the two-moons dataset (300 samples: 240 train, 60 test)
2. Create and compile the neural network
3. Train for 50 epochs (~1 second on CPU)
4. Evaluate on the test set
5. Run sample predictions

### Run Tests

```bash
npm test
```

Tests validate:
- Dataset generation and splitting
- Model architecture correctness
- Loss decreases during training
- Accuracy improves over epochs
- Test accuracy exceeds 75% threshold

## Example Output

```
╔═══════════════════════════════════════════════════════╗
║   Simple Neural Network - TensorFlow.js Demo         ║
╚═══════════════════════════════════════════════════════╝

📊 Generating Two-Moons Dataset...
   Training samples: 240
   Test samples: 60
   Features per sample: 2

🧠 Creating Neural Network...

=== Model Architecture ===

__________________________________________________________________________________________
Layer (type)                Input Shape               Output shape              Param #   
==========================================================================================
dense_Dense1 (Dense)        [[null,2]]                [null,8]                  24        
__________________________________________________________________________________________
dense_Dense2 (Dense)        [[null,8]]                [null,4]                  36        
__________________________________________________________________________________________
dense_Dense3 (Dense)        [[null,4]]                [null,2]                  10        
==========================================================================================
Total params: 70
Trainable params: 70
Non-trainable params: 0
__________________________________________________________________________________________

⚙️  Compiling Model...
   Loss: Categorical Cross-Entropy
   Optimizer: Adam (learning rate = 0.01)
   Metrics: Accuracy

🏋️  Training Model (50 epochs)...

=== Starting Training ===

Epoch  1/50 - loss: 0.6985 - accuracy: 0.5370 - val_loss: 0.6558 - val_accuracy: 0.6250
Epoch 10/50 - loss: 0.2517 - accuracy: 0.8843 - val_loss: 0.2449 - val_accuracy: 0.8333
Epoch 20/50 - loss: 0.1736 - accuracy: 0.9352 - val_loss: 0.1756 - val_accuracy: 0.9167
Epoch 30/50 - loss: 0.0932 - accuracy: 0.9676 - val_loss: 0.1035 - val_accuracy: 0.9583
Epoch 40/50 - loss: 0.0396 - accuracy: 0.9954 - val_loss: 0.0371 - val_accuracy: 1.0000
Epoch 50/50 - loss: 0.0174 - accuracy: 1.0000 - val_loss: 0.0183 - val_accuracy: 1.0000

=== Training Complete ===

   Training completed in 1.16s
   Initial loss: 0.6985
   Final loss: 0.0174
   Initial accuracy: 53.70%
   Final accuracy: 100.00%

📈 Evaluating on Test Set...
Test Loss: 0.0106
Test Accuracy: 100.00%

🔮 Sample Predictions:
   Input: [0.00, 0.50] → Predicted Class: 1
   Input: [1.00, 0.00] → Predicted Class: 0
   Input: [0.50, 0.75] → Predicted Class: 0

╔═══════════════════════════════════════════════════════╗
║                   SUMMARY                             ║
╚═══════════════════════════════════════════════════════╝
   Dataset: Two-Moons (300 samples, 240 train / 60 test)
   Architecture: Dense(8,relu) → Dense(4,relu) → Dense(2,softmax)
   Training Time: 1.16s
   Final Test Accuracy: 100.00%
   Loss Reduction: 0.6985 → 0.0174

✅ Demo completed successfully!
```

## Key Concepts Explained

### Feed-Forward Neural Network
Data flows in one direction: input → hidden layers → output. Each layer transforms the data using learned weights and biases.

### Dense (Fully-Connected) Layers
Every neuron in one layer connects to every neuron in the next layer. The network learns the optimal weights for these connections.

### Activation Functions
- **ReLU** (Rectified Linear Unit): `f(x) = max(0, x)` - Introduces non-linearity, allowing the network to learn complex patterns
- **Softmax**: Converts logits to probability distribution - Essential for multi-class classification

### Loss Function
**Categorical Cross-Entropy**: Measures the difference between predicted probability distribution and true labels. Training minimizes this loss.

### Optimizer
**Adam** (Adaptive Moment Estimation): Combines momentum and adaptive learning rates for faster, more stable convergence than vanilla SGD.

### Training Process
1. **Forward Pass**: Compute predictions from inputs
2. **Loss Computation**: Calculate error between predictions and true labels
3. **Backward Pass (Backpropagation)**: Compute gradients of loss w.r.t. weights
4. **Weight Update**: Adjust weights using the optimizer to minimize loss

### Evaluation
Test the model on held-out data to measure **generalization** - how well it performs on data it hasn't seen during training.

## Project Structure

```
06-simple-neural-network-tensorflow/
├── src/
│   ├── dataset.ts      # Two-moons data generation + train/test split
│   ├── model.ts        # Neural network definition, compile, train, evaluate
│   └── demo.ts         # Main demo script
├── tests/
│   ├── dataset.test.ts # Dataset validation tests
│   └── training.test.ts # Training smoke tests
├── RESEARCH.md         # Background research and design decisions
├── PLAN.md            # Implementation plan
├── README.md          # This file
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
└── .env.example
```

## Technologies

- **Runtime**: Node.js v22
- **Language**: TypeScript (ESM)
- **ML Framework**: TensorFlow.js for Node (`@tensorflow/tfjs-node` v4.22.0)
- **Execution**: `tsx` for direct TypeScript execution
- **Testing**: Vitest

## Dataset: Two-Moons

The two-moons dataset consists of two interleaving crescent shapes (like two moons). It's a classic benchmark for testing classifiers because:
- Simple enough to train quickly
- Complex enough to require non-linear decision boundaries
- Visually intuitive (even though we're not plotting it here)

Parameters:
- 300 total samples (240 train, 60 test)
- 2 features per sample (x, y coordinates)
- 2 classes (moon 0 and moon 1)
- Gaussian noise added for realistic variability
- Deterministic generation (seeded) for reproducibility

## Performance

- **Training Time**: ~1-2 seconds on CPU (50 epochs)
- **Test Accuracy**: 100% (two-moons is very learnable with this architecture)
- **Loss Reduction**: 0.6985 → 0.0174 (97.5% reduction)
- **Model Size**: Only 70 parameters (very lightweight)

## Learning Notes

This project is intentionally simple to focus on core concepts:

1. **Small Dataset**: Trains in seconds, no GPU needed
2. **Shallow Network**: Only 2 hidden layers, easy to understand
3. **Clear Logging**: Every 10 epochs to see training progress
4. **Commented Code**: Explains the "why" behind each concept
5. **Fast Tests**: Complete in under 2 seconds

For production use, you'd typically need:
- Larger datasets and networks
- Regularization (dropout, L2)
- Batch normalization
- More sophisticated architectures (CNNs, RNNs, Transformers)
- Model checkpointing and versioning
- Cross-validation
- Hyperparameter tuning

## Environment Variables

None required! This project runs entirely offline with synthetic data.

See `.env.example` for confirmation.

## License

MIT
