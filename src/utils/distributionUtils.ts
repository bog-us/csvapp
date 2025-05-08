// src/utils/distributionUtils.ts

/**
 * Transformă un obiect de distribuție în array sortat
 */
export function getTopLocations(distributionByLocation: Record<string, number>, limit: number) {
  if (!distributionByLocation || typeof distributionByLocation !== 'object') {
    return [];
  }
  
  return Object.entries(distributionByLocation)
    .map(([judet, count]) => ({ judet, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
