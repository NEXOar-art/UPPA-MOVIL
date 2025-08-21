



export enum ReportType {
  Delay = "Demora",
  RouteChange = "Cambio de Ruta",
  Detour = "Desvío",
  WaitTime = "Tiempo de Espera",
  SafetyIncident = "Incidente de Seguridad",
  MechanicalIssue = "Problema Mecánico",
  ComfortIssue = "Problema de Comodidad",
  PriceUpdate = "Actualización de Precio",
  LocationUpdate = "Actualización de Ubicación",
  Crowded = "Aglomeración",
  BusMoving = "En Movimiento",
  BusStopped = "Detenido",
  Full = "Lleno", // New
  VeryFull = "Muy Lleno", // New
  GoodService = "Buen Servicio", // New
  BadService = "Mal Servicio", // New
}

export interface Coordinates {
  lat: number; // Latitude
  lng: number; // Longitude
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  busLineId: string;
  type: ReportType;
  timestamp: number;
  location?: Coordinates; // Real latitude and longitude
  address?: string; // Human-readable address
  description: string;
  details?: {
    photoBase64?: string;
    reportedWaitTime?: number; // minutes
    severity?: 'low' | 'medium' | 'high';
  };
  upvotes: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export interface Bus {
  id: string; // e.g., "LINEA_29"
  lineName: string; // e.g., "Línea 29"
  description: string; // e.g., "La Boca - Olivos"
  currentLocation?: Coordinates; // Real latitude and longitude
  lastReportedSpeed?: number; // km/h (conceptual)
  lastReportedDirection?: string; // e.g., "Norte" (conceptual)
  statusEvents: string[]; // Report IDs relevant to this bus status
  color: string; // Tailwind color class for visual distinction
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  busLineId: string;
  timestamp: number;
  text: string;
  emoji?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export interface GlobalChatMessage {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  text: string;
  emoji?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string; // URL to an SVG or image
  level: number;
  xp: number;
  xpToNextLevel: number;
  tokens: number;
  badges: string[]; // For gamification, e.g. "Top Reviewer", "Eco-Pilot"
}

export enum MicromobilityServiceType {
  Moto = "Moto",
  Remis = "Remis",
}

export interface RatingHistoryEntry {
  userId: string;
  timestamp: number;
  overallRating: number; // 1-5 stars
  comment?: string;
  mediaUrl?: string; // a base64 string or a URL
  scores: {
    punctuality: number; // 1-5
    safety: number; // 1-5
    cleanliness: number; // 1-5
    kindness: number; // 1-5
  };
  sentiment?: 'positive' | 'negative' | 'neutral' | 'unknown';
}

export interface MicromobilityService {
  id: string;
  providerUserId: string;
  providerName: string; // Name of the person providing the service
  serviceName: string; // Custom name for the service, e.g., "Moto Express Juan"
  type: MicromobilityServiceType;
  vehicleModel: string;
  vehicleColor: string;
  whatsapp: string; // Phone number for WhatsApp contact
  location: Coordinates; // Base or current location of the service
  isActive: boolean; // True if "payment" is confirmed and service is operational
  isPendingPayment: boolean; // True if service is registered but payment not yet confirmed
  isAvailable: boolean; // True if provider sets themselves as "on-duty" / generally available for work
  isOccupied: boolean; // True if provider is currently on a trip with a customer
  registrationTimestamp: number;
  subscriptionDurationHours: number;
  subscriptionExpiryTimestamp: number | null;
  completedTrips: number;
  rating: number; // 0-5 (average rating)
  totalRatingPoints: number; // Sum of all ratings received
  numberOfRatings: number; // Count of ratings received
  ratingHistory: RatingHistoryEntry[];
  // New aggregated scores for detailed reviews
  avgPunctuality: number;
  avgSafety: number;
  avgCleanliness: number;
  avgKindness: number;
  ecoScore: number; // A simulated score from 0-100 for sustainability
}


export interface MapEvent {
  id: string;
  // Make type more generic to accommodate different event sources
  type: ReportType | 'BUS_LOCATION' | 'MICROMOBILITY_MOTO' | 'MICROMOBILITY_REMIS';
  location: Coordinates; // Real latitude and longitude
  busLineId?: string; // For bus related events
  micromobilityServiceId?: string; // For micromobility services
  title: string;
  description?: string;
  icon: string; // Emoji or FontAwesome class
  color?: string; // Tailwind color class for bus, or default for report/micromobility
  isBus?: boolean; // To distinguish bus markers
  isMicromobility?: boolean; // To distinguish micromobility markers
  contactInfo?: string; // e.g., WhatsApp number for micromobility
  isOccupied?: boolean; // For micromobility markers, to indicate if the service is busy
  vehicleModel?: string; // For micromobility
  vehicleColor?: string; // For micromobility
  rating?: number; // Pass rating to map for visual cues
  ecoScore?: number; // Pass ecoScore to map for visual cues
}

export type SentimentFilterType = 'positive' | 'negative' | 'neutral' | 'all';

export interface BusStop {
  id: string;
  name: string; // e.g., "Parada Mitre y Justa Lima"
  location: Coordinates;
  busLineIds: string[]; // Bus lines that use this stop
}

export interface NearestBusStopInfo {
  stop: BusStop;
  forBusLineId: string; // The busLineId for which this stop was identified as nearest
}

export interface ScheduleDetail {
  days: string;
  operationHours: string;
  frequency: string;
}

export interface RouteSegment {
  name: string;
  details?: string;
}

export interface SpecificRouteInfo {
  name:string;
  stopsCount?: number;
  approxDuration?: string;
  startPoint?: string;
  endPoint?: string;
  keyStops?: string[];
}

export interface BusLineDetails {
  operator?: string;
  generalDescription?: string;
  mainCoverage?: string;
  segments?: RouteSegment[];
  variants?: string[];
  specificRoutes?: SpecificRouteInfo[];
  operatingHours?: {
    general?: string;
    weekdaysSaturdaysStart?: string;
    sundaysEnd?: string;
    detailed?: ScheduleDetail[];
  };
}


export interface RouteResult {
  duration?: string;
  distance?: string;
  error?: string;
  warnings?: string[];
}

export type VehicleFocus = 'bus' | 'moto' | 'remis';
export type TravelMode = 'DRIVE' | 'BICYCLE' | 'WALK';

export interface AppState {
  reports: Report[];
  buses: Record<string, Bus>;
  chatMessages: Record<string, ChatMessage[]>; // busLineId -> messages
  micromobilityChatMessages: GlobalChatMessage[]; // Global chat for micromobility
  currentUser: UserProfile | null; // Can be null if not logged in
  isAuthenticated: boolean; // Flag for login status
  selectedBusLineId: string | null;
  isLoading: boolean;
  error: string | null;
  showReportModal: boolean;
  isGoogleMapsApiLoaded: boolean; // To track if Google Maps API is ready
  aiAssistantQuestion: string;
  aiAssistantResponse: string |null;
  isAIAssistantLoading: boolean;
  micromobilityServices: MicromobilityService[];
  showMicromobilityRegistrationModal: boolean;
  showMicromobilityRankingModal: boolean; // New state
  reportSentimentFilter: SentimentFilterType; // New state for report sentiment filter
  nearestBusStop: NearestBusStopInfo | null; // For displaying the nearest bus stop
  showCalculatorModal: boolean; // For calculator modal visibility
  connectedUsersCount: number; // For displaying connected users
  // New state for Trip Planner
  routeOrigin: Coordinates | null;
  routeDestination: Coordinates | null;
  routeResult: RouteResult | null;
  isRouteLoading: boolean;
  aiRouteSummary: string | null;
  isAiSummaryLoading: boolean;
  travelMode: TravelMode;
  // New state for UI focus
  vehicleFocus: VehicleFocus;
  showRecentReportsModal: boolean;
  showSentimentAnalysisModal: boolean;
  showRankingModal: boolean;
  // New state for advanced review system
  showOperatorInsightsModal: boolean;
  postTripReviewData: { serviceId: string; } | null;
}

export type AppAction =
  | { type: 'ADD_REPORT'; payload: Report }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'ADD_MICROMOBILITY_CHAT_MESSAGE'; payload: GlobalChatMessage }
  | { type: 'UPVOTE_REPORT'; payload: { reportId: string } }
  | { type: 'SET_BUS_LOCATION'; payload: { busLineId: string; location: Coordinates; address?: string } }
  | { type: 'SET_SELECTED_BUS_LINE'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_REPORT_MODAL'; payload?: boolean }
  | { type: 'SET_SENTIMENT'; payload: { id: string, type: 'report' | 'chat' | 'globalchat', sentiment: 'positive' | 'negative' | 'neutral' | 'unknown' }}
  | { type: 'SET_MAPS_API_LOADED'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { userName: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_AI_ASSISTANT_QUESTION'; payload: string }
  | { type: 'SET_AI_ASSISTANT_RESPONSE'; payload: string | null }
  | { type: 'SET_AI_ASSISTANT_LOADING'; payload: boolean }
  | { type: 'ADD_OR_UPDATE_MICROMOBILITY_SERVICE'; payload: MicromobilityService }
  | { type: 'TOGGLE_MICROMOBILITY_AVAILABILITY'; payload: { serviceId: string } }
  | { type: 'TOGGLE_MICROMOBILITY_OCCUPIED_STATUS'; payload: { serviceId: string; currentUserId: string } }
  | { type: 'TOGGLE_MICROMOBILITY_REGISTRATION_MODAL'; payload: boolean }
  | { type: 'TOGGLE_MICROMOBILITY_RANKING_MODAL'; payload: boolean }
  | { type: 'CONFIRM_MICROMOBILITY_PAYMENT'; payload: { serviceId: string } }
  | { type: 'DEACTIVATE_EXPIRED_SERVICES' }
  | { type: 'SET_REPORT_SENTIMENT_FILTER'; payload: SentimentFilterType }
  | { type: 'SET_NEAREST_BUS_STOP'; payload: NearestBusStopInfo | null }
  | { type: 'TOGGLE_CALCULATOR_MODAL'; payload: boolean }
  | { type: 'UPDATE_CONNECTED_USERS'; payload: number }
  | { type: 'SET_ROUTE_START'; payload: { origin: Coordinates; destination: Coordinates; travelMode: TravelMode; } }
  | { type: 'SET_ROUTE_RESULT'; payload: RouteResult | null }
  | { type: 'CLEAR_ROUTE' }
  | { type: 'SET_AI_ROUTE_SUMMARY'; payload: string | null }
  | { type: 'SET_AI_SUMMARY_LOADING'; payload: boolean }
  | { type: 'SET_VEHICLE_FOCUS'; payload: VehicleFocus }
  | { type: 'TOGGLE_RECENT_REPORTS_MODAL'; payload: boolean }
  | { type: 'TOGGLE_SENTIMENT_ANALYSIS_MODAL'; payload: boolean }
  | { type: 'TOGGLE_RANKING_MODAL'; payload: boolean }
  // New actions for advanced review system
  | { type: 'SUBMIT_TRIP_REVIEW'; payload: { serviceId: string; review: Omit<RatingHistoryEntry, 'userId' | 'timestamp' | 'sentiment'> } }
  | { type: 'TOGGLE_OPERATOR_INSIGHTS_MODAL'; payload: boolean }
  | { type: 'TRIGGER_POST_TRIP_REVIEW'; payload: { serviceId: string } | null }
  | { type: 'SET_REVIEW_SENTIMENT'; payload: { serviceId: string, timestamp: number, sentiment: 'positive' | 'negative' | 'neutral' | 'unknown' } };


export interface PlaceAutocompleteSuggestion {
  placePrediction: {
    place: string; // e.g. "places/ChIJgUbEo8JvhlQReyF01KjLAmY"
    placeId: string; // e.g. "ChIJgUbEo8JvhlQReyF01KjLAmY"
    text: {
      text: string; // e.g. "Google, Mountain View, CA, USA"
      matches: {
        endOffset: number;
      }[];
    };
  };
}

export interface PlaceDetails {
    location: Coordinates;
    formattedAddress: string;
}