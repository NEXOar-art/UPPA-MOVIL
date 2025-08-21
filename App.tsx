import React, { useReducer, useEffect, useCallback, useState, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import MapDisplay from './components/MapDisplay';
import ChatWindow from './components/ChatWindow';
import ReportForm from './components/ReportForm';
import Modal from './components/Modal';
import LoadingSpinner from './components/LoadingSpinner';
import LoginPage from './components/LoginPage';
import TripPlanner from './components/TripPlanner';
import MicromobilityRegistrationModal from './components/MicromobilityRegistrationModal';
import MicromobilityServiceCard from './components/MicromobilityServiceCard'; 
import MicromobilityChatWindow from './components/MicromobilityChatWindow';
import CalculatorModal from './components/CalculatorModal';
import LocationDashboard from './components/LocationDashboard';
import PostTripReviewModal from './components/BusCard'; // Repurposed for PostTripReviewModal
import OperatorInsightsModal from './components/FloatingMapModal'; // Repurposed for OperatorInsightsModal
import { AppState, AppAction, Report, ChatMessage, GlobalChatMessage, MapEvent, ReportType, UserProfile, Bus, Coordinates, MicromobilityService, MicromobilityServiceType, SentimentFilterType, BusStop, NearestBusStopInfo, RouteResult, VehicleFocus, RatingHistoryEntry, ScheduleDetail, TravelMode } from './types';
import { MOCK_BUS_LINES, REPORT_TYPE_ICONS, DEFAULT_USER_ID, DEFAULT_USER_NAME, API_KEY_ERROR_MESSAGE, MICROMOBILITY_SERVICE_ICONS, MAX_MICROMOBILITY_SERVICES_PER_PROVIDER, MOCK_BUS_STOPS_DATA, BUS_LINE_ADDITIONAL_INFO, CONTACTS_INFO_CAMPANA_ZARATE, MICROMOBILITY_PRICING } from './constants';
import { analyzeSentiment, getAIAssistantResponse, getAiRouteSummary } from './services/geminiService';
import { getAddressFromCoordinates } from './services/geolocationService';
import { getWeather } from './services/mockWeatherService';
import { WireframeBusIcon, WireframeCarIcon, WireframeMotoIcon } from './components/icons';

interface LocationDashboardData {
  location: Coordinates;
  address: string | null;
  weather: { condition: string; temp: number; icon: string; };
  reports: Report[];
  schedule: ScheduleDetail | null;
}

const initialState: AppState = {
  reports: [],
  buses: MOCK_BUS_LINES,
  chatMessages: {},
  micromobilityChatMessages: [], 
  currentUser: null, 
  isAuthenticated: false, 
  selectedBusLineId: null,
  isLoading: true, 
  error: null,
  showReportModal: false,
  isGoogleMapsApiLoaded: window.googleMapsApiLoaded || false,
  aiAssistantQuestion: '',
  aiAssistantResponse: null,
  isAIAssistantLoading: false,
  micromobilityServices: [],
  showMicromobilityRegistrationModal: false,
  showMicromobilityRankingModal: false,
  reportSentimentFilter: 'all',
  nearestBusStop: null,
  showCalculatorModal: false,
  connectedUsersCount: 1,
  routeOrigin: null,
  routeDestination: null,
  routeResult: null,
  isRouteLoading: false,
  aiRouteSummary: null,
  isAiSummaryLoading: false,
  travelMode: 'DRIVE',
  vehicleFocus: 'bus',
  showRecentReportsModal: false,
  showSentimentAnalysisModal: false,
  showRankingModal: false,
  showOperatorInsightsModal: false,
  postTripReviewData: null,
};

// Helper function to calculate distance between two coordinates (simple Euclidean)
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const dx = coord1.lng - coord2.lng;
  const dy = coord1.lat - coord2.lat;
  return Math.sqrt(dx * dx * 111 * 111); // Rough approximation for km
}

// Helper function to calculate user progress
const calculateUserProgress = (currentUser: UserProfile, xpGained: number, tokensGained: number): UserProfile => {
    let newXp = currentUser.xp + xpGained;
    let newLevel = currentUser.level;
    let newXpToNextLevel = currentUser.xpToNextLevel;

    while (newXp >= newXpToNextLevel) {
        newXp -= newXpToNextLevel;
        newLevel++;
        newXpToNextLevel = Math.floor(newXpToNextLevel * 1.5);
    }

    const updatedBadges = new Set(currentUser.badges);
    if(xpGained > 20) updatedBadges.add("Piloto Activo");
    if(tokensGained > 0) updatedBadges.add("Colaborador");


    return {
        ...currentUser,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNextLevel,
        tokens: currentUser.tokens + tokensGained,
        badges: Array.from(updatedBadges),
    };
};


function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        currentUser: { 
            id: DEFAULT_USER_ID, 
            name: action.payload.userName,
            avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(action.payload.userName)}&backgroundRotation=0,360&radius=50`,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            tokens: 50000, // Start with more tokens to test micromobility
            badges: [],
        }, 
        isLoading: false, 
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState, 
        isGoogleMapsApiLoaded: state.isGoogleMapsApiLoaded, 
        isLoading: false, 
      };
    case 'ADD_REPORT': {
      if (!state.currentUser) return state; 
      
      const updatedUser = calculateUserProgress(state.currentUser, 25, 5);

      const updatedReports = [action.payload, ...state.reports];
      const busToUpdate = state.buses[action.payload.busLineId];
      let updatedBuses = state.buses;
      if (busToUpdate) {
         updatedBuses = {
          ...state.buses,
          [action.payload.busLineId]: {
            ...busToUpdate,
            statusEvents: [action.payload.id, ...busToUpdate.statusEvents].slice(0,5),
            ...((action.payload.type === ReportType.LocationUpdate && action.payload.location) ? { currentLocation: action.payload.location } : {})
          }
        };
      }
      return { ...state, reports: updatedReports, buses: updatedBuses, currentUser: updatedUser, error: null };
    }
    case 'ADD_CHAT_MESSAGE':
      if (!state.currentUser) return state; 
      const lineMessages = state.chatMessages[action.payload.busLineId] || [];
      return {
        ...state,
        chatMessages: {
          ...state.chatMessages,
          [action.payload.busLineId]: [...lineMessages, action.payload],
        },
        error: null,
      };
    case 'ADD_MICROMOBILITY_CHAT_MESSAGE':
        if (!state.currentUser) return state;
        return {
            ...state,
            micromobilityChatMessages: [...state.micromobilityChatMessages, action.payload],
            error: null,
        };
    case 'UPVOTE_REPORT':
      return {
        ...state,
        reports: state.reports.map(r => r.id === action.payload.reportId ? { ...r, upvotes: r.upvotes + 1 } : r),
      };
    case 'SET_BUS_LOCATION':
        const targetBus = state.buses[action.payload.busLineId];
        if (!targetBus) return state;
        return {
            ...state,
            buses: {
                ...state.buses,
                [action.payload.busLineId]: {
                    ...targetBus,
                    currentLocation: action.payload.location,
                }
            }
        };
    case 'SET_SELECTED_BUS_LINE':
      return { 
        ...state, 
        vehicleFocus: 'bus',
        selectedBusLineId: action.payload, 
        aiAssistantResponse: null, 
        aiAssistantQuestion: '', 
        reportSentimentFilter: 'all',
        nearestBusStop: null,
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'TOGGLE_REPORT_MODAL':
      return { ...state, showReportModal: action.payload !== undefined ? action.payload : !state.showReportModal };
    case 'TOGGLE_RECENT_REPORTS_MODAL':
      return { ...state, showRecentReportsModal: action.payload };
    case 'TOGGLE_SENTIMENT_ANALYSIS_MODAL':
        return { ...state, showSentimentAnalysisModal: action.payload };
    case 'TOGGLE_RANKING_MODAL':
        return { ...state, showRankingModal: action.payload };
    case 'SET_SENTIMENT':
       if (action.payload.type === 'report') {
            return {
                ...state,
                reports: state.reports.map(r => r.id === action.payload.id ? { ...r, sentiment: action.payload.sentiment } : r),
            };
        } else if (action.payload.type === 'chat') {
            const busLineIdForChat = Object.keys(state.chatMessages).find(key => state.chatMessages[key].some(msg => msg.id === action.payload.id));
            if (busLineIdForChat) {
                return {
                    ...state,
                    chatMessages: {
                        ...state.chatMessages,
                        [busLineIdForChat]: state.chatMessages[busLineIdForChat].map(msg => msg.id === action.payload.id ? { ...msg, sentiment: action.payload.sentiment } : msg)
                    }
                }
            }
            return state;
        } else if (action.payload.type === 'globalchat') {
            return {
                ...state,
                micromobilityChatMessages: state.micromobilityChatMessages.map(msg => msg.id === action.payload.id ? { ...msg, sentiment: action.payload.sentiment } : msg)
            }
        }
        return state;
    case 'SET_REVIEW_SENTIMENT': {
        const { serviceId, timestamp, sentiment } = action.payload;
        return {
            ...state,
            micromobilityServices: state.micromobilityServices.map(s => {
                if (s.id === serviceId) {
                    const history = s.ratingHistory.map(r => r.timestamp === timestamp ? { ...r, sentiment } : r);
                    return { ...s, ratingHistory: history };
                }
                return s;
            })
        };
    }
    case 'SET_MAPS_API_LOADED':
        const stillLoading = state.isAuthenticated ? state.isLoading : !action.payload;
        return { ...state, isGoogleMapsApiLoaded: action.payload, isLoading: stillLoading };
    case 'SET_AI_ASSISTANT_QUESTION':
        return { ...state, aiAssistantQuestion: action.payload };
    case 'SET_AI_ASSISTANT_RESPONSE':
        return { ...state, aiAssistantResponse: action.payload, isAIAssistantLoading: false };
    case 'SET_AI_ASSISTANT_LOADING':
        return { ...state, isAIAssistantLoading: action.payload, error: null };
    case 'ADD_OR_UPDATE_MICROMOBILITY_SERVICE':
        if (!state.currentUser) return state;
        const providerServices = state.micromobilityServices.filter(s => s.providerUserId === state.currentUser!.id);
        const existingServiceIndex = state.micromobilityServices.findIndex(s => s.id === action.payload.id);

        if (existingServiceIndex > -1) { 
            const updatedServices = [...state.micromobilityServices];
            updatedServices[existingServiceIndex] = action.payload;
            return { ...state, micromobilityServices: updatedServices };
        } else { 
            if (providerServices.length >= MAX_MICROMOBILITY_SERVICES_PER_PROVIDER) {
                return { ...state, error: `No puedes registrar más de ${MAX_MICROMOBILITY_SERVICES_PER_PROVIDER} servicios.` };
            }
            return { ...state, micromobilityServices: [...state.micromobilityServices, action.payload] };
        }
    case 'CONFIRM_MICROMOBILITY_PAYMENT': {
        const serviceToActivate = state.micromobilityServices.find(s => s.id === action.payload.serviceId);
        const { currentUser } = state;
        if (!serviceToActivate || !currentUser) return state;

        const price = MICROMOBILITY_PRICING[serviceToActivate.type]?.[serviceToActivate.subscriptionDurationHours];
        if (price === undefined) return { ...state, error: "Precio no definido para este abono." };

        if (currentUser.tokens < price) {
            return { ...state, error: `No tienes suficientes Fichas (${price}) para activar este servicio.` };
        }
        
        const updatedUser = { ...currentUser, tokens: currentUser.tokens - price };
        const updatedService: MicromobilityService = {
            ...serviceToActivate,
            isPendingPayment: false,
            isActive: true,
            isAvailable: true,
            subscriptionExpiryTimestamp: Date.now() + serviceToActivate.subscriptionDurationHours * 60 * 60 * 1000,
        };

        return {
            ...state,
            currentUser: updatedUser,
            micromobilityServices: state.micromobilityServices.map(s =>
                s.id === action.payload.serviceId ? updatedService : s
            ),
        };
    }
    case 'DEACTIVATE_EXPIRED_SERVICES': {
        const now = Date.now();
        return {
            ...state,
            micromobilityServices: state.micromobilityServices.map(s => {
                if (s.isActive && s.subscriptionExpiryTimestamp && s.subscriptionExpiryTimestamp < now) {
                    return { ...s, isActive: false, isAvailable: false };
                }
                return s;
            })
        };
    }
    case 'TOGGLE_MICROMOBILITY_AVAILABILITY': {
      return {
        ...state,
        micromobilityServices: state.micromobilityServices.map(s => 
          s.id === action.payload.serviceId ? { ...s, isAvailable: !s.isAvailable, ...( !s.isAvailable ? {} : { isOccupied: false } ) } : s
        )
      };
    }
    case 'TOGGLE_MICROMOBILITY_OCCUPIED_STATUS': {
      const service = state.micromobilityServices.find(s => s.id === action.payload.serviceId);
      if (!service || !state.currentUser) return state;

      const isFinishingTrip = service.isOccupied;
      let updatedUser = state.currentUser;
      if (isFinishingTrip) {
          updatedUser = calculateUserProgress(state.currentUser, 15, 10);
      }

      return {
        ...state,
        currentUser: updatedUser,
        micromobilityServices: state.micromobilityServices.map(s => 
          s.id === action.payload.serviceId ? { ...s, isOccupied: !s.isOccupied, ...(isFinishingTrip ? { completedTrips: s.completedTrips + 1 } : {}) } : s
        ),
        postTripReviewData: isFinishingTrip ? { serviceId: action.payload.serviceId } : null
      };
    }
    case 'TOGGLE_MICROMOBILITY_REGISTRATION_MODAL':
      return { ...state, showMicromobilityRegistrationModal: action.payload };
    case 'TOGGLE_MICROMOBILITY_RANKING_MODAL':
      return { ...state, showMicromobilityRankingModal: action.payload };
    case 'SET_REPORT_SENTIMENT_FILTER':
      return { ...state, reportSentimentFilter: action.payload };
    case 'SET_NEAREST_BUS_STOP':
        return { ...state, nearestBusStop: action.payload };
    case 'TOGGLE_CALCULATOR_MODAL':
        return { ...state, showCalculatorModal: action.payload };
    case 'UPDATE_CONNECTED_USERS':
        return { ...state, connectedUsersCount: action.payload };
    case 'SET_ROUTE_START':
        return {
            ...state,
            routeOrigin: action.payload.origin,
            routeDestination: action.payload.destination,
            travelMode: action.payload.travelMode,
            isRouteLoading: true,
            routeResult: null,
            aiRouteSummary: null,
        };
    case 'SET_ROUTE_RESULT':
        return { ...state, routeResult: action.payload, isRouteLoading: false };
    case 'CLEAR_ROUTE':
        return {
            ...state,
            routeOrigin: null,
            routeDestination: null,
            routeResult: null,
            isRouteLoading: false,
            aiRouteSummary: null,
            isAiSummaryLoading: false,
        };
    case 'SET_AI_ROUTE_SUMMARY':
        return { ...state, aiRouteSummary: action.payload, isAiSummaryLoading: false };
    case 'SET_AI_SUMMARY_LOADING':
        return { ...state, isAiSummaryLoading: action.payload };
    case 'SET_VEHICLE_FOCUS':
        return { ...state, vehicleFocus: action.payload, selectedBusLineId: null };
    case 'TOGGLE_OPERATOR_INSIGHTS_MODAL':
        return { ...state, showOperatorInsightsModal: action.payload };
    case 'TRIGGER_POST_TRIP_REVIEW':
        return { ...state, postTripReviewData: action.payload };
    case 'SUBMIT_TRIP_REVIEW': {
        if (!state.currentUser) return state;

        const { serviceId, review } = action.payload;
        const newReviewEntry: RatingHistoryEntry = {
            ...review,
            userId: state.currentUser.id,
            timestamp: Date.now(),
            sentiment: 'unknown', // Will be analyzed by effect
        };

        const serviceIndex = state.micromobilityServices.findIndex(s => s.id === serviceId);
        if (serviceIndex === -1) return state;

        const serviceToUpdate = state.micromobilityServices[serviceIndex];
        const newTotalRatingPoints = serviceToUpdate.totalRatingPoints + review.overallRating;
        const newNumberOfRatings = serviceToUpdate.numberOfRatings + 1;
        
        const updatedService: MicromobilityService = {
            ...serviceToUpdate,
            ratingHistory: [newReviewEntry, ...serviceToUpdate.ratingHistory],
            totalRatingPoints: newTotalRatingPoints,
            numberOfRatings: newNumberOfRatings,
            rating: newTotalRatingPoints / newNumberOfRatings,
            avgPunctuality: ((serviceToUpdate.avgPunctuality * serviceToUpdate.numberOfRatings) + review.scores.punctuality) / newNumberOfRatings,
            avgSafety: ((serviceToUpdate.avgSafety * serviceToUpdate.numberOfRatings) + review.scores.safety) / newNumberOfRatings,
            avgCleanliness: ((serviceToUpdate.avgCleanliness * serviceToUpdate.numberOfRatings) + review.scores.cleanliness) / newNumberOfRatings,
            avgKindness: ((serviceToUpdate.avgKindness * serviceToUpdate.numberOfRatings) + review.scores.kindness) / newNumberOfRatings,
        };

        const updatedUser = calculateUserProgress(state.currentUser, 50, 20); // Bonus XP for review

        return {
            ...state,
            currentUser: updatedUser,
            micromobilityServices: [
                ...state.micromobilityServices.slice(0, serviceIndex),
                updatedService,
                ...state.micromobilityServices.slice(serviceIndex + 1),
            ],
            postTripReviewData: null, // Close review modal
        };
    }
    default:
      return state;
  }
}

const App: React.FC = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [locationDashboardData, setLocationDashboardData] = useState<LocationDashboardData | null>(null);

    const mapApiScriptLoaded = useRef(false);

    // --- EFFECT: Initialize Google Maps API ---
    useEffect(() => {
        if (mapApiScriptLoaded.current || window.google?.maps) {
            dispatch({ type: 'SET_MAPS_API_LOADED', payload: true });
            return;
        }

        const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
        if (!GOOGLE_MAPS_API_KEY) {
            dispatch({ type: 'SET_ERROR', payload: "La clave API de Google Maps no está configurada." });
            return;
        }

        window.initMapApp = () => {
            dispatch({ type: 'SET_MAPS_API_LOADED', payload: true });
            window.googleMapsApiLoaded = true;
        };
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry,places&callback=initMapApp`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
            dispatch({ type: 'SET_ERROR', payload: "No se pudo cargar el script de Google Maps. Revisa la clave API y la conexión a internet." });
        };
        document.head.appendChild(script);
        mapApiScriptLoaded.current = true;

        return () => { // Cleanup
            const scripts = document.head.getElementsByTagName('script');
            for (let i = scripts.length - 1; i >= 0; i--) {
                if (scripts[i].src.includes('maps.googleapis.com')) {
                    scripts[i].remove();
                }
            }
             if (window.initMapApp) {
                delete window.initMapApp;
            }
        }
    }, []);

    // --- EFFECT: Mock data simulation and intervals ---
    useEffect(() => {
        if (!state.isAuthenticated) return;
        
        const busMovementInterval = setInterval(() => {
            Object.values(state.buses).forEach(bus => {
                if (bus.currentLocation) {
                    dispatch({
                        type: 'SET_BUS_LOCATION',
                        payload: {
                            busLineId: bus.id,
                            location: {
                                lat: bus.currentLocation.lat + (Math.random() - 0.5) * 0.001,
                                lng: bus.currentLocation.lng + (Math.random() - 0.5) * 0.001,
                            },
                        },
                    });
                }
            });
        }, 5000);

        const userCountInterval = setInterval(() => {
            dispatch({ type: 'UPDATE_CONNECTED_USERS', payload: Math.max(1, state.connectedUsersCount + Math.floor(Math.random() * 3) - 1) });
        }, 7000);

        const serviceExpiryInterval = setInterval(() => {
            dispatch({ type: 'DEACTIVATE_EXPIRED_SERVICES' });
        }, 60 * 1000); // Check every minute

        return () => {
            clearInterval(busMovementInterval);
            clearInterval(userCountInterval);
            clearInterval(serviceExpiryInterval);
        };
    }, [state.isAuthenticated, state.buses, state.connectedUsersCount]);

    // --- EFFECT: Get User's Geolocation ---
    useEffect(() => {
        if (!state.isAuthenticated) return;
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            () => {
                dispatch({ type: 'SET_ERROR', payload: "No se pudo obtener tu ubicación. Funcionalidades como 'Parada más cercana' estarán desactivadas." });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [state.isAuthenticated]);
    
     // --- EFFECT: Update Location Dashboard Data ---
    useEffect(() => {
        if (!userLocation) return;
    
        const updateDashboard = async () => {
          const [address, weather] = await Promise.all([
            getAddressFromCoordinates(userLocation),
            getWeather()
          ]);
    
          const nearbyReports = state.reports.filter(r => r.location && calculateDistance(userLocation, r.location) < 2); // Reports within ~2km
          
          let schedule: ScheduleDetail | null = null;
          if (state.selectedBusLineId && BUS_LINE_ADDITIONAL_INFO[state.selectedBusLineId]?.operatingHours?.detailed?.[0]) {
             schedule = BUS_LINE_ADDITIONAL_INFO[state.selectedBusLineId]!.operatingHours!.detailed![0];
          }

          setLocationDashboardData({
            location: userLocation,
            address: address || `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`,
            weather,
            reports: nearbyReports,
            schedule,
          });
        };
    
        updateDashboard();
        const interval = setInterval(updateDashboard, 60000); // Update every minute
        return () => clearInterval(interval);
    
    }, [userLocation, state.reports, state.selectedBusLineId]);

    // --- EFFECT: Analyze sentiment of new reports, messages, and reviews ---
    useEffect(() => {
        const lastReport = state.reports[0];
        if (lastReport && lastReport.sentiment === 'unknown') {
            analyzeSentiment(lastReport.description).then(sentiment => {
                dispatch({ type: 'SET_SENTIMENT', payload: { id: lastReport.id, type: 'report', sentiment }});
            });
        }
        
        const lastMicroMsg = state.micromobilityChatMessages[state.micromobilityChatMessages.length - 1];
        if (lastMicroMsg && lastMicroMsg.sentiment === 'unknown') {
            analyzeSentiment(lastMicroMsg.text || 'emoji_only').then(sentiment => {
                dispatch({ type: 'SET_SENTIMENT', payload: { id: lastMicroMsg.id, type: 'globalchat', sentiment }});
            })
        }
        
        const serviceWithNewReview = state.micromobilityServices.find(s => s.ratingHistory[0]?.sentiment === 'unknown');
        if (serviceWithNewReview) {
            const newReview = serviceWithNewReview.ratingHistory[0];
             analyzeSentiment(newReview.comment || `rating:${newReview.overallRating}`).then(sentiment => {
                dispatch({ type: 'SET_REVIEW_SENTIMENT', payload: { serviceId: serviceWithNewReview.id, timestamp: newReview.timestamp, sentiment }});
            });
        }

    }, [state.reports, state.micromobilityChatMessages, state.micromobilityServices]);
    
    // --- EFFECT: Find nearest bus stop ---
    useEffect(() => {
        if (!state.selectedBusLineId || !userLocation) {
            dispatch({ type: 'SET_NEAREST_BUS_STOP', payload: null });
            return;
        }

        const stopsForLine = MOCK_BUS_STOPS_DATA[state.selectedBusLineId] || [];
        if (stopsForLine.length === 0) return;

        let nearestStop: BusStop | null = null;
        let minDistance = Infinity;

        stopsForLine.forEach(stop => {
            const dist = calculateDistance(userLocation, stop.location);
            if (dist < minDistance) {
                minDistance = dist;
                nearestStop = stop;
            }
        });

        if (nearestStop) {
            dispatch({ type: 'SET_NEAREST_BUS_STOP', payload: { stop: nearestStop, forBusLineId: state.selectedBusLineId } });
        }

    }, [state.selectedBusLineId, userLocation]);


    // --- EFFECT: Get AI Route Summary ---
    useEffect(() => {
        if(state.routeResult && !state.routeResult.error && state.routeOrigin && state.routeDestination && !state.aiRouteSummary) {
            const fetchSummary = async () => {
                dispatch({ type: 'SET_AI_SUMMARY_LOADING', payload: true });
                const [originAddr, destAddr] = await Promise.all([
                    getAddressFromCoordinates(state.routeOrigin!),
                    getAddressFromCoordinates(state.routeDestination!)
                ]);

                const routeInfo = `Duración: ${state.routeResult!.duration}, Distancia: ${state.routeResult!.distance}.`;
                const nearbyReports = state.reports
                    .filter(r => r.location && (calculateDistance(state.routeOrigin!, r.location) < 5 || calculateDistance(state.routeDestination!, r.location) < 5))
                    .map(r => `[${r.type}] ${r.description}`)
                    .slice(0, 5)
                    .join('\n');

                try {
                    const summary = await getAiRouteSummary(originAddr || 'Origen', destAddr || 'Destino', routeInfo, nearbyReports);
                    dispatch({ type: 'SET_AI_ROUTE_SUMMARY', payload: summary });
                } catch (e: any) {
                    dispatch({ type: 'SET_AI_ROUTE_SUMMARY', payload: `Error al generar resumen IA: ${e.message}` });
                }
            }
            fetchSummary();
        }
    }, [state.routeResult, state.routeOrigin, state.routeDestination, state.reports, state.aiRouteSummary]);


    // --- Handlers ---
    const handleLogin = useCallback((userName: string) => dispatch({ type: 'LOGIN_SUCCESS', payload: { userName } }), []);
    const handleLogout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);
    
    const handleSubmitReport = useCallback((report: Report) => dispatch({ type: 'ADD_REPORT', payload: report }), []);
    const handleSendMessage = useCallback((message: ChatMessage) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message }), []);
    const handleSendMicromobilityMessage = useCallback((message: GlobalChatMessage) => dispatch({ type: 'ADD_MICROMOBILITY_CHAT_MESSAGE', payload: message }), []);

    const handleSelectBusLine = useCallback((busLineId: string | null) => dispatch({ type: 'SET_SELECTED_BUS_LINE', payload: busLineId }), []);
    const handleSendReportFromChat = useCallback((reportType: ReportType, description: string, busLineId: string) => {
        if (!state.currentUser) return;
        const newReport: Report = {
            id: `report-chat-${Date.now()}`,
            userId: state.currentUser.id,
            userName: state.currentUser.name,
            busLineId,
            type: reportType,
            timestamp: Date.now(),
            description,
            upvotes: 0,
            sentiment: 'unknown', // Will be analyzed
        };
        dispatch({ type: 'ADD_REPORT', payload: newReport });
    }, [state.currentUser]);

    const handleAIAssistantSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.aiAssistantQuestion.trim() || !state.selectedBusLineId) return;

        dispatch({ type: 'SET_AI_ASSISTANT_LOADING', payload: true });
        dispatch({ type: 'SET_AI_ASSISTANT_RESPONSE', payload: null });
        
        const busLineName = state.buses[state.selectedBusLineId]?.lineName || 'esta línea';
        const generalInfo = `Información general: ${BUS_LINE_ADDITIONAL_INFO[state.selectedBusLineId]?.generalDescription || 'No disponible.'}`;
        const recentReports = state.reports
            .filter(r => r.busLineId === state.selectedBusLineId)
            .slice(0, 5)
            .map(r => `[${r.type} por ${r.userName}]: ${r.description}`)
            .join('\n');
        
        const combinedContext = `${generalInfo}\n\nReportes recientes de usuarios:\n${recentReports || 'Sin reportes recientes.'}`;
        
        try {
            const response = await getAIAssistantResponse(state.aiAssistantQuestion, busLineName, combinedContext);
            dispatch({ type: 'SET_AI_ASSISTANT_RESPONSE', payload: response });
        } catch (error: any) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            dispatch({ type: 'SET_AI_ASSISTANT_LOADING', payload: false });
        }
    }, [state.aiAssistantQuestion, state.selectedBusLineId, state.reports, state.buses]);


    const handleRegisterMicromobility = useCallback((formData: Omit<MicromobilityService, 'id' | 'providerUserId' | 'providerName' | 'isActive' | 'isPendingPayment' | 'isAvailable' | 'isOccupied' | 'registrationTimestamp' | 'subscriptionExpiryTimestamp' | 'completedTrips' | 'rating' | 'totalRatingPoints' | 'numberOfRatings' | 'ratingHistory' | 'avgPunctuality' | 'avgSafety' | 'avgCleanliness' | 'avgKindness' | 'ecoScore'> ) => {
        if (!state.currentUser) return;
        const newService: MicromobilityService = {
            id: `micro-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            providerUserId: state.currentUser.id,
            providerName: state.currentUser.name,
            ...formData,
            isActive: false,
            isPendingPayment: true,
            isAvailable: false,
            isOccupied: false,
            registrationTimestamp: Date.now(),
            subscriptionExpiryTimestamp: null,
            completedTrips: 0,
            rating: 0,
            totalRatingPoints: 0,
            numberOfRatings: 0,
            ratingHistory: [],
            avgPunctuality: 0,
            avgSafety: 0,
            avgCleanliness: 0,
            avgKindness: 0,
            ecoScore: Math.floor(Math.random() * 40) + 40, // Random eco score 40-79
        };
        dispatch({ type: 'ADD_OR_UPDATE_MICROMOBILITY_SERVICE', payload: newService });
        dispatch({ type: 'TOGGLE_MICROMOBILITY_REGISTRATION_MODAL', payload: false });
    }, [state.currentUser]);

    const handleSetRoute = useCallback((origin: Coordinates, destination: Coordinates, travelMode: TravelMode) => {
        dispatch({ type: 'SET_ROUTE_START', payload: { origin, destination, travelMode } });
    }, []);

    const handleClearRoute = useCallback(() => {
        dispatch({ type: 'CLEAR_ROUTE' });
    }, []);

    const handleRouteResult = useCallback((result: RouteResult) => {
        dispatch({ type: 'SET_ROUTE_RESULT', payload: result });
    }, []);

    const handleMicromobilityToggle = (serviceId: string, action: 'availability' | 'occupied', currentUserId: string) => {
      if (action === 'availability') {
        dispatch({ type: 'TOGGLE_MICROMOBILITY_AVAILABILITY', payload: { serviceId } });
      } else {
        dispatch({ type: 'TOGGLE_MICROMOBILITY_OCCUPIED_STATUS', payload: { serviceId, currentUserId } });
      }
    };
    
    // --- Memos for derived state ---
    const mapEvents = useMemo((): MapEvent[] => {
        const busEvents: MapEvent[] = Object.values(state.buses)
            .filter(bus => bus.currentLocation)
            .map(bus => ({
                id: bus.id,
                type: 'BUS_LOCATION',
                location: bus.currentLocation!,
                busLineId: bus.id,
                title: bus.lineName,
                description: bus.description,
                icon: 'fas fa-bus',
                color: bus.color,
                isBus: true,
            }));
        
        const reportEvents: MapEvent[] = state.reports
            .filter(report => report.location)
            .map(report => ({
                id: report.id,
                type: report.type,
                location: report.location!,
                busLineId: report.busLineId,
                title: report.type,
                description: report.description,
                icon: REPORT_TYPE_ICONS[report.type] || 'fas fa-info-circle',
            }));

        const micromobilityEvents: MapEvent[] = state.micromobilityServices
            .filter(service => service.isActive && service.isAvailable)
            .map(service => ({
                id: service.id,
                type: service.type === MicromobilityServiceType.Moto ? 'MICROMOBILITY_MOTO' : 'MICROMOBILITY_REMIS',
                location: service.location,
                micromobilityServiceId: service.id,
                title: service.serviceName,
                description: `Piloto: ${service.providerName}`,
                icon: MICROMOBILITY_SERVICE_ICONS[service.type],
                isMicromobility: true,
                contactInfo: service.whatsapp,
                isOccupied: service.isOccupied,
                vehicleModel: service.vehicleModel,
                vehicleColor: service.vehicleColor,
                rating: service.rating,
                ecoScore: service.ecoScore,
            }));

        return [...reportEvents, ...micromobilityEvents, ...busEvents];
    }, [state.reports, state.buses, state.micromobilityServices]);

    const filteredReports = useMemo(() => {
        if (!state.selectedBusLineId) return [];
        return state.reports.filter(r => {
            const byLine = r.busLineId === state.selectedBusLineId;
            if (state.reportSentimentFilter === 'all') return byLine;
            return byLine && r.sentiment === state.reportSentimentFilter;
        });
    }, [state.reports, state.selectedBusLineId, state.reportSentimentFilter]);
    
    const micromobilityRanking = useMemo(() => {
        return [...state.micromobilityServices]
            .filter(s => s.isActive)
            .sort((a, b) => {
                if(b.rating !== a.rating) return b.rating - a.rating;
                return b.completedTrips - a.completedTrips;
            });
    }, [state.micromobilityServices]);
    
    const isCurrentUserTopRanked = useMemo(() => {
        if (!state.currentUser) return false;
        const userServices = micromobilityRanking
            .filter(s => s.providerUserId === state.currentUser!.id)
            .map(s => s.id);
        if (userServices.length === 0) return false;
        const top5 = micromobilityRanking.slice(0, 5).map(s => s.id);
        return userServices.some(id => top5.includes(id));
    }, [micromobilityRanking, state.currentUser]);


    // --- Render logic ---
    if (state.isLoading) {
        return (
            <div className="bg-ps-dark-bg min-h-screen flex flex-col items-center justify-center">
                <LoadingSpinner size="w-24 h-24" />
                <p className="text-xl text-slate-300 mt-4 font-orbitron">Cargando Red Urbana...</p>
                 {state.error && <p className="text-red-400 mt-4">{state.error}</p>}
            </div>
        );
    }
    
    if (!state.isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const { currentUser, selectedBusLineId } = state;

    return (
        <div className="bg-ps-dark-bg text-slate-100 font-sans min-h-screen flex flex-col">
            <Navbar 
                appName="UppA"
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenRanking={() => dispatch({ type: 'TOGGLE_RANKING_MODAL', payload: true })}
                connectedUsersCount={state.connectedUsersCount}
                onFocusUserLocation={() => setUserLocation({ ...userLocation! })}
                isTopRanked={isCurrentUserTopRanked}
            />
            {state.error && <div className="bg-red-800 text-center p-2 text-white">{state.error} <button onClick={() => dispatch({type: 'SET_ERROR', payload: null})} className="ml-4 font-bold">X</button></div>}

            <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
                {/* Left Panel */}
                <div className="lg:col-span-3 ps-panel flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-blue-500/20">
                        <h2 className="text-xl font-bold font-audiowide text-blue-300">Nexo Operativo</h2>
                        <div className="flex justify-around bg-slate-900/50 p-1 rounded-md mt-3">
                           <button onClick={() => dispatch({ type: 'SET_VEHICLE_FOCUS', payload: 'bus' })} className={`flex-1 ps-button-toggle ${state.vehicleFocus === 'bus' ? 'active': ''}`}><WireframeBusIcon className="w-6 h-6 mr-2"/> Colectivos</button>
                           <button onClick={() => dispatch({ type: 'SET_VEHICLE_FOCUS', payload: 'moto' })} className={`flex-1 ps-button-toggle ${state.vehicleFocus === 'moto' ? 'active': ''}`}><WireframeMotoIcon className="w-6 h-6 mr-2"/> Motos</button>
                           <button onClick={() => dispatch({ type: 'SET_VEHICLE_FOCUS', payload: 'remis' })} className={`flex-1 ps-button-toggle ${state.vehicleFocus === 'remis' ? 'active': ''}`}><WireframeCarIcon className="w-6 h-6 mr-2"/> Remises</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {state.vehicleFocus === 'bus' && (
                            <div className="space-y-2">
                                {Object.values(state.buses).map(bus => (
                                    <button
                                        key={bus.id}
                                        onClick={() => handleSelectBusLine(bus.id === selectedBusLineId ? null : bus.id)}
                                        className={`w-full text-left p-3 rounded-md transition-all duration-200 border-l-4 ${bus.color} ${selectedBusLineId === bus.id ? 'bg-blue-500/30 border-blue-400' : 'bg-slate-800/70 border-transparent hover:bg-slate-700/90'}`}
                                    >
                                        <p className="font-bold text-white">{bus.lineName}</p>
                                        <p className="text-xs text-slate-400">{bus.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {(state.vehicleFocus === 'moto' || state.vehicleFocus === 'remis') && (
                             <div>
                                <button onClick={() => dispatch({type: 'TOGGLE_MICROMOBILITY_REGISTRATION_MODAL', payload: true})} className="w-full ps-button active mb-4">
                                   <i className="fas fa-plus-circle mr-2"></i> Registrar Mi Servicio
                                </button>
                                <div className="space-y-3">
                                {micromobilityRanking
                                    .filter(s => s.type.toLowerCase() === state.vehicleFocus)
                                    .map(service => (
                                    <MicromobilityServiceCard
                                        key={service.id}
                                        service={service}
                                        isOwnService={service.providerUserId === currentUser?.id}
                                        onToggleAvailability={(id) => handleMicromobilityToggle(id, 'availability', currentUser!.id)}
                                        onToggleOccupied={(id) => handleMicromobilityToggle(id, 'occupied', currentUser!.id)}
                                        onConfirmPayment={(id) => dispatch({type: 'CONFIRM_MICROMOBILITY_PAYMENT', payload: {serviceId: id}})}
                                        onContact={(whatsapp) => window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank')}
                                        chatMessages={state.micromobilityChatMessages}
                                        onSendMessage={handleSendMicromobilityMessage}
                                        currentUser={currentUser!}
                                    />
                                ))}
                                </div>
                             </div>
                        )}
                    </div>
                </div>

                {/* Center Panel (Map) */}
                <div className="lg:col-span-6 ps-panel h-[60vh] lg:h-auto overflow-hidden">
                    <MapDisplay
                        isGoogleMapsApiLoaded={state.isGoogleMapsApiLoaded}
                        events={mapEvents}
                        buses={state.buses}
                        busStops={Object.values(MOCK_BUS_STOPS_DATA).flat()}
                        selectedBusLineId={selectedBusLineId}
                        className="w-full h-full"
                        onBusClick={handleSelectBusLine}
                        nearestBusStop={state.nearestBusStop}
                        routeOrigin={state.routeOrigin}
                        routeDestination={state.routeDestination}
                        onRouteResult={handleRouteResult}
                        userLocationFocus={userLocation}
                        travelMode={state.travelMode}
                    />
                </div>

                {/* Right Panel */}
                <div className="lg:col-span-3 ps-panel flex flex-col overflow-hidden">
                     <div className="p-4 border-b border-blue-500/20">
                         <h2 className="text-xl font-bold font-audiowide text-blue-300">
                             {selectedBusLineId ? `Intel: ${state.buses[selectedBusLineId]?.lineName}` : 'Planificador Global'}
                         </h2>
                     </div>
                     <div className="p-4 flex-grow overflow-y-auto">
                        {selectedBusLineId && (
                            <div className="h-full flex flex-col space-y-4">
                                <div className="flex-grow">
                                     <ChatWindow
                                        busLineId={selectedBusLineId}
                                        messages={state.chatMessages[selectedBusLineId] || []}
                                        currentUser={currentUser!}
                                        onSendMessage={handleSendMessage}
                                        onSendReportFromChat={handleSendReportFromChat}
                                        onToggleCalculator={() => dispatch({type: 'TOGGLE_CALCULATOR_MODAL', payload: true})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <button onClick={() => dispatch({type: 'TOGGLE_REPORT_MODAL', payload: true})} className="w-full ps-button active">
                                        <i className="fas fa-bullhorn mr-2"></i> Reportar Intel
                                    </button>
                                     <form onSubmit={handleAIAssistantSubmit} className="space-y-2">
                                        <textarea
                                            value={state.aiAssistantQuestion}
                                            onChange={e => dispatch({type: 'SET_AI_ASSISTANT_QUESTION', payload: e.target.value})}
                                            placeholder="Pregúntale a UppA sobre esta línea..."
                                            rows={2}
                                            className="w-full ps-input text-sm"
                                        />
                                        <button type="submit" disabled={state.isAIAssistantLoading} className="w-full ps-button">
                                            {state.isAIAssistantLoading ? <LoadingSpinner size="w-5 h-5"/> : <><i className="fas fa-magic mr-2"></i> Consultar IA</>}
                                        </button>
                                     </form>
                                     {state.aiAssistantResponse && (
                                         <div className="p-3 bg-indigo-900/40 border-l-4 border-indigo-500 rounded-r-md">
                                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{state.aiAssistantResponse}</p>
                                         </div>
                                     )}
                                </div>
                            </div>
                        )}
                        {!selectedBusLineId && locationDashboardData && (
                            state.routeOrigin ? (
                                <TripPlanner
                                    isGoogleMapsApiLoaded={state.isGoogleMapsApiLoaded}
                                    onSetRoute={handleSetRoute}
                                    onClearRoute={handleClearRoute}
                                    onShowRecentReports={() => dispatch({type: 'TOGGLE_RECENT_REPORTS_MODAL', payload: true})}
                                    routeResult={state.routeResult}
                                    isRouteLoading={state.isRouteLoading}
                                    aiRouteSummary={state.aiRouteSummary}
                                    isAiSummaryLoading={state.isAiSummaryLoading}
                                />
                            ) : (
                                <LocationDashboard data={locationDashboardData} />
                            )
                        )}
                         {!selectedBusLineId && !locationDashboardData && (
                             <TripPlanner
                                isGoogleMapsApiLoaded={state.isGoogleMapsApiLoaded}
                                onSetRoute={handleSetRoute}
                                onClearRoute={handleClearRoute}
                                onShowRecentReports={() => dispatch({type: 'TOGGLE_RECENT_REPORTS_MODAL', payload: true})}
                                routeResult={state.routeResult}
                                isRouteLoading={state.isRouteLoading}
                                aiRouteSummary={state.aiRouteSummary}
                                isAiSummaryLoading={state.isAiSummaryLoading}
                            />
                         )}
                     </div>
                     <div className="p-4 border-t border-blue-500/20 flex justify-end">
                        <button onClick={() => dispatch({ type: 'TOGGLE_OPERATOR_INSIGHTS_MODAL', payload: true })} className="ps-button"><i className="fas fa-chart-line mr-2"></i>Insights</button>
                     </div>
                </div>
            </main>
            
            {/* Modals */}
            <Modal isOpen={state.showReportModal} onClose={() => dispatch({type: 'TOGGLE_REPORT_MODAL', payload: false})} title="Transmitir Nuevo Intel">
                {selectedBusLineId && currentUser ? (
                    <ReportForm
                        busLineId={selectedBusLineId}
                        currentUser={currentUser}
                        onSubmit={handleSubmitReport}
                        onClose={() => dispatch({type: 'TOGGLE_REPORT_MODAL', payload: false})}
                    />
                ) : <p>Por favor selecciona una línea de colectivo para reportar.</p>}
            </Modal>
             <Modal isOpen={state.showMicromobilityRegistrationModal} onClose={() => dispatch({type: 'TOGGLE_MICROMOBILITY_REGISTRATION_MODAL', payload: false})} title="Registrar Servicio de Micromovilidad">
                {currentUser && <MicromobilityRegistrationModal currentUser={currentUser} onSubmit={handleRegisterMicromobility} onClose={() => dispatch({type: 'TOGGLE_MICROMOBILITY_REGISTRATION_MODAL', payload: false})} />}
            </Modal>
             <Modal isOpen={state.showRankingModal} onClose={() => dispatch({ type: 'TOGGLE_RANKING_MODAL', payload: false })} title="Ranking de Pilotos">
                <div className="space-y-3">
                    {micromobilityRanking.length > 0 ? micromobilityRanking.map((s, index) => (
                        <div key={s.id} className="flex items-center p-2 bg-slate-800/50 rounded-md">
                            <span className="font-bold text-lg w-8 text-center">{index + 1}</span>
                            <img src={`https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${encodeURIComponent(s.providerName)}`} alt={s.providerName} className="w-10 h-10 rounded-full mx-3" />
                            <div className="flex-grow">
                                <p className="font-semibold text-white">{s.providerName}</p>
                                <p className="text-xs text-slate-400">{s.serviceName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-yellow-400 font-bold"><i className="fas fa-star mr-1"></i>{s.rating.toFixed(2)}</p>
                                <p className="text-xs text-slate-400">{s.completedTrips} viajes</p>
                            </div>
                        </div>
                    )) : <p className="text-center text-slate-400">Aún no hay servicios en el ranking.</p>}
                </div>
            </Modal>
            <CalculatorModal isOpen={state.showCalculatorModal} onClose={() => dispatch({type: 'TOGGLE_CALCULATOR_MODAL', payload: false})} />

             {state.postTripReviewData && state.micromobilityServices.find(s => s.id === state.postTripReviewData?.serviceId) && currentUser &&
                <PostTripReviewModal 
                    isOpen={!!state.postTripReviewData}
                    onClose={() => dispatch({ type: 'TRIGGER_POST_TRIP_REVIEW', payload: null })}
                    onSubmit={(review) => dispatch({ type: 'SUBMIT_TRIP_REVIEW', payload: { serviceId: state.postTripReviewData!.serviceId, review }})}
                    service={state.micromobilityServices.find(s => s.id === state.postTripReviewData!.serviceId)!}
                    currentUser={currentUser}
                />
            }
             <OperatorInsightsModal 
                isOpen={state.showOperatorInsightsModal}
                onClose={() => dispatch({ type: 'TOGGLE_OPERATOR_INSIGHTS_MODAL', payload: false })}
                services={state.micromobilityServices}
            />
        </div>
    );
};

export default App;
