# Multi-Input Neural Network for OCR

A learning project demonstrating **multi-input neural networks** — models that accept multiple separate inputs, process them through dedicated branches, and merge them for final predictions.

## What This Is

This project teaches the **multi-input architecture pattern** in the context of OCR:
- **Primary input**: 14x14 grayscale images of synthetic digits (0-4)
- **Auxiliary input**: 5-dimensional feature vector with hints about the digit
- **Two-branch architecture**: Each input processed separately before merging
- **Explicit concatenation**: Shows how to merge learned representations
- **Shared head**: Combined features flow to classification layers

The focus is **understanding multi-input models**, not achieving state-of-the-art OCR.

## Why Multi-Input?

Real-world ML problems often have multiple information sources:
- **Computer Vision**: Image + metadata (camera settings, location, timestamp)
- **Medical Diagnosis**: X-ray image + patient history + lab results
- **Recommendation Systems**: User features + item features + context
- **OCR/Document Processing**: Image + layout features + language hints

Multi-input models let each source have its own processing pipeline before merging.

## Architecture

```
Image (14×14×1) → Flatten → Dense(64, ReLU) ────┐
                                                 ├─→ Concatenate → Dense(64) → Dropout → Dense(5, Softmax)
Auxiliary (5)   → Dense(32, ReLU) ──────────────┘
```

Key components:
- **Image branch**: Extracts visual features from pixel data
- **Auxiliary branch**: Processes hand-crafted features (aspect ratio, fill density, symmetry, etc.)
- **Merge layer**: Concatenates both representations (64 + 32 = 96 dimensions)
- **Classification head**: Makes final prediction from merged features

## Tech Stack

**TypeScript + TensorFlow.js** (`@tensorflow/tfjs-node`)

Why not Python?
- Python 3.9 + TensorFlow on macOS arm64 has installation issues
- `@tensorflow/tfjs-node` v4.x installs reliably and supports multi-input models
- Functional API: `tf.model({ inputs: [a, b], outputs: c })`
- Fast iteration with `tsx` (no build step)

## Installation

```bash
npm install
```

## Usage

### Run the Demo

```bash
npm run demo
```

Generates synthetic data, builds the model, trains for 20 epochs, evaluates, and shows sample predictions.

**Expected Output** (real run):

```
╔═══════════════════════════════════════════════╗
║  Multi-Input Neural Network for OCR Demo     ║
║  Learning Project: Two-Input Architecture     ║
╚═══════════════════════════════════════════════╝

📊 Step 1: Generating synthetic dataset...

Total samples: 500
Training samples: 400
Test samples: 100
Classes: 5 (digits 0-4)
Image size: 14x14 grayscale
Auxiliary features: 5-dimensional vector

Sample image (digit 3):

                
                
                
                
                
                
                
          ███   
                
                
                
                
                
                

Training tensors:
  Images: 400,14,14,1
  Auxiliary: 400,5
  Labels: 400,5

🏗️  Step 2: Building multi-input model...

=== Multi-Input Model Architecture ===

___________________________________________________________________________________________________________________
Layer (type)               Input Shape                 Output shape             Param #     Receives inputs        
===================================================================================================================
image_input (InputLayer)   [[null,14,14,1]]            [null,14,14,1]           0                                  
___________________________________________________________________________________________________________________
image_flatten (Flatten)    [[null,14,14,1]]            [null,196]               0           image_input[0][0]      
___________________________________________________________________________________________________________________
aux_input (InputLayer)     [[null,5]]                  [null,5]                 0                                  
___________________________________________________________________________________________________________________
image_dense (Dense)        [[null,196]]                [null,64]                12608       image_flatten[0][0]    
___________________________________________________________________________________________________________________
aux_dense (Dense)          [[null,5]]                  [null,32]                192         aux_input[0][0]        
___________________________________________________________________________________________________________________
merge_branches (Concatenat [[null,64],[null,32]]       [null,96]                0           image_dense[0][0]      
                                                                                            aux_dense[0][0]        
___________________________________________________________________________________________________________________
combined_dense (Dense)     [[null,96]]                 [null,64]                6208        merge_branches[0][0]   
___________________________________________________________________________________________________________________
dropout (Dropout)          [[null,64]]                 [null,64]                0           combined_dense[0][0]   
___________________________________________________________________________________________________________________
output (Dense)             [[null,64]]                 [null,5]                 325         dropout[0][0]          
===================================================================================================================
Total params: 19333
Trainable params: 19333
Non-trainable params: 0

Note: The model has TWO inputs:
  1. image_input: [batch, 14, 14, 1]
  2. aux_input: [batch, 5]
These are processed separately, then merged.

🎯 Step 3: Training model...

=== Training Multi-Input Model ===

Epochs: 20
Batch size: 32
Validation split: 0.2

Epoch 1/20 - loss: 1.3394 - acc: 0.5500 - val_loss: 1.0861 - val_acc: 0.9750
Epoch 2/20 - loss: 0.8908 - acc: 0.9438 - val_loss: 0.7484 - val_acc: 1.0000
Epoch 3/20 - loss: 0.5620 - acc: 0.9875 - val_loss: 0.4652 - val_acc: 1.0000
Epoch 4/20 - loss: 0.3242 - acc: 0.9938 - val_loss: 0.2671 - val_acc: 1.0000
Epoch 5/20 - loss: 0.1727 - acc: 1.0000 - val_loss: 0.1446 - val_acc: 1.0000
Epoch 6/20 - loss: 0.1126 - acc: 1.0000 - val_loss: 0.0746 - val_acc: 1.0000
Epoch 7/20 - loss: 0.0633 - acc: 1.0000 - val_loss: 0.0394 - val_acc: 1.0000
Epoch 8/20 - loss: 0.0384 - acc: 1.0000 - val_loss: 0.0242 - val_acc: 1.0000
Epoch 9/20 - loss: 0.0243 - acc: 1.0000 - val_loss: 0.0160 - val_acc: 1.0000
Epoch 10/20 - loss: 0.0200 - acc: 1.0000 - val_loss: 0.0114 - val_acc: 1.0000
Epoch 11/20 - loss: 0.0145 - acc: 1.0000 - val_loss: 0.0087 - val_acc: 1.0000
Epoch 12/20 - loss: 0.0133 - acc: 1.0000 - val_loss: 0.0069 - val_acc: 1.0000
Epoch 13/20 - loss: 0.0103 - acc: 1.0000 - val_loss: 0.0057 - val_acc: 1.0000
Epoch 14/20 - loss: 0.0084 - acc: 1.0000 - val_loss: 0.0048 - val_acc: 1.0000
Epoch 15/20 - loss: 0.0072 - acc: 1.0000 - val_loss: 0.0041 - val_acc: 1.0000
Epoch 16/20 - loss: 0.0062 - acc: 1.0000 - val_loss: 0.0035 - val_acc: 1.0000
Epoch 17/20 - loss: 0.0047 - acc: 1.0000 - val_loss: 0.0031 - val_acc: 1.0000
Epoch 18/20 - loss: 0.0047 - acc: 1.0000 - val_loss: 0.0028 - val_acc: 1.0000
Epoch 19/20 - loss: 0.0044 - acc: 1.0000 - val_loss: 0.0025 - val_acc: 1.0000
Epoch 20/20 - loss: 0.0044 - acc: 1.0000 - val_loss: 0.0022 - val_acc: 1.0000

✅ Training complete!
Final training accuracy: 100.00%
Final validation accuracy: 100.00%

📈 Step 4: Evaluating on test set...

=== Evaluating on Test Set ===

Test Loss: 0.0011
Test Accuracy: 100.00%
Baseline (random): 20.00%

🔮 Step 5: Sample predictions...

=== Sample Predictions ===

Sample 1:
  True Label: 1
  Predicted: 1
  Auxiliary Features: [0.20, 0.10, 0.78, 0.00, 0.07]
  Confidence: 100.0%
  All Probabilities: [0.0%, 100.0%, 0.0%, 0.0%, 0.0%]

Sample 2:
  True Label: 0
  Predicted: 0
  Auxiliary Features: [1.00, 0.33, 0.77, 0.50, 0.85]
  Confidence: 100.0%
  All Probabilities: [100.0%, 0.0%, 0.0%, 0.0%, 0.0%]

Sample 3:
  True Label: 3
  Predicted: 3
  Auxiliary Features: [3.00, 0.02, 0.95, 0.00, 0.91]
  Confidence: 99.8%
  All Probabilities: [0.0%, 0.0%, 0.0%, 99.8%, 0.1%]

Sample 4:
  True Label: 4
  Predicted: 4
  Auxiliary Features: [0.80, 0.11, 0.94, 0.07, 0.25]
  Confidence: 99.9%
  All Probabilities: [0.0%, 0.0%, 0.0%, 0.0%, 99.9%]

Sample 5:
  True Label: 1
  Predicted: 1
  Auxiliary Features: [0.20, 0.09, 0.81, 0.00, 0.16]
  Confidence: 99.9%
  All Probabilities: [0.0%, 99.9%, 0.0%, 0.0%, 0.0%]

╔═══════════════════════════════════════════════╗
║              Demo Complete!                   ║
╚═══════════════════════════════════════════════╝

Key Takeaways:
  ✓ Multi-input model accepts TWO inputs (image + auxiliary)
  ✓ Each input processed through separate branch
  ✓ Branches merged via concatenation
  ✓ Shared classification head makes final prediction
  ✓ Test accuracy: 100.00% (baseline: 20%)
```

### Run Tests

```bash
npm test
```

**Test Coverage:**
- **Dataset tests**: Shape validation, class distribution, tensor conversion
- **Model tests**: Architecture checks, multi-input verification, parameter counts
- **Training tests**: Smoke training, accuracy improvement, loss decrease

All tests pass offline (no downloads required).

## Project Structure

```
11-multi-input-ocr/
├── src/
│   ├── dataset.ts      # Synthetic data generation (images + aux features)
│   ├── model.ts        # Multi-input model builder (★ key learning file)
│   ├── train.ts        # Training pipeline
│   ├── evaluate.ts     # Evaluation and predictions
│   └── demo.ts         # Full demo script
├── tests/
│   ├── dataset.test.ts
│   ├── model.test.ts
│   └── training.test.ts
├── RESEARCH.md          # Concept explanation, stack choice
├── PLAN.md              # Implementation plan
└── README.md            # This file
```

## Key Learnings

1. **Multi-Input Pattern**: `tf.model({ inputs: [inputA, inputB], outputs })` — not `inputs: inputA`
2. **Branch Processing**: Each input can have its own layer stack (conv for images, dense for features)
3. **Merging**: `tf.layers.concatenate()` combines learned representations
4. **Training**: Pass inputs as array: `model.fit([imageData, auxData], labels)`
5. **Prediction**: Also an array: `model.predict([imageInput, auxInput])`

## Environment

- **No API keys needed** — all data generated locally
- **Offline-friendly** — no downloads, trains in seconds
- **Tested on**: macOS arm64, Node v22.17.0
- **Dependencies**: `@tensorflow/tfjs-node` v4.x

## Results

- **Test Accuracy**: 100% (perfect classification on synthetic data)
- **Baseline**: 20% (random guessing for 5 classes)
- **Training Time**: ~5 seconds for 20 epochs
- **Dataset**: 500 samples (400 train, 100 test)

The high accuracy demonstrates the model successfully learns from both inputs. With real-world noisy data, you'd expect lower but still improved accuracy compared to image-only models.

## Stretch Ideas (Not Implemented)

- Add convolutional layers to the image branch
- Visualize learned feature weights
- Compare accuracy with vs. without auxiliary features (ablation study)
- Expand to full 10 digits (MNIST-like)
- Integrate real Tesseract.js for comparison
- Add attention mechanism to weight input importance

## License

MIT
