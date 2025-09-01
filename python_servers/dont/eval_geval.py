#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
G-Eval runner for RAG with LlamaIndex 0.13.x

- Retrieval: Chroma (pre-built at storage/chroma, collection "midm_docs")
- Embedding: HuggingFace (intfloat/multilingual-e5-large)  [ingest와 동일하게 설정 必]
- SUT (system under test): Ollama model (default: midm:latest)
- Baseline (pairwise only): Ollama model (default: gemma:2b)
- Judge: GPT(OpenAI) or Ollama (env로 선택)
    USE_OPENAI_JUDGE=1  → GPT 심판 (기본)
    USE_OPENAI_JUDGE=0  → Ollama 심판

Env vars you may set:
    OLLAMA_LLM_MODEL       (default: midm:latest)
    OLLAMA_BASELINE_MODEL  (default: gemma:2b)
    OLLAMA_JUDGE_MODEL     (default: llama3.1:8b)
    OLLAMA_HOST            (optional; e.g., http://host:11434)

    USE_OPENAI_JUDGE=1
    OPENAI_API_KEY=sk-...
    OPENAI_JUDGE_MODEL=gpt-4o-mini  (or gpt-4o)
"""

import os
import re
import json
import argparse
import random
import statistics
from pathlib import Path
from typing import List, Dict, Any

# ---------- LlamaIndex core / vector store ----------
from llama_index.core import VectorStoreIndex, StorageContext, Settings
from llama_index.vector_stores.chroma import ChromaVectorStore
from chromadb import PersistentClient

# ---------- LLMs ----------
from llama_index.llms.ollama import Ollama  # SUT/Baseline 또는 로컬 심판

USE_OPENAI_JUDGE = os.getenv("USE_OPENAI_JUDGE", "1") == "1"
if USE_OPENAI_JUDGE:
    # GPT 심판
    from llama_index.llms.openai import OpenAI as LIOpenAI

# ---------- Embedding (ingest와 동일하게) ----------
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

# ---------- Defaults ----------
DB_PATH = os.getenv("CHROMA_PATH", "storage/chroma")
COLLECTION = os.getenv("CHROMA_COLLECTION", "midm_docs")

SUT_MODEL = os.getenv("OLLAMA_LLM_MODEL", "midm:latest")
BASELINE_MODEL = os.getenv("OLLAMA_BASELINE_MODEL", "gemma:2b")
OLLAMA_JUDGE_MODEL = os.getenv("OLLAMA_JUDGE_MODEL", "llama3.1:8b")

OPENAI_JUDGE_MODEL = os.getenv("OPENAI_JUDGE_MODEL", "gpt-4o-mini")

# (bge-m3를 쓸 때 쿼리에 'query: ' 접두어를 붙이고 싶다면 1로 설정)
USE_BGE_QUERY_PREFIX = os.getenv("USE_BGE_QUERY_PREFIX", "0") == "1"


# ---------- Embedding 설정 (HF) ----------
# ingest.py에서 사용한 임베딩과 반드시 동일해야 함
Settings.embed_model = HuggingFaceEmbedding(
    model_name="intfloat/multilingual-e5-large",
    device="cuda",            # GPU: CUDA_VISIBLE_DEVICES=…로 원하는 카드만 보이게
    embed_batch_size=64
)


# ---------- Retriever / Index ----------
def build_index():
    client = PersistentClient(path=DB_PATH)
    col = client.get_or_create_collection(COLLECTION)
    vs = ChromaVectorStore(chroma_collection=col)
    sc = StorageContext.from_defaults(vector_store=vs)
    idx = VectorStoreIndex.from_vector_store(vs)
    return idx, sc


def make_query_engine(llm_model: str, top_k: int = 4, base_url: str | None = None):
    # 답변 LLM 설정 (Ollama)
    kwargs = {"model": llm_model, "request_timeout": 180.0}
    if base_url := (base_url or os.getenv("OLLAMA_HOST")):
        kwargs["base_url"] = base_url
    Settings.llm = Ollama(**kwargs)

    index, _ = build_index()
    return index.as_query_engine(similarity_top_k=top_k, response_mode="compact")


# ---------- Judge helpers ----------
POINTWISE_PROMPT = """당신은 생성형 AI 평가 심판입니다. 아래 "질문"과 "모델_응답"을 보고
[정확성, 충실성, 지시_준수, 표현력, 안전성]을 1~5 정수로 채점하고,
한두 문장으로 간단한 사유를 적으세요. 출력은 반드시 JSON만.

[질문]
{question}

[모델_응답]
{answer}

출력(JSON):
{{
  "accuracy": 1-5,
  "faithfulness": 1-5,
  "instruction_following": 1-5,
  "fluency": 1-5,
  "safety": 1-5,
  "overall": 1-5,
  "rationale": "사유 한두 문장"
}}"""

PAIRWISE_PROMPT = """당신은 생성형 AI 평가 심판입니다. 아래 질문과 두 응답(A,B)을 보고
정확성, 충실성(근거 일관성), 지시 준수, 표현력/명확성, 안전성을 기준으로 더 나은 것을 고르세요.
동일하면 "tie". 출력은 JSON만.

[질문]
{question}

[응답 A]
{a}

[응답 B]
{b}

출력(JSON):
{{
  "winner": "A" | "B" | "tie",
  "reason": "한두 문장 근거"
}}"""


def extract_json(s: str) -> Dict[str, Any]:
    """심판 출력에서 최상위 JSON 블록만 추출."""
    m = re.search(r"\{.*\}", s, flags=re.S)
    if not m:
        raise ValueError("No JSON found in judge output")
    return json.loads(m.group(0))


def make_judge():
    """심판 LLM 생성 (GPT 또는 Ollama)."""
    if USE_OPENAI_JUDGE:
        # OpenAI GPT (via LlamaIndex)
        return LIOpenAI(
            model=OPENAI_JUDGE_MODEL,
            temperature=0.0,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    # Ollama judge (로컬 무료, 정확도는 모델에 따라 다름)
    kwargs = {"model": OLLAMA_JUDGE_MODEL, "request_timeout": 180.0}
    if base_url := os.getenv("OLLAMA_HOST"):
        kwargs["base_url"] = base_url
    return Ollama(**kwargs)


def judge_pointwise(question: str, answer: str) -> Dict[str, Any]:
    prompt = POINTWISE_PROMPT.format(question=question, answer=answer)
    judge = make_judge()
    out = judge.complete(prompt).text
    return extract_json(out)


def judge_pairwise(question: str, ans_a: str, ans_b: str) -> Dict[str, Any]:
    # 순서 편향 방지: A/B 랜덤 스왑
    order = ["A", "B"]
    random.shuffle(order)
    mapping = {"A": ans_a if order[0] == "A" else ans_b,
               "B": ans_b if order[0] == "A" else ans_a}

    prompt = PAIRWISE_PROMPT.format(question=question, a=mapping["A"], b=mapping["B"])
    judge = make_judge()
    out = judge.complete(prompt).text
    j = extract_json(out)

    # 원래 라벨로 환원
    if j.get("winner") in ["A", "B"]:
        j["winner"] = order[0] if j["winner"] == "A" else order[1]
    return j


# ---------- Runners ----------
def _maybe_prefix_query(q: str) -> str:
    return ("query: " + q) if USE_BGE_QUERY_PREFIX else q


def run_pointwise(dataset: List[Dict[str, Any]], top_k=4) -> Dict[str, Any]:
    qe = make_query_engine(SUT_MODEL, top_k=top_k)
    results = []
    for ex in dataset:
        q = _maybe_prefix_query(ex["question"])
        resp = qe.query(q)
        score = judge_pointwise(q, str(resp))

        results.append({
            "id": ex.get("id"),
            "question": ex["question"],
            "answer": str(resp),
            "sources": [
                {
                    "source": (sn.node.metadata or {}).get("source"),
                    "page": (sn.node.metadata or {}).get("page"),
                    "score": sn.score,
                }
                for sn in getattr(resp, "source_nodes", []) or []
            ],
            "score": score
        })

    keys = ["accuracy", "faithfulness", "instruction_following", "fluency", "safety", "overall"]
    avg = {k: round(statistics.mean([r["score"][k] for r in results]), 3) for k in keys}
    return {"summary": avg, "results": results}


def run_pairwise(dataset: List[Dict[str, Any]], top_k=4) -> Dict[str, Any]:
    qe_sut = make_query_engine(SUT_MODEL, top_k=top_k)
    qe_base = make_query_engine(BASELINE_MODEL, top_k=top_k)
    results = []
    for ex in dataset:
        q = _maybe_prefix_query(ex["question"])
        ans_a = str(qe_sut.query(q))
        ans_b = str(qe_base.query(q))
        j = judge_pairwise(q, ans_a, ans_b)

        results.append({
            "id": ex.get("id"),
            "question": ex["question"],
            "sut": ans_a,
            "baseline": ans_b,
            "judge": j
        })

    wins = sum(1 for r in results if r["judge"]["winner"] == "A")    # SUT 승
    losses = sum(1 for r in results if r["judge"]["winner"] == "B")  # SUT 패
    ties = sum(1 for r in results if r["judge"]["winner"] == "tie")
    denom = max(1, wins + losses)
    winrate = round(wins / denom, 3)
    return {"summary": {"wins": wins, "losses": losses, "ties": ties, "winrate": winrate},
            "results": results}


# ---------- CLI ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", type=str, default="eval_dataset.jsonl", help="JSONL with {'id','question'}")
    ap.add_argument("--mode", choices=["pointwise", "pairwise"], default="pointwise")
    ap.add_argument("--top_k", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0, help="0 = use all")
    ap.add_argument("--outdir", type=str, default="results")
    args = ap.parse_args()

    ds_path = Path(args.dataset)
    if not ds_path.exists():
        raise SystemExit(f"Dataset not found: {ds_path}")

    dataset = [json.loads(l) for l in ds_path.read_text(encoding="utf-8").splitlines() if l.strip()]
    if args.limit and args.limit < len(dataset):
        dataset = dataset[:args.limit]

    Path(args.outdir).mkdir(exist_ok=True)

    if args.mode == "pointwise":
        out = run_pointwise(dataset, top_k=args.top_k)
        Path(f"{args.outdir}/geval_pointwise.jsonl").write_text(
            "\n".join(json.dumps(r, ensure_ascii=False) for r in out["results"]),
            encoding="utf-8"
        )
    else:
        out = run_pairwise(dataset, top_k=args.top_k)
        Path(f"{args.outdir}/geval_pairwise.jsonl").write_text(
            "\n".join(json.dumps(r, ensure_ascii=False) for r in out["results"]),
            encoding="utf-8"
        )

    print("\n=== G-Eval Summary ===")
    print(json.dumps(out["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    # 재현성(쌍대비교 순서 랜덤화 등)
    random.seed(42)
    main()
