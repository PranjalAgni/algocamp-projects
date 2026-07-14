/**
 * Autoencoder Training
 *
 * Trains the autoencoder to minimize reconstruction error.
 * The training process:
 * 1. Forward pass: Input → Encoder → Latent → Decoder → Reconstruction
 * 2. Loss computation: How different is reconstruction from input?
 * 3. Backpropagation: Compute gradients of loss w.r.t. all weights
 * 4. Weight update: Optimizer adjusts weights to reduce loss
 *
 * Key insight: Unlike supervised learning, we don't need labels.
 * The input IS the target (self-supervised learning).
 */

import * as tf from '@tensorflow/tfjs-node';

export interface TrainingHistory {
  loss: number[];      // Reconstruction loss per epoch
  mse: number[];       // Mean squared error per epoch (for reference)
  valLoss?: number[];  // Validation loss (if validation split used)
}

/**
 * Train the autoencoder on the provided data.
 *
 * Training process:
 * - The model learns to reconstruct its input by minimizing the difference
 *   between input and output (reconstruction loss)
 * - The bottleneck forces the network to learn compressed, meaningful features
 * - No labels needed - this is unsupervised learning
 *
 * @param model Compiled autoencoder model
 * @param trainImages Training images [numSamples, 784]
 * @param epochs Number of complete passes through the training data
 * @param batchSize Number of samples per gradient update
 * @param validationSplit Fraction of data to hold out for validation (optional)
 * @returns Training history with loss values per epoch
 */
export async function trainAutoencoder(
  model: tf.Sequential,
  trainImages: tf.Tensor2D,
  epochs: number = 15,
  batchSize: number = 32,
  validationSplit: number = 0.1
): Promise<TrainingHistory> {
  console.log('\n=== Training Autoencoder ===\n');
  console.log(`Epochs: ${epochs}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Validation split: ${(validationSplit * 100).toFixed(0)}%`);
  console.log('');

  // For autoencoders, the target is the same as the input
  // We want: output ≈ input (minimize reconstruction error)
  const targetImages = trainImages;

  // Training configuration
  const history = await model.fit(trainImages, targetImages, {
    epochs,
    batchSize,
    validationSplit,
    shuffle: true, // Shuffle training data each epoch for better generalization
    verbose: 0, // Suppress tfjs-node's built-in per-epoch line; we do our own logging below
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        // Print progress every epoch (since we only train for ~15 epochs)
        const epochNum = (epoch + 1).toString().padStart(2);
        const loss = logs?.loss.toFixed(6);
        const mse = logs?.mse ? logs.mse.toFixed(6) : 'N/A';

        if (validationSplit > 0) {
          const valLoss = logs?.val_loss ? logs.val_loss.toFixed(6) : 'N/A';
          console.log(
            `Epoch ${epochNum}/${epochs} - ` +
            `loss: ${loss} - ` +
            `mse: ${mse} - ` +
            `val_loss: ${valLoss}`
          );
        } else {
          console.log(
            `Epoch ${epochNum}/${epochs} - ` +
            `loss: ${loss} - ` +
            `mse: ${mse}`
          );
        }
      },
    },
  });

  console.log('\n=== Training Complete ===\n');

  // Extract history
  const trainingHistory: TrainingHistory = {
    loss: history.history.loss as number[],
    mse: history.history.mse as number[],
  };

  if (validationSplit > 0 && history.history.val_loss) {
    trainingHistory.valLoss = history.history.val_loss as number[];
  }

  return trainingHistory;
}

/**
 * Evaluate reconstruction quality on test data.
 *
 * Measures how well the autoencoder generalizes to unseen images.
 * Good autoencoders should have similar reconstruction error on
 * test data compared to training data.
 *
 * @param model Trained autoencoder
 * @param testImages Test images [numSamples, 784]
 * @returns Test loss (reconstruction error)
 */
export async function evaluateAutoencoder(
  model: tf.Sequential,
  testImages: tf.Tensor2D
): Promise<{ loss: number; mse: number }> {
  console.log('\n=== Evaluating on Test Data ===\n');

  // For autoencoders, target = input
  const targetImages = testImages;

  // Evaluate returns [loss, ...metrics]
  const result = model.evaluate(testImages, targetImages) as tf.Scalar[];

  const testLoss = await result[0].data();
  const testMse = await result[1].data();

  console.log(`Test Loss (Binary Cross-Entropy): ${testLoss[0].toFixed(6)}`);
  console.log(`Test MSE: ${testMse[0].toFixed(6)}`);

  // Clean up tensors
  result.forEach(tensor => tensor.dispose());

  return {
    loss: testLoss[0],
    mse: testMse[0],
  };
}

/**
 * Reconstruct a batch of images using the trained autoencoder.
 *
 * This demonstrates the complete autoencoder pipeline:
 * Input → Encode → Decode → Reconstruction
 *
 * @param model Trained autoencoder
 * @param images Input images [batchSize, 784]
 * @returns Reconstructed images [batchSize, 784]
 */
export function reconstructImages(
  model: tf.Sequential,
  images: tf.Tensor2D
): tf.Tensor2D {
  // Forward pass through the entire autoencoder
  return model.predict(images) as tf.Tensor2D;
}
