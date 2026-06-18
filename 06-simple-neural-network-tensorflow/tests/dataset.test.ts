/**
 * Dataset Tests
 *
 * Validates that the two-moons dataset generation works correctly:
 * - Correct shapes for train/test splits
 * - Labels are valid (0 or 1)
 * - Features are in reasonable ranges
 * - Reproducibility with the same seed
 */

import { describe, it, expect } from 'vitest';
import { generateTwoMoons, createDataset, prepareTwoMoonsDataset } from '../src/dataset.js';

describe('Two-Moons Dataset', () => {
  it('should generate the correct number of samples', () => {
    const { x, y } = generateTwoMoons(300, 0.1, 42);

    expect(x.length).toBe(300);
    expect(y.length).toBe(300);
  });

  it('should generate 2D features', () => {
    const { x } = generateTwoMoons(100, 0.1, 42);

    // Each sample should have 2 features
    x.forEach((sample) => {
      expect(sample.length).toBe(2);
    });
  });

  it('should generate binary labels (0 or 1)', () => {
    const { y } = generateTwoMoons(300, 0.1, 42);

    // All labels should be 0 or 1
    y.forEach((label) => {
      expect([0, 1]).toContain(label);
    });

    // Should have roughly equal numbers of each class
    const class0Count = y.filter((label) => label === 0).length;
    const class1Count = y.filter((label) => label === 1).length;

    expect(class0Count).toBeGreaterThan(100);
    expect(class1Count).toBeGreaterThan(100);
  });

  it('should generate features in reasonable range', () => {
    const { x } = generateTwoMoons(300, 0.1, 42);

    // Two-moons typically have x in [-0.5, 1.5] and y in [-1, 1.5]
    // With noise, allow a bit more margin
    x.forEach((sample) => {
      expect(sample[0]).toBeGreaterThan(-2);
      expect(sample[0]).toBeLessThan(3);
      expect(sample[1]).toBeGreaterThan(-2);
      expect(sample[1]).toBeLessThan(3);
    });
  });

  it('should be reproducible with the same seed', () => {
    const result1 = generateTwoMoons(100, 0.1, 42);
    const result2 = generateTwoMoons(100, 0.1, 42);

    // Same seed should produce identical results
    expect(result1.x).toEqual(result2.x);
    expect(result1.y).toEqual(result2.y);
  });

  it('should produce different results with different seeds', () => {
    const result1 = generateTwoMoons(100, 0.1, 42);
    const result2 = generateTwoMoons(100, 0.1, 123);

    // Different seeds should produce different results
    expect(result1.x).not.toEqual(result2.x);
  });
});

describe('Dataset Splitting', () => {
  it('should split data with correct train/test ratio', () => {
    const { x, y } = generateTwoMoons(300, 0.1, 42);
    const dataset = createDataset(x, y, 0.2, 42);

    // 80% train (240), 20% test (60)
    expect(dataset.xTrain.shape[0]).toBe(240);
    expect(dataset.yTrain.shape[0]).toBe(240);
    expect(dataset.xTest.shape[0]).toBe(60);
    expect(dataset.yTest.shape[0]).toBe(60);

    // Feature dimension should be 2
    expect(dataset.xTrain.shape[1]).toBe(2);
    expect(dataset.xTest.shape[1]).toBe(2);

    // One-hot encoded labels should have 2 classes
    expect(dataset.yTrain.shape[1]).toBe(2);
    expect(dataset.yTest.shape[1]).toBe(2);

    // Clean up tensors
    dataset.xTrain.dispose();
    dataset.yTrain.dispose();
    dataset.xTest.dispose();
    dataset.yTest.dispose();
  });

  it('should create one-hot encoded labels', async () => {
    const { x, y } = generateTwoMoons(100, 0.1, 42);
    const dataset = createDataset(x, y, 0.2, 42);

    // Get the first label
    const firstLabel = await dataset.yTrain.slice([0, 0], [1, 2]).data();

    // One-hot encoding: should be [1, 0] or [0, 1]
    const sum = firstLabel[0] + firstLabel[1];
    expect(sum).toBeCloseTo(1.0, 5);

    // Each value should be 0 or 1
    expect([0, 1]).toContain(firstLabel[0]);
    expect([0, 1]).toContain(firstLabel[1]);

    // Clean up
    dataset.xTrain.dispose();
    dataset.yTrain.dispose();
    dataset.xTest.dispose();
    dataset.yTest.dispose();
  });
});

describe('Complete Dataset Preparation', () => {
  it('should prepare a complete dataset ready for training', () => {
    const dataset = prepareTwoMoonsDataset(300, 0.1, 0.2, 42);

    // Verify all tensors exist and have correct shapes
    expect(dataset.xTrain.shape).toEqual([240, 2]);
    expect(dataset.yTrain.shape).toEqual([240, 2]);
    expect(dataset.xTest.shape).toEqual([60, 2]);
    expect(dataset.yTest.shape).toEqual([60, 2]);

    // Clean up
    dataset.xTrain.dispose();
    dataset.yTrain.dispose();
    dataset.xTest.dispose();
    dataset.yTest.dispose();
  });
});
