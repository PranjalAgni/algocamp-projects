/**
 * Two-Moons Dataset Generation
 *
 * Generates a synthetic binary classification dataset with two interleaving crescents.
 * This is a classic benchmark that requires non-linear decision boundaries,
 * demonstrating the neural network's ability to learn complex patterns.
 */

import * as tf from '@tensorflow/tfjs-node';

/**
 * Simple seeded random number generator for reproducibility.
 * Uses a linear congruential generator (LCG).
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate a random number between 0 and 1
   */
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate a random number with normal distribution (Box-Muller transform)
   */
  randn(): number {
    const u1 = this.random();
    const u2 = this.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

export interface Dataset {
  xTrain: tf.Tensor2D;
  yTrain: tf.Tensor2D;
  xTest: tf.Tensor2D;
  yTest: tf.Tensor2D;
}

/**
 * Generate two-moons dataset: two interleaving crescents.
 *
 * @param numSamples Total number of samples to generate
 * @param noise Standard deviation of Gaussian noise added to the data
 * @param seed Random seed for reproducibility
 * @returns Object containing features (x) and labels (y) as 2D arrays
 */
export function generateTwoMoons(
  numSamples: number,
  noise: number = 0.1,
  seed: number = 42
): { x: number[][]; y: number[] } {
  const rng = new SeededRandom(seed);
  const samplesPerMoon = Math.floor(numSamples / 2);

  const x: number[][] = [];
  const y: number[] = [];

  // Generate first moon (upper crescent)
  for (let i = 0; i < samplesPerMoon; i++) {
    const angle = (i / samplesPerMoon) * Math.PI;
    const xCoord = Math.cos(angle) + noise * rng.randn();
    const yCoord = Math.sin(angle) + noise * rng.randn();
    x.push([xCoord, yCoord]);
    y.push(0);
  }

  // Generate second moon (lower crescent, shifted and flipped)
  for (let i = 0; i < samplesPerMoon; i++) {
    const angle = (i / samplesPerMoon) * Math.PI;
    const xCoord = 1 - Math.cos(angle) + noise * rng.randn();
    const yCoord = 0.5 - Math.sin(angle) + noise * rng.randn();
    x.push([xCoord, yCoord]);
    y.push(1);
  }

  return { x, y };
}

/**
 * Split dataset into training and test sets.
 *
 * @param x Features array
 * @param y Labels array
 * @param testRatio Proportion of data to use for testing (default 0.2 = 20%)
 * @param seed Random seed for shuffle reproducibility
 * @returns Dataset object with train/test tensors
 */
export function createDataset(
  x: number[][],
  y: number[],
  testRatio: number = 0.2,
  seed: number = 42
): Dataset {
  const numSamples = x.length;

  // Create indices and shuffle them
  const indices = Array.from({ length: numSamples }, (_, i) => i);
  const rng = new SeededRandom(seed);

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testSize = Math.floor(numSamples * testRatio);
  const trainSize = numSamples - testSize;

  // Split indices
  const trainIndices = indices.slice(0, trainSize);
  const testIndices = indices.slice(trainSize);

  // Create train arrays
  const xTrainArray = trainIndices.map(i => x[i]);
  const yTrainArray = trainIndices.map(i => y[i]);

  // Create test arrays
  const xTestArray = testIndices.map(i => x[i]);
  const yTestArray = testIndices.map(i => y[i]);

  // Convert to TensorFlow tensors
  // Features: 2D tensor [numSamples, 2]
  const xTrain = tf.tensor2d(xTrainArray);
  const xTest = tf.tensor2d(xTestArray);

  // Labels: Convert to one-hot encoding [numSamples, 2]
  // This is required for categorical cross-entropy loss
  const yTrain = tf.oneHot(tf.tensor1d(yTrainArray, 'int32'), 2);
  const yTest = tf.oneHot(tf.tensor1d(yTestArray, 'int32'), 2);

  return {
    xTrain,
    yTrain: yTrain as tf.Tensor2D,
    xTest,
    yTest: yTest as tf.Tensor2D,
  };
}

/**
 * Generate and split the two-moons dataset in one call.
 *
 * @param numSamples Total number of samples
 * @param noise Noise level
 * @param testRatio Test set proportion
 * @param seed Random seed
 * @returns Complete dataset ready for training
 */
export function prepareTwoMoonsDataset(
  numSamples: number = 300,
  noise: number = 0.1,
  testRatio: number = 0.2,
  seed: number = 42
): Dataset {
  const { x, y } = generateTwoMoons(numSamples, noise, seed);
  return createDataset(x, y, testRatio, seed);
}
