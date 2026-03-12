# 시크릿 키 노출 대응 가이드

과거 커밋 히스토리에 `client/.env` 파일이 포함되어 Kakao/Google Maps API 키가 노출된 상황에 대한 대응 절차입니다.

---

## 1단계: 즉시 키 로테이션 (가장 중요)

히스토리를 정리하기 전에, **노출된 키를 즉시 폐기/재발급**해야 합니다.
히스토리 재작성을 해도 이미 키를 복사한 제3자가 있을 수 있으므로, 키 로테이션이 최우선입니다.

### Kakao API 키 재발급

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 해당 앱 선택
3. **앱 설정 > 앱 키** 탭에서 키 재발급
4. 애플리케이션에서 새 키로 업데이트

### Google Maps API 키 재발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. API 및 서비스 > 사용자 인증 정보
3. 노출된 API 키 선택 후 **삭제** 또는 **키 재생성**
4. 새 키 생성 시 반드시 **HTTP 리퍼러(웹사이트) 제한** 설정
5. 애플리케이션에서 새 키로 업데이트

---

## 2단계: Git 히스토리에서 `client/.env` 완전 제거

> ⚠️ **경고**: 히스토리 재작성은 되돌리기 어렵습니다. 반드시 백업 후 진행하세요.

### 사전 준비

- `git filter-repo` 설치: https://github.com/newren/git-filter-repo
  ```bash
  pip install git-filter-repo
  # 또는
  brew install git-filter-repo
  ```

### 절차

#### 1) Mirror clone으로 백업본 생성

```bash
git clone --mirror https://github.com/parag0hz/honam.git honam-backup.git
```

#### 2) 작업용 mirror clone 준비

```bash
git clone --mirror https://github.com/parag0hz/honam.git honam-mirror.git
cd honam-mirror.git
```

#### 3) `client/.env`를 전체 히스토리에서 제거

```bash
git filter-repo --path client/.env --invert-paths
```

이 명령은 모든 브랜치와 태그에서 `client/.env` 경로가 포함된 모든 커밋을 재작성합니다.

#### 4) GitHub에 강제 푸시

```bash
git push --force --all
git push --force --tags
```

#### 5) 정리 완료 확인

```bash
# 히스토리에서 client/.env가 없는지 확인
git log --all --full-history -- client/.env
# 결과가 없으면 성공
```

---

## 3단계: 로컬 클론 재설정 가이드

협업자가 있거나 여러 로컬 클론을 운용하는 경우, force push 후 모든 클론을 재설정해야 합니다.

```bash
# 기존 클론 디렉토리에서 실행
cd honam

# 원격 변경사항 가져오기
git fetch origin

# 현재 브랜치를 원격에 맞게 강제 리셋 (main 브랜치 예시)
git checkout main
git reset --hard origin/main

# 불필요한 객체 정리
git gc --prune=now
```

또는 가장 확실한 방법은 **재클론**입니다:

```bash
rm -rf honam
git clone https://github.com/parag0hz/honam.git
```

---

## 4단계: GitHub 추가 설정 권장

### GitHub Secret Scanning 활성화

1. 리포지토리 Settings > Security & analysis
2. **Secret scanning** 활성화
3. **Push protection** 활성화 (향후 시크릿이 포함된 커밋 차단)

### GitHub 캐시 및 코드 검색 주의사항

- force push 후 GitHub의 코드 검색 인덱스가 즉시 갱신되지 않을 수 있습니다 (수 시간 ~ 수일 소요)
- GitHub 지원팀에 캐시 삭제를 요청할 수 있습니다: https://support.github.com
- 포크(fork)된 리포지토리에는 여전히 이전 히스토리가 남아 있을 수 있으므로, 포크가 있다면 포크 소유자에게 연락하거나 포크를 삭제 요청하세요

---

## 참고: 노출된 커밋 이력

과거 히스토리의 특정 커밋에 `client/.env` 파일이 포함되어 있었습니다.
해당 파일에는 Kakao JavaScript 키, Kakao REST API 키, Google Maps API 키가 포함되어 있었으며,
**위 절차대로 키 로테이션 및 히스토리 정리가 완료되어야 실제로 보안 위협이 제거됩니다.**

---

## 재발 방지

이 PR에서 적용된 재발 방지 조치:

1. **`.gitignore` 강화**: `.env` 및 `.env.*` 패턴을 명시적으로 무시, `.env.example`만 예외 허용
2. **`client/.env.example` 추가**: 실제 키 없이 변수명과 플레이스홀더만 포함
3. **문서화**: `client/README.md`에 환경 설정 방법 명확히 기재
