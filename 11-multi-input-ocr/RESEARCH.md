# Multi-Input Neural Networks for OCR — Research

## The Core Concept: Multi-Input Models

Most neural networks take a single input (e.g., an image). A **multi-input model** takes **multiple independent inputs** that are processed through separate branches before being merged into a shared decision head.

### Why Multi-Input?

In OCR and computer vision tasks, you often have:
1. **Primary input**: The image itself
2. **Auxiliary inputs**: Side information that helps classification (e.g., expected language, image quality metrics, contextual hints)

Instead of concatenating these features before the network, a multi-input architecture:
- Lets each input have its own processing pipeline (specialized layers)
- Merges the learned representations deeper in the network
- Can learn to weight different information sources appropriately

### Architecture Pattern

```
Image Input (28x28) → Conv/Dense layers → Feature Vector A (64)
                                                           ↓
Auxiliary Input (5) → Dense layers     → Feature Vector B (32)
                                                           ↓
                            [CONCATENATE A + B] → (96)
                                    ↓
                            Dense Classification Head
                                    ↓
                            Output (10 classes)
```

The key learning point: **Two separate input branches, explicit merge, shared head.**

## Stack Decision: TypeScript + TensorFlow.js

### Why Not Python + TensorFlow/PyTorch?

**Problem**: Python 3.9 on macOS arm64 has well-known TensorFlow installation issues:
- `tensorflow` 2.x wheels are not reliably available for arm64 Python 3.9
- Building from source is complex and error-prone
- PyTorch is an option but adds heavy dependencies

Since this is a **learning project** focused on the multi-input concept (not production OCR), we prioritize **reliability and fast iteration**.

### Solution: TypeScript + `@tensorflow/tfjs-node`

**Evidence**: The sibling project `06-simple-neural-network-tensorflow` confirmed that:
- `@tensorflow/tfjs-node` v4.x installs cleanly on this arm64 machine
- The functional API supports multi-input models: `tf.model({ inputs: [inputA, inputB], outputs })`
- TensorFlow.js has all the operations we need (dense, conv2d, concatenate, compile, fit)

**Advantages**:
- Reliable installation (no native Python extension compilation issues)
- Full functional API with explicit multi-input support
- TypeScript gives strong typing for model structure
- Fast iteration with `tsx` (no build step)
- Consistent with project standards (TypeScript default)

**Trade-offs**:
- Smaller ecosystem than Python TensorFlow (but sufficient for learning)
- No pre-trained OCR models (we're building from scratch anyway)

## Dataset Strategy: Synthetic Generated Digits

For a **learning project**, we want:
- ✅ Zero downloads (fully offline)
- ✅ Fast generation (sub-second)
- ✅ Clear signal (not too noisy)
- ✅ Demonstrates the multi-input concept

### Approach: Programmatically Draw Simple Digit-Like Shapes

Instead of using MNIST (requires download), we'll generate tiny synthetic images:

1. **Primary Input**: 14x14 grayscale images with simple programmatic shapes for digits 0-4 (5 classes)
   - "0": Circle/oval outline
   - "1": Vertical line
   - "2": Two horizontal lines with connecting diagonal
   - "3": Two curves stacked
   - "4": Angle shape

2. **Auxiliary Input**: 5-dimensional feature vector with hints:
   - `[aspect_ratio, fill_density, vertical_symmetry, horizontal_lines, curve_count]`
   - These are **correlated with** but not deterministic of the digit
   - Example: "1" has high vertical_symmetry, low horizontal_lines

This creates a realistic scenario: the auxiliary features provide **useful signal** that helps the model, but the image is the primary source of truth.

## Key Libraries

- `@tensorflow/tfjs-node` (v4.x): Core deep learning, multi-input model support
- `tsx`: Run TypeScript directly
- `vitest`: Testing framework

## Implementation Plan Preview

1. **Data generation**: Functions to draw digit patterns on 14x14 arrays + compute auxiliary features
2. **Multi-input model builder**: Explicit branches (image → conv/dense, aux → dense) → concatenate → head
3. **Training pipeline**: Generate train/test splits, compile model, fit with logging
4. **Evaluation**: Test accuracy, sample predictions showing both inputs
5. **Tests**: Shape validation, model structure checks, smoke training test

## References

- TensorFlow.js Functional API: https://js.tensorflow.org/api/latest/#Functional
- Multi-input model example: `tf.model({ inputs: [...], outputs: ... })`
- Concatenate layer: `tf.layers.concatenate()`
