#!/usr/bin/env python3
"""
Generate embeddings for runreachyrun.com content using Nomic model.
Reads content.json, outputs embeddings.json
"""

import json
import sys
from pathlib import Path
from sentence_transformers import SentenceTransformer
from datetime import datetime
import numpy as np

def main():
    # Paths
    script_dir = Path(__file__).parent
    content_path = script_dir / "content.json"
    output_path = script_dir.parent / "public" / "data" / "embeddings.json"

    if not content_path.exists():
        print(f"Error: {content_path} not found. Run extract-content.ts first.")
        sys.exit(1)

    # Load content
    print("Loading content...")
    with open(content_path, 'r') as f:
        content = json.load(f)

    documents = content['documents']
    print(f"Found {len(documents)} documents to embed")

    # Load Nomic model (same as obsidian-search)
    print("Loading Nomic embedding model...")
    model = SentenceTransformer(
        'nomic-ai/nomic-embed-text-v1.5',
        trust_remote_code=True,
        device='mps'  # Metal for M4 Max
    )

    # Generate embeddings
    print("Generating embeddings...")
    texts = [f"{doc['title']}\n\n{doc['content']}" for doc in documents]
    embeddings = model.encode(texts, show_progress_bar=True)

    # Add embeddings to documents
    for i, doc in enumerate(documents):
        doc['embedding'] = embeddings[i].tolist()

    # Pre-compute related items (top 3 similar for each)
    print("Computing related items...")
    related_map = {}
    embeddings_matrix = np.array([doc['embedding'] for doc in documents])

    for i, doc in enumerate(documents):
        # Cosine similarity with all other docs
        query_embedding = embeddings_matrix[i]
        similarities = np.dot(embeddings_matrix, query_embedding) / (
            np.linalg.norm(embeddings_matrix, axis=1) * np.linalg.norm(query_embedding)
        )

        # Get top 4 (including self), then exclude self
        top_indices = np.argsort(similarities)[::-1][:4]
        related_ids = [documents[j]['id'] for j in top_indices if j != i][:3]
        related_map[doc['id']] = related_ids

    # Build output
    output = {
        "documents": documents,
        "version": "1.0",
        "model": "nomic-ai/nomic-embed-text-v1.5",
        "dimension": 768,
        "generatedAt": datetime.now().isoformat(),
        "relatedMap": related_map
    }

    # Write output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(output, f)

    print(f"✓ Embeddings saved to {output_path}")
    print(f"  - {len(documents)} documents")
    print(f"  - {len(related_map)} related mappings")

    # Also save a lightweight version without embeddings for client-side fallback
    lightweight_path = output_path.parent / "content-index.json"
    lightweight = {
        "documents": [
            {k: v for k, v in doc.items() if k != 'embedding'}
            for doc in documents
        ],
        "relatedMap": related_map,
        "generatedAt": output['generatedAt']
    }
    with open(lightweight_path, 'w') as f:
        json.dump(lightweight, f)
    print(f"✓ Lightweight index saved to {lightweight_path}")

if __name__ == "__main__":
    main()
