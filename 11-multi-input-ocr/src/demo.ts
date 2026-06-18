/**
 * Demo Script: Multi-Input OCR Model
 *
 * This script demonstrates the complete pipeline:
 * 1. Generate synthetic dataset
 * 2. Build multi-input model
 * 3. Train the model
 * 4. Evaluate on test set
 * 5. Run sample predictions
 */

import * as tf from '@tensorflow/tfjs-node';
import { generateDataset, splitDataset, datasetToTensors } from './dataset.js';
import { buildMultiInputModel, compileModel, printModelSummary } from './model.js';
import { trainModel } from './train.js';
import { evaluateModel, runSamplePredictions, visualizeImage } from './evaluate.js';

async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Multi-Input Neural Network for OCR Demo     ║');
  console.log('║  Learning Project: Two-Input Architecture     ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  // ============================================================
  // STEP 1: Generate Synthetic Dataset
  // ============================================================
  console.log('📊 Step 1: Generating synthetic dataset...\n');

  const samplesPerClass = 100; // 100 samples per digit class
  const fullDataset = generateDataset(samplesPerClass);
  const { train, test } = splitDataset(fullDataset, 0.8);

  console.log(`Total samples: ${fullDataset.length}`);
  console.log(`Training samples: ${train.length}`);
  console.log(`Test samples: ${test.length}`);
  console.log(`Classes: 5 (digits 0-4)`);
  console.log(`Image size: 14x14 grayscale`);
  console.log(`Auxiliary features: 5-dimensional vector\n`);

  // Show a sample image
  console.log('Sample image (digit ' + train[0].label + '):');
  console.log(visualizeImage(train[0].image));

  // Convert to tensors
  const trainData = datasetToTensors(train);
  const testData = datasetToTensors(test);

  console.log(`Training tensors:`);
  console.log(`  Images: ${trainData.images.shape}`);
  console.log(`  Auxiliary: ${trainData.auxFeatures.shape}`);
  console.log(`  Labels: ${trainData.labels.shape}\n`);

  // ============================================================
  // STEP 2: Build Multi-Input Model
  // ============================================================
  console.log('🏗️  Step 2: Building multi-input model...\n');

  const { model } = buildMultiInputModel();
  compileModel(model);
  printModelSummary(model);

  // ============================================================
  // STEP 3: Train the Model
  // ============================================================
  console.log('🎯 Step 3: Training model...\n');

  const history = await trainModel(
    model,
    trainData.images,
    trainData.auxFeatures,
    trainData.labels,
    {
      epochs: 20,
      batchSize: 32,
      validationSplit: 0.2
    }
  );

  console.log('\n✅ Training complete!');
  console.log(`Final training accuracy: ${(history.accuracy[history.accuracy.length - 1] * 100).toFixed(2)}%`);
  console.log(`Final validation accuracy: ${(history.valAccuracy![history.valAccuracy!.length - 1] * 100).toFixed(2)}%\n`);

  // ============================================================
  // STEP 4: Evaluate on Test Set
  // ============================================================
  console.log('📈 Step 4: Evaluating on test set...\n');

  const evaluation = evaluateModel(
    model,
    testData.images,
    testData.auxFeatures,
    testData.labels
  );

  // ============================================================
  // STEP 5: Sample Predictions
  // ============================================================
  console.log('🔮 Step 5: Sample predictions...\n');

  await runSamplePredictions(model, test, 5);

  // ============================================================
  // Summary
  // ============================================================
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║              Demo Complete!                   ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  console.log('Key Takeaways:');
  console.log('  ✓ Multi-input model accepts TWO inputs (image + auxiliary)');
  console.log('  ✓ Each input processed through separate branch');
  console.log('  ✓ Branches merged via concatenation');
  console.log('  ✓ Shared classification head makes final prediction');
  console.log(`  ✓ Test accuracy: ${(evaluation.accuracy * 100).toFixed(2)}% (baseline: 20%)\n`);

  // Cleanup
  trainData.images.dispose();
  trainData.auxFeatures.dispose();
  trainData.labels.dispose();
  testData.images.dispose();
  testData.auxFeatures.dispose();
  testData.labels.dispose();
  model.dispose();
}

// Run the demo
main().catch(console.error);
