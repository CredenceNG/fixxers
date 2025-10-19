/**
 * Utility functions for handling neighborhood data during migration period
 * Supports both normalized (cityId -> City -> State) and legacy (legacyCity, legacyState) structures
 */

export type NeighborhoodWithLocation = {
  id: string;
  name: string;
  cityId?: string | null;
  legacyCity?: string | null;
  legacyState?: string | null;
  legacyCountry?: string | null;
  city?: {
    name: string;
    state?: {
      name: string;
      country?: {
        name: string;
      };
    };
  } | null;
};

/**
 * Get city name from neighborhood - works with both normalized and legacy data
 */
export function getCityName(neighborhood: NeighborhoodWithLocation): string {
  return neighborhood.city?.name || neighborhood.legacyCity || 'Unknown';
}

/**
 * Get state name from neighborhood - works with both normalized and legacy data
 */
export function getStateName(neighborhood: NeighborhoodWithLocation): string {
  return neighborhood.city?.state?.name || neighborhood.legacyState || 'Unknown';
}

/**
 * Get country name from neighborhood - works with both normalized and legacy data
 */
export function getCountryName(neighborhood: NeighborhoodWithLocation): string {
  return neighborhood.city?.state?.country?.name || neighborhood.legacyCountry || 'Nigeria';
}

/**
 * Format full location string: "Neighborhood, City, State"
 */
export function formatLocation(neighborhood: NeighborhoodWithLocation, includeState = true): string {
  const parts = [neighborhood.name, getCityName(neighborhood)];
  if (includeState) {
    parts.push(getStateName(neighborhood));
  }
  return parts.join(', ');
}

/**
 * Format full location with country: "Neighborhood, City, State, Country"
 */
export function formatFullLocation(neighborhood: NeighborhoodWithLocation): string {
  return [
    neighborhood.name,
    getCityName(neighborhood),
    getStateName(neighborhood),
    getCountryName(neighborhood),
  ].join(', ');
}
