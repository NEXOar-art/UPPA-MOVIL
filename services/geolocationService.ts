
import { LOCATIONIQ_API_KEY } from '../constants';
import { Coordinates, PlaceAutocompleteSuggestion, PlaceDetails } from '../types';

// LocationIQ returns an array of objects. We'll grab the first one.
interface LocationIQReverseResponse {
    place_id: string;
    display_name: string;
    error?: string;
}
// LocationIQ returns an array of possible matches.
type LocationIQAutocompleteResponse = {
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
}[];

/**
 * A wrapper around fetch that automatically retries on 429 or 5xx errors with exponential backoff.
 * @param url The URL to fetch.
 * @param retries The number of times to retry.
 * @returns A Promise that resolves to the Response.
 */
export const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            // Retry on 429 or 5xx server errors
            if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
                if (i < retries - 1) {
                    const delay = 1000 * Math.pow(2, i); // Exponential backoff: 1s, 2s, 4s
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Try again
                } else {
                    // Last retry failed, throw a user-friendly error
                    throw new Error("El servicio de mapas está experimentando un alto tráfico o problemas técnicos. Por favor, inténtalo de nuevo más tarde.");
                }
            }
            return response; // Success or a non-retryable error (like 404)
        } catch (error) {
            // This catches network errors
            if (i < retries - 1) {
                const delay = 1000 * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                 console.error("Network error after multiple retries:", error);
                throw new Error("No se pudo conectar con el servicio de mapas. Revisa tu conexión a internet.");
            }
        }
    }
    // This should not be reachable, but provides a fallback
    throw new Error("No se pudo contactar con el servicio de geolocalización después de varios intentos.");
};


export const getAddressFromCoordinates = async (coords: Coordinates): Promise<string | null> => {
  if (!LOCATIONIQ_API_KEY) {
    throw new Error("La clave API de geocodificación no está configurada.");
  }
  
  const { lat, lng } = coords;
  const url = `https://us1.locationiq.com/v1/reverse.php?key=${LOCATIONIQ_API_KEY}&lat=${lat}&lon=${lng}&format=json`;

  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorText;
        } catch (e) { /* Not JSON, use raw text */ }
        throw new Error(errorMessage || `El servicio de geocodificación respondió con el estado ${response.status}.`);
    }
    const data: LocationIQReverseResponse = await response.json();

    if (data.error) {
        throw new Error(`Error de geocodificación: ${data.error}`);
    }

    if (data.display_name) {
      const parts = data.display_name.split(',');
      return parts.length > 4 ? parts.slice(0, 3).join(',').trim() : data.display_name;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error: any) {
    console.error("Error fetching address from LocationIQ API:", error);
    throw new Error(`Fallo al obtener la dirección: ${error.message}`);
  }
};

export const fetchAutocompleteSuggestions = async (input: string): Promise<PlaceAutocompleteSuggestion[]> => {
  if (!LOCATIONIQ_API_KEY || !input) {
    return [];
  }

  const url = `https://api.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(input)}&limit=5&countrycodes=ar&normalizeaddress=1`;

  try {
    const response = await fetchWithRetry(url);
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorText;
        } catch (e) { /* Not JSON, use raw text */ }
        throw new Error(errorMessage || `El servicio de autocompletado respondió con el estado ${response.status}.`);
    }
    const data: LocationIQAutocompleteResponse = await response.json();

    if (data && Array.isArray(data)) {
      return data.map(item => ({
        placePrediction: {
          place: item.place_id,
          placeId: item.display_name,
          text: {
            text: item.display_name,
            matches: [{ endOffset: input.length }],
          },
        },
      }));
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching autocomplete suggestions:", error);
    throw new Error(`Error al buscar sugerencias: ${error.message}`);
  }
};

export const fetchPlaceDetails = async (placeName: string): Promise<PlaceDetails> => {
  if (!LOCATIONIQ_API_KEY) {
    throw new Error("La clave API de geocodificación no está configurada.");
  }
  
  const url = `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(placeName)}&format=json&limit=1&countrycodes=ar`;
  
  try {
    const response = await fetchWithRetry(url);
     if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorText;
        } catch (e) { /* Not JSON, use raw text */ }
        throw new Error(errorMessage || `El servicio de detalles de lugar respondió con el estado ${response.status}.`);
    }
    const data = await response.json();
    if (data && data[0]) {
      const place = data[0];
      return {
        location: {
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
        },
        formattedAddress: place.display_name,
      };
    }
    throw new Error(`No se encontraron detalles para "${placeName}".`);
  } catch (error: any) {
    console.error("Error fetching place details:", error);
    throw new Error(`Error al obtener detalles del lugar: ${error.message}`);
  }
};
