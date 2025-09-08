

export interface Coordinates {
  lat: number;
  lng: number;
}

export enum ReportType {
  Delay = "Delay",
  RouteChange = "Route Change",
  Detour = "Detour",
  WaitTime = "Wait Time",
  SafetyIncident = "Safety Incident",
  MechanicalIssue = "Mechanical Issue",
  ComfortIssue = "Comfort Issue",
  PriceUpdate = "Price Update",
  LocationUpdate = "Location Update",
  Crowded = "Crowded",
  BusMoving = "Bus Moving",
  BusStopped = "Bus Stopped",
  Full = "Full",
  VeryFull = "Very Full",
  GoodService = "Good Service",
  BadService = "Bad Service",
}

export interface Bus {
  id: string;
  lineName: string;
  description: string;
  statusEvents: any[];
  color: string;
  currentLocation: Coordinates;
}

export interface BusStop {
  id: string;
  name: string;
  location: Coordinates;
  busLineIds: string[];
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  busLineId: string;
  type: ReportType;
  timestamp: number;
  description: string;
  location?: Coordinates;
  details?: { photoBase64: string };
  upvotes: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export enum BadgeId {
  REPORTER_NOVICE = 'REPORTER_NOVICE',
  REPORTER_PRO = 'REPORTER_PRO',
  REPORTER_ELITE = 'REPORTER_ELITE',
  HELPFUL_VOICE = 'HELPFUL_VOICE',
  COMMUNITY_PILLAR = 'COMMUNITY_PILLAR',
  MOTO_PILOT = 'MOTO_PILOT',
  REMIS_DRIVER = 'REMIS_DRIVER',
  ROAD_VETERAN = 'ROAD_VETERAN',
  TOP_RATED = 'TOP_RATED',
  CHATTERBOX = 'CHATTERBOX',
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  tokens: number;
  badges: BadgeId[];
  rank: number;
  favoriteBusLineIds: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  busLineId: string;
  timestamp: number;
  text: string;
  emoji?: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export interface GlobalChatMessage {
    id: string;
    userId: string;
    userName: string;
    timestamp: number;
    text: string;
    emoji?: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export enum MicromobilityServiceType {
  Moto = "Moto",
  Remis = "Remis",
}

export interface RatingHistoryEntry {
    userId: string;
    timestamp: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'unknown';
    overallRating: number;
    scores: {
        punctuality: number;
        safety: number;
        cleanliness: number;
        kindness: number;
    };
    comment: string;
    mediaUrl?: string;
}

export interface MicromobilityService {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  type: MicromobilityServiceType;
  vehicleModel: string;
  vehicleColor: string;
  whatsapp: string;
  location: Coordinates;
  address?: string;
  petsAllowed: boolean;
  subscriptionDurationHours: number;
  isActive: boolean;
  isAvailable: boolean;
  isOccupied: boolean;
  isPendingPayment: boolean;
  rating: number;
  numberOfRatings: number;
  totalRatingPoints: number;
  completedTrips: number;
  avgPunctuality: number;
  avgSafety: number;
  avgCleanliness: number;
  avgKindness: number;
  ecoScore: number;
  ratingHistory: RatingHistoryEntry[];
  subscriptionExpiryTimestamp: number | null;
}

export interface RouteResult {
  distance?: string;
  duration?: string;
  geometry?: any; // GeoJSON
  error?: string;
}

export type TravelMode = 'DRIVE' | 'BICYCLE' | 'WALK';

export interface PlaceAutocompleteSuggestion {
  placePrediction: {
    place: string;
    placeId: string;
    text: {
      text: string;
      matches: { endOffset: number }[];
    };
  };
}

export interface PlaceDetails {
  location: Coordinates;
  formattedAddress: string;
}

export interface UppyChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface ScheduleDetail {
    days: string;
    operationHours: string;
    frequency: string;
}

export interface BusLineDetails {
    operator: string;
    generalDescription: string;
    mainCoverage: string;
    segments: Array<{
      name: string;
      details?: string;
    }>;
    variants: string[];
    specificRoutes: Array<{
      name: string;
      stopsCount: number;
      approxDuration: string;
      startPoint: string;
      endPoint: string;
      keyStops: string[];
    }>;
    operatingHours: {
      general: string;
      weekdaysSaturdaysStart: string;
      sundaysEnd: string;
      detailed: ScheduleDetail[];
    };
}