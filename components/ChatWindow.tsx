import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, UserProfile, ReportType, Coordinates } from '../types';
import { CHAT_EMOJIS, DEFAULT_USER_ID, DEFAULT_USER_NAME, CHAT_ACTION_ICONS, SUBE_URL } from '../constants';
import { analyzeSentiment, draftChatResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface ChatWindowProps {
  busLineId: string;
  messages: ChatMessage[];
  currentUser: UserProfile;
  onSendMessage: (message: ChatMessage) => void;
  onSendReportFromChat: (reportType: ReportType, description: string, busLineId: string) => void;
  onToggleCalculator: () => void;
}

const getCurrentChatLocation = (): Promise<Coordinates | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ busLineId, messages, currentUser, onSendMessage, onSendReportFromChat, onToggleCalculator }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [aiDraftSuggestion, setAiDraftSuggestion] = useState<string | null>(null);
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isInputActive) {
      inputRef.current?.focus();
    }
  }, [isInputActive]);

  const handleSendMessage = useCallback(async () => {
    let finalMessageText = newMessage.trim();
    if (!finalMessageText && !selectedEmoji && !attachedImageName) return;
    
    setIsSending(true);

    if (attachedImageName) {
      finalMessageText = `${finalMessageText} [Imagen: ${attachedImageName}]`.trim();
    }

    const textForSentiment = selectedEmoji ? `${selectedEmoji} ${finalMessageText}` : finalMessageText;
    const sentiment = await analyzeSentiment(textForSentiment || "emoji_only");

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId: currentUser.id || DEFAULT_USER_ID,
      userName: currentUser.name || DEFAULT_USER_NAME,
      busLineId,
      timestamp: Date.now(),
      text: finalMessageText, 
      emoji: selectedEmoji || undefined,
      sentiment,
    };

    onSendMessage(chatMessage);

    const emojiAction = CHAT_EMOJIS.find(e => e.emoji === selectedEmoji);
    if (emojiAction && emojiAction.type) {
        onSendReportFromChat(emojiAction.type, `${emojiAction.description}: ${finalMessageText || emojiAction.description}`, busLineId);
    }

    setNewMessage('');
    setSelectedEmoji(null);
    setAttachedImageName(null);
    setAiDraftSuggestion(null);
    setAiDraftError(null);
    setShowEmojiPicker(false);
    setIsInputActive(false);
    setIsSending(false);
  }, [newMessage, selectedEmoji, attachedImageName, currentUser, busLineId, onSendMessage, onSendReportFromChat]);
  
  const getSentimentNeonColor = (sentiment?: 'positive' | 'negative' | 'neutral' | 'unknown') => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 [text-shadow:0_0_4px_theme(colors.green.500)]';
      case 'negative': return 'text-red-400 [text-shadow:0_0_4px_theme(colors.red.500)]';
      case 'neutral': return 'text-yellow-400 [text-shadow:0_0_4px_theme(colors.yellow.500)]';
      default: return 'text-slate-400';
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Small delay to allow clicking on other buttons (like send) without collapsing
    setTimeout(() => {
        if (!document.activeElement?.closest('.chat-input-container')) {
             if (!newMessage.trim() && !selectedEmoji) {
                setIsInputActive(false);
             }
        }
    }, 100);
  };

  const displayedMessages = messages.slice(-30);

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-grow p-1 space-y-3 overflow-y-auto max-h-[220px] scrollbar-thin">
        {displayedMessages.length === 0 && (
          <p className="text-center text-slate-500 italic py-8">Aún no hay mensajes. ¡Participa en la conversación!</p>
        )}
        {displayedMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-lg border relative
              ${msg.userId === currentUser.id 
                ? 'bg-cyan-900/40 border-cyan-500/50 [box-shadow:0_0_10px_rgba(0,255,255,0.2)_inset]' 
                : 'bg-fuchsia-900/40 border-fuchsia-500/50 [box-shadow:0_0_10px_rgba(255,0,255,0.2)_inset]'}`
            }>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-baseline">
                  <span className={`text-xs font-semibold opacity-90 ${msg.userId === currentUser.id ? 'text-cyan-300' : 'text-fuchsia-300'}`}>{msg.userName} {msg.userId === currentUser.id ? '(Tú)' : ''}</span>
                  <span className="text-xs opacity-70 ml-2 text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className={`text-xs opacity-80 ml-2 ${getSentimentNeonColor(msg.sentiment)}`} title={`Sentimiento: ${msg.sentiment || 'desconocido'}`}>
                    {msg.sentiment === 'positive' && <i className="fas fa-smile"></i>}
                    {msg.sentiment === 'negative' && <i className="fas fa-frown"></i>}
                    {msg.sentiment === 'neutral' && <i className="fas fa-meh"></i>}
                </span>
              </div>
              <p className="text-sm break-words text-slate-200">
                {msg.emoji && <span className="mr-1 text-lg">{msg.emoji}</span>}
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {attachedImageName && (
        <div className="px-2 py-1 text-xs text-slate-400 bg-slate-900/50 border-y border-blue-500/30">
          Adjunto: <span className="font-semibold">{attachedImageName}</span>
          <button onClick={() => setAttachedImageName(null)} className="ml-2 text-red-400 hover:text-red-300" title="Quitar imagen">
            <i className="fas fa-times-circle"></i>
          </button>
        </div>
      )}

      {(aiDraftSuggestion || aiDraftError) && (
        <div className={`mx-2 my-1 text-sm ${aiDraftError ? 'bg-red-900/50' : 'bg-indigo-900/50'} p-2 rounded-md border ${aiDraftError ? 'border-red-700': 'border-indigo-600'}`}>
            {aiDraftSuggestion && <p className="text-indigo-300 font-semibold mb-1">Sugerencia IA:</p>}
            <p className="text-slate-300 whitespace-pre-wrap mb-2">{aiDraftSuggestion || aiDraftError}</p>
            <div className="flex space-x-2">
                {aiDraftSuggestion && <button onClick={() => { setNewMessage(aiDraftSuggestion); setAiDraftSuggestion(null); }} className="py-1 px-2 text-xs bg-indigo-500 hover:bg-indigo-600 rounded text-white">Usar</button>}
                <button onClick={() => { setAiDraftSuggestion(null); setAiDraftError(null);}} className="py-1 px-2 text-xs bg-slate-600 hover:bg-slate-500 rounded text-white">Descartar</button>
            </div>
        </div>
      )}
      
      <div className="pt-3 mt-auto chat-input-container">
        {showEmojiPicker && (
            <div className="p-1 border-t border-blue-500/20 mb-2">
                <div className="flex space-x-1 p-2 overflow-x-auto">
                    {CHAT_EMOJIS.map(item => (
                        <button key={item.emoji} title={item.description} onClick={() => setSelectedEmoji(item.emoji === selectedEmoji ? null : item.emoji)}
                        className={`flex-shrink-0 p-2 rounded-full text-xl transition-all duration-150 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50
                                    ${selectedEmoji === item.emoji ? 'bg-cyan-500/50 ring-2 ring-cyan-400 scale-110 [box-shadow:0_0_8px_theme(colors.cyan.400)]' : 'bg-slate-800/80 hover:bg-slate-700 ring-slate-600'}`}>
                        {item.emoji}</button>
                    ))}
                </div>
            </div>
        )}

        <div className={`transition-all duration-300 ease-in-out ${isInputActive ? 'bg-slate-900/50 p-2 rounded-lg shadow-inner' : ''}`}>
             {!isInputActive ? (
                <button onClick={() => setIsInputActive(true)} className="w-full text-left p-3 ps-input bg-transparent border-slate-700/80 hover:border-blue-500 flex items-center h-[42px]">
                    <span className="text-slate-400">Escribe un mensaje...</span>
                    <i className="fas fa-paper-plane ml-auto text-slate-500"></i>
                </button>
            ) : (
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input ref={inputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()} onBlur={handleInputBlur}
                            placeholder={selectedEmoji ? `${selectedEmoji} Escribe un mensaje...` : "Escribe un mensaje..."}
                            className="flex-grow ps-input" disabled={isSending || isDraftingAI}
                        />
                        <button onClick={handleSendMessage} disabled={isSending || isDraftingAI || (!newMessage.trim() && !selectedEmoji && !attachedImageName)}
                            className="ps-button active h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center">
                            {isSending ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <i className="fas fa-paper-plane"></i>}
                        </button>
                    </div>
                     <div className="flex items-center justify-around p-1 bg-slate-800/40 rounded-md">
                        {Object.entries(CHAT_ACTION_ICONS).map(([actionKey, iconClass]) => {
                             const actionTitles: Record<string, string> = {
                                emoji: "Seleccionar Emoji", gif: "Enviar GIF (No implementado)", image: "Adjuntar Imagen", poll: "Crear Encuesta (No implementado)",
                                location: "Compartir Ubicación", ai_draft: "Sugerencia de Borrador con IA", calculator: "Abrir Calculadora", sube: "Consultar Saldo SUBE",
                            };
                            const handleActionClick = async (action: string) => {
                                switch (action) {
                                    case 'emoji': setShowEmojiPicker(prev => !prev); break;
                                    case 'image': imageInputRef.current?.click(); break;
                                    case 'location':
                                        const location = await getCurrentChatLocation();
                                        setNewMessage(prev => `${prev} ${location ? `📍 Ubicación: (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})` : '[No se pudo obtener la ubicación]'}`.trim());
                                        break;
                                    case 'ai_draft':
                                        if (!newMessage.trim() && !selectedEmoji) { setAiDraftError("Escribe algo para que la IA lo mejore."); setAiDraftSuggestion(null); return; }
                                        setIsDraftingAI(true); setAiDraftSuggestion(null); setAiDraftError(null);
                                        try {
                                            const suggestion = await draftChatResponse(selectedEmoji ? `${selectedEmoji} ${newMessage}` : newMessage);
                                            setAiDraftSuggestion(suggestion);
                                        } catch (error: any) { setAiDraftError(error.message || "Error al generar borrador IA."); } finally { setIsDraftingAI(false); }
                                        break;
                                    case 'calculator': onToggleCalculator(); break;
                                    case 'sube': window.open(SUBE_URL, '_blank', 'noopener,noreferrer'); break;
                                }
                            };
                            return (
                                <button key={actionKey} onClick={() => handleActionClick(actionKey)} title={actionTitles[actionKey]}
                                    className={`text-slate-400 hover:text-cyan-400 transition-colors text-lg p-2 rounded-full w-9 h-9 flex items-center justify-center hover:bg-slate-700/50 disabled:opacity-50
                                                ${actionKey === 'emoji' && showEmojiPicker ? 'text-cyan-400 bg-slate-700' : ''}`}
                                    disabled={(isDraftingAI && actionKey !== 'ai_draft') || (['gif', 'poll'].includes(actionKey))} aria-label={actionTitles[actionKey]}>
                                    {actionKey === 'ai_draft' ? (isDraftingAI ? <LoadingSpinner size="w-5 h-5" /> : <i className={iconClass}></i>) : <i className={iconClass}></i>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
        <input type="file" ref={imageInputRef} onChange={(e) => setAttachedImageName(e.target.files?.[0]?.name || null)} accept="image/*" style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ChatWindow;