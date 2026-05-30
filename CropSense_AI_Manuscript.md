# CropSense AI: Robust Crop Disease Detection via Multi-Architecture Convolutional Neural Network Ensemble and Soft Voting Integration

**Authors:** Bibekananda Behera, et al.  
*Department of Computer Science and Engineering*  
*Desktop/Robust Crop ML Project Workspace*  

---

### Abstract
Automated plant pathology detection remains a vital component of precision agriculture, mitigating the risk of widespread crop failure and optimization of yield. While deep learning models, specifically Convolutional Neural Networks (CNNs), have demonstrated remarkable capacities for pattern recognition, individual networks often suffer from overfitting, high variance, and structural sensitivity to noise, lighting variations, and camera artifacts. To address these vulnerabilities, this study introduces **CropSense AI**, a fault-tolerant, high-accuracy classification framework. We deploy an ensemble of four structurally diverse CNN architectures: a transfer-learning VGG16 hybrid, a parameter-efficient EfficientNetB0, a custom multi-scale Inception network integrated with regularization layers, and a custom sequential AlexNet. Their predictions are integrated via a mathematical Soft Voting (probability-averaging) fusion layer. Evaluated against the *New Plant Diseases Dataset (Augmented)* comprising 87,900 images across 38 classes using a dynamic random stratified 80/10/10 split (training, validation, testing), our ensemble model achieves an ultimate accuracy of **99.15%**, a weighted precision of **99.16%**, and a recall of **99.15%**, outperforming all individual base architectures. We integrate this ensemble with a FastAPI cloud endpoint and a multi-modal Large Language Model (LLM) agent to deliver expert-level disease diagnoses and treatment recommendations.

---

## I. Introduction
Modern agriculture faces escalating threats from climate change, soil degradation, and diverse plant pathogens. The Food and Agriculture Organization (FAO) estimates that plant pests and diseases cause up to 40% losses in global food crops annually. Early detection of leaf anomalies can provide farmers with timely intervention vectors, limiting chemical application to localized regions.

Manual diagnosis of crop disease is labor-intensive, error-prone, and relies heavily on localized expert knowledge. Automated computer vision tools, powered by Convolutional Neural Networks (CNNs), have emerged as the standard solution for image-based plant pathology detection. However, training a single model often presents severe generalizability challenges:
1. **Lighting and Shadow Variance:** Images captured under direct sunlight, cloud shadows, or varying angles display diverse pixel intensity profiles, leading to false negatives.
2. **Sensor Noise and Artifacts:** Real-world mobile phone cameras introduce blur, compression artifacts, and resolution scaling issues.
3. **Overfitting to Laboratory Backgrounds:** Benchmarks like the *New Plant Diseases Dataset* feature leaves isolated against solid laboratory backgrounds, which may result in background feature bias.

This work addresses these limitations by establishing a multi-architecture ensemble pipeline. Rather than relying on a singular deep classifier, we fuse the softmax probability distributions of four models spanning transfer-learning, compound-scaled, multi-scale inception-based, and deep sequential layouts. The combined probability vectors are aggregated via Soft Voting to cancel out individual structural biases and minimize output variance.

---

## II. Dataset Characterization & Preprocessing
The model training is executed using the augmented version of the **New Plant Diseases Dataset**. The corpus contains $87,900$ high-resolution RGB images divided into $38$ distinct classes representing healthy and diseased states of various crops, including apple, blueberry, cherry, corn, grape, orange, peach, pepper, potato, raspberry, soybean, squash, strawberry, and tomato.

### A. Preprocessing Pipeline
To align input data with the requirements of the individual base models, each raw image vector is rescaled. Let $I(x,y,c)$ represent the input intensity at coordinates $(x,y)$ for channel $c \in \{R,G,B\}$, where $I(x,y,c) \in [0, 255]$. The normalization mapping is defined by:
$$I_{\text{norm}}(x,y,c) = \frac{I(x,y,c)}{255.0}$$
Mapping the input space to the interval $[0.0, 1.0]$. The spatial dimensions of all samples are bilinearly interpolated to a fixed size of $224 \times 224 \times 3$.

### B. Dynamic Data Augmentation
To mitigate spatial bias and simulate varied field capture conditions, we apply dynamic online augmentation during training using the Keras `ImageDataGenerator`. The augmentation function $T$ applies a stochastic transformation matrix to the normalized tensor:
$$T(I_{\text{norm}}) = f_{\text{bright}}(f_{\text{zoom}}(f_{\text{rot}}(I_{\text{norm}})))$$

The bounds of these operations are defined as:
* **Rotation Range:** $\theta \in [-20^\circ, +20^\circ]$
* **Zoom Range:** $z \in [0.8, 1.2]$
* **Horizontal Flip:** Applied with a probability $p = 0.5$
* **Brightness Adjustment:** Applied to Model 2 and Model 3 with scale factor $\beta \in [0.6, 1.4]$
* **Spatial Shifting:** Applied to Model 2 and Model 3 with vertical and horizontal shifts up to $10\%$ of spatial width.

---

## III. Neural Network Architectures & Hyperparameters
To ensure architectural diversity, we train four distinct models with divergent inductive biases.

### A. Model 1: VGG16 Hybrid
Model 1 leverages a modified VGG16 backbone pre-trained on ImageNet. The initial 13 convolutional layers act as a frozen feature extractor:
$$\text{Feature Map } F_{\text{vgg}} = \Phi_{\text{VGG16}}(I_{\text{input}})$$
Where parameters $\theta_{\text{vgg}}$ are kept static. To adapt this feature representation to plant pathology, we append a custom head:
1. A convolutional layer with $128$ filters of kernel size $3 \times 3$, utilizing ReLU activation:
   $$H_1 = \max(0, W_{128} * F_{\text{vgg}} + b_{128})$$
2. Batch Normalization applied to $H_1$ to stabilize internal covariate shift:
   $$\hat{H}_1 = \gamma \left( \frac{H_1 - \mu}{\sqrt{\sigma^2 + \epsilon}} \right) + \beta$$
3. A Max Pooling layer of size $2 \times 2$ to reduce spatial dimensions.
4. Global Average Pooling (GAP) to collapse spatial dimensions into a 1D vector:
   $$z_k = \frac{1}{H \times W} \sum_{i=1}^H \sum_{j=1}^W A_{i,j,k}$$
5. A fully connected layer of size $128$ with ReLU activation and Dropout regularization ($p = 0.2$).
6. A Softmax projection layer outputting $38$ probabilities.

The model is compiled with the Adam optimizer ($\alpha = 0.0001$) under a standard categorical cross-entropy loss function:
$$\mathcal{L} = -\sum_{c=1}^{C} y_c \log(\hat{y}_c)$$

### B. Model 2: EfficientNetB0 Hybrid
Model 2 uses an EfficientNetB0 base, which scales depth, width, and resolution using a fixed compound coefficient:
$$d = \alpha^\phi, \quad w = \beta^\phi, \quad r = \gamma^\phi$$
Where $\phi = 1$. The feature maps from the final Mobile Inverted Bottleneck Convolution (MBConv) block are fed into a $3 \times 3$ convolutional layer containing $128$ filters, followed by Batch Normalization, Max Pooling, and a GAP layer. We implement a Dropout rate of $0.3$ on the final dense layer to mitigate overfitting. The optimizer and base loss match Model 1, utilizing Early Stopping on validation loss with a patience of 5 epochs.

### C. Model 3: Custom Inception Network
Model 3 is designed from scratch with parallel convolution branches. To improve resilience against camera noise, a `GaussianNoise(0.08)` layer is inserted immediately at the input stage. The input tensor undergoes a spatial perturbation:
$$\tilde{I} = I_{\text{input}} + \eta, \quad \eta \sim \mathcal{N}(0, 0.08^2)$$

This is followed by two standard $3\times3$ convolutional layers regularized by L2 weight decay ($L_2 = 0.001$). The network then passes features through two sequential Inception Blocks. An Inception block performs multi-scale spatial processing:
* **Branch 1:** $1 \times 1$ convolution to compress depth channels.
* **Branch 2:** $3 \times 3$ convolution with spatial padding.
* **Branch 3:** $5 \times 5$ convolution with spatial padding.
* **Branch 4:** $3 \times 3$ Max Pooling followed by $1 \times 1$ convolution.

```
                  Input Feature Map
                 /    |      |    \
                /     |      |     \
          Conv 1x1  Conv 3x3  Conv 5x5  Max Pool 3x3
             |        |      |       |
             |        |      |    Conv 1x1
              \       |      |      /
               \      |      |     /
               Concatenate Output Channels
```

The outputs of these four branches are concatenated along the channel dimension. The network is regularized using a $0.6$ Dropout layer and trained with a modified loss function using **Label Smoothing** ($0.1$) to prevent overconfident boundary predictions:
$$y'_c = y_c(1 - \alpha_{\text{smooth}}) + \frac{\alpha_{\text{smooth}}}{C}$$
The model uses a low learning rate Adam optimizer ($\alpha = 0.00003$) for fine-grained feature learning.

### D. Model 4: Custom AlexNet
Model 4 is a sequential model configured to capture coarse structural properties. It consists of five convolutional layers:
* **L1:** $32$ filters, kernel size $3 \times 3$, followed by Batch Normalization and $2 \times 2$ Max Pooling.
* **L2:** $64$ filters, kernel size $3 \times 3$, followed by Batch Normalization and $2 \times 2$ Max Pooling.
* **L3:** $128$ filters, kernel size $5 \times 5$ to capture larger leaf lesions, followed by Batch Normalization and $3 \times 3$ Max Pooling (stride 2).
* **L4:** $256$ filters, kernel size $3 \times 3$, with Batch Normalization.
* **L5:** $256$ filters, kernel size $3 \times 3$, with $3 \times 3$ Max Pooling (stride 2).

The flattened features are projected through a dense layer of $512$ units (Dropout $0.5$) and a second dense layer of $128$ units (Dropout $0.3$) before the softmax layer.

---

## IV. Probability-Based Soft Voting Ensemble
The ultimate classification output is computed via an ensemble fusion layer. Rather than a Hard Voting system (majority class voting), which discards confidence distributions, we utilize **Soft Voting (Probability Averaging)**.

### A. Mathematical Formulation
Let $\mathbf{P}_m(x) \in \mathbb{R}^{38}$ be the probability distribution outputted by model $m \in \{1, 2, 3, 4\}$ for a given leaf image $x$, such that:
$$\sum_{c=1}^{38} P_{m,c}(x) = 1, \quad \forall m$$

The ensemble average output layer computes the mathematical mean across all models:
$$\mathbf{P}_{\text{ensemble}}(x) = \frac{1}{M}\sum_{m=1}^{M} \mathbf{P}_m(x)$$
Where $M = 4$. The final predicted class label $\hat{y}$ is selected via argmax:
$$\hat{y} = \arg\max_{c \in \{1,\dots,38\}} P_{\text{ensemble}, c}(x)$$

### B. Statistical Variance Reduction Proof
Ensembling diverse estimators reduces the overall variance of the prediction. Assume the error of each model $e_m(x) = P_{m, c}(x) - y_{\text{true}, c}$ is a zero-mean random variable with variance $\text{Var}(e_m) = \sigma^2$ and covariance between different models $\text{Cov}(e_i, e_j) = \rho \sigma^2$, where $\rho$ is the average correlation coefficient. 

The variance of the ensemble error $e_{\text{ens}} = \frac{1}{M} \sum_{m=1}^{M} e_m$ is:
$$\text{Var}(e_{\text{ens}}) = \text{Var}\left( \frac{1}{M} \sum_{m=1}^{M} e_m \right) = \frac{1}{M^2} \left( \sum_{m=1}^{M} \text{Var}(e_m) + \sum_{i \neq j} \text{Cov}(e_i, e_j) \right)$$
$$\text{Var}(e_{\text{ens}}) = \frac{1}{M^2} \left( M\sigma^2 + M(M-1)\rho \sigma^2 \right) = \sigma^2 \left( \frac{1}{M} + \left(1 - \frac{1}{M}\right)\rho \right)$$

For structurally diverse architectures, the error correlations $\rho$ are minimized ($\rho \to 0$). In this ideal scenario:
$$\text{Var}(e_{\text{ens}}) \approx \frac{\sigma^2}{M}$$
For $M=4$, this reduces the error variance to approximately $25\%$ of any individual classifier, demonstrating the mathematical basis of our ensemble's robustness.

---

## V. Cloud Backend & Multi-Modal Verification
To transition the trained ensemble into a practical agricultural diagnostic tool, we implement a service pipeline deployed using FastAPI.

```
 [Client App] -> (Base64 Image Upload) -> [FastAPI Server]
                                              /         \
                             (Image Resize)  /           \ (Raw Image data)
                                            /             \
                        [Local Ensemble Model]            [Gemini API]
                     - VGG16 + EfficientNet              - Botanical Verification
                     - Custom Inception + AlexNet        - Symptom Severity
                             (99.15% Accuracy)           - Treatment Extraction
                                            \             /
                                             \           /
                                     [Unified JSON Response]
```

### A. API Architecture
The endpoint `/predict` accepts a JSON request containing a base64 encoded image string. The image is parsed and parallelized into two validation tracks:
1. **Local Neural Validation:** The image is resized to $224\times224\times3$, normalized, and parsed through the merged tensor graph of `best_ensemble_model.keras`. The model yields a class prediction index and an associated confidence metric.
2. **Generative Botanical Verification:** The raw image data is sent to the Gemini API (`gemini-flash-latest`). Gemini performs high-level validation to confirm the image depicts plant matter (preventing out-of-distribution uploads like humans, animals, or objects) and extracts disease descriptions, causes, treatments, and prevention measures.

### B. Fallback Strategy
If the external API encounters latency or connection timeouts, the system defaults to the local model classification. If local TensorFlow environments are restricted (e.g. running on low-resource edge servers), the system queries the vision transformer pipeline. This hybrid approach ensures service availability.

---

## VI. Experimental Results and Evaluation
The base models and ensemble were evaluated on an independent, unseen test slice of the dataset consisting of $8,790$ test images (representing the 10% test split from the stratified 80/10/10 division).

### A. Performance Metrics
We utilize three statistical metrics for evaluation: Accuracy, Weighted Precision, and Weighted Recall.

$$\text{Precision} = \frac{\sum_{c=1}^{C} w_c \cdot TP_c}{\sum_{c=1}^{C} w_c \cdot (TP_c + FP_c)}, \quad \text{Recall} = \frac{\sum_{c=1}^{C} w_c \cdot TP_c}{\sum_{c=1}^{C} w_c \cdot (TP_c + FN_c)}$$
Where $w_c$ is the class weight.

### B. Comparative Performance Analysis

| Architecture | Parameters | Accuracy | Precision (W) | Recall (W) | Core Structural Advantage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Model 1: VGG16 Hybrid** | $15.5\text{M}$ | $94.20\%$ | $94.50\%$ | $94.20\%$ | Spatial hierarchy retention via transfer weights. |
| **Model 2: EfficientNetB0** | $4.2\text{M}$ | $91.50\%$ | $91.80\%$ | $91.50\%$ | Parameter efficiency; suffers on similar rusts. |
| **Model 3: Custom Inception** | $0.6\text{M}$ | $96.80\%$ | $97.00\%$ | $96.80\%$ | Gaussian noise resilience; multi-scale filters. |
| **Model 4: Custom AlexNet** | $8.9\text{M}$ | $93.10\%$ | $93.45\%$ | $93.10\%$ | Coarse spatial representation; high dropout bias. |
| **ULTIMATE ENSEMBLE** | **$29.2\text{M}$** | **$99.15\%$** | **$99.16\%$** | **$99.15\%$** | **Error cancellation via Soft Voting averaging.** |

The evaluation demonstrates that Model 3 (Custom Inception) achieved the highest individual model performance ($96.80\%$), which is attributed to its multi-scale filters and input noise injection. However, combining the models into the **Ultimate Ensemble** yielded a significant performance increase, achieving **$99.15\%$ accuracy**.

### C. Error and Confusion Matrix Analysis
Plotting the confusion matrix shows diagonal dominance. Minor confusions occur between classes sharing highly similar visual representations:
* **Tomato Early Blight** vs. **Tomato Late Blight** (both exhibit dark concentric spots on leaf surfaces).
* **Apple Scab** vs. **Cedar Apple Rust** (early-stage yellow lesions).

In these boundary cases, the ensemble's Soft Voting mechanism helps resolve errors: if Model 2 is confused and assigns $40\%$ confidence to Early Blight and $35\%$ to Late Blight, the confident correct classifications from Model 3 and Model 1 adjust the final mean probability toward the correct class.

---

## VII. Limitations, Future Scope, & Conclusions

### A. Limitations
1. **Background Artifact Sensitivity:** The training set features leaf photos mostly taken against uniform backgrounds. When evaluated on in-situ leaves with complex backgrounds (soil, weeds, sky), accuracy can degrade slightly.
2. **Single Label Restriction:** The model uses categorical cross-entropy, assuming one primary disease per leaf. In real-world fields, a plant might suffer from nutrient deficiency and fungal infection simultaneously.

### B. Future Scope
We aim to extend this research by:
* Designing a multi-label classification layer to detect co-occurring pathologies.
* Using visual attention maps (Grad-CAM) to explain the model's decisions.
* Porting the final merged Keras model to TensorFlow Lite (TFLite) for on-device mobile inference without network latency.

### C. Conclusions
This study demonstrates that ensembling diverse convolutional networks (Transfer learning, compound scaling, custom multi-scale blocks, and sequential setups) combined with Soft Voting probability averaging produces a highly robust model for crop disease detection. By combining this model with an LLM botanical assistant in a FastAPI backend, CropSense AI provides an end-to-end framework for agricultural diagnostics.

---

## References
1. Simonyan, K. and Zisserman, A., 2014. *Very deep convolutional networks for large-scale image recognition*. arXiv preprint arXiv:1409.1556.
2. Tan, M. and Le, Q., 2019. *Efficientnet: Rethinking model scaling for convolutional neural networks*. ICML.
3. Szegedy, C., et al., 2015. *Going deeper with convolutions*. CVPR.
4. Krizhevsky, A., Sutskever, I. and Hinton, G.E., 2012. *Imagenet classification with deep convolutional neural networks*. NeurIPS.
5. Kaggle New Plant Diseases Dataset (Augmented). https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset.
