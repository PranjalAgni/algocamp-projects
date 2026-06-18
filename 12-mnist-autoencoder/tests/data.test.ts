/**
 * Tests for data generation module.
 */

import { describe, it, expect } from 'vitest';
import { generateDataset } from '../src/data.js';

describe('Data Generation', () => {
  it('should generate correct number of training images', () => {
    const dataset = generateDataset(300, 100, 28, 42);

    const expectedTrainPixels = 300 * 28 * 28;
    expect(dataset.trainImages.length).toBe(expectedTrainPixels);
    expect(dataset.trainLabels.length).toBe(300);
  });

  it('should generate correct number of test images', () => {
    // Use 99 so it divides evenly by 3 (33 per digit)
    const dataset = generateDataset(300, 99, 28, 42);

    const expectedTestPixels = 99 * 28 * 28;
    expect(dataset.testImages.length).toBe(expectedTestPixels);
    expect(dataset.testLabels.length).toBe(99);
  });

  it('should have pixel values in range [0, 1]', () => {
    const dataset = generateDataset(30, 10, 28, 42);

    // Check training images
    for (let i = 0; i < dataset.trainImages.length; i++) {
      expect(dataset.trainImages[i]).toBeGreaterThanOrEqual(0);
      expect(dataset.trainImages[i]).toBeLessThanOrEqual(1);
    }

    // Check test images
    for (let i = 0; i < dataset.testImages.length; i++) {
      expect(dataset.testImages[i]).toBeGreaterThanOrEqual(0);
      expect(dataset.testImages[i]).toBeLessThanOrEqual(1);
    }
  });

  it('should have correct image size', () => {
    const dataset = generateDataset(30, 10, 28, 42);
    expect(dataset.imageSize).toBe(28);
  });

  it('should generate labels in range [0, 2]', () => {
    const dataset = generateDataset(30, 10, 28, 42);

    // Check training labels
    for (const label of dataset.trainLabels) {
      expect(label).toBeGreaterThanOrEqual(0);
      expect(label).toBeLessThanOrEqual(2);
    }

    // Check test labels
    for (const label of dataset.testLabels) {
      expect(label).toBeGreaterThanOrEqual(0);
      expect(label).toBeLessThanOrEqual(2);
    }
  });

  it('should be deterministic with same seed', () => {
    const dataset1 = generateDataset(30, 10, 28, 42);
    const dataset2 = generateDataset(30, 10, 28, 42);

    // First few pixels should match exactly
    for (let i = 0; i < 100; i++) {
      expect(dataset1.trainImages[i]).toBe(dataset2.trainImages[i]);
    }
  });

  it('should generate different data with different seed', () => {
    const dataset1 = generateDataset(30, 10, 28, 42);
    const dataset2 = generateDataset(30, 10, 28, 123);

    // Should have at least some different pixels
    let differences = 0;
    for (let i = 0; i < 100; i++) {
      if (dataset1.trainImages[i] !== dataset2.trainImages[i]) {
        differences++;
      }
    }

    expect(differences).toBeGreaterThan(0);
  });

  it('should have balanced digit distribution', () => {
    const dataset = generateDataset(300, 99, 28, 42);

    // Count each digit in training set
    const counts = [0, 0, 0];
    for (const label of dataset.trainLabels) {
      counts[label]++;
    }

    // Should be roughly equal (100 each)
    expect(counts[0]).toBe(100);
    expect(counts[1]).toBe(100);
    expect(counts[2]).toBe(100);
  });
});
