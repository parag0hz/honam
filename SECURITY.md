# 보안 가이드 (Security Guide)

## 민감정보 노출 사고 요약

커밋 `a86cc7a`에서 다음 실제 API 키가 `client/.env` 파일에 포함된 채 Git 히스토리에 기록되었습니다:

- **Google Maps API 키** (`REACT_APP_GOOGLE_MAPS_API_KEY`, `REACT_APP_Maps_API_KEY`)
- **카카오 JavaScript 키** (`REACT_APP_KAKAO_JS_KEY`)
- **카카오 REST API 키** (`REACT_APP_KAKAO_REST_KEY`)

노출된 키의 실제 값은 `git show a86cc7a -- client/.env` 명령으로 확인할 수 있습니다.

이후 커밋에서 `.env` 파일이 삭제되었으나, **Git 히스토리에는 해당 키 값이 여전히 남아있습니다.**

---

## ✅ 즉시 조치 사항 (Key Rotation)

### Google Maps API 키 교체

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. "API 및 서비스" > "사용자 인증 정보" 이동
3. 노출된 키(커밋 `a86cc7a`에서 확인)를 **즉시 삭제하거나 비활성화**
4. 새 API 키 생성 (HTTP 리퍼러, IP, 앱 제한 설정 권장)
5. 새 키를 로컬 `.env` 파일에만 저장 (절대 커밋하지 말 것)

### 카카오 API 키 교체

1. [카카오 개발자 센터](https://developers.kakao.com/) 접속
2. 해당 앱 > "앱 키" 탭에서 키 재발급
3. 기존 키(커밋 `a86cc7a`에서 확인) 비활성화
4. 새 키를 로컬 `.env` 파일에만 저장

---

## 🔒 재발 방지 가이드

### .env 파일 관리 원칙

- 실제 `.env` 파일은 **절대 Git에 커밋하지 마세요**.
- `.env.example` 파일만 저장소에 포함하세요 (플레이스홀더 값만 포함).
- `.gitignore`에 `.env`가 포함되어 있더라도 `git add -f .env`와 같은 명령으로 강제 추가하지 마세요.

### Git 커밋 전 확인

```bash
# 커밋 전 스테이징 영역 확인
git diff --staged

# .env 파일이 포함되지 않았는지 확인
git status
```

### GitHub Secret Scanning 활성화

1. GitHub 저장소 > "Settings" > "Security" > "Code security and analysis"
2. "Secret scanning" 활성화
3. "Push protection" 활성화 (시크릿 포함 커밋 푸시 차단)

---

## 🗑️ Git 히스토리에서 시크릿 제거 가이드

> **⚠️ 주의:** Git 히스토리 재작성은 모든 협업자의 로컬 저장소에 영향을 미칩니다.  
> 반드시 팀원과 사전 협의 후 진행하세요.

### 방법 1: `git filter-repo` 사용 (권장)

```bash
# 1. git-filter-repo 설치
pip install git-filter-repo

# 2. 저장소 클론 (미러)
git clone --mirror https://github.com/parag0hz/honam.git honam-mirror
cd honam-mirror

# 3. 노출된 키 값을 아래 형식으로 저장 (git show a86cc7a -- client/.env 참고)
# expressions.txt 파일 생성:
cat > /tmp/expressions.txt << 'EOF'
<GOOGLE_MAPS_API_KEY>==>GOOGLE_MAPS_API_KEY_REMOVED
<KAKAO_JS_KEY>==>KAKAO_JS_KEY_REMOVED
<KAKAO_REST_KEY>==>KAKAO_REST_KEY_REMOVED
EOF
# 실제 키 값을 위의 <>로 표시된 자리에 직접 입력하세요
# (git show a86cc7a -- client/.env 로 키 값 확인)

# 4. 히스토리에서 민감 문자열 제거
git filter-repo --replace-text /tmp/expressions.txt

# 5. 강제 푸시 (모든 브랜치)
git push --force --all
git push --force --tags
```

### 방법 2: BFG Repo Cleaner 사용

```bash
# 1. BFG 다운로드
# https://rtyley.github.io/bfg-repo-cleaner/ 에서 bfg.jar 다운로드

# 2. 저장소 클론 (미러)
git clone --mirror https://github.com/parag0hz/honam.git honam-mirror

# 3. 노출된 키 값을 아래 형식으로 저장 (git show a86cc7a -- client/.env 참고)
cat > /tmp/secrets.txt << 'EOF'
<GOOGLE_MAPS_API_KEY>
<KAKAO_JS_KEY>
<KAKAO_REST_KEY>
EOF
# 실제 키 값을 위의 <>로 표시된 자리에 직접 입력하세요

# 4. 히스토리에서 민감 문자열 교체
java -jar bfg.jar --replace-text /tmp/secrets.txt honam-mirror

# 5. 저장소 정리
cd honam-mirror
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6. 강제 푸시
git push --force --all
git push --force --tags
```

### 히스토리 재작성 후 조치

1. **GitHub에 연락**: GitHub Support에 캐시된 뷰 삭제 요청
   - https://support.github.com/contact

2. **협업자 공지**: 모든 기여자에게 알림
   ```
   로컬 저장소를 새로 클론하거나 다음 명령어를 실행하세요:
   git fetch --all
   git reset --hard origin/main
   ```

3. **Pull Request 재확인**: 기존 PR의 diff에 시크릿이 노출되어 있을 수 있으므로 확인 필요

---

## 📋 운영 보안 체크리스트

- [ ] 노출된 API 키 모두 교체 (Google Maps, Kakao)
- [ ] 새 키에 적절한 접근 제한 설정 (IP, HTTP 리퍼러 등)
- [ ] GitHub Secret Scanning 활성화
- [ ] GitHub Push Protection 활성화
- [ ] Git 히스토리에서 시크릿 제거 (git filter-repo 또는 BFG)
- [ ] 팀원에게 보안 사고 공지
- [ ] CI/CD에서 환경변수 주입 방식으로 전환 (GitHub Actions Secrets 등)

---

## 📚 참고 자료

- [GitHub Docs: Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Google Cloud: API key best practices](https://cloud.google.com/docs/authentication/api-keys#securing)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
