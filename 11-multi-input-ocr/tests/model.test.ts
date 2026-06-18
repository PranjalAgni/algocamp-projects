/**
 * Tests for multi-input model architecture
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as tf from '@tensorflow/tfjs-node';
import { buildMultiInputModel, compileModel } from '../src/model.js';

describe('Multi-Input Model', () => {
  let model: tf.LayersModel;

  afterEach(() => {
    if (model) {
      model.dispose();
    }
  });

  it('builds a model with correct input shapes', () => {
    const { model: builtModel, imageInput, auxInput } = buildMultiInputModel();
    model = builtModel;

    // Check image input shape: [batch, 14, 14, 1]
    expect(imageInput.shape).toEqual([null, 14, 14, 1]);

    // Check auxiliary input shape: [batch, 5]
    expect(auxInput.shape).toEqual([null, 5]);
  });

  it('has correct output shape', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;

    // Output should be [batch, 5] for 5 classes
    expect(model.outputs[0].shape).toEqual([null, 5]);
  });

  it('accepts two inputs', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;

    // Model should have exactly 2 inputs
    expect(model.inputs.length).toBe(2);
  });

  it('compiles without errors', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;

    expect(() => compileModel(model)).not.toThrow();
  });

  it('can make predictions with both inputs', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    // Create dummy inputs
    const imageInput = tf.randomNormal([1, 14, 14, 1]);
    const auxInput = tf.randomNormal([1, 5]);

    // Make prediction
    const prediction = model.predict([imageInput, auxInput]) as tf.Tensor;

    // Check output shape
    expect(prediction.shape).toEqual([1, 5]);

    // Check output sums to 1 (softmax property)
    const sum = prediction.sum().dataSync()[0];
    expect(sum).toBeCloseTo(1, 5);

    // Cleanup
    imageInput.dispose();
    auxInput.dispose();
    prediction.dispose();
  });

  it('has reasonable number of parameters', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;

    const params = model.countParams();

    // Should have some parameters but not too many
    // Expected ballpark:
    // - Image branch: 196*64 + 64 ≈ 12,600
    // - Aux branch: 5*32 + 32 = 192
    // - Merge: 96*64 + 64 ≈ 6,200
    // - Output: 64*5 + 5 = 325
    // Total ≈ 19,000-20,000
    expect(params).toBeGreaterThan(10000);
    expect(params).toBeLessThan(50000);
  });

  it('requires both inputs (cannot predict with single input)', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;
    compileModel(model);

    const imageInput = tf.randomNormal([1, 14, 14, 1]);

    // Trying to predict with only one input should throw
    expect(() => {
      model.predict(imageInput);
    }).toThrow();

    imageInput.dispose();
  });

  it('has named layers for clarity', () => {
    const { model: builtModel } = buildMultiInputModel();
    model = builtModel;

    const layerNames = model.layers.map(layer => layer.name);

    // Check for expected layer names
    expect(layerNames).toContain('image_input');
    expect(layerNames).toContain('aux_input');
    expect(layerNames).toContain('image_flatten');
    expect(layerNames).toContain('image_dense');
    expect(layerNames).toContain('aux_dense');
    expect(layerNames).toContain('merge_branches');
    expect(layerNames).toContain('output');
  });
});
