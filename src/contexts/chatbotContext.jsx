import React, { createContext, use, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const ChatbotContext = createContext();

export const useChatbot = () => use(ChatbotContext);

export const ChatbotProvider = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isChatOpen = searchParams.get('chat') === 'open';

  // Global state for chat persistence
  const [messages, setMessages] = useState([]);
  const [lastContext, setLastContext] = useState({ dates: [] });
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const toggleChat = useCallback(() => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (isChatOpen) {
        newParams.delete('chat');
      } else {
        newParams.set('chat', 'open');
        // Clear unread flag when opening
        setHasUnreadMessages(false);
      }
      return newParams;
    }, { replace: !!isChatOpen }); // Reemplazar solo al cerrar manualmente
  }, [setSearchParams, isChatOpen]);

  const value = {
    isChatOpen,
    toggleChat,
    messages,
    setMessages,
    lastContext,
    setLastContext,
    hasUnreadMessages,
    setHasUnreadMessages,
  };

  return (
    <ChatbotContext value={value}>
      {children}
    </ChatbotContext>
  );
};