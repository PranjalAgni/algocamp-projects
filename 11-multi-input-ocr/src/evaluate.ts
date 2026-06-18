/**
 * Evaluation and Prediction Utilities
 */

import * as tf from '@tensorflow/tfjs-node';
import { DataSample } from './dataset.js';

/**
 * Evaluate model on test data
 */
export function evaluateModel(
  model: tf.LayersModel,
  testImages: tf.Tensor4D,
  testAux: tf.Tensor2D,
  testLabels: tf.Tensor2D
): { loss: number; accuracy: number } {
  console.log('\n=== Evaluating on Test Set ===\n');

  // Evaluate with BOTH inputs
  const result = model.evaluate(
    [testImages, testAux],
    testLabels
  ) as tf.Scalar[];

  const loss = result[0].dataSync()[0];
  const accuracy = result[1].dataSync()[0];

  console.log(`Test Loss: ${loss.toFixed(4)}`);
  console.log(`Test Accuracy: ${(accuracy * 100).toFixed(2)}%`);
  console.log(`Baseline (random): ${(100 / 5).toFixed(2)}%\n`);

  return { loss, accuracy };
}

/**
 * Run predictions on sample data and display results
 */
export async function runSamplePredictions(
  model: tf.LayersModel,
  samples: DataSample[],
  count: number = 5
): Promise<void> {
  console.log('\n=== Sample Predictions ===\n');

  for (let i = 0; i < Math.min(count, samples.length); i++) {
    const sample = samples[i];

    // Prepare inputs - flatten and reshape properly
    const imageData = sample.image.flat(); // 196 values
    const imageInput = tf.tensor4d(imageData, [1, 14, 14, 1]);
    const auxInput = tf.tensor2d([sample.auxFeatures], [1, 5]);

    // Make prediction with BOTH inputs
    const prediction = model.predict([imageInput, auxInput]) as tf.Tensor;
    const probabilities = await prediction.data();
    const predictedClass = prediction.argMax(-1).dataSync()[0];

    console.log(`Sample ${i + 1}:`);
    console.log(`  True Label: ${sample.label}`);
    console.log(`  Predicted: ${predictedClass}`);
    console.log(`  Auxiliary Features: [${sample.auxFeatures.map(f => f.toFixed(2)).join(', ')}]`);
    console.log(`  Confidence: ${(probabilities[predictedClass] * 100).toFixed(1)}%`);
    console.log(`  All Probabilities: [${Array.from(probabilities).map(p => (p * 100).toFixed(1) + '%').join(', ')}]`);
    console.log();

    // Clean up
    imageInput.dispose();
    auxInput.dispose();
    prediction.dispose();
  }
}

/**
 * Visualize a sample image as ASCII art
 */
export function visualizeImage(image: number[][]): string {
  let output = '\n';
  for (const row of image) {
    output += '  ';
    for (const pixel of row) {
      output += pixel > 0.5 ? '█' : ' ';
    }
    output += '\n';
  }
  return output;
}
