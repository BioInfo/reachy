// RAG system types for runreachyrun.com

export interface EmbeddingDocument {
  id: string;
  type: "journal" | "blog" | "timeline" | "app" | "claude-session";
  title: string;
  content: string; // Truncated content for context
  fullContent?: string; // Full content for display
  embedding: number[]; // 768-dimensional Nomic embedding
  metadata: {
    date?: string;
    tags?: string[];
    slug?: string;
    url?: string;
  };
}

export interface EmbeddingsData {
  documents: EmbeddingDocument[];
  version: string;
  model: string;
  generatedAt: string;
  relatedMap?: Record<string, string[]>; // Pre-computed related items
}

export interface SearchResult {
  document: EmbeddingDocument;
  score: number;
  matchType: "semantic" | "keyword" | "hybrid";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: {
    id: string;
    title: string;
    type: string;
  }[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
}

// Content extraction types (for build script)
export interface ContentItem {
  id: string;
  type: EmbeddingDocument["type"];
  title: string;
  content: string;
  metadata: EmbeddingDocument["metadata"];
}
