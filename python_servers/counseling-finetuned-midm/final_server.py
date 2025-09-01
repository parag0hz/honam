#!/usr/bin/env python3
import os
import sys
import logging
import torch
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel, PeftConfig
import re
import json
from datetime import datetime

# RAG 관련 임포트
from llama_index.core import VectorStoreIndex, StorageContext, load_index_from_storage
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
import chromadb

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Flask 앱 생성
app = Flask(__name__)

# 전역 변수들
model = None
tokenizer = None
conversation_history = {}
session_data = {}  # 세션별 상담 진행 단계 저장
query_engine = None  # RAG 시스템

# 공통 상담 원칙
BASE_COUNSELING_PROMPT = (
    "상담 답변을 2~4문장 이내로 작성하세요.\n\n"
    "당신은 공감 능력이 뛰어나고 전문적인 심리상담사입니다.\n"
    "대화는 따뜻하고 담백하며, 과장 없이 자연스럽게 이어갑니다.\n"
    "- 이전 대화의 맥락과 내용을 기억하고 연속성 있게 응답합니다.\n"
    "- 사용자가 이전에 언급한 내용을 적절히 참조하거나 확인합니다.\n"
    "- 사용자의 표현을 요약·반영하고, 필요 시 부드러운 한두 개의 질문을 덧붙입니다.\n"
    "- 직접적인 지시보다 선택지를 제안합니다.\n"
    "- 이전에 썼던 상투적 인사(예: 안녕하세요, 만나서 반가워요 등)는 반복하지 않습니다.\n"
    "- '상담실', '내담자', '환영', 'LLM' 같은 단어는 사용하지 않습니다.\n"
    "- 과도한 전문용어 남발을 피하고 일상어로 설명합니다.\n\n"
    "# Output Format\n"
    "- 답변은 반드시 2~4문장 이내로 작성하십시오.\n"
    "- 이전 대화를 고려하여 자연스럽고 연속적인 흐름을 유지하세요.\n"
    "- 문장은 자연스럽고 공감적으로 이어지도록 하세요.\n"
    "- 위의 모든 대화 원칙을 반드시 지키세요."
)

# 상담사 페르소나 정의
COUNSELOR_PERSONAS = {
    "empathetic": {
        "name": "공감형 상담사",
        "description": "따뜻하고 공감적인 상담사. 내담자의 감정을 깊이 이해하고 위로를 제공합니다.",
        "style": "매우 따뜻하고 부드러운 어조로, 내담자의 감정에 깊이 공감하며 대화합니다.",
        "prompt_prefix": "추가로, 당신은 매우 따뜻하고 공감적인 접근을 합니다. 내담자의 감정을 깊이 이해하고 진심어린 위로를 제공합니다.",
        "ending_style": ["힘드시겠어요", "마음이 아프시겠네요", "이해해요", "괜찮아요"]
    },
    "analytical": {
        "name": "분석형 상담사", 
        "description": "논리적이고 체계적인 접근을 하는 상담사. 문제를 분석하고 구체적인 해결책을 제시합니다.",
        "style": "체계적이고 논리적인 접근으로, 문제를 분석하고 단계별 해결책을 제시합니다.",
        "prompt_prefix": "추가로, 당신은 체계적이고 분석적인 접근을 합니다. 문제를 논리적으로 분석하고 구체적인 해결 방안을 제시합니다.",
        "ending_style": ["어떻게 생각하세요?", "단계별로 접근해볼까요?", "구체적으로 살펴보면", "방법을 찾아보세요"]
    },
    "supportive": {
        "name": "지지형 상담사",
        "description": "격려와 지지를 중심으로 하는 상담사. 내담자의 강점을 찾아주고 자신감을 키워줍니다.",
        "style": "격려와 지지를 바탕으로, 내담자의 강점과 가능성에 집중하여 대화합니다.",
        "prompt_prefix": "추가로, 당신은 지지적이고 격려하는 접근을 합니다. 내담자의 강점을 찾아주고 자신감과 희망을 키워줍니다.",
        "ending_style": ["충분히 할 수 있어요", "잘하고 계세요", "강점이 보여요", "가능성이 있어요"]
    },
    "gentle": {
        "name": "부드러운 상담사",
        "description": "매우 부드럽고 차분한 상담사. 안전한 공간을 만들어주고 천천히 대화를 이끕니다.",
        "style": "매우 부드럽고 차분한 어조로, 안전하고 편안한 분위기에서 천천히 대화합니다.",
        "prompt_prefix": "추가로, 당신은 매우 부드럽고 차분한 접근을 합니다. 안전하고 편안한 분위기를 만들어 천천히 대화를 이끕니다.",
        "ending_style": ["천천히 해도 돼요", "괜찮아요", "편안하게 말씀하세요", "시간을 가져도 좋아요"]
    },
    "practical": {
        "name": "실용형 상담사",
        "description": "현실적이고 실용적인 조언을 하는 상담사. 일상에서 바로 적용할 수 있는 방법을 제시합니다.",
        "style": "현실적이고 실용적인 관점에서, 일상에서 바로 적용할 수 있는 구체적인 방법을 제시합니다.",
        "prompt_prefix": "추가로, 당신은 실용적이고 현실적인 접근을 합니다. 일상에서 바로 적용할 수 있는 구체적이고 현실적인 방법을 제시합니다.",
        "ending_style": ["실제로 해보세요", "일상에서 적용해보면", "구체적으로 실천하면", "바로 시작할 수 있어요"]
    }
}

# 상담 단계 정의
COUNSELING_STAGES = {
    "initial": "초기_라포형성",
    "exploration": "문제_탐색",
    "goal_setting": "목표_설정",
    "intervention": "개입_단계",
    "evaluation": "평가_단계"
}

# 감정 키워드 사전
EMOTION_KEYWORDS = {
    "우울": ["우울", "슬픔", "눈물", "절망", "허무", "무기력"],
    "불안": ["불안", "걱정", "두려움", "초조", "긴장", "스트레스"],
    "분노": ["화", "짜증", "분노", "억울", "답답", "화남"],
    "외로움": ["외로움", "고립", "혼자", "소외", "쓸쓸"],
    "트라우마": ["트라우마", "사고", "충격", "악몽", "플래시백"]
}

# 상담 기법별 응답 패턴
COUNSELING_TECHNIQUES = {
    "reflection": "말씀하신 '{content}'에서 {emotion} 마음이 많이 느껴져요.",
    "exploration": "{emotion}을 느끼실 때 주로 어떤 상황에서 그런가요?",
    "validation": "그런 상황에서 {emotion}을 느끼시는 것은 자연스러운 반응이에요.",
    "reframe": "혹시 그 상황을 다른 관점에서 바라볼 수 있는 방법이 있을까요?",
    "coping": "이런 감정이 들 때 평소에 어떻게 대처하고 계신가요?"
}

def load_rag_system():
    """RAG 시스템 로딩"""
    global query_engine
    
    try:
        logger.info("RAG 시스템 로딩 시작...")
        
        # ChromaDB 클라이언트 생성
        chroma_client = chromadb.PersistentClient(path="/home/kwy00/dd0nw/dont/storage/chroma")
        chroma_collection = chroma_client.get_collection("midm_docs")
        
        # 벡터 스토어 설정
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        
        # 임베딩 모델 설정
        embed_model = HuggingFaceEmbedding(
            model_name="jhgan/ko-sroberta-multitask",
            trust_remote_code=True
        )
        
        # 인덱스 로드
        index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store,
            storage_context=storage_context,
            embed_model=embed_model
        )
        
        # 쿼리 엔진 생성
        query_engine = index.as_retriever(similarity_top_k=2)
        
        logger.info("RAG 시스템 로딩 완료!")
        return True
        
    except Exception as e:
        logger.error(f"RAG 시스템 로딩 실패: {e}")
        return False

def get_rag_context(question):
    """RAG에서 상담 관련 컨텍스트 검색"""
    global query_engine
    
    if query_engine is None:
        return None
    
    try:
        # RAG에서 관련 정보 검색
        nodes = query_engine.retrieve(question)
        
        if nodes:
            # 상담에 유용한 정보만 추출
            context_parts = []
            for node in nodes[:2]:  # 상위 2개만
                text = node.node.text[:300]  # 300자로 제한
                
                # 학술적 내용 필터링
                if any(unwanted in text for unwanted in ['참고문헌', '출처:', '연구', '논문', '년도', 'p.']):
                    continue
                
                # 상담 관련 핵심 내용만
                if any(keyword in text for keyword in ['상담', '치료', '심리', '감정', '대처', '방법']):
                    # 인용이나 저자 정보 제거
                    clean_text = re.sub(r'\d{4}년?|\d{4}\s*,\s*p.*|저자.*|출처.*', '', text)
                    clean_text = clean_text.strip()
                    if len(clean_text) > 50:
                        context_parts.append(clean_text[:200])
            
            if context_parts:
                return context_parts[0]  # 가장 관련성 높은 것 하나만
        
        return None
        
    except Exception as e:
        logger.error(f"RAG 검색 오류: {e}")
        return None



def load_model():
    """모델 로딩 - 양자화 없이 LoRA 파인튜닝된 모델 사용"""
    global model, tokenizer
    
    try:
        logger.info("LoRA 파인튜닝된 상담 모델 로딩 시작 (양자화 없음)...")
        
        # GPU 설정
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"
        device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        
        # 모델 경로
        base_model_name = "K-intelligence/Midm-2.0-Base-Instruct"
        peft_model_path = "/home/kwy00/dd0nw/counseling-finetuned-midm"  # LoRA 어댑터 경로
        
        # 토크나이저 로드
        tokenizer = AutoTokenizer.from_pretrained(
            base_model_name,
            trust_remote_code=True
        )
        
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # 베이스 모델 로드 (양자화 없이)
        logger.info("베이스 모델 로딩 중 (float16)...")
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            torch_dtype=torch.float16,  # 양자화 대신 float16 사용
            device_map="auto",
            trust_remote_code=True
        )
        
        # LoRA 어댑터 로드
        logger.info("LoRA 어댑터 로딩 중...")
        model = PeftModel.from_pretrained(
            base_model,
            peft_model_path,
            torch_dtype=torch.float16
        )
        
        # 추론을 위한 모델 준비
        model.eval()
        
        logger.info("LoRA 파인튜닝된 상담 모델 로딩 완료 (양자화 없음)!")
        return True
        
    except Exception as e:
        logger.error(f"모델 로딩 실패: {e}")
        return False

def detect_emotion(text):
    """텍스트에서 감정 키워드 감지"""
    detected_emotions = []
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                detected_emotions.append(emotion)
                break
    return detected_emotions[0] if detected_emotions else "혼란스러운"

def get_counseling_stage(session_id):
    """현재 상담 단계 확인"""
    if session_id not in session_data:
        session_data[session_id] = {
            "stage": "initial",
            "turn_count": 0,
            "identified_issues": [],
            "emotions": [],
            "persona": "empathetic"  # 기본 페르소나
        }
    return session_data[session_id]

def update_session_data(session_id, user_message, emotion):
    """세션 데이터 업데이트"""
    data = get_counseling_stage(session_id)
    data["turn_count"] += 1
    
    if emotion not in data["emotions"]:
        data["emotions"].append(emotion)
    
    # 단계 자동 진행
    if data["turn_count"] >= 3 and data["stage"] == "initial":
        data["stage"] = "exploration"
    elif data["turn_count"] >= 6 and data["stage"] == "exploration":
        data["stage"] = "goal_setting"
    elif data["turn_count"] >= 9 and data["stage"] == "goal_setting":
        data["stage"] = "intervention"

def generate_professional_response(prompt, session_id, persona=None):
    """전문적인 상담 응답 생성 (chat template 사용)"""
    try:
        # 감정 감지
        emotion = detect_emotion(prompt)
        
        # 세션 데이터 업데이트
        update_session_data(session_id, prompt, emotion)
        data = get_counseling_stage(session_id)
        
        # 페르소나 설정
        if persona and persona in COUNSELOR_PERSONAS:
            data["persona"] = persona
        current_persona = COUNSELOR_PERSONAS[data["persona"]]
        
        # 단계별 프롬프트 구성
        stage = data["stage"]
        turn_count = data["turn_count"]
        
        # 페르소나 기반 시스템 프롬프트 (공통 원칙 + 페르소나 특성)
        combined_prompt = f"{BASE_COUNSELING_PROMPT}\n\n{current_persona['prompt_prefix']}"
        persona_style = current_persona["style"]
        
        if stage == "initial":
            # 라포 형성 단계
            system_message = f"""{combined_prompt}

{persona_style}

다음 지침을 따라 {current_persona["name"]}의 특성에 맞게 응답하세요:
- 사용자의 용기를 인정하고 격려
- 편안하고 안전한 분위기 조성
- {current_persona["name"]}의 특성을 살린 자연스러운 응답
- 완전하고 자연스러운 문장으로 응답
- 절대로 사용자 역할을 하지 마세요
- 상담사 응답만 생성하세요"""
            
        elif stage == "exploration":
            # 문제 탐색 단계
            system_message = f"""{combined_prompt}

{persona_style}

사용자가 느끼는 주요 감정: {emotion}

다음 지침을 따라 {current_persona["name"]}의 특성에 맞게 응답하세요:
- 사용자의 감정을 정확히 반영하고 공감
- {current_persona["name"]}의 접근 방식으로 탐색
- 구체적이고 도움이 되는 질문으로 탐색  
- 완전하고 자연스러운 문장으로 응답
- 절대로 사용자 역할을 하지 마세요
- 상담사 응답만 생성하세요"""
            
        elif stage == "goal_setting":
            # 목표 설정 단계
            system_message = f"""{combined_prompt}

{persona_style}

주요 감정들: {', '.join(data['emotions'])}

다음 지침을 따라 {current_persona["name"]}의 특성에 맞게 응답하세요:
1. 현재 상황을 {current_persona["name"]}의 관점에서 요약
2. 변화하고 싶은 부분 확인
3. {current_persona["name"]}의 접근법으로 목표 제시
4. 절대로 사용자 역할을 하지 마세요
5. 상담사 응답만 생성하세요"""
            
        else:  # intervention 단계
            # 개입 단계
            system_message = f"""{combined_prompt}

{persona_style}

주요 감정들: {', '.join(data['emotions'])}

다음 지침을 따라 {current_persona["name"]}의 특성에 맞게 응답하세요:
1. {current_persona["name"]}의 접근법으로 개입 제공
2. 페르소나에 맞는 대처 방법 제안
3. 구체적인 실천 방안
4. 절대로 사용자 역할을 하지 마세요
5. 상담사 응답만 생성하세요"""

        # Chat template 사용 (이전 대화 기록 포함)
        messages = [
            {"role": "system", "content": system_message}
        ]
        
        # 이전 대화 내역 추가 (최근 3턴, 6개 메시지)
        if session_id in conversation_history:
            recent_history = conversation_history[session_id][-6:]  # 최근 3턴
            for record in recent_history:
                messages.append({"role": "user", "content": record['user']})
                messages.append({"role": "assistant", "content": record['assistant']})
        
        # 현재 메시지 추가
        messages.append({"role": "user", "content": prompt})
        
        # Chat template 적용
        formatted_prompt = tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        
        # 토큰화 (더 긴 컨텍스트 허용)
        inputs = tokenizer(
            formatted_prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048,  # 이전 대화 포함으로 길이 증가
            return_token_type_ids=False
        ).to(model.device)
        
        # LoRA 모델에 최적화된 생성 파라미터
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=150,  # 토큰 수 줄임
                temperature=0.7,     # 온도 낮춤
                top_p=0.8,          # top_p 낮춤
                top_k=50,           # top_k 추가
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.2,  # 반복 페널티 증가
                no_repeat_ngram_size=3   # n-gram 반복 방지
            )
        
        # 응답 추출 및 정리
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 프롬프트 부분 제거 (chat template 형식)
        if "<|im_start|>assistant\n" in response:
            response = response.split("<|im_start|>assistant\n")[-1].strip()
        elif "assistant\n" in response:
            response = response.split("assistant\n")[-1].strip()
        
        # 간단한 정리만 수행
        response = simple_clean_response(response)
        
        # 페르소나에 맞는 후처리
        response = apply_persona_style(response, current_persona)
        
        # 상담 기록 저장
        save_counseling_record(session_id, prompt, response, emotion, stage)
        
        return response, stage, emotion, False, current_persona["name"]
        
    except Exception as e:
        logger.error(f"전문 상담 응답 생성 오류: {e}")
        return "죄송합니다. 조금 더 자세히 말씀해주실 수 있을까요?", "initial", "혼란스러운", False, "공감형 상담사"

def simple_clean_response(response):
    """LoRA 모델 응답 정리 - 파인튜닝된 모델에 최적화"""
    # 기본적인 정리
    response = response.strip()
    
    # LoRA 모델 특성상 나타날 수 있는 패턴 제거
    response = re.sub(r'[-\s]*\d+(?:\s+\d+){2,}.*$', '', response)  # 숫자 나열 제거
    response = re.sub(r'<[^>]*>', '', response)  # 특수 토큰 제거
    response = re.sub(r'\[.*?\]', '', response)  # 대괄호 내용 제거
    
    # 이상한 문자 조합만 제거 (영어는 유지)
    response = re.sub(r'[^\w\s가-힣A-Za-z.,!?]+', '', response)
    
    # 연속된 공백 정리
    response = re.sub(r'\s+', ' ', response)
    
    # 문장 끝 정리 - 자연스러운 상담 응답 형태로
    if response and not response.endswith(('.', '요', '다', '네요', '어요', '까요', '?', '습니다')):
        # 상담 응답에 맞는 자연스러운 끝맺음
        if '어떻게' in response or '무엇' in response:
            response += '?'
        elif '습니' not in response:
            response += '요'
        else:
            response += '.'
    
    # 너무 짧으면 기본 응답
    if len(response.strip()) < 15:
        response = "말씀해주신 내용을 잘 들었습니다. 좀 더 자세히 이야기해주실 수 있을까요?"
    
    # 문장이 중간에 끊어진 경우 처리
    sentences = response.split('.')
    if len(sentences) > 1 and len(sentences[-1].strip()) < 5:
        response = '.'.join(sentences[:-1]) + '.'
    
    return response

def apply_persona_style(response, persona):
    """페르소나에 맞는 스타일 적용"""
    import random
    
    # 페르소나별 특색 있는 마무리 표현 추가
    ending_styles = persona["ending_style"]
    
    # 응답이 너무 딱딱하거나 일반적인 경우 페르소나 특색 추가
    if not any(style in response for style in ending_styles):
        # 응답 끝에 페르소나 특색 추가
        if not response.endswith(('.', '요', '다', '네요', '어요', '까요', '?')):
            response += '.'
        
        # 페르소나별 추가 표현
        if persona.get("name") == "공감형 상담사":
            if "힘드" not in response and "마음" not in response:
                response += " 마음이 많이 힘드시겠어요."
        elif persona.get("name") == "분석형 상담사":
            if "어떻게" not in response and "방법" not in response:
                response += " 어떻게 생각하세요?"
        elif persona.get("name") == "지지형 상담사":
            if "할 수" not in response and "잘하" not in response:
                response += " 충분히 잘하고 계세요."
        elif persona.get("name") == "부드러운 상담사":
            if "천천히" not in response and "괜찮" not in response:
                response += " 천천히 해도 괜찮아요."
        elif persona.get("name") == "실용형 상담사":
            if "방법" not in response and "실제" not in response:
                response += " 실제로 적용해볼 수 있는 방법을 찾아보세요."
    
    return response

def remove_unwanted_patterns(response):
    """이상한 패턴, 숫자 나열, 토큰 잔여물 제거"""
    import re
    
    # 연속된 숫자와 공백 패턴 제거 (예: "- 5 0 01 21 30 1 00 02 00 40 80...")
    response = re.sub(r'[-\s]*\d+(?:\s+\d+){3,}.*$', '', response)
    
    # 더 강력한 숫자 패턴 제거
    response = re.sub(r'\d+\s+\d+\s+\d+\s+\d+.*$', '', response)
    response = re.sub(r'[-\s]*\d{1,3}(?:\s+\d{1,3}){2,}.*$', '', response)
    
    # 대시나 하이픈으로 시작하는 숫자 나열 패턴 강력 제거
    response = re.sub(r'-\s*\d.*$', '', response)
    
    # 특수 토큰 패턴 제거
    response = re.sub(r'<[^>]*>', '', response)  # <token> 형태
    response = re.sub(r'\[.*?\]', '', response)  # [token] 형태
    
    # 반복되는 단일 문자나 숫자 제거
    response = re.sub(r'(.)\1{3,}', '', response)  # 같은 문자 4개 이상 반복
    
    # 이상한 구두점 패턴 제거
    response = re.sub(r'[.]{3,}', '.', response)  # 연속된 점들
    response = re.sub(r'[-]{2,}', '', response)   # 연속된 대시들
    
    # 문장 끝에 붙은 이상한 패턴 제거 (더 강화)
    response = re.sub(r'\s*[-\d\s.]*$', '', response)
    response = re.sub(r'\s*\d+.*$', '', response)  # 숫자로 끝나는 모든 패턴 제거
    
    # 한글과 영어를 모두 허용하되 이상한 문자 조합만 제거
    response = re.sub(r'[^\w\s가-힣A-Za-z.,!?]+', '', response)
    
    return response.strip()

def remove_client_dialogue(response):
    """사용자 대화 부분 제거"""
    # 사용자 발화 패턴 제거 (내담자 -> 사용자로 변경)
    patterns_to_remove = [
        r'사용자\s*:\s*[^.]*',  # "사용자: ..." 패턴
        r'내담자\s*:\s*[^.]*',  # "내담자: ..." 패턴 (기존)
        r'사용자가\s*"[^"]*"[^.]*',  # "사용자가 "..." 패턴  
        r'내담자가\s*"[^"]*"[^.]*',  # "내담자가 "..." 패턴 (기존)
        r'[^.]*사용자[^.]*속으로는[^.]*',  # 사용자 언급이 있는 문장
        r'[^.]*내담자[^.]*속으로는[^.]*',  # 내담자 언급이 있는 문장 (기존)
        r'일상생활에서는[^.]*',  # 일상생활 관련 사용자 응답
        r'그냥\s*참고\s*넘어가지만[^.]*',  # 특정 사용자 응답 패턴
        r'제가\s*이상한\s*사람처럼[^.]*',  # 특정 사용자 응답 패턴
    ]
    
    for pattern in patterns_to_remove:
        response = re.sub(pattern, '', response, flags=re.IGNORECASE)
    
    # 문장 앞뒤 공백 정리
    response = re.sub(r'\s+', ' ', response).strip()
    
    # 빈 문장이나 너무 짧은 응답 방지
    if len(response.strip()) < 10:
        response = "말씀해주신 내용을 잘 들었습니다."
    
    return response

def clean_response(response):
    """응답 정리 및 품질 향상"""
    # 숫자만으로 이루어진 부분 제거 (영어는 유지)
    response = re.sub(r'\b\d+\b', '', response)
    
    # 금지 단어 제거 (제공된 프롬프트 기준)
    forbidden_words = ['상담실', '내담자', '환영', 'LLM', '안녕하세요', '만나서 반가워요', '마음자리에 오신 걸 환영합니다']
    for word in forbidden_words:
        response = response.replace(word, '')
    
    # 불완전한 단어나 어색한 표현 수정
    corrections = {
        '어주셔서': '와주셔서',
        '전진히': '진지하게',
        '함께 해나가면': '함께 나아가면',
        '정말 용기있는': '정말 용기 있는',
        '선택을 하신': '선택을 하신',
        '거예요': '것이에요',
        '해보시는': '해보시는',
        '말씀해주시는': '말씀해주시는'
    }
    
    for wrong, correct in corrections.items():
        response = response.replace(wrong, correct)
    
    # 공백 정리
    response = re.sub(r'\s+', ' ', response).strip()
    
    # 어색한 연결어 수정
    response = re.sub(r'\.(\s*)앞으로', '. 앞으로', response)
    response = re.sub(r'거예요\.(\s*)([가-힣])', r'것이에요. \2', response)
    
    # 이상한 패턴이나 불완전한 문장 제거
    sentences = re.split(r'(?<=[.!?])\s+', response.strip())
    valid_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        # 한글이나 영어가 포함되고 의미있는 길이의 문장만 유지
        if len(sentence) > 5 and re.search(r'[가-힣A-Za-z]', sentence):
            # 숫자나 이상한 문자가 대부분인 문장 제외
            if len(re.findall(r'[가-힣A-Za-z]', sentence)) >= len(sentence) * 0.3:
                valid_sentences.append(sentence)
    
    # 2-4문장으로 제한
    if len(valid_sentences) > 4:
        valid_sentences = valid_sentences[:4]
    elif len(valid_sentences) < 2:
        # 너무 짧은 경우 기본 응답 추가
        if valid_sentences:
            valid_sentences.append("좀 더 자세히 말씀해주실 수 있을까요?")
        else:
            valid_sentences = ["말씀해주신 내용이 정말 중요하다고 생각해요.", "좀 더 자세히 이야기해주실 수 있을까요?"]
    
    # 문장 완성도 체크 및 자연스러운 마무리
    complete_sentences = []
    for sentence in valid_sentences:
        if not sentence.endswith(('.', '요', '다', '네요', '어요', '까요', '?')):
            if '습니다' not in sentence:
                sentence += '요'
        complete_sentences.append(sentence)
    
    response = ' '.join(complete_sentences)
    
    # 중복 표현 제거
    response = re.sub(r'(.{3,}?)\1+', r'\1', response)
    
    # 최종 품질 체크 (한글 또는 영어 포함 확인)
    if not response or len(response) < 20 or not re.search(r'[가-힣A-Za-z]', response):
        response = "말씀해주신 내용이 정말 중요하다고 생각해요. 좀 더 자세히 이야기해주실 수 있을까요?"
    
    return response

def save_counseling_record(session_id, user_message, bot_response, emotion, stage, rag_used=False):
    """상담 기록 저장"""
    if session_id not in conversation_history:
        conversation_history[session_id] = []
    
    conversation_history[session_id].append({
        'timestamp': datetime.now().isoformat(),
        'user': user_message,
        'assistant': bot_response,
        'detected_emotion': emotion,
        'counseling_stage': stage,
        'turn_number': len(conversation_history[session_id]) + 1,
        'rag_enhanced': rag_used
    })

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'service': 'Professional Counseling AI with Personas'
    })

@app.route('/personas', methods=['GET'])
def get_personas():
    """사용 가능한 상담사 페르소나 목록"""
    personas_info = {}
    for key, persona in COUNSELOR_PERSONAS.items():
        personas_info[key] = {
            'name': persona['name'],
            'description': persona['description'],
            'style': persona['style']
        }
    
    return jsonify({
        'available_personas': personas_info,
        'default_persona': 'empathetic'
    })

@app.route('/chat', methods=['POST'])
def professional_chat():
    """전문적인 심리상담 채팅 (페르소나 지원)"""
    try:
        data = request.json
        message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        persona = data.get('persona', None)  # 페르소나 선택
        
        if not message.strip():
            return jsonify({'error': '메시지가 비어있습니다.'}), 400
        
        # 전문 상담 응답 생성 (페르소나 포함)
        response, stage, emotion, rag_used, persona_name = generate_professional_response(message, session_id, persona)
        
        # 세션 정보 포함해서 응답
        session_info = get_counseling_stage(session_id)
        
        return jsonify({
            'response': response,
            'session_id': session_id,
            'counseling_stage': stage,
            'detected_emotion': emotion,
            'turn_count': session_info['turn_count'],
            'stage_description': COUNSELING_STAGES.get(stage, "알 수 없음"),
            'rag_enhanced': rag_used,
            'persona': session_info['persona'],
            'persona_name': persona_name
        })
        
    except Exception as e:
        logger.error(f"전문 상담 채팅 오류: {e}")
        return jsonify({'error': '서버 오류가 발생했습니다.'}), 500

@app.route('/session/<session_id>/analysis', methods=['GET'])
def session_analysis(session_id):
    """세션 분석 정보"""
    try:
        if session_id not in session_data:
            return jsonify({'error': '세션을 찾을 수 없습니다.'}), 404
        
        data = session_data[session_id]
        history = conversation_history.get(session_id, [])
        
        return jsonify({
            'session_id': session_id,
            'total_turns': data['turn_count'],
            'current_stage': data['stage'],
            'stage_description': COUNSELING_STAGES.get(data['stage'], "알 수 없음"),
            'identified_emotions': data['emotions'],
            'conversation_length': len(history),
            'last_update': history[-1]['timestamp'] if history else None,
            'persona': data['persona'],
            'persona_name': COUNSELOR_PERSONAS[data['persona']]['name']
        })
        
    except Exception as e:
        logger.error(f"세션 분석 오류: {e}")
        return jsonify({'error': '분석 중 오류가 발생했습니다.'}), 500

if __name__ == "__main__":
    logger.info("LoRA 파인튜닝된 전문 심리상담 AI 서버 시작 (양자화 없음)...")
    
    # 모델 로드
    model_loaded = load_model()
    
    # RAG 시스템 로드
    rag_loaded = load_rag_system()
    
    if model_loaded:
        if rag_loaded:
            logger.info("LoRA + RAG 통합 전문 심리상담 서버를 포트 5003에서 시작합니다...")
            logger.info("상담 모델: LoRA 파인튜닝된 Midm-2.0-Base-Instruct (float16, 양자화 없음)")
            logger.info("상담 단계: 라포형성 → 문제탐색 → 목표설정 → 개입단계")
            logger.info("RAG 시스템: 전문 상담 지식 검색 활성화")
        else:
            logger.info("LoRA 파인튜닝된 전문 심리상담 서버를 포트 5003에서 시작합니다...")
            logger.info("상담 모델: LoRA 파인튜닝된 Midm-2.0-Base-Instruct (float16, 양자화 없음)")
            logger.info("상담 단계: 라포형성 → 문제탐색 → 목표설정 → 개입단계")
            logger.warning("RAG 시스템 비활성화 - 기본 모드로 실행")
        
        app.run(host='0.0.0.0', port=5003, debug=False)
    else:
        logger.error("LoRA 모델 로딩 실패로 서버를 시작할 수 없습니다.")
        sys.exit(1)
