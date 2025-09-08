import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    Bus, Report, UserProfile, Coordinates, ChatMessage, BusStop, ReportType, 
    MicromobilityService, MicromobilityServiceType, GlobalChatMessage, RouteResult, TravelMode, 
    UppyChatMessage, BusLineDetails, BadgeId, RatingHistoryEntry, ScheduleDetail 
} from './types';
import { 
    MOCK_BUS_LINES, MOCK_BUS_STOPS_DATA, DEFAULT_MAP_CENTER, DEFAULT_USER_ID, 
    DEFAULT_USER_NAME, BUS_LINE_ADDITIONAL_INFO, GEMINI_TEXT_MODEL, 
    MAX_MICROMOBILITY_SERVICES_PER_PROVIDER 
} from './constants';

import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import MapDisplay from './components/MapDisplay';
import PostTripReviewModal, { BusCard } from './components/BusCard';
import ReportForm from './components/ReportForm';
import ChatWindow from './components/ChatWindow';
import Modal from './components/Modal';
import TripPlanner from './components/TripPlanner';
import LocationDashboard from './components/LocationDashboard';
import MicromobilityChat from './components/MicromobilityChat';
import MicromobilityServiceCard from './components/MicromobilityServiceCard';
import MicromobilityRegistrationModal from './components/MicromobilityRegistrationModal';
import OperatorInsightsModal from './components/FloatingMapModal';
import UppyAssistant from './components/UppyAssistant';
import CalculatorModal from './components/CalculatorModal';
import ErrorToast from './components/ErrorToast';
import RankingTable from './components/RankingTable';
import MapErrorDisplay from './components/MapErrorDisplay';
import MicromobilityChatWindow from './components/MicromobilityChatWindow';
import AccessibilityControls from './components/AccessibilityControls';
import AvailableServices from './components/AvailableServices';
import PointsOfInterest from './components/PointsOfInterest';
import { useSettings } from './contexts/SettingsContext';

import { getAddressFromCoordinates } from './services/geolocationService';
import { fetchRoute } from './services/routesService';
import { getWeather, getWeatherByLocationName } from './services/mockWeatherService';
import { getUppyResponse, getUppySystemInstruction, getAiRouteSummary, analyzeSentiment } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
    // FIX: Destructure `language` from useSettings to correctly set the document's lang attribute.
    const { theme, fontSize, language, t } = useSettings();

    useEffect(() => {
        document.body.className = '';
        document.body.classList.add(`theme-${theme}`);
        document.documentElement.style.fontSize = `${fontSize}px`;
        // FIX: Use 'language' directly. `t` is a function and does not have a `language` property.
        document.documentElement.lang = language;
    // FIX: Update dependency array to use `language` instead of the incorrect `t.language`.
    }, [theme, fontSize, language]);

    // STATE MANAGEMENT
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);
    const [connectedUsersCount, setConnectedUsersCount] = useState(0);

    // Map State
    const [isMapReady, setIsMapReady] = useState(false);
    const [isMapError, setIsMapError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_MAP_CENTER);
    const [mapZoom, setMapZoom] = useState(13);

    // Data State
    const [busLines, setBusLines] = useState<Record<string, Bus>>(MOCK_BUS_LINES);
    const [busStops, setBusStops] = useState<Record<string, BusStop[]>>(MOCK_BUS_STOPS_DATA);
    const [selectedBusLineId, setSelectedBusLineId] = useState<string | null>("LINEA_228CB");
    const [reports, setReports] = useState<Record<string, Report[]>>({});
    const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});
    const [globalChatMessages, setGlobalChatMessages] = useState<GlobalChatMessage[]>([]);
    const [micromobilityServices, setMicromobilityServices] = useState<MicromobilityService[]>([]);
    const [uppyChatHistory, setUppyChatHistory] = useState<UppyChatMessage[]>([]);
    const [userPreferences, setUserPreferences] = useState<string[]>([]);
    const [isUppyLoading, setIsUppyLoading] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
    const [weatherData, setWeatherData] = useState({ condition: "Cargando...", temp: 0, icon: "fas fa-spinner fa-spin" });
    const [busSchedule, setBusSchedule] = useState<ScheduleDetail | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<'transport' | 'pilot'>('transport');
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isUppyModalOpen, setIsUppyModalOpen] = useState(false);
    const [isMicromobilityRegisterModalOpen, setIsMicromobilityRegisterModalOpen] = useState(false);
    const [isOperatorInsightsModalOpen, setIsOperatorInsightsModalOpen] = useState(false);
    const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
    const [isMicromobilityPanelOpen, setIsMicromobilityPanelOpen] = useState(true);
    const [isPostTripReviewModalOpen, setIsPostTripReviewModalOpen] = useState(false);
    const [serviceToReview, setServiceToReview] = useState<MicromobilityService | null>(null);
    const [isMicromobilityChatModalOpen, setIsMicromobilityChatModalOpen] = useState(false);

    // Micromobility Request Confirmation State
    const [serviceToConfirm, setServiceToConfirm] = useState<string | null>(null);
    const [confirmationCountdown, setConfirmationCountdown] = useState(60);
    // FIX: Changed NodeJS.Timeout to number, which is the return type of setInterval in browser environments.
    const countdownIntervalRef = useRef<number | null>(null);


    // Trip Planner State
    const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const [aiRouteSummary, setAiRouteSummary] = useState<string | null>(null);
    const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);
    const tripOriginRef = useRef<Coordinates|null>(null);
    const tripDestinationRef = useRef<Coordinates|null>(null);

    // DERIVED STATE
    const selectedBus = useMemo(() => selectedBusLineId ? busLines[selectedBusLineId] : null, [selectedBusLineId, busLines]);
    const selectedBusDetails = useMemo(() => selectedBusLineId ? BUS_LINE_ADDITIONAL_INFO[selectedBusLineId] : null, [selectedBusLineId]);
    const isTopRankedUser = useMemo(() => currentUser ? currentUser.rank <= 5 : false, [currentUser]);
    const hasAvailableMicromobility = useMemo(() => micromobilityServices.some(s => s.isActive && s.isAvailable && !s.isOccupied), [micromobilityServices]);
    
    const favoriteBusIds = currentUser?.favoriteBusLineIds || [];
    const favoriteBuses = useMemo(() => 
        favoriteBusIds.map(id => busLines[id]).filter(Boolean), 
    [favoriteBusIds, busLines]);

    const otherBuses = useMemo(() => 
        Object.values(busLines).filter(bus => !favoriteBusIds.includes(bus.id)),
    [favoriteBusIds, busLines]);
    
    const availableServices = useMemo(() => 
        micromobilityServices.filter(s => s.isActive && s.isAvailable && !s.isOccupied),
        [micromobilityServices]
    );

    // HANDLERS
    const showNotification = useCallback((message: string, type: 'error' | 'success' | 'info' = 'info') => {
        setNotification({ message, type });
    }, []);

    const handleLogin = (userName: string) => {
        const profile: UserProfile = {
            id: `user-${Date.now()}`,
            name: userName,
            avatar: `https://api.dicebear.com/8.x/bottts/svg?seed=${userName}`,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            tokens: 50000,
            badges: [],
            rank: Math.floor(Math.random() * 100) + 6, // Mock rank outside top 5
            favoriteBusLineIds: [],
        };
        setCurrentUser(profile);
        const baseSimulatedUsers = Math.floor(Math.random() * 20) + 120; // 120-139
        setConnectedUsersCount(baseSimulatedUsers + 1);
        showNotification(t('welcomeMessage', { userName }));
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        setConnectedUsersCount(0);
    };
    const handleSelectBus = (busLineId: string) => {
        setSelectedBusLineId(busLineId);
        audioService.playHighlightSound();
    };

    const handleReportSubmit = (report: Report) => {
        setReports(prev => ({
            ...prev,
            [report.busLineId]: [...(prev[report.busLineId] || []), report],
        }));
        showNotification('Intel transmitido a la red. Gracias por tu aporte.', 'success');
    };

    const handleChatMessageSubmit = (message: ChatMessage) => {
        setChatMessages(prev => ({
            ...prev,
            [message.busLineId]: [...(prev[message.busLineId] || []), message],
        }));
    };
    
    const handleToggleFavoriteBusLine = (busLineId: string) => {
        if (!currentUser) return;
        
        const isFavorite = currentUser.favoriteBusLineIds.includes(busLineId);
        const updatedFavorites = isFavorite
          ? currentUser.favoriteBusLineIds.filter(id => id !== busLineId)
          : [...currentUser.favoriteBusLineIds, busLineId];
          
        setCurrentUser({ ...currentUser, favoriteBusLineIds: updatedFavorites });
    
        const busName = busLines[busLineId]?.lineName || 'La línea';
        showNotification(
            isFavorite ? `${busName} eliminada de favoritos.` : `${busName} añadida a favoritos.`,
            'success'
        );
        audioService.playConfirmationSound();
    };

    const handleReportFromChat = (reportType: ReportType, description: string, busLineId: string) => {
        handleReportSubmit({
            id: `report-chat-${Date.now()}`,
            userId: currentUser?.id || DEFAULT_USER_ID,
            userName: currentUser?.name || DEFAULT_USER_NAME,
            busLineId,
            type: reportType,
            timestamp: Date.now(),
            description,
            upvotes: 0,
            sentiment: 'unknown',
        });
        showNotification(`Reporte rápido de '${reportType}' enviado desde el chat.`, 'info');
    };
    
    const handleSetRoute = useCallback(async (origin: Coordinates, destination: Coordinates, travelMode: TravelMode) => {
        setIsRouteLoading(true);
        setRouteResult(null);
        setAiRouteSummary(null);
        tripOriginRef.current = origin;
        tripDestinationRef.current = destination;
        
        try {
            const result = await fetchRoute(origin, destination, travelMode);
            setRouteResult(result);
            if (result.error) {
                showNotification(result.error, 'error');
            } else {
                setMapCenter(origin);
                setMapZoom(14);
                // Fetch AI summary after route is found
                setIsAiSummaryLoading(true);
                const [originAddr, destAddr] = await Promise.all([
                    getAddressFromCoordinates(origin),
                    getAddressFromCoordinates(destination)
                ]);
                const routeInfo = `Ruta de ${result.distance} en ${result.duration}.`;
                const summary = await getAiRouteSummary(originAddr || 'origen', destAddr || 'destino', routeInfo, 'No hay reportes de la comunidad en esta zona.');
                setAiRouteSummary(summary);
            }
        } catch (e: any) {
            showNotification(e.message, 'error');
        } finally {
            setIsRouteLoading(false);
            setIsAiSummaryLoading(false);
        }
    }, [showNotification]);

    const handleFindRouteToBusStop = useCallback((stopName: string) => {
        if (!userLocation) {
            showNotification("No podemos calcular la ruta porque tu ubicación no está disponible.", "error");
            return;
        }
        if (!selectedBusLineId) {
            showNotification("Selecciona una línea de colectivo primero.", "error");
            return;
        }
        
        const stopsForLine = busStops[selectedBusLineId];
        const targetStop = stopsForLine?.find(s => s.name === stopName);

        if (!targetStop) {
            showNotification(`No se encontraron las coordenadas para la parada: ${stopName}`, "error");
            return;
        }

        showNotification(`Calculando ruta a pie hacia la parada: ${stopName}`, "info");
        handleSetRoute(userLocation, targetStop.location, 'WALK');

    }, [userLocation, selectedBusLineId, busStops, handleSetRoute, showNotification]);

    const handleClearRoute = () => setRouteResult(null);

    const handleMicromobilitySubmit = (formData: any) => {
        if (!currentUser) return;
        if(micromobilityServices.filter(s => s.providerId === currentUser.id).length >= MAX_MICROMOBILITY_SERVICES_PER_PROVIDER) {
            showNotification('Has alcanzado el límite de servicios de micromovilidad.', 'error');
            return;
        }

        const cost = 5000; // Example cost
        if(currentUser.tokens < cost) {
            showNotification('No tienes suficientes Fichas para registrar este servicio.', 'error');
            return;
        }

        const newService: MicromobilityService = {
            id: `ms-${Date.now()}`,
            providerId: currentUser.id,
            providerName: currentUser.name,
            ...formData,
            isActive: false, // Must be activated
            isAvailable: false,
            isOccupied: false,
            isPendingPayment: true,
            rating: 0,
            numberOfRatings: 0,
            totalRatingPoints: 0,
            completedTrips: 0,
            avgPunctuality: 0,
            avgSafety: 0,
            avgCleanliness: 0,
            avgKindness: 0,
            ecoScore: 75, // Mock
            ratingHistory: [],
            subscriptionExpiryTimestamp: Date.now() + formData.subscriptionDurationHours * 3600 * 1000,
        };

        setCurrentUser(prev => prev ? ({...prev, tokens: prev.tokens - cost}) : null);
        setMicromobilityServices(prev => [...prev, newService]);
        showNotification('Servicio registrado. Actívalo desde el panel para que sea visible.', 'success');
        setIsMicromobilityRegisterModalOpen(false);
    };
    
    const handleRequestMicromobility = useCallback((serviceId: string) => {
        if (!currentUser) return;
        
        const service = micromobilityServices.find(s => s.id === serviceId);
        if (!service) return;

        if (service.providerId === currentUser.id) {
            showNotification('No puedes solicitar tu propio servicio.', 'error');
            return;
        }

        setMicromobilityServices(prev => prev.map(s => 
            s.id === serviceId ? { ...s, isOccupied: true, isAvailable: false } : s
        ));

        showNotification(
            `¡Servicio solicitado! Contacta a ${service.providerName} para coordinar.`, 
            'success'
        );
        
        setTimeout(() => {
            const message = `Hola ${service.providerName}, te contacto desde UppA por tu servicio de ${service.type} - ${service.serviceName}.`;
            const whatsappUrl = `https://wa.me/${service.whatsapp}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }, 1000);
    }, [currentUser, micromobilityServices, showNotification]);
    
    const clearCountdown = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const handleInitiateServiceRequest = (serviceId: string) => {
        setServiceToConfirm(serviceId);
        setConfirmationCountdown(60);
    };

    const handleCancelServiceRequest = () => {
        clearCountdown();
        setServiceToConfirm(null);
    };

    useEffect(() => {
        if (serviceToConfirm) {
            countdownIntervalRef.current = setInterval(() => {
                setConfirmationCountdown(prev => {
                    if (prev <= 1) {
                        clearCountdown();
                        handleRequestMicromobility(serviceToConfirm);
                        setServiceToConfirm(null);
                        return 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearCountdown();
        }

        return () => clearCountdown();
    }, [serviceToConfirm, handleRequestMicromobility, clearCountdown]);


    const handleSavePreference = (preference: string) => {
        if (!userPreferences.includes(preference)) {
            setUserPreferences(prev => [...prev, preference]);
            showNotification(`Preferencia guardada: "${preference}"`, 'success');
        }
    };

    const handleUppySubmit = async (text: string) => {
        if (!currentUser) return;
        const userMessage: UppyChatMessage = { role: 'user', text };
        const newHistory = [...uppyChatHistory, userMessage];
        setUppyChatHistory(newHistory);
        setIsUppyLoading(true);

        try {
            const context = `Línea de colectivo actual: ${selectedBus?.lineName || 'Ninguna seleccionada'}.`;

            const relevantReports = (selectedBusLineId ? reports[selectedBusLineId] : []) || [];
            const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
            const recentReports = relevantReports.filter(r => (Date.now() - r.timestamp) < TWO_DAYS_MS);
    
            const formatTimeAgo = (timestamp: number) => {
                const now = Date.now();
                const seconds = Math.floor((now - timestamp) / 1000);
                if (seconds < 60) return `hace segundos`;
                const minutes = Math.floor(seconds / 60);
                if (minutes < 60) return `hace ${minutes} min`;
                const hours = Math.floor(minutes / 60);
                if (hours < 24) return `hace ${hours} hr`;
                const days = Math.floor(hours / 24);
                return `hace ${days} día(s)`;
            };
    
            const reportSummary = recentReports.length > 0
                ? recentReports
                    .slice(-10) 
                    .map(r => `- Reporte de '${r.type}' (Sentimiento: ${r.sentiment}) con descripción "${r.description}". Ocurrió ${formatTimeAgo(r.timestamp)}.`)
                    .join('\n')
                : "No se han registrado reportes de la comunidad en los últimos 2 días.";
            
            const preferencesSummary = userPreferences.length > 0
                ? userPreferences.map(p => `- ${p}`).join('\n')
                : "El usuario no ha especificado preferencias.";

            const instruction = getUppySystemInstruction(currentUser.name, context, reportSummary, preferencesSummary);
            
            const geminiHistory = newHistory.map(m => ({
                role: m.role === 'model' ? 'model' : 'user',
                parts: [{ text: m.text }]
            }));

            const response = await getUppyResponse(instruction, geminiHistory);
            
            const functionCall = response.candidates?.[0]?.content?.parts.find(p => p.functionCall)?.functionCall;

            if (functionCall) {
                const { name, args } = functionCall;
                let functionResponseResult: any;

                if (name === 'getWeatherForLocation' && args.location) {
                    const weather = await getWeatherByLocationName(String(args.location));
                    functionResponseResult = { weather };
                } else if (name === 'saveUserPreference' && args.preference) {
                    const preferenceToSave = String(args.preference);
                    handleSavePreference(preferenceToSave);
                    functionResponseResult = { status: 'success', message: `Preferencia '${preferenceToSave}' guardada.` };
                } else {
                    functionResponseResult = { status: 'error', message: `Función desconocida: ${name}` };
                }

                const funcResponsePart = {
                    functionResponse: {
                        name: name,
                        response: { name: name, content: functionResponseResult }
                    }
                };

                const historyWithFuncCall = [...geminiHistory, response.candidates[0].content, { role: 'function', parts: [funcResponsePart] }];
                const finalResponse = await getUppyResponse(instruction, historyWithFuncCall);
                setUppyChatHistory(prev => [...prev, { role: 'model', text: finalResponse.text }]);
            } else {
                setUppyChatHistory(prev => [...prev, { role: 'model', text: response.text }]);
            }
        } catch (e: any) {
            setUppyChatHistory(prev => [...prev, { role: 'model', text: `Lo siento, estoy teniendo problemas para conectar. ${e.message}` }]);
        } finally {
            setIsUppyLoading(false);
        }
    };
    
    const handleReviewSubmit = async (review: Omit<RatingHistoryEntry, 'userId' | 'timestamp' | 'sentiment'>) => {
        if (!serviceToReview || !currentUser) return;
    
        const sentiment = await analyzeSentiment(review.comment || `Calificación: ${review.overallRating}`);
        
        const newReviewEntry: RatingHistoryEntry = {
            ...review,
            userId: currentUser.id,
            timestamp: Date.now(),
            sentiment,
        };

        setMicromobilityServices(prevServices => prevServices.map(s => {
            if (s.id === serviceToReview.id) {
                const newTotalPoints = s.totalRatingPoints + newReviewEntry.overallRating;
                const newNumberOfRatings = s.numberOfRatings + 1;
                
                const newAvgPunctuality = ((s.avgPunctuality * s.numberOfRatings) + review.scores.punctuality) / newNumberOfRatings;
                const newAvgSafety = ((s.avgSafety * s.numberOfRatings) + review.scores.safety) / newNumberOfRatings;
                const newAvgCleanliness = ((s.avgCleanliness * s.numberOfRatings) + review.scores.cleanliness) / newNumberOfRatings;
                const newAvgKindness = ((s.avgKindness * s.numberOfRatings) + review.scores.kindness) / newNumberOfRatings;

                return {
                    ...s,
                    totalRatingPoints: newTotalPoints,
                    numberOfRatings: newNumberOfRatings,
                    rating: newTotalPoints / newNumberOfRatings,
                    ratingHistory: [...s.ratingHistory, newReviewEntry],
                    avgPunctuality: newAvgPunctuality,
                    avgSafety: newAvgSafety,
                    avgCleanliness: newAvgCleanliness,
                    avgKindness: newAvgKindness,
                };
            }
            return s;
        }));

        showNotification('Evaluación enviada. ¡Gracias por tu feedback!', 'success');
        setIsPostTripReviewModalOpen(false);
        setServiceToReview(null);
    };

    const handleNavigateToPoint = (destination: Coordinates, travelMode: TravelMode) => {
        if (!userLocation) {
            showNotification("No podemos trazar la ruta porque tu ubicación no está disponible.", "error");
            return;
        }
        showNotification(`Trazando ruta al punto de interés...`, "info");
        handleSetRoute(userLocation, destination, travelMode);
    };

    // EFFECTS
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                setUserLocation(coords);
                setMapCenter(coords);
                getWeather(coords).then(setWeatherData);
            },
            () => {
                showNotification('No se pudo obtener tu ubicación. Algunas funciones estarán limitadas.', 'error');
                getWeather(DEFAULT_MAP_CENTER).then(setWeatherData);
            }
        );

        const today = new Date().getDay();
        const dayKey = (today > 0 && today < 6) ? 'Lunes a Viernes' : today === 6 ? 'Sábado' : 'Domingo';
        const scheduleInfo = BUS_LINE_ADDITIONAL_INFO["LINEA_228CB"]?.operatingHours.detailed.find(d => d.days === dayKey);
        if(scheduleInfo) setBusSchedule(scheduleInfo);
        
    }, [showNotification, t]);

    useEffect(() => {
        if (!currentUser) return; 

        const intervalId = setInterval(() => {
            setConnectedUsersCount(prevCount => {
                const fluctuation = Math.floor(Math.random() * 5) - 2;
                const newCount = prevCount + fluctuation;
                return Math.max(1, newCount); 
            });
        }, 5000); 

        return () => clearInterval(intervalId);
    }, [currentUser]);


    // RENDER LOGIC
    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <>
            {notification && <ErrorToast notification={notification} onClose={() => setNotification(null)} />}
            
            <Navbar
                appName={t('appName')}
                currentUser={currentUser}
                onLogout={handleLogout}
                onOpenRanking={() => showNotification("El ranking de pilotos aún está en desarrollo.")}
                connectedUsersCount={connectedUsersCount}
                onFocusUserLocation={() => userLocation && setMapCenter(userLocation)}
                onToggleMicromobilityModal={() => setIsOperatorInsightsModalOpen(true)}
                isTopRanked={isTopRankedUser}
            />

            <main className="main-layout">
                <div className="control-deck overflow-y-auto scrollbar-thin">
                   <div className="ps-card p-4">
                        <div className="flex space-x-2 mb-4">
                            <button 
                                onClick={() => setActiveTab('transport')}
                                className={`ps-button flex-1 ${activeTab === 'transport' ? 'active' : ''}`}
                            >
                                <i className="fas fa-bus-alt mr-2"></i> Transporte Público
                            </button>
                            <button 
                                onClick={() => setActiveTab('pilot')}
                                className={`ps-button flex-1 ${activeTab === 'pilot' ? 'active' : ''}`}
                            >
                               <i className="fas fa-motorcycle mr-2"></i> Mi Flota
                            </button>
                        </div>

                        {activeTab === 'transport' && (
                            <div className="space-y-4 animate-[preloader-fade-in_0.5s_ease-out]">
                                <TripPlanner 
                                    onSetRoute={handleSetRoute}
                                    onClearRoute={handleClearRoute}
                                    routeResult={routeResult}
                                    isRouteLoading={isRouteLoading}
                                    aiRouteSummary={aiRouteSummary}
                                    isAiSummaryLoading={isAiSummaryLoading}
                                    onShowRecentReports={() => showNotification("La visualización de reportes en ruta está en desarrollo.")}
                                />
                                <AvailableServices
                                    services={availableServices}
                                    currentUser={currentUser}
                                    serviceToConfirm={serviceToConfirm}
                                    confirmationCountdown={confirmationCountdown}
                                    onInitiateRequest={handleInitiateServiceRequest}
                                    onCancelRequest={handleCancelServiceRequest}
                                />
                                <PointsOfInterest onNavigate={handleNavigateToPoint} />
                                <div className="space-y-4 mt-4">
                                     {favoriteBuses.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-orbitron text-blue-300 border-b border-blue-500/20 pb-2">⭐ Mis Favoritos</h3>
                                            {favoriteBuses.map((bus) => (
                                                <BusCard
                                                    key={bus.id}
                                                    bus={bus}
                                                    isSelected={selectedBusLineId === bus.id}
                                                    onSelect={() => handleSelectBus(bus.id)}
                                                    onReport={() => setIsReportModalOpen(true)}
                                                    details={selectedBusLineId === bus.id ? selectedBusDetails : null}
                                                    isFavorite={true}
                                                    onToggleFavorite={() => handleToggleFavoriteBusLine(bus.id)}
                                                    onFindRouteToStop={handleFindRouteToBusStop}
                                                >
                                                     {selectedBusLineId === bus.id && (
                                                        <div className="space-y-4">
                                                            <LocationDashboard 
                                                                busLineName={bus.lineName}
                                                                data={{weather: weatherData, reports: reports[bus.id] || [], schedule: busSchedule}}
                                                            />
                                                            <div className="ps-card p-4">
                                                                <h3 className="text-md font-bold text-blue-300 font-orbitron mb-3">Herramientas de Comunicación</h3>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <button onClick={() => setIsChatModalOpen(true)} className="ps-button active py-3 text-base">
                                                                        <i className="fas fa-comments mr-2"></i> Chat de Línea
                                                                    </button>
                                                                    <button onClick={() => setIsUppyModalOpen(true)} className="ps-button active py-3 text-base">
                                                                        <i className="fas fa-robot mr-2"></i> Asistente UppY
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </BusCard>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {favoriteBuses.length > 0 && <h3 className="text-lg font-orbitron text-slate-400 border-b border-slate-700/80 pb-2">Otras Líneas</h3>}
                                        {otherBuses.map((bus) => (
                                            <BusCard
                                                key={bus.id}
                                                bus={bus}
                                                isSelected={selectedBusLineId === bus.id}
                                                onSelect={() => handleSelectBus(bus.id)}
                                                onReport={() => setIsReportModalOpen(true)}
                                                details={selectedBusLineId === bus.id ? selectedBusDetails : null}
                                                isFavorite={false}
                                                onToggleFavorite={() => handleToggleFavoriteBusLine(bus.id)}
                                                onFindRouteToStop={handleFindRouteToBusStop}
                                            >
                                                {selectedBusLineId === bus.id && (
                                                    <div className="space-y-4">
                                                        <LocationDashboard 
                                                            busLineName={bus.lineName}
                                                            data={{weather: weatherData, reports: reports[bus.id] || [], schedule: busSchedule}}
                                                        />
                                                        <div className="ps-card p-4">
                                                            <h3 className="text-md font-bold text-blue-300 font-orbitron mb-3">Herramientas de Comunicación</h3>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <button onClick={() => setIsChatModalOpen(true)} className="ps-button active py-3 text-base">
                                                                    <i className="fas fa-comments mr-2"></i> Chat de Línea
                                                                </button>
                                                                <button onClick={() => setIsUppyModalOpen(true)} className="ps-button active py-3 text-base">
                                                                    <i className="fas fa-robot mr-2"></i> Asistente UppY
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </BusCard>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'pilot' && (
                            <div className="space-y-4 animate-[preloader-fade-in_0.5s_ease-out]">
                                <RankingTable services={micromobilityServices} currentUser={currentUser} />
                                <MicromobilityChat 
                                    isOpen={isMicromobilityPanelOpen}
                                    onToggle={() => setIsMicromobilityPanelOpen(!isMicromobilityPanelOpen)}
                                    hasAvailableServices={hasAvailableMicromobility}
                                    onOpenChat={() => setIsMicromobilityChatModalOpen(true)}
                                />
                                <div className="ps-card p-4 space-y-3">
                                     <h3 className="text-lg font-bold text-blue-300 font-orbitron">Registra tu Servicio de Micromovilidad Moto o Remis</h3>
                                     <button onClick={() => setIsMicromobilityRegisterModalOpen(true)} className="w-full ps-button active">
                                        <i className="fas fa-plus-circle mr-2"></i> Registrar Servicio
                                     </button>
                                     {micromobilityServices.filter(s => s.providerId === currentUser.id).map(service => (
                                         <MicromobilityServiceCard 
                                            key={service.id}
                                            service={service}
                                            isOwnService={true}
                                            currentUser={currentUser}
                                            chatMessages={globalChatMessages}
                                            onSendMessage={(msg) => setGlobalChatMessages(prev => [...prev, msg])}
                                            onConfirmPayment={(serviceId) => {
                                                setMicromobilityServices(prev => prev.map(s => s.id === serviceId ? {...s, isPendingPayment: false, isActive: true, isAvailable: true} : s));
                                                showNotification('¡Servicio activado! Ahora eres visible en el mapa.', 'success');
                                            }}
                                            onToggleAvailability={(serviceId) => {
                                                setMicromobilityServices(prev => prev.map(s => s.id === serviceId ? {...s, isAvailable: !s.isAvailable} : s));
                                            }}
                                            onToggleOccupied={(serviceId) => {
                                                const service = micromobilityServices.find(s=>s.id === serviceId);
                                                if(service && !service.isOccupied){
                                                    setServiceToReview(service);
                                                    setIsPostTripReviewModalOpen(true);
                                                }
                                                 setMicromobilityServices(prev => prev.map(s => s.id === serviceId ? {...s, isOccupied: !s.isOccupied } : s));
                                            }}
                                         />
                                     ))}
                                      {micromobilityServices.filter(s => s.providerId === currentUser.id).length === 0 && (
                                        <p className="text-center text-sm text-slate-400 italic py-4">No tienes servicios registrados.</p>
                                      )}
                                </div>
                            </div>
                        )}
                   </div>
                </div>

                <div className="interactive-display-wrapper ps-card overflow-hidden">
                    {isMapError ? (
                        <MapErrorDisplay errorMessage={isMapError} />
                    ) : (
                        <MapDisplay
                            center={mapCenter}
                            zoom={mapZoom}
                            userLocation={userLocation}
                            busStops={[]}
                            selectedBus={selectedBus}
                            reports={selectedBusLineId ? reports[selectedBusLineId] || [] : []}
                            micromobilityServices={micromobilityServices}
                            routeGeometry={routeResult?.geometry || null}
                            onMapError={setIsMapError}
                            onMapReady={() => setIsMapReady(true)}
                        />
                    )}
                </div>
            </main>

            {/* MODALS */}
            <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Transmitir Intel a la Red">
                {selectedBus && <ReportForm busLineId={selectedBus.id} currentUser={currentUser} onSubmit={handleReportSubmit} onClose={() => setIsReportModalOpen(false)} />}
            </Modal>
            
            {/* CHAT MODAL */}
            {selectedBus && (
                <Modal 
                    isOpen={isChatModalOpen} 
                    onClose={() => setIsChatModalOpen(false)} 
                    title={`Chat de Línea: ${selectedBus.lineName}`}
                >
                    <div style={{ height: '70vh', minHeight: '400px' }}>
                        <ChatWindow
                            busLineId={selectedBus.id}
                            messages={chatMessages[selectedBus.id] || []}
                            currentUser={currentUser}
                            onSendMessage={handleChatMessageSubmit}
                            onSendReportFromChat={handleReportFromChat}
                            onToggleCalculator={() => {
                                setIsChatModalOpen(false);
                                setIsCalculatorModalOpen(true);
                            }}
                        />
                    </div>
                </Modal>
            )}

            {/* UPPY ASSISTANT MODAL */}
            <Modal 
                isOpen={isUppyModalOpen} 
                onClose={() => setIsUppyModalOpen(false)} 
                title="Asistente UppY"
            >
                <div style={{ height: '70vh', minHeight: '400px' }}>
                    <UppyAssistant
                        currentUser={currentUser}
                        chatHistory={uppyChatHistory}
                        isLoading={isUppyLoading}
                        isVoiceEnabled={isVoiceEnabled}
                        onSubmit={handleUppySubmit}
                        onToggleVoice={setIsVoiceEnabled}
                    />
                </div>
            </Modal>
            
            {/* MICROMOBILITY CHAT MODAL */}
            <Modal 
                isOpen={isMicromobilityChatModalOpen} 
                onClose={() => setIsMicromobilityChatModalOpen(false)} 
                title="Nexo Micromovilidad"
            >
                <div style={{ height: '70vh', minHeight: '400px' }}>
                    <MicromobilityChatWindow
                        messages={globalChatMessages}
                        currentUser={currentUser}
                        onSendMessage={(msg) => setGlobalChatMessages(prev => [...prev, msg])}
                    />
                </div>
            </Modal>

            <Modal isOpen={isMicromobilityRegisterModalOpen} onClose={() => setIsMicromobilityRegisterModalOpen(false)} title="Registrar Servicio de Micromovilidad">
                <MicromobilityRegistrationModal currentUser={currentUser} onSubmit={handleMicromobilitySubmit} onClose={() => setIsMicromobilityRegisterModalOpen(false)} />
            </Modal>
            <OperatorInsightsModal isOpen={isOperatorInsightsModalOpen} onClose={() => setIsOperatorInsightsModalOpen(false)} services={micromobilityServices} />
            <CalculatorModal isOpen={isCalculatorModalOpen} onClose={() => setIsCalculatorModalOpen(false)} />
            {serviceToReview && (
              <PostTripReviewModal
                isOpen={isPostTripReviewModalOpen}
                onClose={() => setIsPostTripReviewModalOpen(false)}
                service={serviceToReview}
                currentUser={currentUser}
                onSubmit={handleReviewSubmit}
              />
            )}
            <AccessibilityControls />
        </>
    );
};

export default App;