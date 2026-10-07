/** Google Maps deep links for the store pin (no API key needed). */
export function mapLinks(lat: number, lng: number) {
  return {
    open: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
  };
}
