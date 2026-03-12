# `client/.env` Git 히스토리 완전 삭제 가이드 (macOS)

이 문서는 `client/.env` 파일(Kakao / Google Maps API 키 포함)을 git 히스토리에서 완전히 제거하고, 재발을 방지하는 절차를 설명합니다.

> **⚠️ 먼저 해야 할 것**: 히스토리 삭제 전에 **노출된 키를 반드시 폐기(rotate)** 하세요.  
> 히스토리를 지워도 이미 누군가 복사했을 가능성이 있습니다.

---

## 0) 키 로테이션 (가장 중요, 먼저 하세요)

| 서비스 | 관리 콘솔 URL |
|--------|--------------|
| Google Maps API | <https://console.cloud.google.com/> → API 및 서비스 → 사용자 인증 정보 |
| Kakao JS / REST | <https://developers.kakao.com/> → 내 애플리케이션 → 앱 키 재발급 |

---

## 1) 사전 요구사항

| 항목 | 버전 |
|------|------|
| macOS | 10.15 Catalina 이상 (git-filter-repo는 Python 3.5+ 필요) |
| Homebrew | 자동 설치 (스크립트 실행 시) |
| git-filter-repo | 자동 설치 (Homebrew 경유) |
| Git | 2.x 이상 |

---

## 2) 원 클릭 스크립트 실행

```bash
# 저장소 루트에서 실행
chmod +x scripts/purge-env-history.sh
./scripts/purge-env-history.sh
```

스크립트가 자동으로 수행하는 작업:

1. **Homebrew** 미설치 시 자동 설치
2. **git-filter-repo** 미설치 시 `brew install git-filter-repo`
3. `client/.env`가 히스토리에 존재하는지 확인
4. 작업 전 로컬 백업 태그 생성(`backup/before-purge-YYYYMMDDHHMMSS`)
5. `git filter-repo --path client/.env --invert-paths --force` 실행
6. 히스토리에서 파일이 완전히 제거됐는지 검증
7. force-push 실행(`git push origin --force --all && --force --tags`)

---

## 3) 수동 실행 절차 (스크립트를 쓰지 않을 경우)

```bash
# 1. git-filter-repo 설치
brew install git-filter-repo

# 2. 히스토리 재작성
git filter-repo --path client/.env --invert-paths --force

# 3. 리모트 재등록 (filter-repo가 제거함)
git remote add origin https://github.com/parag0hz/honam.git

# 4. force-push
git push origin --force --all
git push origin --force --tags

# 5. 정리 확인
git log --all --oneline -- client/.env   # 아무 결과도 없어야 함
```

---

## 4) force-push 이후 협업자 대응

```bash
# 협업자가 로컬에서 실행
git fetch --all
git reset --hard origin/main
# 또는 재클론(가장 확실)
git clone https://github.com/parag0hz/honam.git
```

---

## 5) 재발 방지 체크리스트

- [x] `.gitignore` (루트) — `client/.env`, `server/.env`, `.env` 등 포함
- [x] `client/.gitignore` — `.env` 포함
- [x] `client/.env.example` — 플레이스홀더 값만 포함, **실제 키 없음**
- [ ] 새 키를 `client/.env`(로컬 전용)에 설정 후 절대 커밋하지 않기
- [ ] GitHub → Settings → Security → Secret scanning 알림 활성화

---

## 6) 주의사항

- GitHub 코드 검색/캐시는 force-push 후에도 잠시 동안 이전 내용을 보여줄 수 있습니다.  
  완전히 사라지지 않으면 GitHub Support에 캐시 제거를 요청하세요.
- 포크(fork)가 있는 경우 포크에는 여전히 남아 있습니다.  
  포크 소유자에게도 삭제를 요청하거나 포크를 삭제하도록 안내하세요.
- 키 로테이션 없이 히스토리만 지우는 것은 **완전한 해결책이 아닙니다**.
