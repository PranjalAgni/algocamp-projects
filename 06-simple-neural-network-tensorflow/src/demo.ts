/**
 * Neural Network Demo
 *
 * This script demonstrates the complete workflow of training a neural network:
 * 1. Generate synthetic dataset
 * 2. Split into train/test sets
 * 3. Define model architecture
 * 4. Compile with loss function and optimizer
 * 5. Train the model (forward + backward passes, weight updates)
 * 6. Evaluate on held-out test data
 * 7. Run sample predictions
 */

import { prepareTwoMoonsDataset } from './dataset.js';
import {
  createModel,
  compileModel,
  trainModel,
  evaluateModel,
  predict,
  printModelSummary,
} from './model.js';

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║   Simple Neural Network - TensorFlow.js Demo          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Step 1: Generate and prepare the dataset
  console.log('📊 Generating Two-Moons Dataset...');
  const dataset = prepareTwoMoonsDataset(
    300, // Total samples
    0.1, // Noise level
    0.2, // 20% test split
    42 // Random seed for reproducibility
  );

  console.log(`   Training samples: ${dataset.xTrain.shape[0]}`);
  console.log(`   Test samples: ${dataset.xTest.shape[0]}`);
  console.log(`   Features per sample: ${dataset.xTrain.shape[1]}`);

  // Step 2: Create the neural network model
  console.log('\n🧠 Creating Neural Network...');
  const model = createModel();
  printModelSummary(model);

  // Step 3: Compile the model with loss, optimizer, and metrics
  console.log('⚙️  Compiling Model...');
  compileModel(model);
  console.log('   Loss: Categorical Cross-Entropy');
  console.log('   Optimizer: Adam (learning rate = 0.01)');
  console.log('   Metrics: Accuracy');

  // Step 4: Train the model
  console.log('\n🏋️  Training Model (50 epochs)...');
  const startTime = Date.now();
  const history = await trainModel(
    model,
    dataset.xTrain,
    dataset.yTrain,
    50, // epochs
    32, // batch size
    0.1 // validation split
  );
  const trainingTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`   Training completed in ${trainingTime}s`);
  console.log(`   Initial loss: ${history.loss[0].toFixed(4)}`);
  console.log(`   Final loss: ${history.loss[history.loss.length - 1].toFixed(4)}`);
  console.log(
    `   Initial accuracy: ${(history.accuracy[0] * 100).toFixed(2)}%`
  );
  console.log(
    `   Final accuracy: ${(history.accuracy[history.accuracy.length - 1] * 100).toFixed(2)}%`
  );

  // Step 5: Evaluate on test data
  console.log('\n📈 Evaluating on Test Set...');
  const testAccuracy = await evaluateModel(model, dataset.xTest, dataset.yTest);

  // Step 6: Run sample predictions
  console.log('\n🔮 Sample Predictions:');
  // Moon 0 traces (cos θ, sin θ); moon 1 traces (1 - cos θ, 0.5 - sin θ).
  // These points sit in the unambiguous body of each arc (not the interleaving
  // tips), so the trained network classifies them the same way every run.
  const sampleInputs = [
    [0.0, 1.0], // Top of moon 0's arc → class 0
    [1.0, -0.5], // Bottom of moon 1's arc → class 1
    [0.707, 0.707], // Along moon 0's arc → class 0
  ];

  const predictions = predict(model, sampleInputs);

  sampleInputs.forEach((input, i) => {
    console.log(
      `   Input: [${input[0].toFixed(2)}, ${input[1].toFixed(2)}] → Predicted Class: ${predictions[i]}`
    );
  });

  // Step 7: Final summary
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                   SUMMARY                             ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log(`   Dataset: Two-Moons (300 samples, 240 train / 60 test)`);
  console.log(`   Architecture: Dense(8,relu) → Dense(4,relu) → Dense(2,softmax)`);
  console.log(`   Training Time: ${trainingTime}s`);
  console.log(`   Final Test Accuracy: ${(testAccuracy * 100).toFixed(2)}%`);
  console.log(
    `   Loss Reduction: ${history.loss[0].toFixed(4)} → ${history.loss[history.loss.length - 1].toFixed(4)}`
  );
  console.log('\n✅ Demo completed successfully!\n');

  // Clean up tensors to prevent memory leaks
  dataset.xTrain.dispose();
  dataset.yTrain.dispose();
  dataset.xTest.dispose();
  dataset.yTest.dispose();
}

// Run the demo
main().catch((error) => {
  console.error('\n❌ Error running demo:');
  console.error(error);
  process.exit(1);
});
