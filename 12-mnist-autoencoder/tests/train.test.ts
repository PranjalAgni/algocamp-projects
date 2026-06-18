/**
 * Tests for training module.
 */

import { describe, it, expect } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { generateDataset } from '../src/data.js';
import { buildAutoencoder, compileAutoencoder } from '../src/model.js';
import {
  trainAutoencoder,
  evaluateAutoencoder,
  reconstructImages,
} from '../src/train.js';
import { buildEncoder } from '../src/model.js';

describe('Autoencoder Training', () => {
  it('should train and reduce loss over epochs', async () => {
    // Generate small dataset for quick test
    const dataset = generateDataset(60, 20, 28, 42);
    const trainTensor = tf.tensor2d(
      Array.from(dataset.trainImages),
      [60, 784]
    );

    // Build and compile model
    const autoencoder = buildAutoencoder();
    compileAutoencoder(autoencoder, 0.01); // Higher learning rate for faster test

    // Train for just 3 epochs
    const history = await trainAutoencoder(
      autoencoder,
      trainTensor,
      3,  // Few epochs for smoke test
      16, // Smaller batch size
      0.0 // No validation split for speed
    );

    // Loss should decrease (learning is happening)
    const initialLoss = history.loss[0];
    const finalLoss = history.loss[history.loss.length - 1];

    expect(finalLoss).toBeLessThan(initialLoss);
    expect(history.loss.length).toBe(3);

    trainTensor.dispose();
  }, 30000); // 30 second timeout

  it('should evaluate on test data without errors', async () => {
    // Generate small dataset (use 12 test images = 4 per digit, divisible by 3)
    const dataset = generateDataset(30, 12, 28, 42);
    const trainTensor = tf.tensor2d(Array.from(dataset.trainImages), [30, 784]);
    const testTensor = tf.tensor2d(Array.from(dataset.testImages), [12, 784]);

    // Build, compile, and train briefly
    const autoencoder = buildAutoencoder();
    compileAutoencoder(autoencoder);

    await trainAutoencoder(autoencoder, trainTensor, 2, 10, 0.0);

    // Evaluate should return valid metrics
    const metrics = await evaluateAutoencoder(autoencoder, testTensor);

    expect(metrics.loss).toBeGreaterThan(0);
    expect(metrics.mse).toBeGreaterThan(0);
    expect(isFinite(metrics.loss)).toBe(true);
    expect(isFinite(metrics.mse)).toBe(true);

    trainTensor.dispose();
    testTensor.dispose();
  }, 30000);

  it('should reconstruct images with correct shape', async () => {
    const autoencoder = buildAutoencoder();
    compileAutoencoder(autoencoder);

    const testInput = tf.randomUniform([5, 784], 0, 1);
    const reconstructed = reconstructImages(autoencoder, testInput);

    expect(reconstructed.shape).toEqual([5, 784]);

    testInput.dispose();
    reconstructed.dispose();
  });

  it('should use encoder separately for latent encoding', async () => {
    // Build separate encoder model
    const encoder = buildEncoder();
    compileAutoencoder(encoder);

    // Test encoder output
    const testInput = tf.randomUniform([3, 784], 0, 1);
    const latent = encoder.predict(testInput) as tf.Tensor2D;

    expect(latent.shape).toEqual([3, 32]); // Latent dimension is 32

    testInput.dispose();
    latent.dispose();
  });

  it('should have history with correct number of epochs', async () => {
    const dataset = generateDataset(30, 10, 28, 42);
    const trainTensor = tf.tensor2d(Array.from(dataset.trainImages), [30, 784]);

    const autoencoder = buildAutoencoder();
    compileAutoencoder(autoencoder);

    const epochs = 5;
    const history = await trainAutoencoder(
      autoencoder,
      trainTensor,
      epochs,
      10,
      0.0
    );

    expect(history.loss.length).toBe(epochs);
    expect(history.mse.length).toBe(epochs);

    trainTensor.dispose();
  }, 30000);

  it('should produce reconstructions different from random noise', async () => {
    // Train a model briefly
    const dataset = generateDataset(60, 20, 28, 42);
    const trainTensor = tf.tensor2d(Array.from(dataset.trainImages), [60, 784]);

    const autoencoder = buildAutoencoder();
    compileAutoencoder(autoencoder);

    await trainAutoencoder(autoencoder, trainTensor, 3, 16, 0.0);

    // Test reconstruction
    const testInput = trainTensor.slice([0, 0], [1, 784]);
    const reconstructed = reconstructImages(autoencoder, testInput);

    const inputData = await testInput.data();
    const outputData = await reconstructed.data();

    // Calculate MSE between input and reconstruction
    let mse = 0;
    for (let i = 0; i < inputData.length; i++) {
      const diff = inputData[i] - outputData[i];
      mse += diff * diff;
    }
    mse /= inputData.length;

    // MSE should be reasonably small after training (not random)
    // Expect < 0.5 after even brief training
    expect(mse).toBeLessThan(0.5);

    trainTensor.dispose();
    testInput.dispose();
    reconstructed.dispose();
  }, 30000);
});
