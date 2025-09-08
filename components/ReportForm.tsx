

import React, { useState, useCallback, useRef } from 'react';
import { ReportType, Report, UserProfile, Coordinates } from '../types'; // Added Coordinates
import { REPORT_TYPE_ICONS, DEFAULT_USER_ID, DEFAULT_USER_NAME, REPORT_FORM_EMOJIS, REPORT_TYPE_TRANSLATIONS } from '../constants';
import { analyzeSentiment } from '../services/geminiService';

interface ReportFormProps {
  busLineId: string;
  currentUser: UserProfile;
  onSubmit: (report: Report) => void;
  onClose: () => void;
}

// Helper to get current location as a Promise
const getCurrentLocation = (): Promise<Coordinates | null> => {
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
        console.warn(`Error getting location in ReportForm (Code ${error.code}): ${error.message}`);
        resolve(null); // Resolve with null on error, so form submission can continue
      },
      { timeout: 5000 } // Add a timeout to avoid blocking indefinitely
    );
  });
};


const ReportForm: React.FC<ReportFormProps> = ({ busLineId, currentUser, onSubmit, onClose }) => {
  const [reportType, setReportType] = useState<ReportType>(ReportType.Delay);
  const [description, setDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setDescription(prevDescription => prevDescription + emoji);
    descriptionTextareaRef.current?.focus();
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!description.trim()) {
      alert("Por favor, ingresa una descripción para el reporte.");
      return;
    }
    setIsSubmitting(true);

    const userLocation = await getCurrentLocation(); // Get location
    const sentiment = await analyzeSentiment(description);

    const newReport: Report = {
      id: `report-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId: currentUser.id || DEFAULT_USER_ID,
      userName: currentUser.name || DEFAULT_USER_NAME,
      busLineId,
      type: reportType,
      timestamp: Date.now(),
      description,
      location: userLocation || undefined, // Add location if available
      details: photoBase64 && reportType === ReportType.SafetyIncident ? { photoBase64 } : undefined,
      upvotes: 0,
      sentiment,
    };
    
    onSubmit(newReport);
    setIsSubmitting(false);
    onClose();
  }, [description, reportType, busLineId, currentUser, photoBase64, onSubmit, onClose]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-200">
      <div>
        <label htmlFor="reportType" className="block text-sm font-medium text-blue-300 mb-1">
          Tipo de Intel
        </label>
        <select
          id="reportType"
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="w-full p-3 ps-input"
        >
          {Object.values(ReportType).map((type) => (
            <option key={type} value={type} className="bg-slate-800">
              {/* FIX: Cast `type` to `ReportType` to correctly index `REPORT_TYPE_ICONS`. `Object.values` on a string enum returns `string[]`, which is not specific enough for indexing. */}
              <i className={`${REPORT_TYPE_ICONS[type as ReportType] || 'fas fa-info-circle'} mr-2 w-4 inline-block text-center`}></i> {REPORT_TYPE_TRANSLATIONS[type as ReportType] || type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-blue-300 mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          ref={descriptionTextareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full p-3 ps-input"
          placeholder="Ej: El colectivo está demorado más de 20 minutos en Av. Corrientes."
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-blue-300 mb-2">
            Añadir Emoji Rápido:
        </label>
        <div className="flex flex-wrap gap-2">
            {REPORT_FORM_EMOJIS.map(item => (
                <button
                    type="button" 
                    key={item.emoji}
                    title={item.description}
                    onClick={() => handleEmojiClick(item.emoji)}
                    className="p-2 rounded-md text-xl bg-slate-700/50 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Añadir emoji ${item.description}`}
                >
                    {item.emoji}
                </button>
            ))}
        </div>
      </div>


      {reportType === ReportType.SafetyIncident && (
        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-blue-300 mb-1">
            Adjuntar Holo-scan (Opcional)
          </label>
          <input
            type="file"
            id="photo"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:ps-button"
          />
          {photoBase64 && (
            <div className="mt-2">
              <img src={photoBase64} alt="Previsualización" className="max-h-40 rounded-md border border-gray-600" />
            </div>
          )}
        </div>
      )}
      
      <div className="flex justify-end space-x-3 pt-2">
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
          disabled={isSubmitting}
          className="ps-button active flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Transmitiendo...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-2"></i> Transmitir Intel
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ReportForm;