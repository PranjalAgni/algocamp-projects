/**
 * Training Smoke Tests
 *
 * Validates that the neural network can train successfully:
 * - Model compiles without errors
 * - Training reduces loss over epochs
 * - Model achieves reasonable accuracy on the test set
 *
 * These tests train a small model briefly to keep test runtime fast.
 */

import { describe, it, expect } from 'vitest';
import { prepareTwoMoonsDataset } from '../src/dataset.js';
import { createModel, compileModel, trainModel, evaluateModel } from '../src/model.js';

describe('Neural Network Training', () => {
  it('should create a model with the correct architecture', () => {
    const model = createModel();

    // Model should have 3 layers
    expect(model.layers.length).toBe(3);

    // First layer: 8 units
    expect(model.layers[0].getWeights()[0].shape[1]).toBe(8);

    // Second layer: 4 units
    expect(model.layers[1].getWeights()[0].shape[1]).toBe(4);

    // Third layer: 2 units (output)
    expect(model.layers[2].getWeights()[0].shape[1]).toBe(2);
  });

  it('should compile without errors', () => {
    const model = createModel();

    expect(() => {
      compileModel(model);
    }).not.toThrow();
  });

  it('should reduce loss during training', async () => {
    // Generate a small dataset for fast testing
    const dataset = prepareTwoMoonsDataset(100, 0.1, 0.2, 42);

    const model = createModel();
    compileModel(model);

    // Train for only 10 epochs to keep test fast
    const history = await trainModel(
      model,
      dataset.xTrain,
      dataset.yTrain,
      10, // epochs
      32, // batch size
      0.1 // validation split
    );

    // Loss should decrease from first to last epoch
    const initialLoss = history.loss[0];
    const finalLoss = history.loss[history.loss.length - 1];

    expect(finalLoss).toBeLessThan(initialLoss);

    // Clean up
    dataset.xTrain.dispose();
    dataset.yTrain.dispose();
    dataset.xTest.dispose();
    dataset.yTest.dispose();
  }, 10000); // 10 second timeout for training

  it('should achieve reasonable test accuracy', async () => {
    // Generate dataset
    const dataset = prepareTwoMoonsDataset(200, 0.1, 0.2, 42);

    const model = createModel();
    compileModel(model);

    // Train briefly
    await trainModel(
      model,
      dataset.xTrain,
      dataset.yTrain,
      20, // More epochs for better accuracy
      32,
      0.1
    );

    // Evaluate on test set
    const testAccuracy = await evaluateModel(model, dataset.xTest, dataset.yTest);

    // Two-moons is a simple dataset, so accuracy should be well above random (50%)
    // With 20 epochs, we should easily achieve >75% accuracy
    expect(testAccuracy).toBeGreaterThan(0.75);

    // Clean up
    dataset.xTrain.dispose();
    dataset.yTrain.dispose();
    dataset.xTest.dispose();
    dataset.yTest.dispose();
  }, 15000); // 15 second timeout

  it('should improve accuracy over epochs', async () => {
    const dataset = prepareTwoMoonsDataset(100, 0.1, 0.2, 42);

    const model = createModel();
    compileModel(model);

    const history = await trainModel(
      model,
      dataset.xTrain,
      dataset.yTrain,
      15,
      32,
      0.1
    );

    // Accuracy should increase from first to last epoch
    const initialAccuracy = history.accuracy[0];
    const finalAccuracy = history.accuracy[history.accuracy.length - 1];

    expect(finalAccuracy).toBeGreaterThan(initialAccuracy);

    // Clean up
    dataset.xTrain.dispose();
    dataset.yTrain.dispose();
    dataset.xTest.dispose();
    dataset.yTest.dispose();
  }, 10000);
});
