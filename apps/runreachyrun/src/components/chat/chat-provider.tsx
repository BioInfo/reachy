"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ChatMessage, ChatState } from "@/lib/rag/types";
import {
  loadEmbeddings,
  hybridSearch,
  buildContextFromResults,
} from "@/lib/rag/vector-search";

interface ChatContextType extends ChatState {
  sendMessage: (message: string) => Promise<void>;
  toggleChat: () => void;
  clearHistory: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Load embeddings and search for relevant context
      const embeddings = await loadEmbeddings();
      const searchResults = hybridSearch(message, embeddings.documents, 5);
      const context = buildContextFromResults(searchResults);

      // Extract source info for display
      const sources = searchResults.slice(0, 3).map((r) => ({
        id: r.document.id,
        title: r.document.title,
        type: r.document.type,
      }));

      // Call chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant message with sources
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.answer,
        sources: sources.length > 0 ? sources : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isOpen,
        sendMessage,
        toggleChat,
        clearHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
