/**
 * Autoencoder Demo
 *
 * Complete demonstration of training an autoencoder on synthetic MNIST-like digits.
 *
 * Steps:
 * 1. Generate synthetic digit data (0, 1, 2)
 * 2. Build autoencoder architecture (encoder + decoder)
 * 3. Train to minimize reconstruction error
 * 4. Reconstruct test images and visualize results
 * 5. Show latent space encodings
 */

import * as tf from '@tensorflow/tfjs-node';
import { generateDataset } from './data.js';
import {
  buildAutoencoderWithEncoder,
  compileAutoencoder,
  printModelSummary,
} from './model.js';
import {
  trainAutoencoder,
  evaluateAutoencoder,
  reconstructImages,
} from './train.js';
import {
  showComparison,
  showLatentVector,
  showTrainingProgress,
} from './visualize.js';

/**
 * Main demo function.
 */
async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   MNIST Autoencoder Demonstration     ║');
  console.log('╚════════════════════════════════════════╝\n');

  // =========================================================
  // STEP 1: Generate Synthetic Data
  // =========================================================
  console.log('=== Step 1: Generating Synthetic Digit Data ===\n');

  const dataset = generateDataset(
    300, // 300 training images
    100, // 100 test images
    28,  // 28×28 pixels
    42   // Random seed
  );

  console.log(`Generated ${dataset.trainImages.length / 784} training images`);
  console.log(`Generated ${dataset.testImages.length / 784} test images`);
  console.log(`Image size: ${dataset.imageSize}×${dataset.imageSize} pixels`);
  console.log(`Digits: 0, 1, 2 (balanced distribution)`);

  // =========================================================
  // STEP 2: Build Autoencoder Model
  // =========================================================
  console.log('\n=== Step 2: Building Autoencoder ===\n');

  // Build the autoencoder and keep a handle on the encoder that is part of it.
  // They share the same layer instances, so training the autoencoder below also
  // trains this encoder - Step 5 can then read the learned latent vector from it.
  const { autoencoder, encoder } = buildAutoencoderWithEncoder();
  compileAutoencoder(autoencoder, 0.001); // Learning rate 0.001

  printModelSummary(autoencoder);

  console.log('Architecture:');
  console.log('  Encoder: 784 → 128 → 64 → 32 (compression)');
  console.log('  Decoder: 32 → 64 → 128 → 784 (reconstruction)');
  console.log('  Loss: Binary Cross-Entropy');
  console.log('  Optimizer: Adam (lr=0.001)');

  // =========================================================
  // STEP 3: Train the Autoencoder
  // =========================================================
  // Convert data to tensors
  const trainImagesTensor = tf.tensor2d(
    Array.from(dataset.trainImages),
    [dataset.trainImages.length / 784, 784]
  );

  const testImagesTensor = tf.tensor2d(
    Array.from(dataset.testImages),
    [dataset.testImages.length / 784, 784]
  );

  // Train the model
  const history = await trainAutoencoder(
    autoencoder,
    trainImagesTensor,
    15,  // 15 epochs (enough to see convergence)
    32,  // Batch size 32
    0.1  // 10% validation split
  );

  // Show training progress
  showTrainingProgress(history);

  // =========================================================
  // STEP 4: Evaluate on Test Data
  // =========================================================
  await evaluateAutoencoder(autoencoder, testImagesTensor);

  // =========================================================
  // STEP 5: Reconstruct Test Images
  // =========================================================
  console.log('\n=== Step 4: Reconstructing Test Images ===');

  // Reconstruct first 3 test images
  const numExamples = 3;
  for (let i = 0; i < numExamples; i++) {
    const label = dataset.testLabels[i];
    const startIdx = i * 784;
    const endIdx = startIdx + 784;

    // Get original image
    const originalImage = dataset.testImages.slice(startIdx, endIdx);

    // Reconstruct through autoencoder
    const inputTensor = tf.tensor2d([Array.from(originalImage)], [1, 784]);
    const reconstructedTensor = reconstructImages(autoencoder, inputTensor);
    const reconstructedData = await reconstructedTensor.data();
    const reconstructedImage = Array.from(reconstructedData);

    // Visualize side-by-side
    showComparison(
      originalImage,
      reconstructedImage,
      `Digit ${label} (Test Image ${i + 1})`,
      28
    );

    // Clean up
    inputTensor.dispose();
    reconstructedTensor.dispose();
  }

  // =========================================================
  // STEP 6: Show Latent Space Encoding
  // =========================================================
  console.log('\n=== Step 5: Latent Space Encoding ===');

  // Encode a test image with the trained encoder (shares weights with the
  // autoencoder, so this reflects what training learned - not random init).
  const testIdx = 0;
  const testLabel = dataset.testLabels[testIdx];
  const testImageArray = dataset.testImages.slice(testIdx * 784, (testIdx + 1) * 784);
  const testImageTensor = tf.tensor2d([Array.from(testImageArray)], [1, 784]);

  // Get latent encoding using the trained encoder
  const latentTensor = encoder.predict(testImageTensor) as tf.Tensor2D;
  const latentData = await latentTensor.data();
  const latentVector = Array.from(latentData);

  showLatentVector(latentVector, `Digit ${testLabel}`);

  console.log('\nKey Insight:');
  console.log('  The autoencoder compressed a 784-dimensional image');
  console.log('  into just 32 dimensions while preserving enough');
  console.log('  information to reconstruct it!');

  // Clean up
  testImageTensor.dispose();
  latentTensor.dispose();
  trainImagesTensor.dispose();
  testImagesTensor.dispose();

  // =========================================================
  // Summary
  // =========================================================
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          Demo Complete! ✓              ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('What we learned:');
  console.log('  ✓ Autoencoders compress data to a bottleneck');
  console.log('  ✓ They learn to reconstruct the input');
  console.log('  ✓ The latent space captures essential features');
  console.log('  ✓ Reconstruction loss decreases with training');
  console.log('  ✓ No labels needed (unsupervised learning)');
  console.log('');
}

// Run the demo
main().catch(error => {
  console.error('Error running demo:', error);
  process.exit(1);
});
