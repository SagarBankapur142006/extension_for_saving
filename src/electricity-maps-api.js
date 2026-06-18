import { getSettings } from './storage.js';

export function getFallbackGridIntensity(regionCode) {
  const fallbacks = {
    FR: 50,
    DE: 400,
    US: 380,
    IN: 600,
  };
  return fallbacks[regionCode] || 380;
}

export async function getGridIntensity(regionCode = "US") {
  try {
    const settings = await getSettings();
    const apiKey = settings.electricityMapsApiKey;

    if (!apiKey) {
      return getFallbackGridIntensity(regionCode);
    }

    const response = await fetch(`https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${regionCode}`, {
      headers: {
        'auth-token': apiKey
      }
    });

    if (!response.ok) {
      console.warn(`[Eco-LLM Proxy] Electricity Maps API failed with status ${response.status}. Using fallback.`);
      return getFallbackGridIntensity(regionCode);
    }

    const data = await response.json();
    if (data && data.carbonIntensity) {
      return data.carbonIntensity;
    }

    return getFallbackGridIntensity(regionCode);
  } catch (error) {
    console.error(`[Eco-LLM Proxy] Error fetching grid intensity:`, error);
    return getFallbackGridIntensity(regionCode);
  }
}
