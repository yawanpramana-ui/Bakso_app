export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
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

export function findNearbySpot(
  lat: number,
  lng: number,
  spots: Array<{ id: string; lat: number; lng: number; name: string }>,
  excludeSpotId?: string,
  thresholdMeters: number = 200
): { spot: { id: string; name: string }; distance: number } | null {
  for (const s of spots) {
    if (excludeSpotId && s.id === excludeSpotId) continue;
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') continue;
    const distance = getDistanceInMeters(lat, lng, s.lat, s.lng);
    if (distance < thresholdMeters) {
      return { spot: s, distance: Math.round(distance) };
    }
  }
  return null;
}
