/**
 * Neural Network Model Definition and Training
 *
 * This module demonstrates the core concepts of a feed-forward neural network:
 * - Model architecture (Sequential API with Dense layers)
 * - Activation functions (ReLU for hidden layers, Softmax for output)
 * - Loss function (Categorical Cross-Entropy for classification)
 * - Optimizer (Adam with adaptive learning rate)
 * - Training loop (fit method with callbacks)
 * - Evaluation (accuracy metric on held-out test data)
 */

import * as tf from '@tensorflow/tfjs-node';

/**
 * Create a simple feed-forward neural network for binary classification.
 *
 * Architecture:
 * - Input: 2 features (x, y coordinates)
 * - Hidden Layer 1: 8 neurons with ReLU activation
 * - Hidden Layer 2: 4 neurons with ReLU activation
 * - Output Layer: 2 neurons with Softmax activation (probability distribution over 2 classes)
 *
 * ReLU (Rectified Linear Unit): f(x) = max(0, x)
 * - Introduces non-linearity, allowing the network to learn complex patterns
 * - Computationally efficient
 * - Helps avoid vanishing gradient problem
 *
 * Softmax: Converts logits to probability distribution summing to 1
 * - Essential for multi-class classification
 * - Output[i] = exp(logit[i]) / sum(exp(logit))
 */
export function createModel(): tf.Sequential {
  const model = tf.sequential();

  // First hidden layer: 8 neurons with ReLU activation
  // inputShape [2] means we expect 2D input features
  model.add(
    tf.layers.dense({
      units: 8,
      activation: 'relu',
      inputShape: [2],
    })
  );

  // Second hidden layer: 4 neurons with ReLU activation
  // Gradually reducing dimensions is a common pattern
  model.add(
    tf.layers.dense({
      units: 4,
      activation: 'relu',
    })
  );

  // Output layer: 2 neurons (one per class) with Softmax
  // Softmax ensures outputs are probabilities that sum to 1
  model.add(
    tf.layers.dense({
      units: 2,
      activation: 'softmax',
    })
  );

  return model;
}

/**
 * Compile the model with loss function, optimizer, and metrics.
 *
 * Loss: Categorical Cross-Entropy
 * - Standard loss for multi-class classification
 * - Measures the difference between predicted probability distribution and true labels
 * - Formula: -sum(y_true * log(y_pred))
 *
 * Optimizer: Adam (Adaptive Moment Estimation)
 * - Combines momentum and adaptive learning rates
 * - Generally converges faster than vanilla SGD
 * - Learning rate 0.01 is a reasonable starting point
 *
 * Metrics: Accuracy
 * - Percentage of correctly classified samples
 * - Easy to interpret for learning purposes
 */
export function compileModel(model: tf.Sequential): void {
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });
}

export interface TrainingHistory {
  loss: number[];
  accuracy: number[];
}

/**
 * Train the neural network on the provided data.
 *
 * The training loop performs the following steps for each epoch:
 * 1. Forward Pass: Compute predictions from inputs
 * 2. Loss Computation: Calculate error between predictions and true labels
 * 3. Backward Pass (Backpropagation): Compute gradients of loss w.r.t. weights
 * 4. Weight Update: Adjust weights using the optimizer to minimize loss
 *
 * @param model The compiled model
 * @param xTrain Training features
 * @param yTrain Training labels (one-hot encoded)
 * @param epochs Number of complete passes through the training data
 * @param batchSize Number of samples per gradient update
 * @param validationSplit Fraction of training data to use for validation
 * @returns Training history with loss and accuracy per epoch
 */
export async function trainModel(
  model: tf.Sequential,
  xTrain: tf.Tensor2D,
  yTrain: tf.Tensor2D,
  epochs: number = 50,
  batchSize: number = 32,
  validationSplit: number = 0.1
): Promise<TrainingHistory> {
  console.log('\n=== Starting Training ===\n');

  // The fit method handles the entire training loop internally
  const history = await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationSplit, // Hold out 10% of training data for validation during training
    callbacks: {
      // Log progress every epoch
      onEpochEnd: (epoch, logs) => {
        // Only print every 10 epochs to reduce clutter
        if ((epoch + 1) % 10 === 0 || epoch === 0) {
          console.log(
            `Epoch ${(epoch + 1).toString().padStart(2)}/${epochs} - ` +
              `loss: ${logs?.loss.toFixed(4)} - ` +
              `accuracy: ${logs?.acc.toFixed(4)} - ` +
              `val_loss: ${logs?.val_loss.toFixed(4)} - ` +
              `val_accuracy: ${logs?.val_acc.toFixed(4)}`
          );
        }
      },
    },
  });

  console.log('\n=== Training Complete ===\n');

  return {
    loss: history.history.loss as number[],
    accuracy: history.history.acc as number[],
  };
}

/**
 * Evaluate the model on test data.
 *
 * This measures generalization: how well the model performs on unseen data.
 * A large gap between training and test accuracy suggests overfitting.
 *
 * @param model Trained model
 * @param xTest Test features
 * @param yTest Test labels (one-hot encoded)
 * @returns Test accuracy as a percentage
 */
export async function evaluateModel(
  model: tf.Sequential,
  xTest: tf.Tensor2D,
  yTest: tf.Tensor2D
): Promise<number> {
  const result = model.evaluate(xTest, yTest) as tf.Scalar[];

  // evaluate returns [loss, accuracy]
  const testLoss = await result[0].data();
  const testAccuracy = await result[1].data();

  console.log(`Test Loss: ${testLoss[0].toFixed(4)}`);
  console.log(`Test Accuracy: ${(testAccuracy[0] * 100).toFixed(2)}%`);

  // Clean up tensors
  result.forEach(tensor => tensor.dispose());

  return testAccuracy[0];
}

/**
 * Run predictions on sample inputs.
 *
 * This demonstrates inference: using a trained model to make predictions.
 *
 * @param model Trained model
 * @param samples Array of [x, y] coordinate pairs
 * @returns Predicted class labels (0 or 1)
 */
export function predict(model: tf.Sequential, samples: number[][]): number[] {
  const inputTensor = tf.tensor2d(samples);
  const predictions = model.predict(inputTensor) as tf.Tensor2D;

  // argMax gets the index of the highest probability (the predicted class)
  const predictedClasses = predictions.argMax(-1);
  const classArray = Array.from(predictedClasses.dataSync());

  // Clean up tensors
  inputTensor.dispose();
  predictions.dispose();
  predictedClasses.dispose();

  return classArray;
}

/**
 * Print a summary of the model architecture.
 * Shows layers, output shapes, and number of parameters.
 */
export function printModelSummary(model: tf.Sequential): void {
  console.log('\n=== Model Architecture ===\n');
  model.summary();
  console.log('');
}
