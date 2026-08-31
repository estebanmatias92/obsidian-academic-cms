/**
 * Finds the first matching template configuration for a path
 * @param {object} tp = Obsidian's Templater API for template handling
 * @param {object} pathConfig - Configuration object with patterns and templates
 * @param {array} [priorityOrder] - Optional ordered keys for matching priority
 * @returns {object|null} - Matched config with added metadata or null
 */
const getTemplateForPath = (tp, pathConfig, priorityOrder) => {
  // Safely determine priority order
  const order =
    Array.isArray(priorityOrder) && priorityOrder.length > 0
      ? priorityOrder
      : Object.keys(pathConfig); // Fallback to natural object key order

  for (const key of order) {
    // Skip invalid keys
    if (!pathConfig[key] || !pathConfig[key].pattern) continue;

    try {
      const matchedPath = tp.user.get_matched_path(pathConfig[key].pattern);
      if (matchedPath) {
        return {
          ...pathConfig[key],
          _meta: {
            matchedPath,
            configKey: key,
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      console.error(`Pattern matching failed for ${key}:`, error);
      continue; // Skip to next pattern if matching fails
    }
  }

  return null; // Explicit return for no match
};

module.exports = getTemplateForPath;
