#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from chromadb import PersistentClient
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, StorageContext, Settings

# ✅ 답변 LLM: Ollama (midm:latest)
from llama_index.llms.ollama import Ollama
MODEL_NAME = os.getenv("OLLAMA_LLM_MODEL", "midm:latest")
Settings.llm = Ollama(model=MODEL_NAME, request_timeout=180.0)

# ✅ 질의 임베딩: ingest와 동일(HF E5)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
Settings.embed_model = HuggingFaceEmbedding(
    model_name="intfloat/multilingual-e5-large",
    device="cuda",
    embed_batch_size=64
)

DB_PATH = "storage/chroma"
COLLECTION_NAME = "midm_docs"

def get_query_engine(top_k=4):
    client = PersistentClient(path=DB_PATH)
    collection = client.get_or_create_collection(COLLECTION_NAME)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_vector_store(vector_store)
    return index.as_query_engine(similarity_top_k=top_k, response_mode="compact")

if __name__ == "__main__":
    qe = get_query_engine(top_k=4)
    q = input("질문을 입력하세요: ")
    resp = qe.query(q)
    print("\n=== 응답 ===\n", resp)
    print("\n=== 출처 ===")
    for sn in resp.source_nodes:
        meta = sn.node.metadata or {}
        print(f"- {meta.get('source')} (p.{meta.get('page')}), score={sn.score:.3f}")
