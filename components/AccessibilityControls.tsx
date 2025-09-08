
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const AccessibilityControls: React.FC = () => {
  const { theme, setTheme, fontSize, setFontSize, language, setLanguage, t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const increaseFontSize = () => setFontSize(prev => Math.min(22, prev + 1));
  const decreaseFontSize = () => setFontSize(prev => Math.max(12, prev - 1));

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-cyan-500/80 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300"
        aria-label="Open accessibility settings"
      >
        <i className="fas fa-universal-access text-2xl"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 ps-card p-4 w-64 animate-[preloader-fade-in_0.3s_ease-out]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-cyan-300 font-orbitron">{t('accessibilitySettings')}</h3>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close accessibility settings">
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-blue-300 mb-1">{t('theme')}</label>
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-md">
            {(['dark', 'light', 'high-contrast'] as const).map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`flex-1 text-xs py-1 rounded transition-colors ${theme === th ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
              >
                {t(`theme-${th}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-blue-300 mb-1">{t('fontSize')}</label>
          <div className="flex items-center space-x-2">
            <button onClick={decreaseFontSize} className="ps-button w-10 h-10">-</button>
            <div className="flex-1 text-center font-mono bg-slate-800/50 py-1 rounded">{fontSize}px</div>
            <button onClick={increaseFontSize} className="ps-button w-10 h-10">+</button>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-blue-300 mb-1">{t('language')}</label>
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-md">
            {(['es', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 text-sm py-1 rounded transition-colors ${language === lang ? 'bg-cyan-500 text-white' : 'hover:bg-slate-700'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityControls;
