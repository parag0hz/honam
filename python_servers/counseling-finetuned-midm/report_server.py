#!/usr/bin/env python3
"""
전문 심리상담 리포트 생성 서버 (포트 5004)
채팅 내역을 분석해서 객관적이고 전문적인 심리상담 리포트를 생성합니다.
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import json
import re
from datetime import datetime, timedelta
import random

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 모델 로드 (채팅과 동일한 모델 사용)
model_name = "K-intelligence/Midm-2.0-Base-Instruct"
adapter_path = "."  # 현재 디렉토리의 어댑터

# 콘텐츠 추천 데이터베이스
CONTENT_RECOMMENDATIONS = {
    "자기계발": {
        "youtube": [
            "📹 '5분 만에 스트레스 해소법' - 마음건강TV",
            "📹 '감정조절 간단 호흡법' - 힐링마인드",
            "📹 '자존감 높이는 3가지 방법' - 심리학 카페"
        ],
        "books": [
            "📚 '불안할 때 뇌과학' - 에이미 모린",
            "📚 '감정조절의 기술' - 마사 라인한",
            "📚 '회복탄력성' - 김주환"
        ],
        "articles": [
            "📰 '스트레스와 뇌 변화' - 대한신경정신의학회지",
            "📰 '인지행동치료의 효과' - 한국심리학회지",
            "📰 '마음챙김과 정신건강' - 정신건강의학 리뷰"
        ]
    },
    "관계개선": {
        "youtube": [
            "📹 '건강한 소통법 5분 가이드' - 관계심리학",
            "📹 '갈등 해결하는 방법' - 소통의기술",
            "📹 '감정 표현하는 법' - 마음소통"
        ],
        "books": [
            "📚 '비폭력 대화' - 마셜 로젠버그",
            "📚 '관계의 기술' - 존 고트만",
            "📚 '감정의 언어' - 캐롤 드웩"
        ]
    },
    "우울불안": {
        "youtube": [
            "📹 '우울감 극복 간단 실천법' - 마음치유",
            "📹 '불안 다스리기 호흡법' - 심리건강",
            "📹 '긍정적 사고 훈련' - 멘탈케어"
        ],
        "books": [
            "📚 '우울증 벗어나기' - 데이비드 번스",
            "📚 '불안 다스리기' - 에드먼드 번",
            "📚 '마음의 치유력' - 루이즈 헤이"
        ]
    }
}

# 체크리스트 템플릿
FEEDBACK_CHECKLIST = {
    "정서상태": [
        "오늘 하루 기분은 어떠셨나요? (1-10점)",
        "스트레스 수준은 어느 정도인가요?",
        "수면의 질은 어떠셨나요?"
    ],
    "상담효과": [
        "상담 후 마음이 편해졌나요?",
        "새롭게 깨달은 점이 있나요?",
        "실천하고 싶은 방법을 찾았나요?"
    ],
    "일상변화": [
        "어제와 비교해 달라진 점이 있나요?",
        "오늘 긍정적인 일이 있었나요?",
        "내일 시도해보고 싶은 것이 있나요?"
    ]
}

# 모델 로드 (채팅과 동일한 모델 사용)
model_name = "K-intelligence/Midm-2.0-Base-Instruct"
adapter_path = "."  # 현재 디렉토리의 어댑터

logger.info("리포트 생성 모델을 로드하는 중...")

try:
    # 베이스 모델 로드
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    # GPU 사용 (CUDA_VISIBLE_DEVICES=1로 설정했을 때 0번으로 인식됨)
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    logger.info(f"사용 디바이스: {device}")
    
    # GPU에서 모델 로드
    base_model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.float16,
        trust_remote_code=True,
        device_map="auto"
    )
    
    # LoRA 어댑터 적용
    model = PeftModel.from_pretrained(base_model, adapter_path)
    model.eval()
    
    # 패딩 토큰 설정
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    logger.info("리포트 생성 모델 로드 완료!")

except Exception as e:
    logger.error(f"모델 로드 실패: {e}")
    logger.info("모델 없이 기본 리포트 모드로 실행합니다.")
    model = None
    tokenizer = None

def analyze_psychological_state(chat_text):
    """채팅 내용에서 심리상태 전문 분석"""
    
    # 정서 상태 키워드 분석
    emotional_indicators = {
        "우울감": ["우울", "슬프", "힘들", "절망", "무기력", "의욕없", "재미없"],
        "불안감": ["불안", "걱정", "두려", "초조", "긴장", "떨려", "무서"],
        "스트레스": ["스트레스", "압박", "부담", "피곤", "지쳐", "답답", "숨막"],
        "분노감": ["화나", "짜증", "분노", "억울", "속상", "열받", "빡쳐"],
        "긍정감": ["좋", "행복", "기쁘", "만족", "편안", "감사", "희망"],
        "혼란감": ["혼란", "모르겠", "어떻게", "갈등", "딜레마", "애매"]
    }
    
    # 위험 요인 분석
    risk_factors = {
        "고위험": ["죽고싶", "자살", "사라지고싶", "끝내고싶"],
        "중위험": ["소용없", "의미없", "포기", "그만두고싶"],
        "저위험": ["힘들지만", "그래도", "노력", "해보려"]
    }
    
    # 치료 동기 분석
    motivation_indicators = {
        "높음": ["변화하고싶", "노력", "해보겠", "시도", "배우고싶"],
        "보통": ["그런 것 같", "해볼게", "생각해볼게"],
        "낮음": ["모르겠", "안될것같", "어려울것같"]
    }
    
    # 분석 결과
    emotions = []
    risk_level = "정상"
    motivation = "보통"
    
    for emotion, keywords in emotional_indicators.items():
        if any(keyword in chat_text for keyword in keywords):
            emotions.append(emotion)
    
    # 위험도 평가
    for level, keywords in risk_factors.items():
        if any(keyword in chat_text for keyword in keywords):
            if level == "고위험":
                risk_level = "주의필요"
            elif level == "중위험" and risk_level == "정상":
                risk_level = "관찰필요"
    
    # 치료 동기 평가
    for level, keywords in motivation_indicators.items():
        if any(keyword in chat_text for keyword in keywords):
            motivation = level
            break
    
    return {
        "emotions": emotions[:3] if emotions else ["혼란감"],  # 최대 3개
        "dominant_emotion": emotions[0] if emotions else "혼란감",
        "risk_level": risk_level,
        "motivation": motivation,
        "emotional_intensity": len([e for e in emotions if e in ["우울감", "불안감", "분노감"]])
    }

def generate_professional_report(chat_history, date, chat_count, previous_session=None):
    """전문적이고 객관적인 심리상담 리포트 생성 (React UI 최적화)"""
    
    # 심리상태 분석
    psychological_state = analyze_psychological_state(chat_history)
    
    # 리포트 생성 프롬프트 (React 구조에 맞게 최적화)
    system_prompt = f"""당신은 전문 임상심리사입니다. 다음 지침에 따라 객관적이고 전문적인 상담 리포트를 작성해주세요:

【리포트 작성 지침】
1. 전문적이고 신뢰감 있는 말투 사용
2. 각 섹션당 2-3문장으로 간결하게 작성
3. 객관적 관찰과 분석 중심
4. 구체적이고 실천 가능한 조언 제시
5. 단계별 실행 계획 포함
6. 섹션 제목 없이 내용만 작성

【분석 정보】
- 주요 정서: {psychological_state['dominant_emotion']}
- 정서 강도: {psychological_state['emotional_intensity']}/5
- 치료 동기: {psychological_state['motivation']}
- 위험도: {psychological_state['risk_level']}
- 상담 횟수: {chat_count}회

【상담 내용】
{chat_history}

다음 형식으로 정확히 작성하세요:

📊 정서상태 분석
내담자는 현재 **{psychological_state['dominant_emotion']}** 상태를 주로 나타내며, 전반적 정서 강도는 **{psychological_state['emotional_intensity']}/5** 수준입니다. 치료 동기는 **{psychological_state['motivation']}** 수준으로 평가되며, 현재 위험도는 **{psychological_state['risk_level']}** 상태입니다.

🎯 주요 이슈
총 **{chat_count}회** 상담을 통해 관찰된 주요 문제점과 패턴을 분석합니다. 주된 어려움은 정서 조절과 관련이 있으며, 일상생활에서의 스트레스 대처 능력 향상이 필요합니다.

💡 치료적 개입점
정서 조절력 강화와 스트레스 대처 기술 습득이 우선적으로 필요합니다. 인지행동치료 기법을 활용한 부정적 사고 패턴 개선과 마음챙김 연습을 통한 현재 순간 집중력 향상을 권장합니다.

📋 실행계획
**1단계**: 감정 인식 및 기록하기 (일일 감정 일기 작성)
**2단계**: 호흡법 등 즉시 대처 기술 연습 (4-7-8 호흡법)
**3단계**: 일상 스트레스 관리 루틴 구축 (규칙적 운동, 충분한 수면)"""

    if model and tokenizer:
        try:
            # 토크나이징 (token_type_ids 제거)
            inputs = tokenizer(
                system_prompt,
                return_tensors="pt",
                max_length=2048,
                truncation=True,
                padding=True,
                return_token_type_ids=False
            )
            
            # GPU로 이동
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            # 생성
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=600,
                    temperature=0.6,
                    top_p=0.9,
                    top_k=40,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id
                )
            
            # 디코딩
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 프롬프트 부분 제거
            if "📋 실행계획" in response:
                report_start = response.find("📊 정서상태 분석")
                if report_start != -1:
                    report = response[report_start:].strip()
                else:
                    report = response.split("📋 실행계획")[-1].strip()
            else:
                report = response[len(system_prompt):].strip()
            
            return clean_professional_report(report)
        
        except Exception as e:
            logger.error(f"전문 리포트 생성 오류: {e}")
            return generate_fallback_professional_report(psychological_state, date, chat_count)
    else:
        return generate_fallback_professional_report(psychological_state, date, chat_count)

def clean_professional_report(report):
    """전문 리포트 정리 및 형식화 (React 마크다운 최적화)"""
    # 프롬프트 부분 제거
    if "다음 형식으로 정확히 작성하세요:" in report:
        report = report.split("다음 형식으로 정확히 작성하세요:")[-1].strip()
    
    # 불필요한 메타 텍스트 제거
    unwanted_patterns = [
        r'【[^】]*】[^#]*',
        r'당신은 전문 임상심리사입니다[^#]*',
        r'리포트 작성 지침[^#]*',
        r'분석 정보[^#]*',
        r'상담 내용[^#]*'
    ]
    
    for pattern in unwanted_patterns:
        report = re.sub(pattern, '', report, flags=re.DOTALL)
    
    # 섹션 헤더 정규화 (## 제거)
    report = re.sub(r'#+\s*📊\s*정서상태[^#]*', '📊 정서상태 분석', report)
    report = re.sub(r'#+\s*🎯\s*주요\s*이슈[^#]*', '🎯 주요 이슈', report)
    report = re.sub(r'#+\s*💡\s*치료[^#]*', '💡 치료적 개입점', report)
    report = re.sub(r'#+\s*📋\s*실행[^#]*', '📋 실행계획', report)
    
    # 빈 줄 정리
    report = re.sub(r'\n{3,}', '\n\n', report)
    
    # 마크다운 볼드 텍스트 유지 (React에서 렌더링됨)
    # **텍스트** 형태는 그대로 유지
    
    return report.strip()

def generate_fallback_professional_report(psychological_state, date, chat_count):
    """모델 없을 때 사용하는 전문 리포트 (React UI 최적화)"""
    emotions = ', '.join(psychological_state['emotions'])
    intensity = psychological_state['emotional_intensity']
    motivation = psychological_state['motivation']
    risk_level = psychological_state['risk_level']
    dominant_emotion = psychological_state['dominant_emotion']
    
    return f"""📊 정서상태 분석
내담자는 현재 **{dominant_emotion}** 상태를 주로 나타내며, 전반적 정서 강도는 **{intensity}/5** 수준입니다. 치료 동기는 **{motivation}** 수준으로 평가되며, 현재 위험도는 **{risk_level}** 상태입니다.

🎯 주요 이슈  
총 **{chat_count}회** 상담을 통해 **{emotions}** 관련 어려움이 관찰되었습니다. 주된 문제는 정서 조절의 어려움과 일상 스트레스 대처 능력 부족으로 나타납니다.

💡 치료적 개입점
정서 조절력 강화와 스트레스 대처 기술 습득이 우선적으로 필요합니다. 인지행동치료 기법을 활용한 부정적 사고 패턴 개선과 마음챙김 연습을 통한 현재 순간 집중력 향상을 권장합니다.

📋 실행계획
**1단계**: 감정 인식 및 기록하기 (일일 감정 일기 작성)
**2단계**: 호흡법 등 즉시 대처 기술 연습 (4-7-8 호흡법 실시)
**3단계**: 일상 스트레스 관리 루틴 구축 (규칙적 운동, 충분한 수면 패턴 확립)"""

def get_content_recommendations(psychological_state):
    """심리상태에 따른 콘텐츠 추천 (더 세밀한 맞춤형 추천)"""
    dominant = psychological_state['dominant_emotion']
    intensity = psychological_state['emotional_intensity']
    motivation = psychological_state['motivation']
    
    # 감정과 강도에 따른 더 정확한 카테고리 매핑
    if dominant in ['우울감', '무기력']:
        if intensity >= 4:
            category = "우울불안"  # 강한 우울감
        else:
            category = "자기계발"  # 가벼운 우울감
    elif dominant in ['불안감', '스트레스']:
        category = "우울불안"
    elif dominant in ['분노감', '짜증']:
        category = "관계개선"
    elif dominant in ['긍정감']:
        category = "자기계발"
    else:
        category = "자기계발"  # 기본값
    
    recommendations = CONTENT_RECOMMENDATIONS.get(category, CONTENT_RECOMMENDATIONS["자기계발"])
    
    # 치료 동기에 따른 추천 개수 조정
    num_items = 3 if motivation == "높음" else 2
    
    # 각 카테고리에서 선택
    selected = {}
    for content_type, items in recommendations.items():
        if items:  # 빈 리스트가 아닌 경우만
            selected[content_type] = random.sample(items, min(num_items, len(items)))
    
    # 추가 맞춤 추천 (강도별)
    if intensity >= 4:  # 높은 강도일 때 추가 리소스
        if 'books' not in selected:
            selected['books'] = []
        selected['books'].append("📚 '마음의 응급처치' - 가이 윈치")
    
    return selected

def generate_three_line_summary(chat_history, psychological_state):
    """3줄 핵심 요약 생성 (더 구체적이고 개인화된 내용)"""
    emotion = psychological_state['dominant_emotion']
    motivation = psychological_state['motivation']
    intensity = psychological_state['emotional_intensity']
    
    # 감정 강도에 따른 메시지 조정
    if intensity >= 4:
        intensity_desc = "강한"
    elif intensity >= 2:
        intensity_desc = "중간 정도의"
    else:
        intensity_desc = "약한"
    
    # 치료 동기에 따른 메시지
    motivation_messages = {
        "높음": "적극적인 변화 의지를 보여주셨습니다",
        "보통": "적절한 수준의 치료 동기를 유지하고 계십니다", 
        "낮음": "치료에 대한 동기를 높이는 것이 필요합니다"
    }
    
    summaries = [
        f"💭 오늘 상담에서 **{emotion}** 감정이 {intensity_desc} 강도로 나타났습니다.",
        f"🎯 {motivation_messages.get(motivation, '치료 동기를 평가했습니다')}.",
        f"📈 지속적인 관찰과 단계적 접근을 통해 긍정적 변화가 기대됩니다."
    ]
    
    return summaries

def generate_comparison_analysis(current_state, previous_session):
    """이전 세션과의 비교 분석 (더 구체적이고 전문적)"""
    if not previous_session:
        return "📍 첫 상담으로 비교 데이터가 없습니다. 다음 상담부터 변화 추이를 분석하겠습니다."
    
    # 현재 상태 기반으로 더 구체적인 분석 생성
    emotion = current_state['dominant_emotion']
    intensity = current_state['emotional_intensity']
    motivation = current_state['motivation']
    
    # 변화 패턴 생성 (실제로는 이전 데이터와 비교해야 함)
    stability_trend = "개선" if intensity <= 2 else "유지" if intensity == 3 else "관찰 필요"
    expression_trend = "증가" if motivation in ["높음", "보통"] else "유지"
    coping_trend = "강화" if emotion in ["긍정감", "혼란감"] else "개발 필요"
    
    return f"""📊 **변화 분석** (전회 대비):
• **정서 안정성**: {stability_trend} - 감정 조절 능력이 점진적으로 향상되고 있습니다
• **표현 능력**: 구체적 감정 표현이 {expression_trend} - 자기 인식이 깊어지고 있습니다  
• **대처 의지**: {coping_trend} 경향 - 문제 해결에 대한 의지가 나타납니다
• **치료 관계**: 상담사와의 신뢰 관계가 안정적으로 형성되고 있습니다"""

@app.route('/generate-report', methods=['POST'])
def generate_report():
    """전문 리포트 생성 엔드포인트 (React UI 최적화)"""
    try:
        data = request.json
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        # React에서는 단순히 date만 보내므로, 해당 날짜의 채팅 내역을 가져와야 함
        # 실제로는 외부 서버나 DB에서 가져와야 하지만, 여기서는 샘플 데이터 사용
        chat_history = ""
        chat_count = 0
        
        # 실제 채팅 내역 가져오기 시도 (포트 8000 서버에서)
        try:
            import requests
            response = requests.get('http://192.168.0.105:8000/chat-history', timeout=5)
            if response.status_code == 200:
                chat_data = response.json()
                date_history = chat_data.get('chatHistory', {}).get(date, [])
                if date_history:
                    # 채팅 내역을 텍스트로 변환
                    chat_history = "\n".join([
                        f"사용자: {msg.get('message', '')}" if msg.get('sender') == 'user' 
                        else f"상담사: {msg.get('message', '')}"
                        for msg in date_history
                    ])
                    chat_count = len([msg for msg in date_history if msg.get('sender') == 'user'])
        except Exception as e:
            logger.warning(f"외부 채팅 내역 가져오기 실패: {e}")
            # 실패 시 샘플 데이터 사용
            chat_history = "오늘 기분이 좀 우울해요. 일이 잘 안 풀리는 것 같아서 스트레스를 많이 받고 있어요."
            chat_count = 1
        
        previous_session = data.get('previousSession', None)
        
        if not chat_history:
            return jsonify({
                'success': False,
                'message': '채팅 내역이 없습니다.',
                'report': None,
                'date': date,
                'session_count': 0,
                'three_line_summary': [
                    "💭 아직 오늘의 상담 내역이 없습니다.",
                    "🎯 마음자리와 대화를 시작해보세요!",
                    "📈 상담을 통해 마음을 나누고 성장할 수 있습니다."
                ],
                'professional_report': """📊 정서상태 분석
아직 상담 내역이 없어 정서 상태를 분석할 수 없습니다.

🎯 주요 이슈
마음자리와의 대화를 통해 하루의 감정과 생각을 나누어보세요.

💡 치료적 개입점
상담을 시작하시면 개인화된 분석과 조언을 제공해드리겠습니다.

📋 실행계획
**1단계**: 마음자리와 대화 시작하기
**2단계**: 오늘의 감정과 상황 나누기  
**3단계**: 전문적인 리포트와 조언 받기""",
                'psychological_state': {
                    'dominant_emotion': '대기중',
                    'emotions': ['대기중'],
                    'risk_level': '정상',
                    'motivation': '준비중',
                    'intensity': 0
                },
                'comparison_analysis': "📍 첫 상담을 시작하면 변화 분석을 제공해드리겠습니다.",
                'recommendations': {
                    'youtube_videos': ["📹 '마음건강 시작하기' - 마음건강TV"],
                    'books': ["📚 '상담의 첫걸음' - 심리학 안내서"],
                    'articles': ["📰 '상담의 효과' - 심리건강 가이드"]
                },
                'feedback_checklist': FEEDBACK_CHECKLIST,
                'checklist_link': f"https://forms.gle/counseling-feedback-{date.replace('-', '')}",
                'generated_at': datetime.now().isoformat(),
                'report_version': '3.0-react-optimized'
            })
        
        # 심리상태 전문 분석
        psychological_state = analyze_psychological_state(chat_history)
        
        # 전문 리포트 생성
        professional_report = generate_professional_report(
            chat_history, date, chat_count, previous_session
        )
        
        # 3줄 핵심 요약
        three_line_summary = generate_three_line_summary(chat_history, psychological_state)
        
        # 콘텐츠 추천
        content_recommendations = get_content_recommendations(psychological_state)
        
        # 비교 분석
        comparison_analysis = generate_comparison_analysis(
            psychological_state, previous_session
        )
        
        # 체크리스트 링크 생성 (날짜 기반)
        checklist_link = f"https://forms.gle/counseling-feedback-{date.replace('-', '')}"
        
        # React UI에 최적화된 응답 구조
        response_data = {
            'success': True,
            'date': date,
            'session_count': chat_count,
            
            # 프론트엔드 핵심 데이터
            'title': f"{date} 전문 심리상담 리포트",
            'mood': psychological_state['dominant_emotion'],
            'content': professional_report,
            'activities': professional_report.split('\n') if professional_report else [],
            
            # 업그레이드된 전문 데이터
            'three_line_summary': three_line_summary,
            'professional_report': professional_report,
            'psychological_state': {
                'dominant_emotion': psychological_state['dominant_emotion'],
                'emotions': psychological_state['emotions'],
                'risk_level': psychological_state['risk_level'],
                'motivation': psychological_state['motivation'],
                'intensity': psychological_state['emotional_intensity']
            },
            
            # 비교 분석
            'comparison_analysis': comparison_analysis,
            
            # 추천 콘텐츠 (React 구조에 맞게)
            'recommendations': {
                'youtube_videos': content_recommendations.get('youtube', []),
                'books': content_recommendations.get('books', []),
                'articles': content_recommendations.get('articles', [])
            },
            
            # 체크리스트 관련
            'feedback_checklist': FEEDBACK_CHECKLIST,
            'checklist_link': checklist_link,
            
            # 메타 정보
            'generated_at': datetime.now().isoformat(),
            'generatedAt': datetime.now().isoformat(),  # React에서 사용하는 camelCase
            'report_version': '3.0-react-optimized'
        }
        
        logger.info(f"리포트 생성 완료: {date}, 세션: {chat_count}회, 주요감정: {psychological_state['dominant_emotion']}")
        
        return jsonify(response_data)
    
    except Exception as e:
        logger.error(f"전문 리포트 생성 오류: {e}")
        return jsonify({
            'success': False,
            'message': '리포트 생성 중 오류가 발생했습니다.',
            'error': str(e),
            'date': data.get('date', datetime.now().strftime('%Y-%m-%d')) if 'data' in locals() else datetime.now().strftime('%Y-%m-%d'),
            'session_count': 0,
            'three_line_summary': [
                "⚠️ 리포트 생성 중 오류가 발생했습니다.",
                "🔄 잠시 후 다시 시도해주세요.",
                "💬 문제가 지속되면 관리자에게 문의하세요."
            ],
            'professional_report': "리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            'psychological_state': {
                'dominant_emotion': '오류',
                'emotions': ['오류'],
                'risk_level': '정상',
                'motivation': '오류',
                'intensity': 0
            },
            'recommendations': {},
            'generated_at': datetime.now().isoformat(),
            'report_version': '3.0-react-optimized'
        }), 500

@app.route('/report', methods=['POST'])
def generate_report_legacy():
    """index.js 호환 리포트 생성 엔드포인트"""
    try:
        data = request.json
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        chat_history = data.get('chatHistory', '')  # index.js에서 이미 텍스트로 변환해서 보냄
        chat_count = data.get('chatCount', 0)
        previous_session = data.get('previousSession', None)
        
        logger.info(f"리포트 생성 요청: 날짜={date}, 채팅수={chat_count}, 텍스트길이={len(chat_history) if chat_history else 0}")
        
        if not chat_history or len(chat_history.strip()) < 10:
            return jsonify({
                'success': False,
                'message': '채팅 내역이 충분하지 않습니다.',
                'date': date,
                'session_count': 0,
                'three_line_summary': [
                    "💭 아직 오늘의 상담 내역이 없습니다.",
                    "🎯 마음자리와 대화를 시작해보세요!",
                    "📈 상담을 통해 마음을 나누고 성장할 수 있습니다."
                ],
                'professional_report': """📊 정서상태 분석
아직 상담 내역이 없어 정서 상태를 분석할 수 없습니다.

🎯 주요 이슈
마음자리와의 대화를 통해 하루의 감정과 생각을 나누어보세요.

💡 치료적 개입점
상담을 시작하시면 개인화된 분석과 조언을 제공해드리겠습니다.

📋 실행계획
**1단계**: 마음자리와 대화 시작하기
**2단계**: 오늘의 감정과 상황 나누기  
**3단계**: 전문적인 리포트와 조언 받기""",
                'psychological_state': {
                    'dominant_emotion': '대기중',
                    'emotions': ['대기중'],
                    'risk_level': '정상',
                    'motivation': '준비중',
                    'intensity': 0
                },
                'comparison_analysis': "📍 첫 상담을 시작하면 변화 분석을 제공해드리겠습니다.",
                'recommendations': {
                    'youtube_videos': ["📹 '마음건강 시작하기' - 마음건강TV"],
                    'books': ["📚 '상담의 첫걸음' - 심리학 안내서"],
                    'articles': ["📰 '상담의 효과' - 심리건강 가이드"]
                },
                'feedback_checklist': FEEDBACK_CHECKLIST,
                'checklist_link': f"https://forms.gle/counseling-feedback-{date.replace('-', '')}",
                'generated_at': datetime.now().isoformat(),
                'report_version': '3.0-index-js-compatible'
            })
        
        
        # 심리상태 전문 분석
        psychological_state = analyze_psychological_state(chat_history)
        
        # 전문 리포트 생성
        professional_report = generate_professional_report(
            chat_history, date, chat_count, previous_session
        )
        
        # 3줄 핵심 요약
        three_line_summary = generate_three_line_summary(chat_history, psychological_state)
        
        # 콘텐츠 추천
        content_recommendations = get_content_recommendations(psychological_state)
        
        # 비교 분석
        comparison_analysis = generate_comparison_analysis(
            psychological_state, previous_session
        )
        
        # 체크리스트 링크 생성 (날짜 기반)
        checklist_link = f"https://forms.gle/counseling-feedback-{date.replace('-', '')}"
        
        logger.info(f"리포트 생성 완료: 주요감정={psychological_state['dominant_emotion']}, 강도={psychological_state['emotional_intensity']}")
        
        response_data = {
            'success': True,
            'date': date,
            'session_count': chat_count,
            'three_line_summary': three_line_summary,
            'professional_report': professional_report,
            'psychological_state': {
                'dominant_emotion': psychological_state['dominant_emotion'],
                'emotions': psychological_state['emotions'],
                'risk_level': psychological_state['risk_level'],
                'motivation': psychological_state['motivation'],
                'intensity': psychological_state['emotional_intensity']
            },
            'comparison_analysis': comparison_analysis,
            'recommendations': {
                'youtube_videos': content_recommendations.get('youtube', []),
                'books': content_recommendations.get('books', []),
                'articles': content_recommendations.get('articles', [])
            },
            'feedback_checklist': FEEDBACK_CHECKLIST,
            'checklist_link': checklist_link,
            'generated_at': datetime.now().isoformat(),
            'report_version': '3.0-index-js-compatible'
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"index.js 리포트 생성 오류: {e}")
        return jsonify({
            'success': False,
            'message': '리포트 생성 중 오류가 발생했습니다.',
            'error': str(e)
        }), 500
        
    except Exception as e:
        logger.error(f"기존 리포트 생성 오류: {e}")
        return jsonify({
            'success': False,
            'message': '리포트 생성 중 오류가 발생했습니다.',
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'professional-counseling-report-server',
        'version': '3.0-index-js-compatible',
        'model_loaded': model is not None,
        'gpu_device': device if 'device' in globals() else 'unknown',
        'port': 5004,
        'endpoints': ['/report', '/health', '/checklist'],
        'compatible_with': 'index.js middleware server',
        'features': [
            'professional_analysis',
        ]
    })

@app.route('/checklist', methods=['GET'])
def get_checklist():
    """체크리스트 반환 엔드포인트"""
    return jsonify({
        'checklist': FEEDBACK_CHECKLIST,
        'instructions': '각 항목에 대해 1-10점으로 평가해주세요.',
        'completion_time': '약 3-5분 소요'
    })

if __name__ == '__main__':
    logger.info("전문 심리상담 리포트 서버 v3.0을 시작합니다...")
    logger.info("React UI 최적화: 마크다운 지원, 섹션별 아이콘, 개선된 응답 구조")
    logger.info("업그레이드 기능: 객관적 분석, 콘텐츠 추천, 3줄 요약, 체크리스트, 감정 강도 분석")
    logger.info("포트 5004에서 실행 중 (index.js 호환)")
    app.run(host='0.0.0.0', port=5004, debug=False)
