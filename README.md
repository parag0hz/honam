# 호남IS해커톤 조선심리센터: 마음자리
> **마음자리: 심리상담 데이터 활용 AI 기반 정신건강 관리 시스템**
<img width="1215" height="684" alt="image" src="https://github.com/user-attachments/assets/87ef8aef-d9cb-4baa-b260-72d6d5ca438e" />


## 목차

* [서비스 소개](#서비스-소개)
* [프로젝트 기간](#프로젝트-기간)
* [요구 사항](#요구-사항)
* [빠른 시작 (Quick Start)](#빠른-시작-quick-start)
* [기능](#기능)
* [시스템 아키텍처](#시스템-아키텍처)
* [화면 구성](#화면구성)
* [사용 모델 · 데이터](#사용-모델--데이터)
* [정량적 평가](#정량적-평가)
* [프로젝트 구조](#프로젝트-구조)
* [개발/실행 스크립트](#개발실행-스크립트)
* [팀](#팀)

---


## 서비스 소개

**마음자리**는 실제 상담 데이터를 바탕으로, AI 챗봇/리포트/의료기관 연계를 통해 개인의 정신건강 관리를 돕는 서비스입니다.

<details>
<summary><b>핵심 가치</b></summary>

* **실질적 상담 경험**: 대화 맥락 이해와 근거 기반 응대
* **개인화**: 감정 변화 추적, 상담 이력 기반 맞춤형 제안
* **연계성**: 주변 의료기관 검색·안내 (지도 기반)
* **신뢰성**: 국립정신건강센터/보건복지부 공식 지침 RAG 적용
* **문서화**: 대화 요약·분석을 활용한 자동 상담 리포트 생성

</details>

---

## 프로젝트 기간

**2025.08.01 \~ 2025.08.22**

---

## 요구 사항

```txt
nodejs>=16.0.0
npm>=8.0.0
python>=3.10
```

> 권장: Conda 환경 사용 (아래 Quick Start 참고)

---

## 빠른 시작 (Quick Start)

<details>
<summary><b>환경 설정</b></summary>

### 1) 저장소 클론

```bash
git clone https://github.com/parag0hz/honam.git
cd honam
```

### 2) Conda 환경 생성

```bash
cd python_servers
conda env create -f environment.yml
conda activate counseling-midm
```

### 3) 의존성 확인 (선택)

```bash
python --version  # >= 3.10
pip -V
```

</details>

<details>
<summary><b>서버 실행</b></summary>

> 아래 경로의 `PATH`는 로컬 프로젝트 루트로 바꿔주세요.

#### 채팅 서버

```bash
conda activate counseling-midm
cd PATH/python_servers/counseling-finetuned-midm
python final_server.py
```

#### 리포트 서버

```bash
conda activate counseling-midm
cd PATH/python_servers/counseling-finetuned-midm
python report_server.py
```

</details>

<details>
<summary><b>문제 해결 가이드(FAQ)</b></summary>

* `conda: command not found`

  * Miniconda/Anaconda 설치 후 터미널을 재시작하세요.
* 패키지 충돌/해결 지연

  * `conda-forge` 채널 우선 추가 후 재시도하거나, `mamba` 사용을 권장합니다.
* 포트 충돌

  * 이미 사용 중인 포트가 있다면 `final_server.py`/`report_server.py`의 포트를 변경하세요.

</details>

---

## 기능

<details>
<summary><b>주요 기능</b></summary>

* **AI 챗봇을 통한 실질적 심리상담**: 실제 상담 데이터를 바탕으로 한 깊이 있는 분석과 맞춤형 답변 제공
* **개인화 상담 및 연계**: 상담 이력, 감정 변화 분석, 페르소나별 맞춤 서비스
* **실시간 주변 의료기관 정보**: GPS 기반으로 지도에서 바로 확인 가능
* **공식 상담 지침 활용**: 국립정신건강센터/보건복지부 공식 응대지침 RAG 적용
* **심리상담 보고서 자동 생성**: 사용자가 원하는 말투/분량/형식 반영

</details>

<details>
<summary><b>추가 기능 (예정/옵션)</b></summary>

* 사용자 대화 히스토리 기반 리마인드/케어 루틴 생성
* 위기 상황 신호 감지 및 보호자/기관 연결 옵션
* 대화 주제별 태깅/검색

</details>

---

## 시스템 아키텍처

<p align="center">
  <img width="4329" height="2475" alt="Frame 3" src="https://github.com/user-attachments/assets/54a018c4-5951-4dc7-a9e4-6b9e022dbcd2" />
</p>
<p align="center">
  <img width="4000" height="2475" alt="Frame 10" src="https://github.com/user-attachments/assets/2b349e50-a518-4195-9202-3ec3fa7497b2" />
</p>

---

## 화면구성

<p align="center">
  <img width="1893" height="1064" alt="image" src="https://github.com/user-attachments/assets/1c4eed5e-b445-4f1d-91b2-5c9c609c83f0" />
</p>

---

## 사용 모델 · 데이터

* **KT-MIDM 2.0 BASE 11.5B**
* **LoRA Finetuning** (AI-Hub 심리 상담 데이터셋)

<p align="center">
  <img width="4000" height="2475" alt="Frame 7" src="https://github.com/user-attachments/assets/37df9e20-2ca4-41e3-9407-99781d3b34d8" />
</p>

> 공공 데이터/가이드 사용 시 출처 표기를 준수합니다.

---

## 정량적 평가

<p align="center">
  <img width="1206" height="676" alt="image" src="https://github.com/user-attachments/assets/570b866f-ad31-4d1f-88e2-c424dc4744d6" />
</p>

---

## 프로젝트 구조

> 실제 구조에 맞춰 경로/폴더명을 조정하세요.

```text
honam/
├─ python_servers/
│  ├─ counseling-finetuned-midm/
│  │  ├─ final_server.py
│  │  └─ report_server.py
│  └─ environment.yml
├─ client/         (프론트엔드)
├─ server/         (백엔드)       
└─ README.md
```

---

## 개발/실행 스크립트

```bash
# 환경 생성
conda env create -f python_servers/environment.yml
conda activate counseling-midm

# 채팅 서버 실행
python python_servers/counseling-finetuned-midm/final_server.py

# 리포트 서버 실행
python python_servers/counseling-finetuned-midm/report_server.py
```

---

## 팀

<p align="center">
  <img width="1906" height="1067" alt="image" src="https://github.com/user-attachments/assets/6a41b16b-f7c7-4fbc-aa07-26f6ed29c95a" />
</p>

---

### 고지

* 이 프로젝트는 심리상담을 보조하기 위한 도구이며, **의학적 진단을 대체하지 않습니다**. 긴급 상황 시 지역 응급기관에 즉시 연락하세요.


