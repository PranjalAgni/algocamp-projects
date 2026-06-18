/**
 * ASCII Art Visualization for Images
 *
 * Renders 28×28 grayscale images as ASCII art for terminal display.
 * Perfect for offline visualization without needing a GUI or image files.
 *
 * Design:
 * - Maps pixel intensities [0, 1] to ASCII characters (dark to bright)
 * - ' ' (space) = black (0.0)
 * - '█' (full block) = white (1.0)
 * - Intermediate characters for grayscale values
 */

/**
 * ASCII characters ordered from darkest to brightest.
 * Used to represent different pixel intensities.
 */
const ASCII_CHARS = ' .:-=+*#%@█';

/**
 * Convert a pixel value [0, 1] to an ASCII character.
 *
 * @param value Pixel intensity in range [0, 1]
 * @returns ASCII character representing the intensity
 */
function pixelToAscii(value: number): string {
  // Clamp value to [0, 1]
  const clamped = Math.max(0, Math.min(1, value));

  // Map to ASCII character index
  const index = Math.floor(clamped * (ASCII_CHARS.length - 1));
  return ASCII_CHARS[index];
}

/**
 * Render a flattened image as ASCII art.
 *
 * @param pixels Flattened pixel array [784] with values in [0, 1]
 * @param width Image width (default 28)
 * @param height Image height (default 28)
 * @returns ASCII art string with newlines
 */
export function renderImageAscii(
  pixels: number[] | Float32Array,
  width: number = 28,
  height: number = 28
): string {
  let ascii = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const pixel = pixels[index];
      ascii += pixelToAscii(pixel);
    }
    ascii += '\n';
  }

  return ascii;
}

/**
 * Display original and reconstructed images side-by-side.
 *
 * Shows:
 * - Original image (left)
 * - Reconstructed image (right)
 * - Reconstruction error (MSE between them)
 *
 * @param original Original image pixels [784]
 * @param reconstructed Reconstructed image pixels [784]
 * @param label Optional label (e.g., "Digit 0")
 * @param width Image width (default 28)
 */
export function showComparison(
  original: number[] | Float32Array,
  reconstructed: number[] | Float32Array,
  label: string = '',
  width: number = 28
): void {
  const height = Math.floor(original.length / width);

  console.log(`\n=== ${label || 'Image Reconstruction'} ===\n`);

  // Render both images side by side
  console.log('Original:'.padEnd(width + 5) + 'Reconstructed:');

  for (let y = 0; y < height; y++) {
    let originalRow = '';
    let reconstructedRow = '';

    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      originalRow += pixelToAscii(original[index]);
      reconstructedRow += pixelToAscii(reconstructed[index]);
    }

    console.log(originalRow + '  |  ' + reconstructedRow);
  }

  // Calculate reconstruction error (MSE)
  let sumSquaredError = 0;
  for (let i = 0; i < original.length; i++) {
    const diff = original[i] - reconstructed[i];
    sumSquaredError += diff * diff;
  }
  const mse = sumSquaredError / original.length;

  console.log(`\nReconstruction Error (MSE): ${mse.toFixed(6)}`);
}

/**
 * Display a latent vector encoding.
 *
 * Shows the compressed representation that the encoder learned.
 * This 32-dimensional vector captures the essence of the 784-dimensional input.
 *
 * @param latentVector Latent representation [32]
 * @param label Optional label (e.g., "Digit 1")
 */
export function showLatentVector(
  latentVector: number[] | Float32Array,
  label: string = ''
): void {
  console.log(`\n=== Latent Space Encoding ${label ? `(${label})` : ''} ===\n`);

  console.log(`Dimensions: ${latentVector.length} (compressed from 784)`);

  // Show first 16 values (half the latent vector)
  const firstHalf = Array.from(latentVector.slice(0, 16))
    .map(v => v.toFixed(3))
    .join(', ');
  console.log(`First 16 values: [${firstHalf}, ...]`);

  // Calculate some statistics
  const values = Array.from(latentVector);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  console.log(`\nStatistics:`);
  console.log(`  Mean: ${mean.toFixed(3)}`);
  console.log(`  Min:  ${min.toFixed(3)}`);
  console.log(`  Max:  ${max.toFixed(3)}`);
}

/**
 * Display training progress summary.
 *
 * @param history Training history with loss values per epoch
 */
export function showTrainingProgress(history: { loss: number[]; mse?: number[] }): void {
  console.log('\n=== Training Progress ===\n');

  const epochs = history.loss.length;
  const initialLoss = history.loss[0];
  const finalLoss = history.loss[epochs - 1];
  const improvement = ((initialLoss - finalLoss) / initialLoss * 100).toFixed(1);

  console.log(`Total epochs: ${epochs}`);
  console.log(`Initial loss: ${initialLoss.toFixed(6)}`);
  console.log(`Final loss:   ${finalLoss.toFixed(6)}`);
  console.log(`Improvement:  ${improvement}% reduction`);

  console.log('\nLoss curve (every 5 epochs):');
  for (let i = 0; i < epochs; i++) {
    if (i % 5 === 0 || i === epochs - 1) {
      const epoch = (i + 1).toString().padStart(2);
      const loss = history.loss[i].toFixed(6);
      const bar = '█'.repeat(Math.max(1, Math.floor((1 - history.loss[i] / initialLoss) * 40)));
      console.log(`  Epoch ${epoch}: ${loss} ${bar}`);
    }
  }
}
