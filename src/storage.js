const DEFAULT_STATS = {
  totalQueries: 0,
  localQueries: 0,
  cloudQueries: 0,
  totalCO2SavedGrams: 0,
  todayCO2SavedGrams: 0,
  todayLocalQueries: 0,
  todayCloudQueries: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  recentDecisions: [],
  settings: {
    regionCode: "US",
    electricityMapsApiKey: ""
  }
};

export async function getStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (result) => {
      if (Object.keys(result).length === 0) {
        resolve(DEFAULT_STATS);
      } else {
        // Handle date reset
        const today = new Date().toISOString().split('T')[0];
        if (result.lastResetDate !== today) {
          result.todayCO2SavedGrams = 0;
          result.todayLocalQueries = 0;
          result.todayCloudQueries = 0;
          result.lastResetDate = today;
          chrome.storage.local.set(result);
        }
        resolve({ ...DEFAULT_STATS, ...result });
      }
    });
  });
}

export async function updateStats(decision) {
  const stats = await getStats();
  
  stats.totalQueries += 1;
  
  if (decision.route === 'local') {
    stats.localQueries += 1;
    stats.todayLocalQueries += 1;
    stats.totalCO2SavedGrams += decision.co2SavedGrams || 0;
    stats.todayCO2SavedGrams += decision.co2SavedGrams || 0;
  } else {
    stats.cloudQueries += 1;
    stats.todayCloudQueries += 1;
  }

  // Add to recent decisions
  stats.recentDecisions.unshift({
    timestamp: new Date().toISOString(),
    ...decision
  });

  // Keep only the last 20
  if (stats.recentDecisions.length > 20) {
    stats.recentDecisions = stats.recentDecisions.slice(0, 20);
  }

  return new Promise((resolve) => {
    chrome.storage.local.set(stats, () => resolve(stats));
  });
}

export async function resetStats() {
  const stats = await getStats();
  const resetData = {
    ...DEFAULT_STATS,
    settings: stats.settings, // Preserve settings
  };
  return new Promise((resolve) => {
    chrome.storage.local.set(resetData, () => resolve(resetData));
  });
}

export async function getSettings() {
  const stats = await getStats();
  return stats.settings;
}

export async function saveSettings(settings) {
  const stats = await getStats();
  stats.settings = { ...stats.settings, ...settings };
  return new Promise((resolve) => {
    chrome.storage.local.set(stats, () => resolve(stats.settings));
  });
}
