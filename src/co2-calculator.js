// Constants based on research
const GPT4_CO2_PER_TOKEN_MG = 30; // baseline estimation for complex cloud models
const DISTILBERT_CO2_PER_TOKEN_MG = 0.05; // baseline for frugal local models

export function calculateLocalCO2({ tokenCount, gridIntensity }) {
  // result in grams
  return (DISTILBERT_CO2_PER_TOKEN_MG * tokenCount * (gridIntensity / 1000000));
}

export function calculateCloudCO2({ tokenCount, gridIntensity }) {
  // result in grams
  return (GPT4_CO2_PER_TOKEN_MG * tokenCount * (gridIntensity / 1000000));
}

export function calculateSavings({ tokenCount, gridIntensity }) {
  const local = calculateLocalCO2({ tokenCount, gridIntensity });
  const cloud = calculateCloudCO2({ tokenCount, gridIntensity });
  return Math.max(0, cloud - local);
}

export function formatCO2(grams) {
  if (grams < 0.01) return '< 0.01g';
  if (grams < 1) return grams.toFixed(3) + 'g';
  if (grams < 1000) return grams.toFixed(2) + 'g';
  return (grams / 1000).toFixed(2) + 'kg';
}
