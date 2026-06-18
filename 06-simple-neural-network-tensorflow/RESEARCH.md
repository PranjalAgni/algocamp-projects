# Research: Simple Neural Network in TensorFlow

## Concept Overview
A **feed-forward neural network** (also called a multi-layer perceptron, or MLP) is the foundational architecture in deep learning. It consists of:
- **Input layer**: raw features
- **Hidden layers**: Dense (fully-connected) layers with activation functions
- **Output layer**: produces predictions

Training involves:
1. **Forward pass**: compute predictions from inputs
2. **Loss computation**: measure error between predictions and true labels
3. **Backward pass (backpropagation)**: compute gradients of loss w.r.t. weights
4. **Optimization**: update weights using an optimizer (e.g., SGD, Adam) to minimize loss

## Key Concepts to Demonstrate
- **Dense layers**: each neuron connects to all neurons in the previous layer
- **Activation functions**: non-linearities (ReLU, sigmoid, softmax) that allow the network to learn complex patterns
- **Loss function**: cross-entropy for classification, MSE for regression
- **Optimizer**: Adam or SGD to update weights
- **Training loop**: iterate over epochs, feeding batches of data, tracking loss/accuracy
- **Evaluation**: test on held-out data to measure generalization

## Library Choices

### Option 1: TensorFlow.js for Node (`@tensorflow/tfjs-node`)
- **Pros**: 
  - Official TensorFlow for JavaScript
  - Uses native C++ bindings for performance
  - Full Keras-style API (sequential, compile, fit)
  - Fits the project title "TensorFlow"
- **Cons**: 
  - Native bindings may have issues on arm64/Apple Silicon
  - Heavier dependency
- **Decision**: Try this first since the project is named "TensorFlow"

### Option 2: Pure TypeScript from scratch
- **Pros**: 
  - Zero dependencies beyond dev tools
  - Educational: implement forward/backward pass manually
  - Guaranteed to run on any platform
- **Cons**: 
  - More code to write
  - Slower (no native acceleration)
- **Fallback**: Use if tfjs-node fails to install/run

## Dataset Choice
We need a small, fast dataset that:
- Trains in seconds on CPU
- Demonstrates non-linear classification
- Requires no network downloads

**Selected: Two-Moons synthetic dataset**
- Generate 300 points (240 train, 60 test)
- Two interleaving crescents (binary classification)
- Requires non-linearity to separate (tests the network's capacity)
- Deterministic generation (seed-based) for reproducibility

Alternatives considered:
- Iris (150 samples, too small)
- XOR (4 points, too trivial)
- Spiral (harder, but two-moons is sufficient for learning)

## Architecture Design
For two-moons:
```
Input (2) → Dense(8, relu) → Dense(4, relu) → Dense(2, softmax) → Output
```
- 2 input features (x, y coordinates)
- Two hidden layers with ReLU activation
- 2 output classes (softmax for probability distribution)
- ~150 trainable parameters (small but sufficient)

## Training Strategy
- **Loss**: Categorical cross-entropy (standard for multi-class classification)
- **Optimizer**: Adam (lr=0.01) — adaptive learning rate, faster convergence
- **Epochs**: 50 (sufficient for convergence on this dataset)
- **Batch size**: 32 (small dataset, so this is fine)
- **Metrics**: Accuracy (easy to interpret for learning)

Expected outcome: >95% test accuracy (two-moons is very learnable)

## Implementation Plan
1. Generate two-moons dataset with deterministic seed
2. Split into train/test (80/20)
3. Define model using Sequential API
4. Compile with Adam + categorical cross-entropy
5. Train for 50 epochs, logging every 10 epochs
6. Evaluate on test set
7. Run sample predictions

## Testing Strategy
- **Dataset tests**: verify shape, labels, split ratios
- **Training smoke test**: assert loss decreases OR accuracy increases
- Keep tests fast (<5 seconds total)

## Practical Assumptions
- CPU-only training is acceptable (small model, small dataset)
- No saved model persistence required (trains in seconds)
- Console output is sufficient (no visualization/plots)
- TypeScript/ESM for consistency with other projects

## References
- TensorFlow.js documentation: https://www.tensorflow.org/js
- Neural Networks and Deep Learning (Michael Nielsen): http://neuralnetworksanddeeplearning.com
- Two-moons dataset: classic synthetic benchmark from scikit-learn
