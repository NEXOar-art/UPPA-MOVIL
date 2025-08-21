

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, UserProfile, ReportType, Coordinates } from '../types';
import { CHAT_EMOJIS, DEFAULT_USER_ID, DEFAULT_USER_NAME, CHAT_ACTION_ICONS, SUBE_URL } from '../constants';
import { analyzeSentiment, draftChatResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner'; // For AI draft loading

interface ChatWindowProps {
  busLineId: string;
  messages: ChatMessage[];
  currentUser: UserProfile;
  onSendMessage: (message: ChatMessage) => void;
  onSendReportFromChat: (reportType: ReportType, description: string, busLineId: string) => void;
  onToggleCalculator: () => void; // New prop to toggle calculator
}

// Helper to get current location (can be moved to a shared util if used more widely)
const getCurrentChatLocation = (): Promise<Coordinates | null> => {
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
        console.warn(`Error getting location for chat (Code ${error.code}): ${error.message}`);
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ busLineId, messages, currentUser, onSendMessage, onSendReportFromChat, onToggleCalculator }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [attachedImagePreviewUrl, setAttachedImagePreviewUrl] = useState<string | null>(null);
  const [aiDraftSuggestion, setAiDraftSuggestion] = useState<string | null>(null);
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [aiDraftError, setAiDraftError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 

  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const currentPreviewUrlRef = useRef<string | null>(null); // To help with revoking object URLs

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Cleanup object URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (currentPreviewUrlRef.current && currentPreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }
    };
  }, []);


  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAttachedImageName(file.name);

      if (currentPreviewUrlRef.current && currentPreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrlRef.current);
      }

      const newPreviewUrl = URL.createObjectURL(file);
      setAttachedImagePreviewUrl(newPreviewUrl);
      currentPreviewUrlRef.current = newPreviewUrl;
      
      event.target.value = '';
    }
  };

  const clearAttachedImage = () => {
    setAttachedImageName(null);
    if (currentPreviewUrlRef.current && currentPreviewUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreviewUrlRef.current);
    }
    setAttachedImagePreviewUrl(null);
    currentPreviewUrlRef.current = null;
  };

  const actionTitles: Record<keyof typeof CHAT_ACTION_ICONS, string> = {
    emoji: "Seleccionar Emoji",
    gif: "Enviar GIF (No implementado)",
    image: "Adjuntar Imagen",
    poll: "Crear Encuesta (No implementado)",
    location: "Compartir Ubicación",
    ai_draft: "Sugerencia de Borrador con IA",
    calculator: "Abrir Calculadora",
    sube: "Consultar Saldo SUBE",
  };
  const allowedActions: Array<keyof typeof CHAT_ACTION_ICONS> = ['emoji', 'image', 'location', 'ai_draft', 'calculator', 'sube'];

  const handleActionClick = async (action: keyof typeof CHAT_ACTION_ICONS) => {
    switch (action) {
      case 'emoji':
        setShowEmojiPicker(prev => !prev);
        break;
      case 'image':
        imageInputRef.current?.click();
        break;
      case 'location':
        const location = await getCurrentChatLocation();
        if (location) {
          setNewMessage(prev => `${prev} 📍 Ubicación: (${location.lat.toFixed(3)}, ${location.lng.toFixed(3)})`.trim());
        } else {
          setNewMessage(prev => `${prev} [No se pudo obtener la ubicación]`.trim());
        }
        break;
      case 'ai_draft':
        if (!newMessage.trim() && !selectedEmoji) { 
          setAiDraftError("Escribe algo o selecciona un emoji para que la IA lo mejore.");
          setAiDraftSuggestion(null);
          return;
        }
        setIsDraftingAI(true);
        setAiDraftSuggestion(null);
        setAiDraftError(null);
        try {
          const textToDraft = selectedEmoji ? `${selectedEmoji} ${newMessage}` : newMessage;
          const suggestion = await draftChatResponse(textToDraft);
          setAiDraftSuggestion(suggestion);
        } catch (error: any) {
          setAiDraftError(error.message || "Error al generar borrador IA.");
        } finally {
          setIsDraftingAI(false);
        }
        break;
      case 'calculator':
        onToggleCalculator();
        break;
      case 'sube':
        window.open(SUBE_URL, '_blank', 'noopener,noreferrer');
        break;
    }
  };

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
    clearAttachedImage();
    setAiDraftSuggestion(null);
    setAiDraftError(null);
    setShowEmojiPicker(false); 
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

  const displayedMessages = messages.slice(-30);

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-grow p-1 space-y-3 overflow-y-auto max-h-[350px]">
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
                <span className={`text-xs font-semibold opacity-90 ${msg.userId === currentUser.id ? 'text-cyan-300' : 'text-fuchsia-300'}`}>{msg.userName} {msg.userId === currentUser.id ? '(Tú)' : ''}</span>
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
              <span className="text-xs opacity-70 block text-right mt-1 text-slate-400">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {attachedImageName && (
        <div className="px-4 py-2 bg-slate-900/50 border-t border-b border-blue-500/30">
          <div className="text-sm text-slate-400">
            Adjunto: <span className="font-semibold">{attachedImageName}</span>
            <button onClick={clearAttachedImage} className="ml-2 text-red-400 hover:text-red-300" title="Quitar imagen">
              <i className="fas fa-times-circle"></i>
            </button>
          </div>
          {attachedImagePreviewUrl && (
            <div className="mt-2">
              <img 
                src={attachedImagePreviewUrl} 
                alt="Vista previa de imagen adjunta" 
                className="max-h-32 rounded-md border border-slate-600 shadow-md" 
              />
            </div>
          )}
        </div>
      )}

      {(aiDraftSuggestion || aiDraftError) && (
        <div className={`px-4 py-2 text-sm ${aiDraftError ? 'bg-red-900/50' : 'bg-indigo-900/50'} p-2 rounded-md mx-4 my-2 border ${aiDraftError ? 'border-red-700': 'border-indigo-600'}`}>
            {aiDraftError && <p className="text-red-300 font-semibold mb-1">Error IA: {aiDraftError}</p>}
            {aiDraftSuggestion && <p className="text-indigo-300 font-semibold mb-1">Sugerencia IA:</p>}
            <p className="text-slate-300 whitespace-pre-wrap mb-2">{aiDraftSuggestion}</p>
            <div className="flex space-x-2">
                {aiDraftSuggestion && !aiDraftError && (
                    <button
                        onClick={() => {
                            setNewMessage(aiDraftSuggestion);
                            navigator.clipboard.writeText(aiDraftSuggestion);
                            setAiDraftSuggestion(null);
                        }}
                        className="py-1 px-2 text-xs bg-indigo-500 hover:bg-indigo-600 rounded text-white"
                    >
                        Copiar y Usar
                    </button>
                )}
                <button
                    onClick={() => { setAiDraftSuggestion(null); setAiDraftError(null);}}
                    className="py-1 px-2 text-xs bg-slate-600 hover:bg-slate-500 rounded text-white"
                >
                    Descartar
                </button>
            </div>
        </div>
      )}

      <div className="pt-3">
        {showEmojiPicker && (
            <div className="p-1 border-t border-blue-500/20 mb-3">
                <div className="flex space-x-1 p-2 overflow-x-auto">
                    {CHAT_EMOJIS.map(item => (
                        <button
                        key={item.emoji}
                        title={item.description}
                        onClick={() => setSelectedEmoji(item.emoji === selectedEmoji ? null : item.emoji)}
                        className={`flex-shrink-0 p-2 rounded-full text-xl transition-all duration-150 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50
                                    ${selectedEmoji === item.emoji ? 'bg-cyan-500/50 ring-2 ring-cyan-400 scale-110 [box-shadow:0_0_8px_theme(colors.cyan.400)]' : 'bg-slate-800/80 hover:bg-slate-700 ring-slate-600'}`}
                        >
                        {item.emoji}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex items-center space-x-2">
            <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
            placeholder="Escribe un mensaje..."
            className="flex-grow ps-input"
            disabled={isSending || isDraftingAI}
            />
            <button
            onClick={handleSendMessage}
            disabled={isSending || isDraftingAI || (!newMessage.trim() && !selectedEmoji && !attachedImageName)}
            className="ps-button active h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center"
            >
            {isSending ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <i className="fas fa-paper-plane"></i>
            )}
            </button>
        </div>
        <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-2">
            {allowedActions.map(actionKey => (
                <button
                    key={actionKey}
                    onClick={() => handleActionClick(actionKey)}
                    title={actionTitles[actionKey]}
                    className={`text-slate-400 hover:text-cyan-400 transition-colors text-lg p-2 rounded-full hover:bg-slate-800/80 disabled:opacity-50 flex items-center
                                [text-shadow:0_0_3px_theme(colors.slate.400)] hover:[text-shadow:0_0_5px_theme(colors.cyan.400)]
                                ${actionKey === 'emoji' && showEmojiPicker ? 'text-cyan-400 bg-slate-700/50' : ''}`}
                    disabled={isDraftingAI && actionKey !== 'ai_draft'} 
                    aria-label={actionTitles[actionKey]}
                >
                    {actionKey === 'ai_draft' ? (
                        <>
                            {isDraftingAI ? <LoadingSpinner size="w-5 h-5" /> : <i className={CHAT_ACTION_ICONS[actionKey]}></i>}
                        </>
                    ) : (
                        <i className={CHAT_ACTION_ICONS[actionKey]}></i>
                    )}
                </button>
            ))}
            <input type="file" ref={imageInputRef} onChange={handleImageFileChange} accept="image/*" style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;