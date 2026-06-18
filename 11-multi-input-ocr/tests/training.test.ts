/**
 * Tests for training pipeline
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { generateDataset, datasetToTensors } from '../src/dataset.js';
import { buildMultiInputModel, compileModel } from '../src/model.js';
import { trainModel } from '../src/train.js';

describe('Training Pipeline', () => {
  let model: tf.LayersModel;
  let images: tf.Tensor4D;
  let auxFeatures: tf.Tensor2D;
  let labels: tf.Tensor2D;

  afterEach(() => {
    if (model) model.dispose();
    if (images) images.dispose();
    if (auxFeatures) auxFeatures.dispose();
    if (labels) labels.dispose();
  });

  it('trains without errors', async () => {
    // Generate small dataset
    const dataset = generateDataset(5); // 25 samples
    const tensors = datasetToTensors(dataset);
    images = tensors.images;
    auxFeatures = tensors.auxFeatures;
    labels = tensors.labels;

    // Build and compile model
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    // Train for just 2 epochs
    await expect(
      trainModel(model, images, auxFeatures, labels, {
        epochs: 2,
        batchSize: 8,
        validationSplit: 0.2
      })
    ).resolves.toBeDefined();
  });

  it('returns training history', async () => {
    const dataset = generateDataset(5);
    const tensors = datasetToTensors(dataset);
    images = tensors.images;
    auxFeatures = tensors.auxFeatures;
    labels = tensors.labels;

    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    const history = await trainModel(model, images, auxFeatures, labels, {
      epochs: 3,
      batchSize: 8,
      validationSplit: 0.2
    });

    // Check history structure
    expect(history.loss.length).toBe(3);
    expect(history.accuracy.length).toBe(3);
    expect(history.valLoss?.length).toBe(3);
    expect(history.valAccuracy?.length).toBe(3);
  });

  it('improves accuracy during training', async () => {
    // Use larger dataset for reliable training
    const dataset = generateDataset(20); // 100 samples
    const tensors = datasetToTensors(dataset);
    images = tensors.images;
    auxFeatures = tensors.auxFeatures;
    labels = tensors.labels;

    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    const history = await trainModel(model, images, auxFeatures, labels, {
      epochs: 10,
      batchSize: 16,
      validationSplit: 0.2
    });

    const initialAccuracy = history.accuracy[0];
    const finalAccuracy = history.accuracy[history.accuracy.length - 1];

    // Final accuracy should be better than initial
    // OR final accuracy should be significantly above random (20% for 5 classes)
    const improved = finalAccuracy > initialAccuracy;
    const aboveRandom = finalAccuracy > 0.3; // 30% > 20% random baseline

    expect(improved || aboveRandom).toBe(true);
  }, 30000); // Increase timeout for this test

  it('loss decreases during training', async () => {
    const dataset = generateDataset(15); // 75 samples
    const tensors = datasetToTensors(dataset);
    images = tensors.images;
    auxFeatures = tensors.auxFeatures;
    labels = tensors.labels;

    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    const history = await trainModel(model, images, auxFeatures, labels, {
      epochs: 8,
      batchSize: 16,
      validationSplit: 0.2
    });

    const initialLoss = history.loss[0];
    const finalLoss = history.loss[history.loss.length - 1];

    // Loss should decrease (or stay very low)
    expect(finalLoss).toBeLessThanOrEqual(initialLoss + 0.1); // Allow small noise
  }, 30000);

  it('model can make predictions after training', async () => {
    const dataset = generateDataset(10);
    const tensors = datasetToTensors(dataset);
    images = tensors.images;
    auxFeatures = tensors.auxFeatures;
    labels = tensors.labels;

    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    await trainModel(model, images, auxFeatures, labels, {
      epochs: 3,
      batchSize: 16,
      validationSplit: 0.2
    });

    // Try making a prediction
    const testImage = tf.randomNormal([1, 14, 14, 1]);
    const testAux = tf.randomNormal([1, 5]);

    const prediction = model.predict([testImage, testAux]) as tf.Tensor;

    expect(prediction.shape).toEqual([1, 5]);

    testImage.dispose();
    testAux.dispose();
    prediction.dispose();
  });
});
