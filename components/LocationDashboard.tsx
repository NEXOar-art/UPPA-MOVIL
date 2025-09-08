import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Report, ScheduleDetail } from '../types';
import { REPORT_TYPE_TRANSLATIONS } from '../constants';

interface MissionBriefingCarouselProps {
  busLineName: string;
  data: {
    weather: { condition: string; temp: number; icon: string; };
    reports: Report[];
    schedule: ScheduleDetail | null;
  };
}

// Helper to shuffle array for random display order
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) return "ahora mismo";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  return `hace ${hours} h`; // Should not be reached with 10min filter, but good fallback.
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};


const MissionBriefingCarousel: React.FC<MissionBriefingCarouselProps> = ({ data, busLineName }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = useMemo(() => {
    const baseSlides = [];
    
    baseSlides.push({
      id: 'weather',
      icon: data.weather.icon,
      iconColor: 'text-yellow-300',
      title: 'Clima Actual',
      content: (
        <>
          <p className="text-5xl font-bold text-white text-glow-pulse">{data.weather.temp}°C</p>
          <p className="text-slate-300">{data.weather.condition}</p>
        </>
      )
    });

    if (data.schedule) {
      baseSlides.push({
        id: 'schedule',
        icon: 'fas fa-clock',
        iconColor: 'text-green-300',
        title: 'Horarios Línea',
        content: (
          <>
            <p className="text-3xl font-bold text-white text-glow-pulse">{data.schedule.frequency}</p>
            <p className="text-slate-300">{data.schedule.days}</p>
          </>
        )
      });
    }
    
    // --- DYNAMIC INTEL SLIDES ---
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const recentReports = data.reports.filter(r => (Date.now() - r.timestamp) < TEN_MINUTES_MS);

    if (recentReports.length > 0) {
        recentReports.forEach(report => {
            baseSlides.push({
                id: `intel-${report.id}`,
                icon: 'fas fa-satellite-dish',
                iconColor: 'text-purple-300',
                title: 'Intel de Campo Reciente',
                content: (
                    <div className="h-full w-full flex flex-col items-center justify-center">
                        <div className="text-center">
                            <p className="text-lg font-bold text-white text-glow-pulse">{REPORT_TYPE_TRANSLATIONS[report.type] || report.type}</p>
                            <p className="text-sm text-slate-200 px-2 leading-tight italic mt-1">"{truncateText(report.description, 70)}"</p>
                        </div>
                        <div className="flex justify-between w-full text-xs text-slate-400 px-2 mt-auto">
                            <span>{busLineName}</span>
                            <span>{formatRelativeTime(report.timestamp)}</span>
                        </div>
                    </div>
                )
            });
        });
    } else {
        baseSlides.push({
          id: 'intel-fallback',
          icon: 'fas fa-satellite-dish',
          iconColor: 'text-purple-300',
          title: 'Intel de Campo',
          content: (
            <>
              <p className="text-5xl font-bold text-white text-glow-pulse">{data.reports.length}</p>
              <p className="text-slate-300">Reportes Totales</p>
            </>
          )
        });
    }
    // --- END DYNAMIC INTEL SLIDES ---

    baseSlides.push({
      id: 'emergency',
      icon: 'fas fa-phone-alt',
      iconColor: 'text-red-400',
      title: 'Emergencias',
      content: (
        <>
          <p className="text-6xl font-orbitron text-red-300 text-glow-pulse">911</p>
          <p className="text-slate-400">Canal Directo</p>
        </>
      )
    });

    baseSlides.push({
      id: 'bomberos_campana',
      icon: 'fas fa-fire-extinguisher',
      iconColor: 'text-orange-400',
      title: 'Bomberos Campana',
      content: (
        <>
          <p className="text-4xl font-orbitron text-orange-300 text-glow-pulse">42-2677</p>
          <p className="text-slate-400">(03489)</p>
        </>
      )
    });

    baseSlides.push({
        id: 'ad',
        icon: 'fas fa-bullhorn',
        iconColor: 'text-lime-300',
        title: 'Anunciantes',
        content: (
          <>
            <p className="text-xl font-bold text-lime-200">Espacio Disponible</p>
            <p className="text-xs text-slate-400 mt-1">Contacta para anunciar tu marca en la red.</p>
          </>
        )
    });

    return shuffleArray(baseSlides);
  }, [data, busLineName]);

  const startRotation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 7000);
  };

  useEffect(() => {
    // Reset slide index when slides change to prevent out-of-bounds error
    setCurrentSlide(0);
    if(slides.length > 1) {
        startRotation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides]);

  const pauseRotation = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  
  const handleDotClick = (index: number) => {
      setCurrentSlide(index);
      startRotation();
  }

  return (
    <div 
        className="mission-carousel"
        onMouseEnter={pauseRotation}
        onMouseLeave={startRotation}
    >
      <div 
        className="carousel-track" 
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="carousel-slide">
            <div className="slide-header">
              <i className={`${slide.icon} ${slide.iconColor} icon-glow-pulse`}></i>
              <span>{slide.title}</span>
            </div>
            <div className="slide-content">
              {slide.content}
            </div>
          </div>
        ))}
      </div>
      <div className="carousel-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
            aria-label={`Ir a la diapositiva ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default MissionBriefingCarousel;