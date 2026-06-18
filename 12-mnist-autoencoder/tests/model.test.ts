/**
 * Tests for model architecture.
 */

import { describe, it, expect } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import {
  buildEncoder,
  buildDecoder,
  buildAutoencoder,
  compileAutoencoder,
  DEFAULT_CONFIG,
} from '../src/model.js';

describe('Autoencoder Architecture', () => {
  it('should build encoder with correct output shape', () => {
    const encoder = buildEncoder();

    // Test with batch of 10 images
    const testInput = tf.randomNormal([10, 784]);
    const output = encoder.predict(testInput) as tf.Tensor2D;

    expect(output.shape).toEqual([10, 32]); // Latent dimension is 32

    testInput.dispose();
    output.dispose();
  });

  it('should build decoder with correct output shape', () => {
    const decoder = buildDecoder();

    // Test with batch of 10 latent vectors
    const testInput = tf.randomNormal([10, 32]);
    const output = decoder.predict(testInput) as tf.Tensor2D;

    expect(output.shape).toEqual([10, 784]); // Reconstructed to 784 dims

    testInput.dispose();
    output.dispose();
  });

  it('should build complete autoencoder with correct input/output shapes', () => {
    const autoencoder = buildAutoencoder();

    // Test with batch of 5 images
    const testInput = tf.randomNormal([5, 784]);
    const output = autoencoder.predict(testInput) as tf.Tensor2D;

    // Output should match input shape (reconstruction)
    expect(output.shape).toEqual([5, 784]);

    testInput.dispose();
    output.dispose();
  });

  it('should have correct number of layers', () => {
    const autoencoder = buildAutoencoder();

    // Encoder: 3 layers (128, 64, 32)
    // Decoder: 3 layers (64, 128, 784)
    // Total: 6 layers
    expect(autoencoder.layers.length).toBe(6);
  });

  it('should compile without errors', () => {
    const autoencoder = buildAutoencoder();

    expect(() => {
      compileAutoencoder(autoencoder);
    }).not.toThrow();
  });

  it('should use sigmoid activation in output layer', () => {
    const autoencoder = buildAutoencoder();

    // The last layer should have sigmoid activation (for [0,1] pixel values)
    const lastLayer = autoencoder.layers[autoencoder.layers.length - 1];
    const config = lastLayer.getConfig();

    expect(config.activation).toBe('sigmoid');
  });

  it('should compress input dimensions through encoder', () => {
    const encoder = buildEncoder();

    const inputDim = DEFAULT_CONFIG.inputDim; // 784
    const latentDim = DEFAULT_CONFIG.latentDim; // 32

    // Latent dimension should be much smaller than input
    expect(latentDim).toBeLessThan(inputDim);
    expect(latentDim).toBe(32);
  });

  it('should produce output in valid range [0,1] after sigmoid', () => {
    const autoencoder = buildAutoencoder();
    compileAutoencoder(autoencoder);

    // Test with random input
    const testInput = tf.randomUniform([3, 784], 0, 1);
    const output = autoencoder.predict(testInput) as tf.Tensor2D;

    const outputData = output.dataSync();

    // All output values should be in [0, 1] due to sigmoid
    for (let i = 0; i < outputData.length; i++) {
      expect(outputData[i]).toBeGreaterThanOrEqual(0);
      expect(outputData[i]).toBeLessThanOrEqual(1);
    }

    testInput.dispose();
    output.dispose();
  });
});
