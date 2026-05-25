export type Severity = "low" | "moderate" | "high";

export interface DiseasePrediction {
  disease: string;
  crop: string;
  confidence: number;
  severity: Severity;
  description: string;
  treatment: string[];
  prevention: string[];
  causes: string[];
}

export const sampleDiseases: DiseasePrediction[] = [
  {
    disease: "Apple Scab",
    crop: "Apple",
    confidence: 96.4,
    severity: "moderate",
    description:
      "Fungal infection caused by Venturia inaequalis. Olive-green to brown lesions on leaves and fruit reduce yield and marketability.",
    treatment: [
      "Apply captan or myclobutanil fungicide every 10–14 days during wet periods",
      "Remove and destroy fallen infected leaves to break the disease cycle",
      "Prune canopy to improve airflow and reduce leaf wetness duration",
    ],
    prevention: [
      "Plant scab-resistant cultivars (e.g., Liberty, Enterprise)",
      "Maintain dormant-season copper sprays",
      "Avoid overhead irrigation during humid weather",
    ],
    causes: [
      "Prolonged leaf wetness above 6 hours",
      "Temperatures between 12–24°C",
      "Dense canopy reducing air circulation",
    ],
  },
  {
    disease: "Tomato Late Blight",
    crop: "Tomato",
    confidence: 93.1,
    severity: "high",
    description:
      "Aggressive oomycete (Phytophthora infestans) causing rapid foliar collapse and fruit rot. Can destroy a field within days.",
    treatment: [
      "Apply chlorothalonil or mancozeb immediately on dry foliage",
      "Remove and bag all infected plant material — do not compost",
      "Switch to systemic fungicide (cymoxanil) if outbreak persists",
    ],
    prevention: [
      "Use certified disease-free seedlings",
      "Stake and space plants for airflow",
      "Monitor humidity above 90% as a warning trigger",
    ],
    causes: [
      "Cool nights (10–15°C) with warm humid days",
      "Rain splash spreading sporangia",
      "Susceptible varieties planted densely",
    ],
  },
  {
    disease: "Healthy Leaf",
    crop: "Maize",
    confidence: 99.2,
    severity: "low",
    description:
      "No visible pathogen markers detected. Leaf morphology, chlorophyll distribution, and venation are within healthy ranges.",
    treatment: ["No treatment required — continue current crop management"],
    prevention: [
      "Maintain balanced NPK nutrition",
      "Scout fields weekly for early symptoms",
      "Rotate crops to suppress soil-borne pathogens",
    ],
    causes: ["Optimal growing conditions and integrated pest management"],
  },
];

export const recentScans = [
  { id: "scn_8421", crop: "Tomato", disease: "Late Blight", severity: "high" as Severity, confidence: 93, time: "2m ago" },
  { id: "scn_8420", crop: "Apple", disease: "Apple Scab", severity: "moderate" as Severity, confidence: 96, time: "18m ago" },
  { id: "scn_8419", crop: "Maize", disease: "Healthy", severity: "low" as Severity, confidence: 99, time: "1h ago" },
  { id: "scn_8418", crop: "Grape", disease: "Powdery Mildew", severity: "moderate" as Severity, confidence: 91, time: "3h ago" },
  { id: "scn_8417", crop: "Potato", disease: "Early Blight", severity: "high" as Severity, confidence: 88, time: "5h ago" },
  { id: "scn_8416", crop: "Wheat", disease: "Healthy", severity: "low" as Severity, confidence: 97, time: "1d ago" },
];

export const cropHealth = [
  { crop: "Tomato", health: 72 },
  { crop: "Apple", health: 84 },
  { crop: "Maize", health: 95 },
  { crop: "Grape", health: 78 },
  { crop: "Potato", health: 66 },
  { crop: "Wheat", health: 91 },
];

export const weatherForecast = [
  { day: "Today", icon: "sun", high: 28, low: 17, condition: "Sunny", risk: "Low" },
  { day: "Tue", icon: "cloud", high: 26, low: 16, condition: "Partly Cloudy", risk: "Low" },
  { day: "Wed", icon: "rain", high: 22, low: 15, condition: "Light Rain", risk: "Moderate" },
  { day: "Thu", icon: "rain", high: 20, low: 14, condition: "Showers", risk: "High" },
  { day: "Fri", icon: "cloud", high: 24, low: 15, condition: "Overcast", risk: "Moderate" },
  { day: "Sat", icon: "sun", high: 27, low: 16, condition: "Sunny", risk: "Low" },
  { day: "Sun", icon: "sun", high: 29, low: 18, condition: "Sunny", risk: "Low" },
];

export const systemStats = [
  { label: "Crops Supported", value: 14 },
  { label: "Disease Classes", value: 38 },
  { label: "Training Images", value: "87K+" },
  { label: "Model Accuracy", value: "98.4%" },
];

export const suggestedQuestions = [
  "How do I treat Apple Scab?",
  "Identify Spider Mite symptoms",
  "Why are leaves turning yellow?",
  "Best treatment for tomato blight?",
  "Organic pest control methods",
];
