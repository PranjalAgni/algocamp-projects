/**
 * Training Pipeline for Multi-Input Model
 */

import * as tf from '@tensorflow/tfjs-node';

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  validationSplit: number;
}

export interface TrainingHistory {
  loss: number[];
  accuracy: number[];
  valLoss?: number[];
  valAccuracy?: number[];
}

/**
 * Train the multi-input model
 *
 * IMPORTANT: When calling model.fit() with a multi-input model,
 * we must pass the inputs as an ARRAY: [imageData, auxData]
 */
export async function trainModel(
  model: tf.LayersModel,
  imageData: tf.Tensor4D,
  auxData: tf.Tensor2D,
  labels: tf.Tensor2D,
  config: TrainingConfig
): Promise<TrainingHistory> {
  console.log('\n=== Training Multi-Input Model ===\n');
  console.log(`Epochs: ${config.epochs}`);
  console.log(`Batch size: ${config.batchSize}`);
  console.log(`Validation split: ${config.validationSplit}\n`);

  // Train the model with BOTH inputs
  // Key point: x is an array [imageData, auxData]
  const history = await model.fit(
    [imageData, auxData], // <-- Array of inputs for multi-input model
    labels,
    {
      epochs: config.epochs,
      batchSize: config.batchSize,
      validationSplit: config.validationSplit,
      verbose: 0, // We'll do custom logging
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(
            `Epoch ${epoch + 1}/${config.epochs} - ` +
            `loss: ${logs?.loss.toFixed(4)} - ` +
            `acc: ${logs?.acc.toFixed(4)} - ` +
            `val_loss: ${logs?.val_loss.toFixed(4)} - ` +
            `val_acc: ${logs?.val_acc.toFixed(4)}`
          );
        }
      }
    }
  );

  return {
    loss: history.history.loss as number[],
    accuracy: history.history.acc as number[],
    valLoss: history.history.val_loss as number[],
    valAccuracy: history.history.val_acc as number[]
  };
}
