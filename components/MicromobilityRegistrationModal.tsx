

import React, { useState, useCallback } from 'react';
import { MicromobilityServiceType, UserProfile, Coordinates } from '../types';
import { MICROMOBILITY_PRICING, MICROMOBILITY_TERMS_CONTENT } from '../constants';
import { getAddressFromCoordinates } from '../services/geolocationService';

type RegistrationFormData = {
  serviceName: string;
  type: MicromobilityServiceType;
  vehicleModel: string;
  vehicleColor: string;
  whatsapp: string;
  location: Coordinates;
  address: string;
  petsAllowed: boolean;
  subscriptionDurationHours: number;
}

interface MicromobilityRegistrationModalProps {
  currentUser: UserProfile;
  onSubmit: (formData: RegistrationFormData) => void;
  onClose: () => void;
}

const getCurrentLocationPromise = (): Promise<Coordinates | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn(`Error getting location (Code ${error.code}): ${error.message}`);
        resolve(null);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
};

const TermsAndConditions: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="border border-blue-500/30 rounded-lg p-3 mb-5">
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="w-full flex justify-between items-center text-left text-blue-300 hover:text-blue-200"
            >
                <h3 className="font-semibold text-lg">{MICROMOBILITY_TERMS_CONTENT.title}</h3>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isVisible ? 'rotate-180' : ''}`}></i>
            </button>
            {isVisible && (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {MICROMOBILITY_TERMS_CONTENT.sections.map(section => (
                        <div key={section.title} className="flex items-start gap-3">
                           <i className={`fas ${section.icon} text-blue-400 mt-1 w-5 text-center`}></i>
                           <div>
                            <h4 className="font-semibold text-white">{section.title}</h4>
                            <p>{section.content}</p>
                           </div>
                        </div>
                    ))}
                    <p className="font-semibold text-center pt-3 border-t border-blue-500/20">{MICROMOBILITY_TERMS_CONTENT.conclusion}</p>
                </div>
            )}
        </div>
    )
}

const MicromobilityRegistrationModal: React.FC<MicromobilityRegistrationModalProps> = ({ currentUser, onSubmit, onClose }) => {
  const [serviceName, setServiceName] = useState('');
  const [type, setType] = useState<MicromobilityServiceType>(MicromobilityServiceType.Moto);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [subscriptionDurationHours, setSubscriptionDurationHours] = useState<number | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    setLocationError(null);
    setLocation(null);
    setAddress(null);
    const coords = await getCurrentLocationPromise();
    if (coords) {
      setLocation(coords);
      try {
        const fetchedAddress = await getAddressFromCoordinates(coords);
        setAddress(fetchedAddress);
      } catch (error) {
        setAddress("No se pudo obtener la dirección.");
      }
    } else {
      setLocationError("No se pudo obtener la ubicación. Asegúrate de tener los permisos activados.");
    }
    setIsFetchingLocation(false);
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceName.trim() || !vehicleModel.trim() || !vehicleColor.trim() || !whatsapp.trim()) {
      alert("Por favor, completa todos los campos del vehículo y contacto.");
      return;
    }
    if (!location || !address) {
      alert("Por favor, establece la ubicación base de tu servicio.");
      return;
    }
    if (subscriptionDurationHours === null) {
      alert("Por favor, selecciona un abono de tiempo para la publicación.");
      return;
    }
    setIsSubmitting(true);

    const formData: RegistrationFormData = {
      serviceName: serviceName.trim(),
      type,
      vehicleModel: vehicleModel.trim(),
      vehicleColor: vehicleColor.trim(),
      whatsapp: whatsapp.trim().replace(/\D/g, ''),
      location,
      address,
      petsAllowed,
      subscriptionDurationHours,
    };
    
    onSubmit(formData);
    setIsSubmitting(false);
  }, [serviceName, type, vehicleModel, vehicleColor, whatsapp, location, address, petsAllowed, subscriptionDurationHours, onSubmit]);

  const currentPrice = subscriptionDurationHours ? MICROMOBILITY_PRICING[type][subscriptionDurationHours] : null;
  const hasEnoughTokens = currentPrice !== null ? currentUser.tokens >= currentPrice : true;


  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-gray-200">
      <TermsAndConditions />

      <div>
        <label htmlFor="serviceName" className="block text-sm font-medium text-teal-300 mb-1">Nombre del Servicio</label>
        <input
          id="serviceName" type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)}
          className="w-full p-3 ps-input"
          placeholder="Ej: Moto Rápida Juan, Remis Express" required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="serviceType" className="block text-sm font-medium text-teal-300 mb-1">Tipo de Vehículo</label>
          <select
            id="serviceType" value={type}
            onChange={(e) => {
                setType(e.target.value as MicromobilityServiceType);
                setSubscriptionDurationHours(null); // Reset subscription on type change
            }}
            className="w-full p-3 ps-input"
          >
            {Object.values(MicromobilityServiceType).map(item => (
              <option key={item} value={item} className="bg-slate-800">{item}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="vehicleModel" className="block text-sm font-medium text-teal-300 mb-1">Modelo</label>
          <input
            id="vehicleModel" type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)}
            className="w-full p-3 ps-input"
            placeholder="Ej: Honda Wave / Toyota Corolla" required
          />
        </div>
        <div>
          <label htmlFor="vehicleColor" className="block text-sm font-medium text-teal-300 mb-1">Color</label>
          <input
            id="vehicleColor" type="text" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)}
            className="w-full p-3 ps-input"
            placeholder="Ej: Rojo" required
          />
        </div>
         <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-teal-300 mb-1">WhatsApp</label>
          <input
            id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full p-3 ps-input"
            placeholder="Ej: 1122334455" required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-teal-300 mb-2">Opciones Adicionales</label>
          <button
            type="button"
            onClick={() => setPetsAllowed(!petsAllowed)}
            className={`w-full p-3 ps-button flex items-center justify-center space-x-3 ${petsAllowed ? 'active' : ''}`}
          >
            <i className={`fas fa-paw transition-colors ${petsAllowed ? 'text-cyan-300' : 'text-slate-500'}`}></i>
            <span>{petsAllowed ? 'Mascotas Bienvenidas' : 'No se admiten mascotas'}</span>
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-teal-300 mb-2">Seleccione Abono de Tiempo para Publicación</label>
        <div className="space-y-2">
            {Object.entries(MICROMOBILITY_PRICING[type]).map(([hours, price]) => (
                 <button
                    type="button"
                    key={`${type}-${hours}`}
                    onClick={() => setSubscriptionDurationHours(Number(hours))}
                    className={`w-full flex justify-between items-center p-3 rounded-lg border-2 transition-all duration-200 
                                ${subscriptionDurationHours === Number(hours) 
                                    ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_10px_var(--ps-glow-soft)]' 
                                    : 'bg-slate-800/60 hover:bg-slate-700/80 border-slate-700 hover:border-blue-500/50'}`
                    }
                >
                    <span className="font-semibold text-white">{Number(hours)} HORA{Number(hours) > 1 ? 'S' : ''}</span>
                    <span className="font-orbitron text-yellow-400 text-lg">
                        <i className="fas fa-coins mr-2 opacity-80"></i>
                        {price.toLocaleString('es-AR')}
                    </span>
                </button>
            ))}
        </div>
        {currentPrice !== null && !hasEnoughTokens && (
             <p className="text-sm text-center mt-3 p-2 bg-red-900/50 rounded-md border border-red-700">
                No tienes suficientes Fichas para este abono. Necesitas {currentPrice.toLocaleString('es-AR')}, tienes {currentUser.tokens.toLocaleString('es-AR')}.
             </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-teal-300 mb-1">Ubicación Base del Servicio</label>
        <button
            type="button"
            onClick={handleGetLocation}
            disabled={isFetchingLocation}
            className="w-full mb-2 ps-button flex items-center justify-center"
        >
            {isFetchingLocation ? (
                <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Obteniendo...</>
            ) : (
                <><i className="fas fa-map-marker-alt mr-2"></i> Usar Ubicación Actual</>
            )}
        </button>
        {isFetchingLocation && !location && <p className="text-xs text-yellow-400">Obteniendo coordenadas...</p>}
        {location && !address && <p className="text-xs text-yellow-400">Coordenadas obtenidas. Obteniendo dirección...</p>}
        {location && address && <p className="text-xs text-green-400">Ubicación establecida: {address}</p>}
        {locationError && <p className="text-xs text-red-400 mt-1">{locationError}</p>}
        <p className="text-xs text-slate-400 mt-1">Esta será tu ubicación de partida. La visibilidad en mapa requiere activación.</p>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="ps-button"
        >
            Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isFetchingLocation || !location || subscriptionDurationHours === null || !hasEnoughTokens}
          title={!hasEnoughTokens ? `No tienes suficientes Fichas.` : !location || subscriptionDurationHours === null ? 'Completa todos los campos requeridos.' : 'Registrar Mi Servicio'}
          className="ps-button active flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registrando...
            </>
          ) : (
            <>
              <i className="fas fa-plus-circle mr-2"></i> Registrar Mi Servicio
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default MicromobilityRegistrationModal;