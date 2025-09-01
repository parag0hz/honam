# 호남IS해커톤 조선심리센터: 마음자리
<img width="1215" height="684" alt="image" src="https://github.com/user-attachments/assets/87ef8aef-d9cb-4baa-b260-72d6d5ca438e" />

## 서비스 소개
마음자리: 심리상담 데이터 활용 AI 기반 정신건강 관리 시스템

<details>
<summary>환경 설정</summary>

## 저장소 코드 복사 
```
git clone https://github.com/parag0hz/honam.git
```
## 패키지 설치
```
cd python_servers
conda env create -f environment.yml
```

## 채팅 서버 
```
conda activate counseling-midm
cd PATH/python_servers/counseling-finetuned-midm
python final_server.py
```

## 리포트 서버
```
conda activate counseling-midm
cd PATH/python_servers/counseling-finetuned-midm
python report_server.py
```
</details>

## 프로젝트 기간
2025.08.01 ~ 2025.08.22

## 개발 환경
nodejs>=16.0.0
<br>
npm>=8.0.0
<br>
python>=3.10


## 주요 기능
- **AI 챗봇을 통한 실질적 심리상담**: 실제 상담 데이터를 바탕으로 한 깊이 있는 분석과 맞춤형 답변 제공
- **개인화 상담 및 연계**: 상담 이력, 감정 변화 분석, 페르소나별 맞춤 서비스
- **실시간 주변 의료기관 정보**: GPS 기반으로 지도에서 바로 확인 가능
- **공식 상담 지침 활용**: 국립정신건강센터/보건복지부 공식 응대지침 RAG 적용
- **심리상담 보고서 자동 생성**: 사용자가 원하는 말투/분량/형식 반영

## 시스템 아키텍처
<img width="4329" height="2475" alt="Frame 3" src="https://github.com/user-attachments/assets/54a018c4-5951-4dc7-a9e4-6b9e022dbcd2" />
<img width="4000" height="2475" alt="Frame 10" src="https://github.com/user-attachments/assets/2b349e50-a518-4195-9202-3ec3fa7497b2" />

## 화면구성
<img width="1893" height="1064" alt="image" src="https://github.com/user-attachments/assets/1c4eed5e-b445-4f1d-91b2-5c9c609c83f0" />

## 사용 모델
- KT-MIDM 2.0 BASE 11.5B
- LoRA Finetuning(AI-Hub 심리 상담 데이터셋)
<img width="4000" height="2475" alt="Frame 7" src="https://github.com/user-attachments/assets/37df9e20-2ca4-41e3-9407-99781d3b34d8" />

## 정량적 평가
<img width="1206" height="676" alt="image" src="https://github.com/user-attachments/assets/570b866f-ad31-4d1f-88e2-c424dc4744d6" />

## 팀원 소개
<img width="1906" height="1067" alt="image" src="https://github.com/user-attachments/assets/6a41b16b-f7c7-4fbc-aa07-26f6ed29c95a" />
