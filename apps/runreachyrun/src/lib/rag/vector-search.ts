// Client-side vector search for runreachyrun.com
// Uses pre-computed embeddings from build time

import { EmbeddingDocument, EmbeddingsData, SearchResult } from "./types";

let embeddingsCache: EmbeddingsData | null = null;
let lightweightCache: { documents: Omit<EmbeddingDocument, "embedding">[]; relatedMap: Record<string, string[]> } | null = null;

/**
 * Load full embeddings data (includes vectors for semantic search)
 * Warning: ~1-2MB file, use loadLightweightIndex for related-only lookups
 */
export async function loadEmbeddings(): Promise<EmbeddingsData> {
  if (embeddingsCache) return embeddingsCache;

  const response = await fetch("/data/embeddings.json");
  if (!response.ok) {
    throw new Error(`Failed to load embeddings: ${response.statusText}`);
  }

  embeddingsCache = await response.json();
  return embeddingsCache!;
}

/**
 * Load lightweight index (no embeddings, just content + related map)
 * Use for related content lookups without semantic search
 */
export async function loadLightweightIndex(): Promise<{
  documents: Omit<EmbeddingDocument, "embedding">[];
  relatedMap: Record<string, string[]>;
}> {
  if (lightweightCache) return lightweightCache;

  const response = await fetch("/data/content-index.json");
  if (!response.ok) {
    throw new Error(`Failed to load content index: ${response.statusText}`);
  }

  lightweightCache = await response.json();
  return lightweightCache!;
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Search documents by embedding similarity
 */
export function searchByEmbedding(
  queryEmbedding: number[],
  documents: EmbeddingDocument[],
  limit: number = 5,
  minScore: number = 0.3
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const doc of documents) {
    const score = cosineSimilarity(queryEmbedding, doc.embedding);
    if (score >= minScore) {
      results.push({
        document: doc,
        score,
        matchType: "semantic",
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Simple keyword search using TF-IDF-like scoring
 */
export function searchByKeywords(
  query: string,
  documents: EmbeddingDocument[],
  limit: number = 5
): SearchResult[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (queryTerms.length === 0) return [];

  const results: SearchResult[] = [];

  for (const doc of documents) {
    const text = `${doc.title} ${doc.content}`.toLowerCase();
    let score = 0;

    for (const term of queryTerms) {
      // Count occurrences
      const regex = new RegExp(term, "gi");
      const matches = text.match(regex);
      if (matches) {
        // Weight title matches more heavily
        const titleMatches = doc.title.toLowerCase().match(regex)?.length || 0;
        const contentMatches = matches.length - titleMatches;
        score += titleMatches * 3 + contentMatches;
      }
    }

    if (score > 0) {
      // Normalize by document length
      const normalizedScore = score / Math.sqrt(text.length);
      results.push({
        document: doc,
        score: normalizedScore,
        matchType: "keyword",
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Hybrid search combining keyword and semantic results
 * Since we can't embed queries client-side without a model,
 * this falls back to keyword search with optional semantic boost
 */
export function hybridSearch(
  query: string,
  documents: EmbeddingDocument[],
  limit: number = 5
): SearchResult[] {
  // Start with keyword search
  const keywordResults = searchByKeywords(query, documents, limit * 2);

  // Deduplicate and return top results
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const result of keywordResults) {
    if (!seen.has(result.document.id)) {
      seen.add(result.document.id);
      results.push({
        ...result,
        matchType: "hybrid",
      });
    }
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Get related documents for a given document ID
 * Uses pre-computed related map from embeddings.json
 */
export async function getRelatedDocuments(
  documentId: string,
  limit: number = 3
): Promise<Omit<EmbeddingDocument, "embedding">[]> {
  const index = await loadLightweightIndex();
  const relatedIds = index.relatedMap[documentId] || [];

  return relatedIds
    .slice(0, limit)
    .map((id) => index.documents.find((d) => d.id === id))
    .filter(Boolean) as Omit<EmbeddingDocument, "embedding">[];
}

/**
 * Get document by ID
 */
export async function getDocumentById(
  documentId: string
): Promise<Omit<EmbeddingDocument, "embedding"> | null> {
  const index = await loadLightweightIndex();
  return index.documents.find((d) => d.id === documentId) || null;
}

/**
 * Get all documents of a specific type
 */
export async function getDocumentsByType(
  type: EmbeddingDocument["type"]
): Promise<Omit<EmbeddingDocument, "embedding">[]> {
  const index = await loadLightweightIndex();
  return index.documents.filter((d) => d.type === type);
}

/**
 * Build context string from search results for RAG
 */
export function buildContextFromResults(results: SearchResult[], maxLength: number = 4000): string {
  let context = "";
  let currentLength = 0;

  for (const result of results) {
    const entry = `## ${result.document.title}\nType: ${result.document.type}\n${result.document.content}\n\n`;
    if (currentLength + entry.length > maxLength) break;
    context += entry;
    currentLength += entry.length;
  }

  return context.trim();
}
