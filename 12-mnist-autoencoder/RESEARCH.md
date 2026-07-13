# Autoencoder Research

## What is an Autoencoder?

An **autoencoder** is an unsupervised neural network architecture that learns efficient data representations (encodings) by training the network to reconstruct its input. The key idea is to compress input data through a bottleneck layer, forcing the network to learn the most important features.

### Architecture Components

1. **Encoder**: Compresses input into a lower-dimensional latent space (bottleneck)
   - Input: e.g., 784-dimensional vector (28×28 flattened image)
   - Output: e.g., 32-dimensional latent vector

2. **Latent Space (Bottleneck)**: The compressed representation
   - Acts as a dimensionality reduction
   - Forces the network to learn meaningful features
   - Can be used for visualization, clustering, anomaly detection

3. **Decoder**: Reconstructs the original input from the latent representation
   - Input: e.g., 32-dimensional latent vector
   - Output: e.g., 784-dimensional vector (reconstructed image)

### Loss Function

**Reconstruction Loss**: Measures how well the output matches the input
- **Mean Squared Error (MSE)**: Common for continuous data
  - `loss = mean((input - reconstruction)²)`
- **Binary Cross-Entropy**: Better for pixel values normalized to [0,1]
  - Treats each pixel as a probability
  - More appropriate for image reconstruction

### Learning Objectives

This project teaches:
1. **Encoder-Decoder Architecture**: Symmetric compression/decompression
2. **Dimensionality Reduction**: 784 → 32 → 784 (forced feature learning)
3. **Reconstruction Loss**: Self-supervised learning (no labels needed)
4. **Latent Space Visualization**: Understanding what the network learns
5. **Trade-offs**: Bottleneck size vs. reconstruction quality

## Technology Stack Decision

### Language: TypeScript

Following project standards, using TypeScript for consistency with other projects.

### ML Framework: TensorFlow.js (`@tensorflow/tfjs-node`)

**Why TensorFlow.js?**
- Confirmed working on arm64 macOS (sibling project 06-simple-neural-network-tensorflow runs successfully)
- Node bindings (`@tensorflow/tfjs-node`) provide CPU performance via native TensorFlow
- Sequential API is perfect for autoencoder architecture
- No API keys or network required for training
- Built-in optimizers (Adam) and loss functions (MSE, binary crossentropy)

**Alternatives Considered:**
- Python + TensorFlow/Keras: More common for deep learning, but adds Python venv complexity. TensorFlow.js is sufficient for this learning project.
- Python + PyTorch: Similar to above, overkill for a simple autoencoder.
- NumPy from scratch: Great for learning low-level concepts, but TensorFlow.js better teaches practical autoencoder construction.

### Data Strategy: Synthetic Digit-like Images (Offline)

**Decision**: Generate synthetic 28×28 digit-like images programmatically for **guaranteed offline operation**.

**Why Synthetic?**
- **100% Offline**: No network required, no download failures
- **Deterministic**: Same data every run, reproducible results
- **Sufficient for Learning**: Goal is to understand autoencoder concepts, not SOTA reconstruction
- **Fast**: Generate on-demand, no large files to bundle

**What We'll Generate:**
- Simple geometric shapes representing digits 0, 1, 2
  - **0**: Circle/ellipse
  - **1**: Vertical line/rectangle
  - **2**: Two horizontal bars with offset
- 28×28 grayscale images with pixel values in [0, 1]
- Randomized positioning and slight noise for variability
- Dataset size: ~300-500 images total (enough to see loss decrease without slow training)

**Alternative (Not Chosen):**
- Real MNIST subset: Would require bundling binary data or downloading at runtime, risks offline failures

## Practical Assumptions

1. **Training Speed**: Keep epochs low (10-20) and dataset small (300-500 images) for fast feedback (seconds to a minute)
2. **Bottleneck Size**: 32 dimensions is a good balance (significant compression from 784, but not too extreme)
3. **Visualization**: ASCII art reconstruction since no GUI needed and works perfectly offline
4. **Encoder/Decoder Architecture**:
   - Encoder: 784 → 128 → 64 → 32 (gradual compression)
   - Decoder: 32 → 64 → 128 → 784 (symmetric expansion)
   - ReLU activation in hidden layers, sigmoid in output (for [0,1] pixel values)

## Key References

- TensorFlow.js Sequential API: https://js.tensorflow.org/api/latest/#sequential
- Autoencoder basics: Unsupervised feature learning through reconstruction
- Sibling project `06-simple-neural-network-tensorflow` for TensorFlow.js patterns
- Loss functions: Binary cross-entropy more suitable for image pixels than MSE

## Success Criteria

- Model trains and reconstruction loss decreases over epochs
- Reconstructed images visually resemble inputs (via ASCII visualization)
- Latent space is demonstrably smaller (32 dims vs 784 dims)
- All tests pass (shape validation, loss decrease)
- Runs offline in under 1 minute
