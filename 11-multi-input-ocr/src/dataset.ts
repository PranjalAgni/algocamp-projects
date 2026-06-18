/**
 * Synthetic Dataset Generation for Multi-Input OCR
 *
 * Generates simple digit-like patterns (0-4) as 14x14 grayscale images
 * plus auxiliary feature vectors that provide hints about the digit.
 */

import * as tf from '@tensorflow/tfjs-node';

export interface DataSample {
  image: number[][]; // 14x14 array of pixel values [0, 1]
  auxFeatures: number[]; // 5-dimensional feature vector
  label: number; // Class label 0-4
}

/**
 * Draw digit patterns on a 14x14 grid
 * Simple programmatic shapes for digits 0-4
 */
function drawDigit(digit: number): number[][] {
  const size = 14;
  const grid: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

  switch (digit) {
    case 0: // Circle/oval outline
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const cx = size / 2;
          const cy = size / 2;
          const dist = Math.sqrt((i - cy) ** 2 + (j - cx) ** 2);
          // Ring between radius 4 and 6
          if (dist >= 4 && dist <= 6) {
            grid[i][j] = 1;
          }
        }
      }
      break;

    case 1: // Vertical line
      const col = Math.floor(size / 2);
      for (let i = 2; i < size - 2; i++) {
        grid[i][col] = 1;
        grid[i][col + 1] = 1; // Make it 2 pixels wide
      }
      break;

    case 2: // Two horizontal lines with diagonal
      // Top horizontal
      for (let j = 3; j < size - 3; j++) {
        grid[3][j] = 1;
      }
      // Diagonal
      for (let i = 4; i < 10; i++) {
        grid[i][size - 4 - (i - 4)] = 1;
      }
      // Bottom horizontal
      for (let j = 3; j < size - 3; j++) {
        grid[10][j] = 1;
      }
      break;

    case 3: // Two curves (stacked semicircles)
      // Top curve
      for (let i = 2; i < 7; i++) {
        for (let j = 6; j < size - 3; j++) {
          const cx = 8;
          const cy = 4;
          const dist = Math.sqrt((i - cy) ** 2 + (j - cx) ** 2);
          if (dist >= 3 && dist <= 4 && j >= cx) {
            grid[i][j] = 1;
          }
        }
      }
      // Bottom curve
      for (let i = 7; i < 12; i++) {
        for (let j = 6; j < size - 3; j++) {
          const cx = 8;
          const cy = 10;
          const dist = Math.sqrt((i - cy) ** 2 + (j - cx) ** 2);
          if (dist >= 3 && dist <= 4 && j >= cx) {
            grid[i][j] = 1;
          }
        }
      }
      break;

    case 4: // Angle shape (vertical + horizontal)
      // Vertical left
      for (let i = 2; i < 8; i++) {
        grid[i][3] = 1;
      }
      // Horizontal middle
      for (let j = 3; j < size - 3; j++) {
        grid[7][j] = 1;
      }
      // Vertical right
      for (let i = 2; i < size - 2; i++) {
        grid[i][size - 4] = 1;
      }
      break;
  }

  // Add small random noise for variety
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (Math.random() < 0.05) {
        grid[i][j] = Math.random() < 0.5 ? 0 : 0.3;
      }
    }
  }

  return grid;
}

/**
 * Compute auxiliary features from the image
 * These provide hints that correlate with (but don't determine) the digit
 */
function computeAuxFeatures(image: number[][], label: number): number[] {
  const size = image.length;

  // Feature 1: Aspect ratio (width/height of bounding box)
  let minRow = size, maxRow = 0, minCol = size, maxCol = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (image[i][j] > 0.5) {
        minRow = Math.min(minRow, i);
        maxRow = Math.max(maxRow, i);
        minCol = Math.min(minCol, j);
        maxCol = Math.max(maxCol, j);
      }
    }
  }
  const height = maxRow - minRow + 1;
  const width = maxCol - minCol + 1;
  const aspectRatio = width / Math.max(height, 1);

  // Feature 2: Fill density (ratio of filled pixels)
  let fillCount = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (image[i][j] > 0.5) fillCount++;
    }
  }
  const fillDensity = fillCount / (size * size);

  // Feature 3: Vertical symmetry (correlation between left and right halves)
  let symmetryScore = 0;
  const mid = Math.floor(size / 2);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < mid; j++) {
      const left = image[i][j];
      const right = image[i][size - 1 - j];
      symmetryScore += 1 - Math.abs(left - right);
    }
  }
  const verticalSymmetry = symmetryScore / (size * mid);

  // Feature 4: Horizontal line count (heuristic)
  let horizontalLines = 0;
  for (let i = 0; i < size; i++) {
    let linePixels = 0;
    for (let j = 0; j < size; j++) {
      if (image[i][j] > 0.5) linePixels++;
    }
    if (linePixels >= size * 0.4) horizontalLines++;
  }
  const horizontalLineScore = horizontalLines / size;

  // Feature 5: Curve presence (simple heuristic based on label)
  // In real world, this could be edge detection or contour analysis
  const curveScore = [0.8, 0.1, 0.5, 0.9, 0.2][label] + (Math.random() - 0.5) * 0.2;

  return [
    aspectRatio,
    fillDensity,
    verticalSymmetry,
    horizontalLineScore,
    Math.max(0, Math.min(1, curveScore)) // Clamp to [0, 1]
  ];
}

/**
 * Generate a dataset of synthetic samples
 */
export function generateDataset(samplesPerClass: number): DataSample[] {
  const dataset: DataSample[] = [];

  for (let label = 0; label < 5; label++) {
    for (let i = 0; i < samplesPerClass; i++) {
      const image = drawDigit(label);
      const auxFeatures = computeAuxFeatures(image, label);
      dataset.push({ image, auxFeatures, label });
    }
  }

  // Shuffle the dataset
  for (let i = dataset.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
  }

  return dataset;
}

/**
 * Convert dataset to tensors for training
 * Returns both inputs (images and aux features) plus labels
 */
export function datasetToTensors(dataset: DataSample[]): {
  images: tf.Tensor4D;
  auxFeatures: tf.Tensor2D;
  labels: tf.Tensor2D;
} {
  // Convert images to 4D tensor: [batch, height, width, channels]
  const imageData = dataset.map(sample => {
    return sample.image.flat(); // Flatten 14x14 to 196
  });
  const images = tf.tensor4d(
    imageData.flat(),
    [dataset.length, 14, 14, 1]
  );

  // Convert auxiliary features to 2D tensor: [batch, features]
  const auxData = dataset.map(sample => sample.auxFeatures);
  const auxFeatures = tf.tensor2d(auxData);

  // Convert labels to one-hot encoded 2D tensor: [batch, numClasses]
  const labels = tf.tensor1d(dataset.map(s => s.label), 'int32');
  const labelsOneHot = tf.oneHot(labels, 5);
  labels.dispose();

  return { images, auxFeatures, labels: labelsOneHot };
}

/**
 * Split dataset into train and test sets
 */
export function splitDataset(dataset: DataSample[], trainRatio: number = 0.8): {
  train: DataSample[];
  test: DataSample[];
} {
  const trainSize = Math.floor(dataset.length * trainRatio);
  return {
    train: dataset.slice(0, trainSize),
    test: dataset.slice(trainSize)
  };
}
