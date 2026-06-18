/**
 * Synthetic Digit Image Generation
 *
 * Generates simple 28×28 grayscale images representing digits 0, 1, and 2.
 * This ensures the project runs completely offline without downloading real MNIST data.
 *
 * Design decisions:
 * - Digit 0: Circle/ellipse shape
 * - Digit 1: Vertical line/rectangle
 * - Digit 2: Two horizontal bars (top and bottom)
 * - Randomized positioning and slight noise for variability
 * - Pixel values normalized to [0, 1] range
 * - Deterministic seeded randomness for reproducibility
 */

/**
 * Simple seeded pseudo-random number generator for reproducibility.
 * Uses a Linear Congruential Generator (LCG) algorithm.
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number in [0, 1)
   */
  next(): number {
    // LCG parameters (Numerical Recipes)
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return this.seed / 2 ** 32;
  }

  /**
   * Generate random integer in [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export interface Dataset {
  trainImages: Float32Array; // Shape: [trainCount, 784]
  testImages: Float32Array;  // Shape: [testCount, 784]
  trainLabels: number[];     // Digit labels (0, 1, or 2)
  testLabels: number[];
  imageSize: number;         // 28 (for 28×28 images)
}

/**
 * Draw a circle/ellipse representing digit 0.
 * Creates a hollow or filled circle in the center of the image.
 */
function drawDigit0(
  pixels: number[],
  width: number,
  height: number,
  rng: SeededRandom
): void {
  const centerX = width / 2 + rng.nextInt(-2, 2); // Slight random offset
  const centerY = height / 2 + rng.nextInt(-2, 2);
  const radiusX = rng.nextInt(8, 10); // Ellipse x-radius
  const radiusY = rng.nextInt(8, 10); // Ellipse y-radius
  const thickness = rng.nextInt(2, 3); // Circle thickness

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distSquared = dx * dx + dy * dy;

      // Draw circle as a ring (hollow)
      if (distSquared <= 1.0 && distSquared >= (1.0 - thickness / radiusX) ** 2) {
        pixels[y * width + x] = 1.0;
      }
    }
  }
}

/**
 * Draw a vertical line/rectangle representing digit 1.
 * Creates a vertical bar, roughly centered.
 */
function drawDigit1(
  pixels: number[],
  width: number,
  height: number,
  rng: SeededRandom
): void {
  const centerX = width / 2 + rng.nextInt(-2, 2);
  const lineWidth = rng.nextInt(2, 4);
  const startY = rng.nextInt(3, 5);
  const endY = height - rng.nextInt(3, 5);

  for (let y = startY; y < endY; y++) {
    for (let x = centerX - lineWidth / 2; x < centerX + lineWidth / 2; x++) {
      if (x >= 0 && x < width) {
        pixels[y * width + x] = 1.0;
      }
    }
  }
}

/**
 * Draw two horizontal bars representing digit 2.
 * Top bar and bottom bar with a gap in the middle.
 */
function drawDigit2(
  pixels: number[],
  width: number,
  height: number,
  rng: SeededRandom
): void {
  const barHeight = rng.nextInt(2, 3);
  const leftMargin = rng.nextInt(5, 7);
  const rightMargin = width - rng.nextInt(5, 7);

  // Top horizontal bar
  const topY = rng.nextInt(6, 8);
  for (let y = topY; y < topY + barHeight; y++) {
    for (let x = leftMargin; x < rightMargin; x++) {
      pixels[y * width + x] = 1.0;
    }
  }

  // Bottom horizontal bar
  const bottomY = height - rng.nextInt(8, 10);
  for (let y = bottomY; y < bottomY + barHeight; y++) {
    for (let x = leftMargin; x < rightMargin; x++) {
      pixels[y * width + x] = 1.0;
    }
  }
}

/**
 * Add random noise to the image for variability.
 * Randomly flips a small percentage of pixels.
 */
function addNoise(pixels: number[], noiseLevel: number, rng: SeededRandom): void {
  for (let i = 0; i < pixels.length; i++) {
    if (rng.next() < noiseLevel) {
      // Flip pixel: if it's 0, make it slightly bright; if it's 1, dim it
      pixels[i] = pixels[i] > 0.5 ? rng.next() * 0.3 : 0.7 + rng.next() * 0.3;
    }
  }
}

/**
 * Generate a single synthetic digit image.
 *
 * @param digit The digit to generate (0, 1, or 2)
 * @param width Image width (typically 28)
 * @param height Image height (typically 28)
 * @param rng Seeded random number generator
 * @returns Flattened pixel array with values in [0, 1]
 */
function generateDigitImage(
  digit: number,
  width: number,
  height: number,
  rng: SeededRandom
): number[] {
  const pixels = new Array(width * height).fill(0);

  switch (digit) {
    case 0:
      drawDigit0(pixels, width, height, rng);
      break;
    case 1:
      drawDigit1(pixels, width, height, rng);
      break;
    case 2:
      drawDigit2(pixels, width, height, rng);
      break;
    default:
      throw new Error(`Unsupported digit: ${digit}`);
  }

  // Add slight noise for realism
  addNoise(pixels, 0.02, rng); // 2% noise

  return pixels;
}

/**
 * Generate a synthetic dataset of digit images.
 *
 * Creates a balanced dataset with equal numbers of each digit (0, 1, 2).
 * The dataset is split into training and test sets.
 *
 * @param trainCount Total number of training images (should be divisible by 3)
 * @param testCount Total number of test images (should be divisible by 3)
 * @param imageSize Image dimension (default 28 for 28×28)
 * @param seed Random seed for reproducibility
 * @returns Dataset object with train/test splits
 */
export function generateDataset(
  trainCount: number = 300,
  testCount: number = 100,
  imageSize: number = 28,
  seed: number = 42
): Dataset {
  const rng = new SeededRandom(seed);
  const imagesPerDigit = trainCount / 3; // Equal distribution
  const testImagesPerDigit = testCount / 3;

  const trainImages: number[] = [];
  const trainLabels: number[] = [];
  const testImages: number[] = [];
  const testLabels: number[] = [];

  // Generate training data (balanced across digits 0, 1, 2)
  for (let digit = 0; digit < 3; digit++) {
    for (let i = 0; i < imagesPerDigit; i++) {
      const image = generateDigitImage(digit, imageSize, imageSize, rng);
      trainImages.push(...image);
      trainLabels.push(digit);
    }
  }

  // Generate test data
  for (let digit = 0; digit < 3; digit++) {
    for (let i = 0; i < testImagesPerDigit; i++) {
      const image = generateDigitImage(digit, imageSize, imageSize, rng);
      testImages.push(...image);
      testLabels.push(digit);
    }
  }

  return {
    trainImages: new Float32Array(trainImages),
    testImages: new Float32Array(testImages),
    trainLabels,
    testLabels,
    imageSize,
  };
}

/**
 * Get a single image from the dataset as a 2D array for visualization.
 *
 * @param dataset The dataset
 * @param index Image index
 * @param isTrain Whether to get from training set (true) or test set (false)
 * @returns 2D array of pixel values [height][width]
 */
export function getImage2D(
  dataset: Dataset,
  index: number,
  isTrain: boolean = true
): number[][] {
  const images = isTrain ? dataset.trainImages : dataset.testImages;
  const imageSize = dataset.imageSize;
  const pixelsPerImage = imageSize * imageSize;
  const start = index * pixelsPerImage;

  const image2D: number[][] = [];
  for (let y = 0; y < imageSize; y++) {
    const row: number[] = [];
    for (let x = 0; x < imageSize; x++) {
      row.push(images[start + y * imageSize + x]);
    }
    image2D.push(row);
  }

  return image2D;
}
