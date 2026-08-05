import { BaksoSpot } from '../types';

/**
 * Calculates the Haversine distance between two geographical points in meters.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest BaksoSpot within a specified threshold distance (default 50m).
 * @param lat Target latitude
 * @param lng Target longitude
 * @param spots List of existing spots to check
 * @param excludeSpotId Optional spot ID to exclude (e.g., when editing)
 * @param thresholdMeters Maximum distance threshold in meters (default 50)
 * @returns Nearest spot object and distance in meters, or null if none found within threshold
 */
export function findNearbySpot50m(
  lat: number,
  lng: number,
  spots: BaksoSpot[],
  excludeSpotId?: string,
  thresholdMeters: number = 50
): { spot: BaksoSpot; distance: number } | null {
  let closestSpot: BaksoSpot | null = null;
  let minDistance = Infinity;

  for (const s of spots) {
    if (!s || (excludeSpotId && s.id === excludeSpotId)) continue;
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') continue;
    if (isNaN(s.lat) || isNaN(s.lng) || !isFinite(s.lat) || !isFinite(s.lng)) continue;

    const distance = calculateHaversineDistance(lat, lng, s.lat, s.lng);
    if (distance <= thresholdMeters && distance < minDistance) {
      minDistance = distance;
      closestSpot = s;
    }
  }

  if (closestSpot) {
    return { spot: closestSpot, distance: Math.round(minDistance) };
  }

  return null;
}
