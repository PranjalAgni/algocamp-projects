# MNIST Autoencoder

A learning project demonstrating how autoencoders compress and reconstruct images through unsupervised learning using TensorFlow.js.

## What is This?

An **autoencoder** is a neural network that learns to compress data into a smaller representation (latent space) and then reconstruct it. This project trains an autoencoder on synthetic MNIST-like digit images, teaching:

- **Encoder-Decoder Architecture**: Symmetric compression and decompression networks
- **Dimensionality Reduction**: Compressing 784 dimensions → 32 dimensions
- **Reconstruction Loss**: Self-supervised learning without labels
- **Latent Space**: Understanding learned feature representations
- **Unsupervised Learning**: Training without explicit labels

## Architecture

```
Input (784) → Encoder → Latent (32) → Decoder → Output (784)

Encoder:  784 → 128 (ReLU) → 64 (ReLU) → 32 (linear)
Decoder:  32 → 64 (ReLU) → 128 (ReLU) → 784 (sigmoid)

Loss: Binary Cross-Entropy (reconstruction error)
Optimizer: Adam (learning rate 0.001)
```

**Key Insight**: The 32-dimensional bottleneck forces the network to learn compressed, meaningful representations of 784-dimensional images.

## Technology Stack

- **Language**: TypeScript (ES2022 modules)
- **ML Framework**: TensorFlow.js (`@tensorflow/tfjs-node` v4.22.0)
- **Runtime**: Node.js with `tsx`
- **Testing**: Vitest
- **Data**: Synthetic digit images (0, 1, 2) generated programmatically

**Why TensorFlow.js?**
- Confirmed working on arm64 macOS
- No API keys or network required
- Sequential API perfect for autoencoder architecture
- Good for learning practical deep learning concepts

## Installation

```bash
npm install
```

## Usage

### Run the Demo

Train the autoencoder and see reconstructions:

```bash
npm run demo
```

### Run Tests

```bash
npm test
```

## Demo Output

```
╔════════════════════════════════════════╗
║   MNIST Autoencoder Demonstration     ║
╚════════════════════════════════════════╝

=== Step 1: Generating Synthetic Digit Data ===

Generated 300 training images
Generated 102 test images
Image size: 28×28 pixels
Digits: 0, 1, 2 (balanced distribution)

=== Step 2: Building Autoencoder ===

Architecture:
  Encoder: 784 → 128 → 64 → 32 (compression)
  Decoder: 32 → 64 → 128 → 784 (reconstruction)
  Loss: Binary Cross-Entropy
  Optimizer: Adam (lr=0.001)

=== Training Autoencoder ===

Epochs: 15
Batch size: 32
Validation split: 10%

Epoch  1/15 - loss: 0.667197 - mse: 0.234745 - val_loss: 0.550645
Epoch  2/15 - loss: 0.463509 - mse: 0.139620 - val_loss: 0.251364
Epoch  3/15 - loss: 0.358869 - mse: 0.102128 - val_loss: 0.265598
Epoch  4/15 - loss: 0.331348 - mse: 0.098762 - val_loss: 0.251591
Epoch  5/15 - loss: 0.313655 - mse: 0.091160 - val_loss: 0.243115
Epoch  6/15 - loss: 0.299139 - mse: 0.086343 - val_loss: 0.237590
Epoch  7/15 - loss: 0.284817 - mse: 0.081900 - val_loss: 0.231816
Epoch  8/15 - loss: 0.267257 - mse: 0.076493 - val_loss: 0.220877
Epoch  9/15 - loss: 0.253378 - mse: 0.072540 - val_loss: 0.216774
Epoch 10/15 - loss: 0.244300 - mse: 0.069975 - val_loss: 0.213630
Epoch 11/15 - loss: 0.237395 - mse: 0.067705 - val_loss: 0.207919
Epoch 12/15 - loss: 0.229193 - mse: 0.064699 - val_loss: 0.203057
Epoch 13/15 - loss: 0.219512 - mse: 0.061459 - val_loss: 0.197623
Epoch 14/15 - loss: 0.211973 - mse: 0.059149 - val_loss: 0.192225
Epoch 15/15 - loss: 0.205319 - mse: 0.056878 - val_loss: 0.189101

=== Training Complete ===

Total epochs: 15
Initial loss: 0.667197
Final loss:   0.205319
Improvement:  69.2% reduction

=== Evaluating on Test Data ===

Test Loss (Binary Cross-Entropy): 0.229967
Test MSE: 0.061775
```

### Example Reconstruction

```
=== Digit 0 (Test Image 1) ===

Original:                        Reconstructed:
                              |                              
        %      @              |                              
     %                        |                              
                              |                              
                              |                              
                #             |                              
                █             |   .   . ..-:=*+-:.:.....     
             ███████          |       .:-+==#%%*-=+=---.     
            █████████     %   |   .   .=-++#%%@#*+*#+-=:     
          %███████████        |       =+=++##%#*--***=:-.    
          █████   █████       |       :=:==+***-..:++=-..    
    %  %  ████     ████       |     ..-:-:--=-.   .-+--:. .  
         ████       ████      |      :-=::-:-:     -=:-: .   
         ███ %       ███      |      -=-::::-.    .--:-:.:  .
         ███         ███      |     .:=:::.:::.    :-::::. . 
         ███         ███      |    ..:-:-:.-:..    :-::-:.   
        ████         ████     |    ..:===:.:::     :::--.:.  
         ███         ███      |     ..---:..::.   ..:--:...  
         ███         ███      |     .:===---=++:.::-=+=-.. . 
         ███         ███ #    |     ..=+=*++***-:.:-===-. .  
 #       ████       ████      |   .  .=+**+*###+--=+++=-..   
          ████     ████@      |       :-==**#%#+--=+=+=.     
     #    █████   █████       |       .=-=+*#%#=-:-+=::.  .  
           ███████████        |         :.-=+**=---::... .   
            █████████         |       . . .-++=:::::..       
             █████.█          |    ..    .   :: .....        
                █        #    |             ..   .           

Reconstruction Error (MSE): 0.124096
```

### Latent Space Encoding

```
=== Latent Space Encoding (Digit 0) ===

Dimensions: 32 (compressed from 784)
First 16 values: [0.088, 0.123, -0.460, 0.366, 0.196, -0.159, -0.021, 0.544, ...]

Statistics:
  Mean: 0.054
  Min:  -0.460
  Max:  0.664

Key Insight:
  The autoencoder compressed a 784-dimensional image
  into just 32 dimensions while preserving enough
  information to reconstruct it!
```

## Project Structure

```
12-mnist-autoencoder/
├── src/
│   ├── data.ts          # Synthetic digit image generation
│   ├── model.ts         # Autoencoder architecture (encoder + decoder)
│   ├── train.ts         # Training loop with history tracking
│   ├── visualize.ts     # ASCII art image rendering
│   └── demo.ts          # Main demo: train + reconstruct + visualize
├── tests/
│   ├── data.test.ts     # Data generation tests
│   ├── model.test.ts    # Architecture shape tests
│   └── train.test.ts    # Training smoke tests
├── RESEARCH.md          # Background on autoencoders + stack decision
├── PLAN.md              # Implementation plan
├── README.md            # This file
├── package.json         # Dependencies + scripts
├── tsconfig.json        # TypeScript config
└── vitest.config.ts     # Test config
```

## Key Learning Outcomes

1. **Unsupervised Learning**: No labels needed—the network learns by reconstructing inputs
2. **Dimensionality Reduction**: 784 → 32 dimensions (96% compression!)
3. **Encoder-Decoder Pattern**: Symmetric compression and reconstruction
4. **Reconstruction Loss**: Measures how well output matches input
5. **Latent Space**: Compressed representation that captures essential features
6. **Bottleneck Effect**: Forces network to learn meaningful, not just memorize

## Data Strategy

This project uses **synthetically generated digit images** rather than downloading real MNIST data:

- **Offline-first**: No network required, runs anywhere
- **Deterministic**: Same seed produces same data
- **Educational**: Sufficient for learning autoencoder concepts
- **Fast**: Generated on-demand in milliseconds

Digits generated:
- **0**: Circle/ellipse shapes
- **1**: Vertical lines
- **2**: Two horizontal bars

## Stretch Ideas (Not Implemented)

- Compare different bottleneck sizes (16, 32, 64, 128)
- Convolutional autoencoder (better for images)
- Variational autoencoder (VAE) for generation
- Anomaly detection (high reconstruction error on unseen digits)
- t-SNE visualization of latent space clustering
- Save/load trained model weights

## License

MIT
