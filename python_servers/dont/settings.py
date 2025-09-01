# settings.py
from llama_index.core import Settings
from llama_index.llms.ollama import Ollama
from llama_index.embeddings.ollama import OllamaEmbedding

# LLM: KT 믿음2.0 (Ollama에 등록된 모델명으로 변경)
Settings.llm = Ollama(model="midm2.0", request_timeout=120.0)

# Embedding: 로컬 임베딩 모델
Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

# 청킹 기본값(필요 시 조절)
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150
TOP_K = 4
