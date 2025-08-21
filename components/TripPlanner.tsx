import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Coordinates, RouteResult, PlaceAutocompleteSuggestion, TravelMode } from '../types';
import { fetchAutocompleteSuggestions, fetchPlaceDetails } from '../services/geolocationService';
import LoadingSpinner from './LoadingSpinner';

interface TripPlannerProps {
  isGoogleMapsApiLoaded: boolean;
  onSetRoute: (origin: Coordinates, destination: Coordinates, travelMode: TravelMode) => void;
  onClearRoute: () => void;
  onShowRecentReports: () => void;
  routeResult: RouteResult | null;
  isRouteLoading: boolean;
  aiRouteSummary: string | null;
  isAiSummaryLoading: boolean;
}

const TripPlanner: React.FC<TripPlannerProps> = ({ 
    isGoogleMapsApiLoaded, 
    onSetRoute, 
    onClearRoute,
    onShowRecentReports,
    routeResult,
    isRouteLoading,
    aiRouteSummary,
    isAiSummaryLoading,
}) => {
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState<PlaceAutocompleteSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceAutocompleteSuggestion[]>([]);
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [activeInput, setActiveInput] = useState<'origin' | 'destination' | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('DRIVE');

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plannerRef.current && !plannerRef.current.contains(event.target as Node)) {
        setActiveInput(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQueryChange = (
    query: string, 
    type: 'origin' | 'destination'
  ) => {
    if (type === 'origin') {
      setOriginQuery(query);
      setOriginCoords(null);
    } else {
      setDestinationQuery(query);
      setDestinationCoords(null);
    }
    setActiveInput(type);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!query.trim()) {
        if(type === 'origin') setOriginSuggestions([]); else setDestinationSuggestions([]);
        return;
    }

    debounceTimeout.current = setTimeout(async () => {
      const suggestions = await fetchAutocompleteSuggestions(query);
      if (type === 'origin') {
        setOriginSuggestions(suggestions);
      } else {
        setDestinationSuggestions(suggestions);
      }
    }, 300);
  };

  const handleSuggestionClick = async (
    suggestion: PlaceAutocompleteSuggestion,
    type: 'origin' | 'destination'
  ) => {
    const { placeId, text } = suggestion.placePrediction;
    
    if (type === 'origin') {
      setOriginQuery(text.text);
      setOriginSuggestions([]);
    } else {
      setDestinationQuery(text.text);
      setDestinationSuggestions([]);
    }
    setActiveInput(null);

    const details = await fetchPlaceDetails(placeId);
    if (details) {
      if (type === 'origin') {
        setOriginCoords(details.location);
      } else {
        setDestinationCoords(details.location);
      }
    }
  };

  const handleFindRoute = () => {
    if (originCoords && destinationCoords) {
      onSetRoute(originCoords, destinationCoords, travelMode);
    } else {
      alert("Por favor, selecciona un origen y un destino válidos de las sugerencias.");
    }
  };
  
  // Recalculate route when travel mode changes and a route is already set
  useEffect(() => {
    if (originCoords && destinationCoords) {
      handleFindRoute();
    }
  }, [travelMode]);

  const handleClear = () => {
    setOriginQuery('');
    setDestinationQuery('');
    setOriginCoords(null);
    setDestinationCoords(null);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setActiveInput(null);
    onClearRoute();
  };
  
  const SuggestionsList: React.FC<{
    suggestions: PlaceAutocompleteSuggestion[];
    onSelect: (suggestion: PlaceAutocompleteSuggestion) => void;
  }> = ({ suggestions, onSelect }) => (
    <div className="absolute left-0 right-0 mt-1 bg-slate-800 border border-blue-500/50 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto scrollbar-thin">
      <ul role="listbox">
        {suggestions.map((s, index) => (
          <li key={s.placePrediction.placeId + index} role="option" aria-selected="false">
            <button
              onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-blue-900/50"
            >
              {s.placePrediction.text.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  
  const travelModeButtons = [
      { mode: 'DRIVE' as TravelMode, icon: 'fas fa-car', label: 'Auto' },
      { mode: 'BICYCLE' as TravelMode, icon: 'fas fa-bicycle', label: 'Bicicleta' },
      { mode: 'WALK' as TravelMode, icon: 'fas fa-walking', label: 'Caminando' },
  ]

  return (
    <div className="space-y-4" ref={plannerRef}>
      <h2 className="text-2xl font-bold text-blue-300 font-orbitron border-b border-blue-500/20 pb-2">Planificador de Misión</h2>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="origin" className="block text-sm font-medium text-blue-300 mb-1">Origen</label>
          <input
            id="origin"
            type="text"
            className="w-full ps-input"
            placeholder="Ej: Obelisco, Buenos Aires"
            value={originQuery}
            onChange={(e) => handleQueryChange(e.target.value, 'origin')}
            onFocus={() => setActiveInput('origin')}
            autoComplete="off"
            role="combobox"
            aria-expanded={activeInput === 'origin'}
            aria-controls="origin-suggestions"
          />
          {activeInput === 'origin' && originQuery && (
            <div id="origin-suggestions">
                <SuggestionsList suggestions={originSuggestions} onSelect={(s) => handleSuggestionClick(s, 'origin')} />
            </div>
          )}
        </div>
        <div className="relative">
          <label htmlFor="destination" className="block text-sm font-medium text-blue-300 mb-1">Destino</label>
          <input
            id="destination"
            type="text"
            className="w-full ps-input"
            placeholder="Ej: Estación de tren de Tigre"
            value={destinationQuery}
            onChange={(e) => handleQueryChange(e.target.value, 'destination')}
            onFocus={() => setActiveInput('destination')}
            autoComplete="off"
            role="combobox"
            aria-expanded={activeInput === 'destination'}
            aria-controls="destination-suggestions"
          />
          {activeInput === 'destination' && destinationQuery && (
            <div id="destination-suggestions">
                <SuggestionsList suggestions={destinationSuggestions} onSelect={(s) => handleSuggestionClick(s, 'destination')} />
            </div>
          )}
        </div>
      </div>

       <div className="flex justify-center space-x-2 my-3">
            {travelModeButtons.map(btn => (
                <button
                    key={btn.mode}
                    onClick={() => setTravelMode(btn.mode)}
                    className={`ps-button px-4 py-2 flex items-center space-x-2 text-sm ${travelMode === btn.mode ? 'active' : ''}`}
                    title={`Calcular ruta en ${btn.label}`}
                >
                    <i className={btn.icon}></i>
                    <span>{btn.label}</span>
                </button>
            ))}
        </div>

      <div className="flex space-x-2">
        <button
          onClick={handleFindRoute}
          disabled={!originCoords || !destinationCoords || isRouteLoading}
          className="flex-1 ps-button active flex items-center justify-center"
        >
          {isRouteLoading ? <LoadingSpinner size="w-5 h-5"/> : <><i className="fas fa-route mr-2"></i>Buscar Ruta</>}
        </button>
        <button
          onClick={handleClear}
          className="ps-button"
        >
          <i className="fas fa-times"></i> Limpiar
        </button>
      </div>
      
      {(routeResult || isRouteLoading) && (
        <div className="pt-4 border-t border-blue-500/20 space-y-3">
          <h3 className="text-lg font-semibold text-blue-300">Detalles del Viaje</h3>
          {isRouteLoading && !routeResult && <div className="flex justify-center"><LoadingSpinner/></div>}
          {routeResult?.error && <p className="text-red-400 bg-red-900/50 p-2 rounded-md">{routeResult.error}</p>}
          {routeResult?.duration && routeResult?.distance && (
            <div className="flex justify-around text-center bg-slate-900/50 p-2 rounded-md">
                <div>
                    <p className="text-xs text-gray-400">Duración</p>
                    <p className="font-bold text-white"><i className="fas fa-clock mr-1 text-blue-400"></i>{routeResult.duration}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400">Distancia</p>
                    <p className="font-bold text-white"><i className="fas fa-road mr-1 text-blue-400"></i>{routeResult.distance}</p>
                </div>
            </div>
          )}

          <div className="space-y-2">
             <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold text-blue-300">Resumen IA</h4>
                <button
                    onClick={onShowRecentReports}
                    className="text-xs ps-button"
                    title="Ver los últimos reportes de la comunidad"
                >
                    <i className="fas fa-list-alt mr-2"></i> Reportes
                </button>
            </div>
             {isAiSummaryLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <LoadingSpinner size="w-4 h-4" />
                    <span>Analizando condiciones del viaje...</span>
                </div>
            )}
            {aiRouteSummary && !isAiSummaryLoading && (
                 <div className="p-3 bg-indigo-900/40 border-l-4 border-indigo-500 rounded-r-md">
                    <p className="text-sm text-gray-200 whitespace-pre-wrap">{aiRouteSummary}</p>
                 </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;