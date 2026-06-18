/**
 * Multi-Input Neural Network Model
 *
 * This demonstrates the KEY CONCEPT: a model with TWO separate inputs
 * (image and auxiliary features) that are processed through separate
 * branches before being merged.
 *
 * Architecture:
 * - Branch 1: Image (14x14x1) → Flatten → Dense(64, relu)
 * - Branch 2: Auxiliary (5) → Dense(32, relu)
 * - Merge: Concatenate branches → Dense(64, relu)
 * - Head: Dense(5, softmax) for classification
 */

import * as tf from '@tensorflow/tfjs-node';

export interface MultiInputModel {
  model: tf.LayersModel;
  imageInput: tf.SymbolicTensor;
  auxInput: tf.SymbolicTensor;
}

/**
 * Build a multi-input model for digit classification
 *
 * The function explicitly shows the two-branch structure:
 * 1. Define separate input layers
 * 2. Process each input through its own branch
 * 3. Concatenate the learned representations
 * 4. Add a shared classification head
 */
export function buildMultiInputModel(): MultiInputModel {
  // ============================================================
  // BRANCH 1: Image Processing
  // ============================================================
  // Input layer for images: [batch, 14, 14, 1]
  const imageInput = tf.input({ shape: [14, 14, 1], name: 'image_input' });

  // Flatten the 2D image to 1D: 14*14*1 = 196
  let imageFeatures = tf.layers.flatten({ name: 'image_flatten' }).apply(imageInput) as tf.SymbolicTensor;

  // Dense layer to learn image features
  imageFeatures = tf.layers.dense({
    units: 64,
    activation: 'relu',
    name: 'image_dense'
  }).apply(imageFeatures) as tf.SymbolicTensor;

  // ============================================================
  // BRANCH 2: Auxiliary Features Processing
  // ============================================================
  // Input layer for auxiliary features: [batch, 5]
  const auxInput = tf.input({ shape: [5], name: 'aux_input' });

  // Dense layer to learn auxiliary feature representations
  let auxFeatures = tf.layers.dense({
    units: 32,
    activation: 'relu',
    name: 'aux_dense'
  }).apply(auxInput) as tf.SymbolicTensor;

  // ============================================================
  // MERGE: Concatenate Both Branches
  // ============================================================
  // This is the KEY STEP: combine the learned representations
  // from both inputs. The concatenated vector has size 64 + 32 = 96
  const merged = tf.layers.concatenate({ name: 'merge_branches' }).apply([
    imageFeatures,
    auxFeatures
  ]) as tf.SymbolicTensor;

  // ============================================================
  // SHARED HEAD: Classification Layers
  // ============================================================
  // Process the merged features through a shared dense layer
  let combined = tf.layers.dense({
    units: 64,
    activation: 'relu',
    name: 'combined_dense'
  }).apply(merged) as tf.SymbolicTensor;

  // Add dropout for regularization
  combined = tf.layers.dropout({
    rate: 0.3,
    name: 'dropout'
  }).apply(combined) as tf.SymbolicTensor;

  // Final classification layer: 5 classes (digits 0-4)
  const output = tf.layers.dense({
    units: 5,
    activation: 'softmax',
    name: 'output'
  }).apply(combined) as tf.SymbolicTensor;

  // ============================================================
  // CREATE THE MULTI-INPUT MODEL
  // ============================================================
  // CRITICAL: We specify BOTH inputs in an array
  // This is what makes it a multi-input model
  const model = tf.model({
    inputs: [imageInput, auxInput], // <-- TWO inputs!
    outputs: output,
    name: 'multi_input_ocr'
  });

  return { model, imageInput, auxInput };
}

/**
 * Compile the model with optimizer and loss function
 */
export function compileModel(model: tf.LayersModel): void {
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
}

/**
 * Print model summary to show the architecture
 */
export function printModelSummary(model: tf.LayersModel): void {
  console.log('\n=== Multi-Input Model Architecture ===\n');
  model.summary();
  console.log('\nNote: The model has TWO inputs:');
  console.log('  1. image_input: [batch, 14, 14, 1]');
  console.log('  2. aux_input: [batch, 5]');
  console.log('These are processed separately, then merged.\n');
}
