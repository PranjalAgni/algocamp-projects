/**
 * Tests for dataset generation
 */

import { describe, it, expect } from 'vitest';
import { generateDataset, datasetToTensors, splitDataset } from '../src/dataset.js';

describe('Dataset Generation', () => {
  it('generates correct number of samples', () => {
    const samplesPerClass = 10;
    const dataset = generateDataset(samplesPerClass);

    // 5 classes * 10 samples each = 50 total
    expect(dataset.length).toBe(50);
  });

  it('generates samples with correct structure', () => {
    const dataset = generateDataset(5);
    const sample = dataset[0];

    // Check image is 14x14
    expect(sample.image.length).toBe(14);
    expect(sample.image[0].length).toBe(14);

    // Check auxiliary features is 5-dimensional
    expect(sample.auxFeatures.length).toBe(5);

    // Check label is in range [0, 4]
    expect(sample.label).toBeGreaterThanOrEqual(0);
    expect(sample.label).toBeLessThanOrEqual(4);
  });

  it('generates images with values in [0, 1] range', () => {
    const dataset = generateDataset(5);
    const sample = dataset[0];

    for (const row of sample.image) {
      for (const pixel of row) {
        expect(pixel).toBeGreaterThanOrEqual(0);
        expect(pixel).toBeLessThanOrEqual(1);
      }
    }
  });

  it('generates auxiliary features in valid range', () => {
    const dataset = generateDataset(10);

    for (const sample of dataset) {
      for (const feature of sample.auxFeatures) {
        // Features should be reasonable values
        // Most features are [0, 1] but aspect ratio can be wider
        expect(feature).toBeGreaterThanOrEqual(0);
        expect(feature).toBeLessThanOrEqual(5); // Allow headroom for aspect ratio edge cases
      }
    }
  });

  it('distributes classes evenly', () => {
    const samplesPerClass = 10;
    const dataset = generateDataset(samplesPerClass);

    const classCounts = [0, 0, 0, 0, 0];
    for (const sample of dataset) {
      classCounts[sample.label]++;
    }

    // Each class should have exactly samplesPerClass samples
    for (let i = 0; i < 5; i++) {
      expect(classCounts[i]).toBe(samplesPerClass);
    }
  });
});

describe('Dataset to Tensors', () => {
  it('converts dataset to correct tensor shapes', () => {
    const dataset = generateDataset(10); // 50 samples total
    const { images, auxFeatures, labels } = datasetToTensors(dataset);

    // Images: [batch, height, width, channels]
    expect(images.shape).toEqual([50, 14, 14, 1]);

    // Auxiliary features: [batch, features]
    expect(auxFeatures.shape).toEqual([50, 5]);

    // Labels: [batch, numClasses] (one-hot)
    expect(labels.shape).toEqual([50, 5]);

    // Cleanup
    images.dispose();
    auxFeatures.dispose();
    labels.dispose();
  });

  it('converts labels to one-hot encoding', () => {
    const dataset = generateDataset(1); // 5 samples, one per class
    const { labels } = datasetToTensors(dataset);

    const labelsArray = labels.arraySync() as number[][];

    // Each sample should have exactly one "1" in its label vector
    for (const labelVector of labelsArray) {
      const sum = labelVector.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1);
    }

    labels.dispose();
  });
});

describe('Dataset Split', () => {
  it('splits dataset into train and test sets', () => {
    const dataset = generateDataset(10); // 50 samples
    const { train, test } = splitDataset(dataset, 0.8);

    expect(train.length).toBe(40);
    expect(test.length).toBe(10);
  });

  it('maintains sample integrity after split', () => {
    const dataset = generateDataset(5);
    const { train, test } = splitDataset(dataset, 0.7);

    // Check all samples have correct structure
    const allSamples = [...train, ...test];
    for (const sample of allSamples) {
      expect(sample.image.length).toBe(14);
      expect(sample.auxFeatures.length).toBe(5);
      expect(sample.label).toBeGreaterThanOrEqual(0);
      expect(sample.label).toBeLessThanOrEqual(4);
    }
  });
});
