/**
 * Autoencoder Model Architecture
 *
 * An autoencoder is an unsupervised learning architecture that learns to compress
 * and reconstruct data. It consists of two main parts:
 *
 * 1. ENCODER: Compresses input (784 dims) → latent space (32 dims)
 *    - Forces the network to learn the most important features
 *    - Acts as dimensionality reduction / feature extraction
 *
 * 2. DECODER: Reconstructs input from latent space (32 dims) → output (784 dims)
 *    - Learns to reverse the compression
 *    - Output should match the original input
 *
 * LOSS: Reconstruction error (how different is output from input?)
 * - Binary cross-entropy: treats each pixel as a probability in [0, 1]
 * - Training minimizes this error, forcing the network to learn good features
 *
 * KEY INSIGHT: The bottleneck (32 dims) forces compression, so the network
 * can't just memorize inputs - it must learn meaningful representations.
 */

import * as tf from '@tensorflow/tfjs-node';

/**
 * Hyperparameters for the autoencoder architecture.
 */
export interface AutoencoderConfig {
  inputDim: number;     // 784 (28×28 flattened image)
  latentDim: number;    // 32 (compressed representation)
  encoderHidden: number[]; // Hidden layer sizes for encoder [128, 64]
  decoderHidden: number[]; // Hidden layer sizes for decoder [64, 128] (symmetric)
}

/**
 * Default configuration for the autoencoder.
 */
export const DEFAULT_CONFIG: AutoencoderConfig = {
  inputDim: 784,      // 28×28 pixels
  latentDim: 32,      // Bottleneck dimension
  encoderHidden: [128, 64], // Gradual compression: 784→128→64→32
  decoderHidden: [64, 128], // Symmetric expansion: 32→64→128→784
};

/**
 * Build the encoder network: compresses input to latent space.
 *
 * Architecture:
 * - Input: 784 dimensions (flattened 28×28 image)
 * - Hidden layers: [128, 64] with ReLU activation
 * - Output: 32 dimensions (latent representation)
 *
 * ReLU (Rectified Linear Unit): f(x) = max(0, x)
 * - Introduces non-linearity (neural networks need this to learn complex patterns)
 * - Computationally efficient
 * - Prevents vanishing gradients during training
 *
 * @param config Autoencoder configuration
 * @returns Encoder model
 */
export function buildEncoder(config: AutoencoderConfig = DEFAULT_CONFIG): tf.Sequential {
  const encoder = tf.sequential({ name: 'encoder' });

  // Input layer
  encoder.add(
    tf.layers.dense({
      units: config.encoderHidden[0], // 128 neurons
      activation: 'relu',
      inputShape: [config.inputDim], // 784 input features
      name: 'encoder_hidden_1',
    })
  );

  // Second hidden layer (further compression)
  encoder.add(
    tf.layers.dense({
      units: config.encoderHidden[1], // 64 neurons
      activation: 'relu',
      name: 'encoder_hidden_2',
    })
  );

  // Latent layer (bottleneck) - no activation (linear)
  // This is the compressed representation we'll visualize
  encoder.add(
    tf.layers.dense({
      units: config.latentDim, // 32 neurons (latent space)
      name: 'latent',
    })
  );

  return encoder;
}

/**
 * Build the decoder network: reconstructs input from latent space.
 *
 * Architecture:
 * - Input: 32 dimensions (latent representation)
 * - Hidden layers: [64, 128] with ReLU activation (mirrors encoder)
 * - Output: 784 dimensions with sigmoid activation
 *
 * Sigmoid activation: f(x) = 1 / (1 + e^(-x))
 * - Squashes output to [0, 1] range
 * - Perfect for reconstructing pixel values (which are normalized to [0, 1])
 * - Works well with binary cross-entropy loss
 *
 * @param config Autoencoder configuration
 * @returns Decoder model
 */
export function buildDecoder(config: AutoencoderConfig = DEFAULT_CONFIG): tf.Sequential {
  const decoder = tf.sequential({ name: 'decoder' });

  // First hidden layer
  decoder.add(
    tf.layers.dense({
      units: config.decoderHidden[0], // 64 neurons
      activation: 'relu',
      inputShape: [config.latentDim], // 32 input features from latent space
      name: 'decoder_hidden_1',
    })
  );

  // Second hidden layer (gradual expansion)
  decoder.add(
    tf.layers.dense({
      units: config.decoderHidden[1], // 128 neurons
      activation: 'relu',
      name: 'decoder_hidden_2',
    })
  );

  // Output layer: reconstruct original 784 dimensions
  // Sigmoid ensures pixel values are in [0, 1]
  decoder.add(
    tf.layers.dense({
      units: config.inputDim, // 784 neurons (same as input)
      activation: 'sigmoid',  // Output range [0, 1]
      name: 'reconstruction',
    })
  );

  return decoder;
}

/**
 * Build the complete autoencoder by chaining encoder and decoder.
 *
 * Data flow:
 * Input [784] → Encoder → Latent [32] → Decoder → Reconstruction [784]
 *
 * The model is trained end-to-end to minimize reconstruction error.
 * Gradients flow backwards through both encoder and decoder.
 *
 * @param config Autoencoder configuration
 * @returns Complete autoencoder model
 */
export function buildAutoencoder(config: AutoencoderConfig = DEFAULT_CONFIG): tf.Sequential {
  const encoder = buildEncoder(config);
  const decoder = buildDecoder(config);

  // Chain encoder and decoder into a single model
  const autoencoder = tf.sequential({ name: 'autoencoder' });

  // Add all encoder layers
  encoder.layers.forEach(layer => autoencoder.add(layer));

  // Add all decoder layers
  decoder.layers.forEach(layer => autoencoder.add(layer));

  return autoencoder;
}

/**
 * Build the autoencoder AND return the encoder that is part of it.
 *
 * Why this exists: `buildAutoencoder` composes the model from a *fresh*
 * encoder/decoder built inside it, so the caller gets no handle on the
 * encoder whose weights actually get trained. If you separately call
 * `buildEncoder()` and train the autoencoder, that standalone encoder keeps
 * its random initial weights - encoding an image with it shows a meaningless
 * latent vector, not what the model learned.
 *
 * This function shares the SAME layer instances between the returned encoder
 * and the autoencoder. Training the autoencoder updates those layers in place,
 * so `encoder.predict(image)` afterwards returns the trained latent vector.
 *
 * @param config Autoencoder configuration
 * @returns Both the full autoencoder and the encoder sharing its trained weights
 */
export function buildAutoencoderWithEncoder(
  config: AutoencoderConfig = DEFAULT_CONFIG
): { autoencoder: tf.Sequential; encoder: tf.Sequential } {
  const encoder = buildEncoder(config);
  const decoder = buildDecoder(config);

  const autoencoder = tf.sequential({ name: 'autoencoder' });
  encoder.layers.forEach(layer => autoencoder.add(layer));
  decoder.layers.forEach(layer => autoencoder.add(layer));

  return { autoencoder, encoder };
}

/**
 * Compile the autoencoder with loss function and optimizer.
 *
 * Loss: Binary Cross-Entropy
 * - Measures reconstruction error for each pixel
 * - Treats each pixel as a probability in [0, 1]
 * - Formula: -sum(y_true * log(y_pred) + (1 - y_true) * log(1 - y_pred))
 * - Better than MSE for image reconstruction (handles the [0,1] probability space)
 *
 * Optimizer: Adam (Adaptive Moment Estimation)
 * - Combines momentum with adaptive learning rates
 * - Generally converges faster than vanilla SGD
 * - Learning rate 0.001 is a good default for autoencoders
 *
 * @param model The autoencoder model to compile
 * @param learningRate Learning rate for Adam optimizer
 */
export function compileAutoencoder(
  model: tf.Sequential,
  learningRate: number = 0.001
): void {
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'binaryCrossentropy', // Reconstruction loss
    metrics: ['mse'], // Also track mean squared error for comparison
  });
}

/**
 * Encode images to their latent representations.
 *
 * This demonstrates what the autoencoder has learned: it compresses
 * 784-dimensional images to just 32 dimensions while preserving
 * the information needed to reconstruct them.
 *
 * @param encoder Trained encoder model
 * @param images Input images [batchSize, 784]
 * @returns Latent vectors [batchSize, 32]
 */
export function encode(encoder: tf.Sequential, images: tf.Tensor2D): tf.Tensor2D {
  return encoder.predict(images) as tf.Tensor2D;
}

/**
 * Decode latent vectors back to images.
 *
 * @param decoder Trained decoder model
 * @param latentVectors Latent representations [batchSize, 32]
 * @returns Reconstructed images [batchSize, 784]
 */
export function decode(decoder: tf.Sequential, latentVectors: tf.Tensor2D): tf.Tensor2D {
  return decoder.predict(latentVectors) as tf.Tensor2D;
}

/**
 * Print a summary of the autoencoder architecture.
 * Shows layer structure, output shapes, and parameter counts.
 */
export function printModelSummary(model: tf.Sequential): void {
  console.log('\n=== Model Architecture ===\n');
  model.summary();
  console.log('');
}
