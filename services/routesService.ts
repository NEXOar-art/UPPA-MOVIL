import { GOOGLE_MAPS_API_KEY } from '../constants';
import { Coordinates, TravelMode } from '../types';

interface RoutesApiResponse {
  routes?: {
    distanceMeters: number;
    duration: string;
    polyline: {
      encodedPolyline: string;
    };
  }[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export interface RouteResultWithPolyline {
  duration?: string;
  distance?: string;
  error?: string;
  polyline?: string;
}

export const fetchRoute = async (origin: Coordinates, destination: Coordinates, travelMode: TravelMode): Promise<RouteResultWithPolyline> => {
  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API Key no configurada.' };
  }
  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes';
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
    'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
  };
  const body = {
    origin: { location: { latLng: origin } },
    destination: { location: { latLng: destination } },
    travelMode: travelMode,
    routingPreference: 'TRAFFIC_AWARE',
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    const data: RoutesApiResponse = await response.json();

    if (!response.ok || data.error) {
      console.error("Routes API error:", data.error);
      const errorMessage = data.error?.message || 'Error desconocido al calcular la ruta.';
      if (errorMessage.includes("API key not valid")) {
        return { error: 'La clave de API de Google Maps no es válida o está restringida.' };
      }
      if (errorMessage.includes("Routes API has not been used")) {
        return { error: 'El servicio de Rutas (Routes API) no está activado para este proyecto. Por favor, actívalo en la consola de Google Cloud.' };
      }
      return { error: errorMessage };
    }
    
    if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const durationInSeconds = parseInt(route.duration.slice(0, -1), 10);
        const minutes = Math.floor(durationInSeconds / 60);
        const durationText = `${minutes} min`;
        const distanceText = `${(route.distanceMeters / 1000).toFixed(1)} km`;

        return {
            duration: durationText,
            distance: distanceText,
            polyline: route.polyline.encodedPolyline,
        };
    } else {
        return { error: 'No se encontró una ruta entre los puntos seleccionados.' };
    }

  } catch (error) {
    console.error("Error fetching route from Routes API:", error);
    return { error: 'Fallo la conexión con el servicio de rutas. Revisa la consola para más detalles.' };
  }
};