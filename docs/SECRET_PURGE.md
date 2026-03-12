# client/.env 히스토리 완전 삭제 가이드

이 문서는 `client/.env` 파일이 Git 히스토리에 남아있는 경우,  
원격 저장소(GitHub)에서도 **객체 레벨까지 완전히 제거**하는 방법을 설명합니다.

---

## 1. 현황 진단

### 1-1. 객체 레벨 검증 (가장 확실한 방법)

```bash
git rev-list --objects --all | grep -F "client/.env"
```

- 출력이 **없으면** 로컬 히스토리에서는 완전 제거된 것입니다.
- 출력이 **있으면** 아직 로컬/원격에 해당 blob 객체가 남아있습니다.

### 1-2. 어떤 ref(브랜치·태그)에 남아있는지 확인

아래 스크립트로 모든 refs를 순회하며 `client/.env`가 포함된 ref를 찾습니다.

```bash
git for-each-ref --format='%(refname)' | while read ref; do
  if git ls-tree -r --name-only "$ref" 2>/dev/null | grep -qF "client/.env"; then
    echo "FOUND in: $ref"
  fi
done
```

출력 예시:

```
FOUND in: refs/heads/main
FOUND in: refs/remotes/origin/main
```

### 1-3. 커밋 히스토리에서 `client/.env` 관련 커밋 찾기

```bash
git log --all --full-history -- "client/.env"
```

---

## 2. 완전 삭제 절차

### 전제 조건

- `git filter-repo` 설치: `brew install git-filter-repo`
- Python 3 필요 (보통 macOS에 기본 설치됨)

### 2-1. mirror clone (항상 새 작업 디렉터리에서 시작)

```bash
WORK_DIR="$HOME/honam-history-purge-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"
git clone --mirror https://github.com/parag0hz/honam.git
cd honam.git
```

> ⚠️ **주의**: `filter-repo`는 기존 remote를 삭제합니다. 그래서 mirror clone을 사용합니다.

### 2-2. 히스토리에서 `client/.env` 제거

```bash
git filter-repo --path "client/.env" --invert-paths
```

### 2-3. remote 재등록

`filter-repo` 실행 후 origin remote가 삭제되므로 다시 추가합니다.

```bash
git remote add origin https://github.com/parag0hz/honam.git
```

### 2-4. 제거 결과 즉시 검증

```bash
git rev-list --objects --all | grep -F "client/.env"
```

출력이 없으면 로컬 제거 성공.

### 2-5. force push

```bash
# 모든 브랜치
git push origin --force --all

# 모든 태그
git push origin --force --tags

# 원격에만 남은 불필요한 refs 정리
git remote prune origin
```

> ⚠️ **HTTPS + PAT 인증**: GitHub은 비밀번호 인증을 지원하지 않습니다.  
> Personal Access Token(PAT)을 사용해야 합니다.  
> `repo` 권한이 필요하며, push 시 비밀번호 프롬프트에 PAT를 입력하세요.  
> macOS Keychain에 캐시된 자격증명이 있다면 먼저 삭제하세요:  
> `git credential-osxkeychain erase` → `host=github.com` + `protocol=https` + 엔터 두 번

### 2-6. push 후 재검증

```bash
# 로컬 객체 확인
git rev-list --objects --all | grep -F "client/.env"

# 원격에서 직접 clone해서 확인
cd /tmp
git clone https://github.com/parag0hz/honam.git honam-verify
cd honam-verify
git rev-list --objects --all | grep -F "client/.env"
```

두 결과 모두 빈 출력이면 **완전 제거 성공**입니다.

---

## 3. "Everything up-to-date" 인데도 객체가 남아있는 경우

force push 후 `git rev-list --objects --all | grep -F "client/.env"` 결과가 여전히 남아있다면:

### 원인
- 원격에 `filter-repo`가 건드리지 못한 브랜치/태그가 별도로 존재할 수 있습니다.
- 예: GitHub이 자동으로 생성하는 `refs/pull/*` 스냅샷, 포크 등

### 조치 A: 남아있는 브랜치/태그를 직접 삭제

```bash
# 예: 특정 브랜치 삭제
git push origin --delete BRANCH_NAME

# 예: 특정 태그 삭제
git push origin --delete TAG_NAME
```

### 조치 B: 전체 refs rewrite (가장 확실)

```bash
# mirror clone → filter-repo → 전체 refs force push
git push origin --mirror --force
```

> ⚠️ `--mirror` push는 원격의 **모든 refs**(브랜치, 태그, PR refs 등)를 로컬 기준으로 덮어씁니다.  
> 협업 중인 저장소에서는 팀원들에게 사전 고지 후 진행하세요.

### 조치 C: GitHub에 캐시 만료 요청

GitHub 지원팀에 연락하거나 아래 GitHub Docs를 참고하세요:  
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

---

## 4. zsh 사용 시 주의사항

macOS 기본 쉘은 zsh입니다. zsh는 `<` `>` 문자를 리다이렉션 연산자로 해석하므로  
다음과 같은 placeholder가 포함된 명령을 그대로 복사하면 **파싱 에러**가 납니다.

### ❌ 잘못된 예 (에러 발생)

```zsh
git remote add <이름> <URL>
git push origin --delete <브랜치명>
```

```
zsh: parse error near `>'
```

### ✅ 올바른 예 (실제 값으로 교체)

```zsh
git remote add origin https://github.com/parag0hz/honam.git
git push origin --delete old-branch-name
```

> `<이름>`, `<URL>`, `<브랜치명>` 등은 반드시 실제 값으로 교체한 후 실행하세요.

---

## 5. 재발 방지

`client/.env`는 `.gitignore`에 등록되어 있으므로 새로 생성해도 자동으로 추적 제외됩니다.

환경변수 설정은 `client/.env.example`을 복사해서 사용하세요:

```bash
cp client/.env.example client/.env
# 그 후 실제 값 입력
```

이 파일(`.env.example`)은 **키 이름만 포함**하고 실제 값은 포함하지 않습니다.

---

## 6. 요약 체크리스트

- [ ] `git rev-list --objects --all | grep -F "client/.env"` → 출력 없음
- [ ] 모든 브랜치/태그에서 `git ls-tree -r`로 `client/.env` 미포함 확인
- [ ] `git push origin --force --all && git push origin --force --tags` 완료
- [ ] 원격에서 fresh clone 후 위 검증 재확인
- [ ] 노출된 API 키/시크릿 즉시 무효화 및 재발급 완료
- [ ] `client/.env` → `.gitignore`에 등록 확인
