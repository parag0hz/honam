#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from pathlib import Path
from typing import List

# ✅ LlamaParse SDK 직접 사용 (Reader 아님)
from llama_parse import LlamaParse

# LlamaIndex (0.13.x)
from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.core.node_parser import SentenceSplitter

# Chroma
from chromadb import PersistentClient
from llama_index.vector_stores.chroma import ChromaVectorStore

from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# 경로/파라미터
# -----------------------------
DATA_DIR = Path("data")
DB_DIR = Path("storage/chroma")
COLLECTION_NAME = "midm_docs"

# 청킹 파라미터
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150

# 임베딩/LLM은 settings.py에서 전역 지정해두었다면 생략 가능.
# 여기서 바로 지정하려면 아래 주석을 해제하세요.
#
# from llama_index.llms.ollama import Ollama
# from llama_index.embeddings.ollama import OllamaEmbedding
# Settings.llm = Ollama(model="midm2.0", request_timeout=120.0)
# Settings.embed_model = OllamaEmbedding(model_name="nomic-embed-text")

# node parser(청킹) 설정
Settings.node_parser = SentenceSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)

Settings.embed_model = HuggingFaceEmbedding(
    model_name="intfloat/multilingual-e5-large",
    device="cuda",                 # 또는 "cuda:0"
    embed_batch_size=64            # 메모리 여유에 맞춰 조절
)
# -----------------------------
# 유틸
# -----------------------------
def log(msg: str):
    print(msg, flush=True)


def ensure_data_files() -> List[Path]:
    if not DATA_DIR.exists():
        raise SystemExit(f"{DATA_DIR} 폴더가 없습니다. 문서를 넣고 다시 실행하세요.")
    files = sorted(list(DATA_DIR.glob("**/*.pdf")))  # 필요시 docx/txt 추가 가능
    if not files:
        raise SystemExit(f"{DATA_DIR} 안에 처리할 PDF가 없습니다.")
    return files


def normalize_docs(docs: List[Document], source_name: str) -> List[Document]:
    """Document 리스트의 메타데이터에 source/page 보강."""
    out = []
    for i, d in enumerate(docs, 1):
        text = d.text or ""
        meta = dict(d.metadata or {})
        # page/filename 보강 (이미 있으면 유지)
        meta.setdefault("source", source_name)
        meta.setdefault("page", meta.get("page", i))
        out.append(Document(text=text, metadata=meta))
    return out


# -----------------------------
# 1) 파싱: LlamaParseReader (권장)
# -----------------------------
def parse_with_llamaparse(files: List[Path]) -> List[Document]:
    """
    LlamaParse SDK 직접 사용.
    result_type="markdown" 권장 (표/레이아웃에 유리)
    """
    parser = LlamaParse(result_type="markdown")  # wait 파라미터 없음

    all_docs: List[Document] = []
    for f in files:
        print(f"Started parsing: {f.name}", flush=True)
        out = parser.load_data(str(f))  # 보통 'list'로 반환됨
        if not out:
            continue

        # out의 원소 타입이 케이스별로 다를 수 있어 안전 처리
        first = out[0]

        def add_doc(text: str, page_no: int):
            all_docs.append(
                Document(text=text or "",
                         metadata={"source": f.name, "page": page_no})
            )

        if hasattr(first, "pages"):
            # 케이스 1: [Result] 객체 리스트, .pages 보유
            for p in first.pages:
                text = getattr(p, "md", None) or getattr(p, "text", "")
                page_no = getattr(p, "page", None) or 1
                add_doc(text, page_no)
        elif hasattr(first, "text") and not hasattr(first, "metadata"):
            # 케이스 2: [Page] 형태
            for i, p in enumerate(out, 1):
                text = getattr(p, "md", None) or getattr(p, "text", "")
                page_no = getattr(p, "page", i)
                add_doc(text, page_no)
        else:
            # 케이스 3: 이미 LlamaIndex Document 리스트
            for i, d in enumerate(out, 1):
                text = getattr(d, "text", "")
                meta = dict(getattr(d, "metadata", {}) or {})
                page_no = meta.get("page", i)
                meta.setdefault("source", f.name)
                meta.setdefault("page", page_no)
                all_docs.append(Document(text=text, metadata=meta))

    return all_docs



# -----------------------------
# 2) 색인 적재: Chroma
# -----------------------------
def build_chroma_index(docs: List[Document]) -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    client = PersistentClient(path=str(DB_DIR))
    collection = client.get_or_create_collection(COLLECTION_NAME)
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    log("Building index (this writes embeddings to Chroma)...")
    # Settings.node_parser가 세팅돼 있으면 자동 청킹 후 임베딩 저장
    _ = VectorStoreIndex.from_documents(docs, storage_context=storage_context)
    log(f"Done. Index stored at: {DB_DIR}")


# -----------------------------
# 메인
# -----------------------------
def main():
    files = ensure_data_files()
    log(f"Parsing {len(files)} files...")

    # LlamaParse 키가 없을 때 경고(파싱 품질에 영향)
    if not os.getenv("LLAMA_CLOUD_API_KEY"):
        log("[경고] LLAMA_CLOUD_API_KEY가 설정되지 않았습니다. "
            "복잡한 PDF(표/레이아웃) 파싱 품질이 떨어질 수 있어요.")

    docs = parse_with_llamaparse(files)
    log(f"Parsed pages (docs): {len(docs)}")

    if not docs:
        raise SystemExit("파싱 결과가 비어 있습니다. 파일/키/네트워크를 확인하세요.")

    build_chroma_index(docs)


if __name__ == "__main__":
    main()
