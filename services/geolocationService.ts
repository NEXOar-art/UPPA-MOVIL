

import { GOOGLE_MAPS_API_KEY } from '../constants';
import { Coordinates, PlaceAutocompleteSuggestion, PlaceDetails } from '../types';

export const getAddressFromCoordinates = async (coords: Coordinates): Promise<string | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API Key not configured for geocoding. Returning coordinates as fallback.");
    return null;
  }
  
  const { lat, lng } = coords;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error(`Geocoding API request failed: ${response.status}`, data);
      if (data?.error?.message) {
          console.error('Google API Error Message:', data.error.message);
      }
      return null;
    }
    
    if (data.error_message) {
        console.warn("Geocoding API returned an error:", data.status, data.error_message);
        return null;
    }

    if (data.results && data.results.length > 0) {
      // Find the most specific address, often the first result
      const bestResult = data.results[0];
      // Try to find a street_address or similar precise type
      const streetAddress = data.results.find((r: any) => r.types.includes('street_address'));
      const pointOfInterest = data.results.find((r: any) => r.types.includes('point_of_interest'));
      
      if (streetAddress?.formatted_address) {
        return streetAddress.formatted_address;
      }
      if (pointOfInterest?.name && bestResult.formatted_address.includes(pointOfInterest.name)) {
        // If a POI name is part of the formatted address, it might be more relevant
        return `${pointOfInterest.name}, ${bestResult.formatted_address.split(',').slice(1).join(',').trim()}`;
      }
      if (bestResult.formatted_address) {
        // Use a shorter version if it's too generic
        const parts = bestResult.formatted_address.split(',');
        if (parts.length > 3) { // Heuristic: if too many commas, it might be too broad
            return parts.slice(0, 2).join(',').trim();
        }
        return bestResult.formatted_address;
      }
      // Should not be reached if results exist, but as a safeguard:
      return null;

    } else if (data.status === "ZERO_RESULTS") {
      // No specific address found for these coordinates
      return null; 
    } else {
      // Other API errors like OVER_QUERY_LIMIT, REQUEST_DENIED, INVALID_REQUEST, UNKNOWN_ERROR
      console.warn("Geocoding API did not return results or had an error:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching address from Geocoding API:", error);
    return null; // Fallback to null if any other exception occurs
  }
};


// --- New functions for Places API (New) ---

const PLACES_API_BASE_URL = 'https://places.googleapis.com/v1';

export const fetchAutocompleteSuggestions = async (input: string): Promise<PlaceAutocompleteSuggestion[]> => {
  if (!GOOGLE_MAPS_API_KEY || !input) {
    return [];
  }

  const url = `${PLACES_API_BASE_URL}/places:autocomplete`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
  };
  const body = {
    input,
    locationBias: { // Bias towards Argentina
      circle: {
        center: { latitude: -34.6037, longitude: -58.3816 }, // Buenos Aires
        radius: 500000.0
      }
    },
    languageCode: 'es',
    includedRegionCodes: ['ar'],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.suggestions) {
      return data.suggestions;
    }
    return [];
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    return [];
  }
};

export const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }
  
  const url = `${PLACES_API_BASE_URL}/places/${placeId}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
    'X-Goog-FieldMask': 'location,formattedAddress',
  };

  try {
    const response = await fetch(url, { method: 'GET', headers });
    const data = await response.json();
    if (data.location && data.formattedAddress) {
        return {
            location: {
                lat: data.location.latitude,
                lng: data.location.longitude,
            },
            formattedAddress: data.formattedAddress,
        }
    }
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};