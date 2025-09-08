
import React, { useState } from 'react';
import { BusIcon } from './icons'; 
import { useSettings } from '../contexts/SettingsContext';

interface LoginPageProps {
  onLogin: (userName: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { t } = useSettings();
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (userName.trim()) {
      setIsLoading(true);
      // Simulate network request for login
      setTimeout(() => {
        onLogin(userName.trim());
        // No need to setIsLoading(false) here as the component will unmount
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-ps-dark-bg flex flex-col items-center justify-center p-4">
      <div className="ps-card p-8 md:p-12 w-full max-w-md text-center">
        <BusIcon className="w-24 h-24 text-cyan-400 mx-auto mb-6" style={{filter: 'drop-shadow(0 0 10px var(--ps-cyan))'}} />
        <h1 className="text-5xl font-bold text-cyan-400 mb-3 font-audiowide">
          {t('appName')}
        </h1>
        <p className="text-slate-400 mb-8 text-lg font-orbitron">
          {t('loginPageTitle')}
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="sr-only">
              {t('loginPlaceholder')}
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-4 ps-input text-lg text-center"
              placeholder={t('loginPlaceholder')}
              required
              aria-label="Indicativo de Piloto"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !userName.trim()}
            className="w-full p-4 ps-button active text-lg tracking-widest"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('loginConnecting')}
              </span>
            ) : (
              t('loginButton')
            )}
          </button>
        </form>
         <p className="text-xs text-slate-600 mt-8">
            {t('loginDisclaimer')}
        </p>
      </div>
       <footer className="text-center p-4 text-xs text-slate-700 mt-8">
        UppA &copy; {new Date().getFullYear()}. Una simulación para fines de demostración.
      </footer>
    </div>
  );
};

export default LoginPage;
