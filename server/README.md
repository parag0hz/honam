# Server

이 프로젝트의 백엔드 서버입니다.

## 환경 설정

1. `.env.example` 파일을 `.env`로 복사하세요:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일에서 다음 환경변수를 설정하세요:
   - `OPENAI_API_KEY`: OpenAI API 키를 입력하세요

## 설치 및 실행

1. 의존성 패키지 설치:
   ```bash
   npm install
   ```

2. 개발 서버 실행:
   ```bash
   npm run dev
   ```

3. 프로덕션 서버 실행:
   ```bash
   npm start
   ```

## 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- API 키와 같은 민감한 정보는 `.env` 파일에만 저장하세요
