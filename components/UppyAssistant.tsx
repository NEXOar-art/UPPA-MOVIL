import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UppyChatMessage, UserProfile } from '../types';

interface UppyAssistantProps {
  currentUser: UserProfile;
  chatHistory: UppyChatMessage[];
  isLoading: boolean;
  isVoiceEnabled: boolean;
  onSubmit: (text: string) => void;
  onToggleVoice: (enabled: boolean) => void;
}

const UppyAssistant: React.FC<UppyAssistantProps> = ({
  currentUser,
  chatHistory,
  isLoading,
  isVoiceEnabled,
  onSubmit,
  onToggleVoice
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (isInputActive) {
        inputRef.current?.focus();
    }
  }, [isInputActive]);

  useEffect(() => {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage?.role === 'model' && isVoiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(lastMessage.text);
        utterance.lang = 'es-AR';
        window.speechSynthesis.speak(utterance);
    }
  }, [chatHistory, isVoiceEnabled]);
  
  const handleListen = useCallback(() => {
    if (!isSpeechSupported || isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'es-AR';
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = (event: any) => setIsListening(false);

    recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        onSubmit(transcript);
    };

    recognitionRef.current.start();
  }, [isSpeechSupported, isListening, onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSubmit(inputText);
      setInputText('');
      setIsInputActive(false);
    }
  };
  
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
        if (!document.activeElement?.closest('.uppy-input-container')) {
            if (!inputText.trim()) {
                setIsInputActive(false);
            }
        }
    }, 100);
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
        <div className="flex-grow p-1 space-y-3 overflow-y-auto">
            {chatHistory.length === 0 && (
                <div className="text-center text-slate-400 p-4">
                    <i className="fas fa-robot text-4xl mb-3 text-cyan-400"></i>
                    <p className="font-semibold">Hola, {currentUser.name}. Soy UppY.</p>
                    <p className="text-sm">Tu asistente de viaje. ¿Cómo puedo ayudarte hoy?</p>
                </div>
            )}
            {chatHistory.map((msg, index) => (
                 <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-lg border relative
                    ${msg.role === 'user' 
                        ? 'bg-cyan-900/40 border-cyan-500/50' 
                        : 'bg-indigo-900/40 border-indigo-500/50'}`
                    }>
                         <p className="text-sm break-words text-slate-200">{msg.text}</p>
                    </div>
                </div>
            ))}
             {isLoading && (
                 <div className="flex justify-start">
                     <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-lg border bg-indigo-900/40 border-indigo-500/50">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                        </div>
                     </div>
                 </div>
             )}
            <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="pt-3 mt-auto uppy-input-container">
            {!isInputActive ? (
                 <button onClick={() => setIsInputActive(true)} className="w-full text-left p-3 ps-input bg-transparent border-slate-700/80 hover:border-blue-500 flex items-center h-[42px]">
                    <span className="text-slate-400">Pregúntale a UppY...</span>
                    <i className="fas fa-paper-plane ml-auto text-slate-500"></i>
                </button>
            ) : (
                <div className="flex items-center space-x-2">
                     <button type="button" onClick={() => onToggleVoice(!isVoiceEnabled)} title={isVoiceEnabled ? "Desactivar voz" : "Activar voz"}
                        className={`ps-button h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center ${isVoiceEnabled ? 'active' : ''}`}>
                        <i className={`fas ${isVoiceEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                    </button>
                     <button type="button" onClick={handleListen} disabled={!isSpeechSupported || isListening} title="Entrada de voz"
                        className={`ps-button h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center ${isListening ? 'ps-button-glow-effect' : ''}`}>
                        <i className="fas fa-microphone"></i>
                    </button>
                    <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onBlur={handleInputBlur}
                        placeholder={isListening ? "Escuchando..." : "Pregúntale a UppY..."}
                        className="flex-grow ps-input" disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !inputText.trim()}
                        className="ps-button active h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center">
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            )}
        </form>
    </div>
  );
};

export default UppyAssistant;