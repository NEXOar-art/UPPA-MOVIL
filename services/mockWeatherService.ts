// This service now fetches real weather data from OpenWeatherMap as requested.
import { OPENWEATHER_API_KEY } from '../constants';
import { Coordinates } from '../types';
import { fetchPlaceDetails } from './geolocationService';

interface WeatherData {
  condition: string;
  temp: number;
  icon: string;
}

const DEFAULT_WEATHER: WeatherData = {
  condition: "Clima no disponible",
  temp: 0,
  icon: "fas fa-question-circle",
};

const ICON_MAP: Record<string, string> = {
  '01d': 'fas fa-sun',
  '01n': 'fas fa-moon',
  '02d': 'fas fa-cloud-sun',
  '02n': 'fas fa-cloud-moon',
  '03d': 'fas fa-cloud',
  '03n': 'fas fa-cloud',
  '04d': 'fas fa-cloud',
  '04n': 'fas fa-cloud',
  '09d': 'fas fa-cloud-showers-heavy',
  '09n': 'fas fa-cloud-showers-heavy',
  '10d': 'fas fa-cloud-sun-rain',
  '10n': 'fas fa-cloud-moon-rain',
  '11d': 'fas fa-bolt',
  '11n': 'fas fa-bolt',
  '13d': 'fas fa-snowflake',
  '13n': 'fas fa-snowflake',
  '50d': 'fas fa-smog',
  '50n': 'fas fa-smog',
};

export const getWeather = async (coords: Coordinates): Promise<WeatherData> => {
  if (!OPENWEATHER_API_KEY) {
    console.warn("OpenWeatherMap API Key not configured.");
    return DEFAULT_WEATHER;
  }

  const { lat, lng } = coords;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.status !== 200 || !data.weather) {
      console.error("Error fetching weather data:", data.message || `Status ${response.status}`);
      return DEFAULT_WEATHER;
    }

    const condition = data.weather[0].description;
    const temp = Math.round(data.main.temp);
    const iconCode = data.weather[0].icon;
    const icon = ICON_MAP[iconCode] || 'fas fa-cloud'; // Default to cloud if icon unknown

    return {
      condition: condition.charAt(0).toUpperCase() + condition.slice(1),
      temp,
      icon,
    };
  } catch (error) {
    console.error("Network error fetching weather:", error);
    return DEFAULT_WEATHER;
  }
};

export const getWeatherByLocationName = async (locationName: string): Promise<WeatherData> => {
  try {
    const placeDetails = await fetchPlaceDetails(locationName);
    if (placeDetails && placeDetails.location) {
      return await getWeather(placeDetails.location);
    } else {
      return { ...DEFAULT_WEATHER, condition: `No se pudo encontrar la ubicación: ${locationName}` };
    }
  } catch (error) {
    console.error(`Error getting weather for location name "${locationName}":`, error);
    return { ...DEFAULT_WEATHER, condition: `Error al obtener el clima para ${locationName}` };
  }
};
