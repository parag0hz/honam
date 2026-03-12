# 시크릿 로테이션 및 Git 히스토리 정리 가이드

이 문서는 `client/.env` 파일이 Git 커밋 히스토리에 포함되어 API 키가 노출된 경우의
대응 절차를 안내합니다.

---

## ⚠️ 1단계: 키 로테이션 (가장 먼저, 필수)

히스토리를 정리하기 전에 **반드시** 노출된 키를 먼저 폐기하고 새 키를 발급하세요.
이미 키를 누군가 확인했을 가능성이 있으므로, 히스토리 정리만으로는 완전한 보호가 되지 않습니다.

### Google Maps API 키 로테이션

1. [Google Cloud Console](https://console.cloud.google.com/) > "API 및 서비스" > "사용자 인증 정보" 접속
2. 노출된 키를 선택 후 **삭제** 또는 **키 재발급**
3. 새 키에 **HTTP 리퍼러 제한** 또는 **IP 제한** 설정 (권장)
4. 새 키를 `.env` 파일 (로컬 전용)에만 저장

### Kakao API 키 로테이션

1. [Kakao Developers](https://developers.kakao.com/) > 내 애플리케이션 접속
2. 해당 앱 선택 > **앱 설정** > **앱 키** 탭
3. **키 재발급** 버튼 클릭 (JavaScript 키, REST API 키 각각 재발급)
4. 새 키를 `.env` 파일 (로컬 전용)에만 저장

---

## 🔧 2단계: 현재 상태에서 `.env` 파일 추적 해제

현재 저장소에서 `client/.env`가 Git에 추적되고 있다면 다음을 실행하세요:

```bash
# Git 인덱스(추적)에서 제거 (파일은 로컬에 유지)
git rm --cached client/.env

# .gitignore에 추가 (이미 추가되어 있음)
# client/.env 는 루트 .gitignore 및 client/.gitignore 에 포함됨

git add .gitignore client/.gitignore
git commit -m "chore: remove client/.env from tracking and update .gitignore"
git push
```

---

## 🗑️ 3단계: Git 히스토리에서 노출된 파일/키 완전 제거

> **주의:** 히스토리 재작성은 되돌릴 수 없으며, 협업자 전원의 동의와 재클론이 필요합니다.
> 퍼블릭 저장소라면 GitHub Support를 통해 캐시 제거도 요청하세요.

### 사전 준비

```bash
# git-filter-repo 설치
pip install git-filter-repo

# 작업 전 전체 히스토리 fetch
git fetch --unshallow origin
```

### 방법 A: `client/.env` 파일 전체를 히스토리에서 제거

```bash
# 저장소 루트에서 실행
git filter-repo --path client/.env --invert-paths --force
```

이 명령은 모든 커밋에서 `client/.env` 파일을 제거합니다.

### 방법 B: 특정 키 문자열을 히스토리 전체에서 치환

특정 키 값을 `***REMOVED***`로 치환합니다. `replacements.txt` 파일을 만드세요:

```
# replacements.txt (실제 노출된 키 값을 사용하세요)
AIzaSy<실제_구글_키_값>==>***REMOVED_GOOGLE_KEY***
<실제_카카오_JS_키_값>==>***REMOVED_KAKAO_JS_KEY***
<실제_카카오_REST_키_값>==>***REMOVED_KAKAO_REST_KEY***
```

```bash
git filter-repo --replace-text replacements.txt --force
```

> ⚠️ `replacements.txt`는 실제 키 값을 포함하므로 절대 저장소에 커밋하지 마세요.
> 작업 후 즉시 삭제하거나 `/tmp` 디렉터리에서 작업하세요.

### Force Push

히스토리 재작성 후 모든 브랜치와 태그를 강제 푸시합니다:

```bash
git push origin --force --all
git push origin --force --tags
```

---

## 👥 4단계: 협업자 및 배포 환경 대응 체크리스트

히스토리 재작성 및 force push 후 아래 항목을 모두 확인하세요.

- [ ] **협업자 전원에게 공지**: force push 후 로컬 저장소를 재클론하거나 히스토리를 재설정해야 함을 알립니다.
  ```bash
  # 협업자가 실행할 명령
  git fetch origin
  git reset --hard origin/main   # 또는 해당 브랜치명
  ```
- [ ] **포크(Fork) 저장소 확인**: 포크한 사람들에게도 공지하고, 가능하면 포크 저장소에서도 히스토리 정리를 요청하세요.
- [ ] **GitHub 캐시 제거 요청**: 퍼블릭 저장소의 경우, [GitHub Support](https://support.github.com)에 캐시된 커밋 데이터 제거를 요청하세요.
- [ ] **CI/CD 환경 업데이트**: GitHub Actions, Vercel, Netlify 등의 환경 변수(Secrets)를 새 키로 업데이트하세요.
- [ ] **배포 서버 환경 변수 업데이트**: 프로덕션 서버의 환경 변수를 새 키로 교체하세요.
- [ ] **태그/릴리즈 확인**: 노출된 커밋이 태그 또는 릴리즈에 포함되어 있다면, 해당 태그도 재생성이 필요합니다.

---

## 🛡️ 5단계: 예방 조치 (재발 방지)

### GitHub Secret Scanning 및 Push Protection 활성화

퍼블릭 저장소 또는 GitHub Advanced Security 구독 시:

1. 저장소 **Settings** > **Security** > **Code security and analysis** 접속
2. **Secret scanning** 활성화
3. **Push protection** 활성화 (시크릿이 포함된 커밋 자동 차단)

### Pre-commit 훅 설정

로컬에서 `.env` 파일이 실수로 커밋되는 것을 방지합니다:

```bash
# .git/hooks/pre-commit 파일 생성
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# .env 파일 커밋 방지
if git diff --cached --name-only | grep -qE '(^|/)\.env$'; then
  echo "ERROR: .env 파일은 커밋할 수 없습니다. Git에서 추적하지 마세요."
  exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

또는 팀 전체에 적용하려면 [pre-commit](https://pre-commit.com/) 프레임워크와 [detect-secrets](https://github.com/Yelp/detect-secrets) 플러그인 사용을 권장합니다:

```yaml
# .pre-commit-config.yaml 예시
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### GitHub Actions에서 시크릿 스캔 (선택)

```yaml
# .github/workflows/secret-scan.yml 예시
name: Secret Scan
on: [push, pull_request]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run detect-secrets
        run: |
          pip install detect-secrets
          detect-secrets scan --baseline .secrets.baseline
```

---

## 참고 자료

- [git-filter-repo 공식 문서](https://github.com/newren/git-filter-repo)
- [GitHub: 민감한 데이터 제거](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Google Cloud: API 키 보안](https://cloud.google.com/docs/authentication/api-keys#securing_an_api_key)
- [Kakao Developers: 앱 키 관리](https://developers.kakao.com/docs/latest/ko/getting-started/app)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
