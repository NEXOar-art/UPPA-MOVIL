
import React, { useState, useEffect } from 'react';
import { BusIcon } from './icons'; 
import { UserProfile, BadgeId } from '../types';
import { BADGE_DEFINITIONS } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface NavbarProps {
  appName: string;
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenRanking: () => void;
  connectedUsersCount: number;
  onFocusUserLocation: () => void;
  onToggleMicromobilityModal: () => void;
  isTopRanked: boolean;
}

const DateTimeDisplay: React.FC = () => {
  const { language } = useSettings();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const locale = language === 'en' ? 'en-US' : 'es-AR';

  const timeString = currentDateTime.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateString = currentDateTime.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="text-center text-sm text-slate-400 space-x-2 hidden md:flex items-center">
       <i className="far fa-clock mr-2 opacity-70 text-cyan-400"></i>
      <span className='font-mono tracking-widest'>{timeString}</span>
      <span className="opacity-50">|</span>
      <span className='font-mono'>{dateString}</span>
    </div>
  );
};

const XPBar: React.FC<{ xp: number; xpToNextLevel: number }> = ({ xp, xpToNextLevel }) => {
    const percentage = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;
    return (
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 border border-cyan-500/30 overflow-hidden" title={`${xp} / ${xpToNextLevel} XP`}>
            <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_4px_theme(colors.cyan.500)]"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};


const Navbar: React.FC<NavbarProps> = ({ appName, currentUser, onLogout, onOpenRanking, connectedUsersCount, onFocusUserLocation, onToggleMicromobilityModal, isTopRanked }) => {
  const { t } = useSettings();
  return (
    <nav className="bg-slate-900/70 backdrop-blur-md border-b border-blue-500/30 p-3 sticky top-0 z-30 shadow-lg shadow-blue-500/5">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <BusIcon className="w-10 h-10 text-cyan-400" style={{filter: 'drop-shadow(0 0 5px var(--ps-cyan))'}} />
          <div>
            <h1 className="text-2xl font-bold text-cyan-300 font-audiowide">{appName}</h1>
            <p className="text-xs text-cyan-500/80 hidden md:block tracking-widest">{t('appSubtitle')}</p>
          </div>
          <button
            onClick={onFocusUserLocation}
            className="ps-button ps-button-glow-effect p-2.5 ml-2"
            title={t('myLocation')}
            aria-label={t('myLocation')}
          >
            <i className="fas fa-crosshairs"></i>
          </button>
          <button
            onClick={onToggleMicromobilityModal}
            className="ps-button p-2.5"
            title={t('micromobility')}
            aria-label={t('micromobility')}
          >
            <i className="fas fa-motorcycle"></i>
          </button>
        </div>
        
        <DateTimeDisplay />

        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="text-center text-sm text-slate-300 flex items-center space-x-2" title={t('connectedPilots')}>
              <i className="fas fa-users text-cyan-400"></i>
              <span className="font-semibold font-mono">{connectedUsersCount}</span>
          </div>
          {currentUser && (
            <>
              <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 pr-3 rounded-full border border-slate-700">
                <img src={currentUser.avatar} alt="User Avatar" className="w-9 h-9 rounded-full bg-cyan-500/20 p-0.5 border-2 border-slate-600"/>
                <div className="hidden lg:block w-32">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-sm text-slate-300 truncate">{currentUser.name}</span>
                    <span className="font-bold text-xs text-cyan-400 font-orbitron">Nvl {currentUser.level}</span>
                  </div>
                  <XPBar xp={currentUser.xp} xpToNextLevel={currentUser.xpToNextLevel} />
                </div>
                <div className="flex items-center space-x-1.5" title="Insignias Obtenidas">
                  {currentUser.badges.slice(0, 3).map(badgeId => {
                      const badge = BADGE_DEFINITIONS[badgeId as BadgeId];
                      if (!badge) return null;
                      return (
                          <i 
                              key={badgeId}
                              className={`${badge.icon} text-slate-400 hover:text-cyan-300 transition-colors text-sm`}
                              title={`${badge.name}: ${badge.description}`}
                          ></i>
                      );
                  })}
                  {currentUser.badges.length > 3 && (
                      <span className="text-xs text-slate-500" title={`+${currentUser.badges.length - 3} más insignias`}>
                          ...
                      </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-yellow-400" title={`${currentUser.tokens} Fichas`}>
                    {isTopRanked && <i title="Piloto de Élite (Top 5)" className="fas fa-crown rank-glow text-lg text-yellow-400"></i>}
                    <i className="fas fa-coins text-sm"></i>
                    <span className="font-mono font-bold text-sm">{currentUser.tokens}</span>
                </div>
              </div>
              <button onClick={onOpenRanking} className="ps-button p-2.5" title={t('pilotRanking')}>
                <i className="fas fa-trophy"></i>
              </button>
              <button onClick={onLogout} className="ps-button p-2.5" title={t('logout')}>
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
