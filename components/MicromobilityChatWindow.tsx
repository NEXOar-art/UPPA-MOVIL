import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GlobalChatMessage, UserProfile } from '../types';
import { MICROMOBILITY_CHAT_EMOJIS, DEFAULT_USER_ID, DEFAULT_USER_NAME } from '../constants';
import { analyzeSentiment } from '../services/geminiService';

interface MicromobilityChatWindowProps {
  messages: GlobalChatMessage[];
  currentUser: UserProfile;
  onSendMessage: (message: GlobalChatMessage) => void;
}

const MicromobilityChatWindow: React.FC<MicromobilityChatWindowProps> = ({ messages, currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() && !selectedEmoji) return;
    setIsSending(true);

    const textForSentiment = selectedEmoji ? `${selectedEmoji} ${newMessage.trim()}` : newMessage.trim();
    const sentiment = await analyzeSentiment(textForSentiment || "emoji_only");

    const chatMessage: GlobalChatMessage = {
      id: `global-msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      userId: currentUser.id || DEFAULT_USER_ID,
      userName: currentUser.name || DEFAULT_USER_NAME,
      timestamp: Date.now(),
      text: newMessage.trim(),
      emoji: selectedEmoji || undefined,
      sentiment,
    };

    onSendMessage(chatMessage);

    setNewMessage('');
    setSelectedEmoji(null);
    setIsSending(false);
  }, [newMessage, selectedEmoji, currentUser, onSendMessage]);

  const getSentimentNeonColor = (sentiment?: 'positive' | 'negative' | 'neutral' | 'unknown') => {
    switch (sentiment) {
      case 'positive': return 'text-green-400 [text-shadow:0_0_4px_theme(colors.green.500)]';
      case 'negative': return 'text-red-400 [text-shadow:0_0_4px_theme(colors.red.500)]';
      case 'neutral': return 'text-yellow-400 [text-shadow:0_0_4px_theme(colors.yellow.500)]';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-transparent">
      <div className="flex-grow p-1 space-y-3 overflow-y-auto max-h-[300px]">
        {messages.length === 0 && (
          <p className="text-center text-slate-500 italic py-8">El nexo de comunicación está abierto. Inicia la conversación.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-lg border relative
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

      <div className="p-1 border-y border-blue-500/20 mt-2">
         <div className="flex space-x-1 p-2 overflow-x-auto">
            {MICROMOBILITY_CHAT_EMOJIS.map(item => (
                <button
                key={item.emoji}
                title={item.description}
                onClick={() => setSelectedEmoji(item.emoji === selectedEmoji ? null : item.emoji)}
                className={`p-2 rounded-full text-xl transition-all duration-150 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-opacity-50
                          ${selectedEmoji === item.emoji ? 'bg-blue-500 ring-blue-400 scale-110' : 'bg-slate-800/80 hover:bg-slate-700 ring-slate-600'}`}
                >
                {item.emoji}
                </button>
            ))}
        </div>
      </div>

      <div className="pt-2 flex items-center space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
          placeholder="Transmitir en el nexo..."
          className="flex-grow ps-input"
          disabled={isSending}
        />
        <button
          onClick={handleSendMessage}
          disabled={isSending || (!newMessage.trim() && !selectedEmoji)}
          className="ps-button active h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default MicromobilityChatWindow;