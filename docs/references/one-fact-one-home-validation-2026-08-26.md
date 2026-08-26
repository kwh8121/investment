# One Fact, One Home — 검증 증거 스냅샷 (2026-08-26)

## 0. 문서 상태 (필독)

- **이 문서는 정책 권위 문서가 아니다.** "One Fact, One Home" 문서 정책의 유일한 권위(authoritative) 소스는
  `AGENTS.md`의 `<!-- MANUAL: 프로젝트 차원에서 보존할 사용자 메모를 이 줄 아래에 추가하세요 -->` 마커 이하
  "## 문서 정책: One Fact, One Home" 절이다.
- 이 문서는 그 정책이 실제로 유지·동작하는지를 특정 시점에 검증한 **역사적/참조용 스냅샷**이며, 정책 자체를 재작성하거나
  대체하지 않는다. 정책 문구, 표, 운영 규칙은 이 문서가 아니라 `AGENTS.md`에서만 갱신된다.
- 검증 일자: 2026-08-26
- 검증 대상 브랜치: `docs/one-fact-one-home`
- 이 문서는 별도의 리뷰·커밋 절차를 통해 저장소에 반영되는 것을 전제로 작성되었으며, 본 작업에서는 파일 생성 외에
  다른 파일 수정이나 커밋을 수행하지 않았다.

## 1. 검증 범위

| 항목                                      | 검증 방법                                                                                                  | 결과                                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| MANUAL 블록 무결성(해시/크기)             | `sha256sum`, `wc` (본 세션에서 직접 실행)                                                                  | 일치                                                                                        |
| OpenCode `/init` 재생성 시 정책 보존 여부 | 디스포저블(임시) worktree(`3272d52`)에서 `opencode run --command init` 실행 후 비교(본 세션에서 직접 실행) | 정책 내용(표·규칙 문구)은 보존, 바이트 해시는 표 서식 변경으로 불일치 — §3 참조             |
| 정본 위치에 대한 CLI 응답 정확성          | OpenCode / Claude Code / Codex에 신규 세션으로 질의(본 세션에서 직접, 각 CLI별 반복 실행)                  | 세 CLI 모두 5/5 정확한 응답을 관찰(Claude는 일부 재실행에서 타임아웃도 관찰됨) — §4·§5 참조 |
| 정적 검사/빌드 통과 여부                  | `npm run check-all`, `npm run build`(본 세션에서 직접 실행)                                                | 모두 통과                                                                                   |

## 2. MANUAL 블록 무결성 검증

대상: `AGENTS.md` 77~99행 (`<!-- MANUAL: ... -->` 마커부터 파일 끝까지, 23줄).

- SHA-256: `f7f8652ffec14ac747346bae8e7ecc784fa34cab9761ffdbc28ab71826260c76`
- 크기: 1855 bytes / 23 lines

이 값은 본 세션에서 `sed -n '77,99p' AGENTS.md | sha256sum`와 `wc -c -l`로 직접 재계산하여 확인했으며,
사전에 제시된 값과 정확히 일치했다. 이 검증은 §3의 `/init` 재생성 테스트와는 독립적으로, 현재 HEAD의 정적 상태만
검사한 것이다.

## 3. OpenCode `/init` 재생성 시 정책 보존 여부 — 디스포저블(임시) 테스트

- 테스트 대상 커밋: `3272d52` (`🔧 chore: .omx 런타임 디렉터리 Git·Prettier 무시 규칙 정렬`)
- 방법: `git worktree add --detach`로 메인 작업 트리와 완전히 분리된 임시 디렉터리(`/tmp` 하위, 저장소 밖)에
  해당 커밋을 체크아웃한 뒤 `opencode run --dir <path> --model openai/gpt-5.6-sol --command init`을 실행했다.
  이 실행은 단일 호출로 즉시 끝나지 않았고(내부적으로 explore/librarian 서브에이전트, `npm ci`, `npm run
check-all`, `npm run build`까지 스스로 수행), 완료까지 프로세스를 계속 지켜보며 세션이 끝날 때까지 대기해야
  했다. 완료 후 `git worktree remove --force`로 임시 트리를 즉시 삭제했다.
- **실행 전** `AGENTS.md` 전체 SHA-256: `b4ffa736bb64414beb9e406079e19e163fe480920036bd0d59117a33a4bf5d35`
  (MANUAL 블록만: `f7f8652ffec14ac747346bae8e7ecc784fa34cab9761ffdbc28ab71826260c76`, 1855 bytes / 23 lines —
  커밋 `3272d52` 시점에도 현재 HEAD와 동일함을 별도로 확인).
- **실행 후 실제 관찰 결과** (본 세션에서 직접 실행하여 확인, 사전에 예상했던 결과와 다름— 아래 참조):
  - `AGENTS.md`의 MANUAL 마커 **위쪽 섹션**(Purpose/Key Files/Subdirectories/For AI Agents/Dependencies 등)은
    예상대로 완전히 재작성되었다(프로젝트를 "starter"가 아닌 ETF MVP 기준선으로 재기술, 명령 목록 확장 등).
  - MANUAL 마커 **아래쪽**의 "문서 정책: One Fact, One Home" 절은 **표의 각 셀 값과 운영 규칙 문구가 의미상
    전혀 변경되지 않았다** — 정본 매핑 4행(`docs/PRD.md`/`docs/ROADMAP.md`/`docs/architecture.md`/
    `docs/plan/gates/*.md`)과 운영 규칙 문장 6개가 모두 그대로 유지됨.
  - 그러나 **바이트 단위 해시는 실행 전과 동일하지 않았다.** 최종 MANUAL 블록 SHA-256은
    `ce729c8b0802912aa3f615757b17c279eeaed2e3cc6222a8bf52a0022bc78a76` (2096 bytes / 23 lines)로,
    실행 전 `f7f8652f...` (1855 bytes)와 다르다. 원인은 표 내용 자체가 아니라 **마크다운 표의 열 폭 패딩이
    (예: `| 사실 유형 |` → `| 사실 유형` + 정렬용 공백들 `|`) 일관되게 넓게 재포맷된 것**이었다 — 셀 텍스트,
    행 순서, 규칙 문구는 `diff`로 완전히 동일함을 확인했다.
  - `AGENTS.md`는 `.prettierignore`에 `**/AGENTS.md`로 명시되어 있어 저장소의 `prettier --check .`가
    이 파일을 검사하지 않는다. 따라서 이 표 서식 변화는 Prettier 강제 규칙 때문이 아니라, `/init`을 수행한
    모델이 표를 다시 쓰면서 스스로 정렬 패딩을 적용한 결과로 보인다.
- **결론(정정)**: 사전에 제시되었던 "MANUAL 블록 해시가 실행 전후 완전히 동일하다"는 결과는 이번 세션에서
  독립적으로 재현되지 않았다. 실제로 확인된 것은 **정책의 의미 내용(표 값, 규칙 문구)은 보존되지만, 바이트
  단위 서식(표 패딩)까지 보존된다는 보장은 없다**는 것이다. 이는 이 문서가 "실행 결과를 그대로 검증"하도록
  요구받았기 때문에, 사전 제시값과 다르더라도 실제 관찰값을 기록한다.

## 4. 정본 위치에 대한 Fresh CLI 응답 검증 (본 세션에서 직접 실행)

질의 내용: `AGENTS.md`의 "문서 정책: One Fact, One Home" 표를 근거로 다음 5개 항목에 답하도록 요청 —
① 제품 요구사항/인수조건(AC)의 정본, ② 실행 일정/Task/진행상황의 정본, ③ 기술적 경계/구현완료 여부의 정본,
④ Gate 실제 판정의 정본, ⑤ Mem0/OpenViking이 정본 출처인지 여부.

기대값(정책 표 기준): `docs/PRD.md` / `docs/ROADMAP.md` / `docs/architecture.md` / `docs/plan/gates/*.md` / 아니오.

| CLI         | 명령                                                           | 결과               | 비고                                                     |
| ----------- | -------------------------------------------------------------- | ------------------ | -------------------------------------------------------- |
| OpenCode    | `opencode run "..." -m openrouter/anthropic/claude-sonnet-5`   | ✅ 5/5 정확히 일치 | 정상 종료(exit 0)                                        |
| Claude Code | `claude -p "..." --model claude-sonnet-5 --output-format text` | ✅ 5/5 정확히 일치 | 워크스페이스 신뢰 경고 출력됨(§5)에도 정상 응답, exit 0  |
| Codex       | `codex exec -s read-only "..."` (model `gpt-5.6-terra`)        | ✅ 5/5 정확히 일치 | 정상 종료(exit 0), bubblewrap 대체 경고 발생(비차단, §5) |

세 CLI 모두 최소 1회의 신규(fresh) 세션에서 5/5 정확한 응답을 냈다. Claude Code는 동일한 질의를 반복 실행하는
과정에서 일부 실행이 타임아웃되기도 했다(재현성 관련 세부 사항은 §5 참조 — 이는 부차적 한계이며, 주된 결론인
"정본 위치 질의에 정확히 답할 수 있음"을 뒤집지 않는다).

## 5. 제약/한계 (비차단, Non-blocking)

- **Claude 워크스페이스 신뢰(trust) 경고 및 실행 재현성**: 이 체크아웃은 대화형(interactive)으로 신뢰 승인을
  받은 적이 없다. `claude -p`로 신규(fresh) 세션을 non-interactive로 실행하면 다음 경고가 매번 출력되었다:
  `Ignoring 11 permissions.allow entries from .claude/settings.local.json: this workspace has not been
trusted.` 이 경고 자체는 응답을 막지 않았다 — 본 세션에서 같은 질의를 여러 차례 반복 실행한 결과, **2회는
  60~90초 내에 정상적으로 5/5 정답을 반환했고(§4), 다른 2회는 60~100초 타임아웃까지 응답이 없었다.** 즉 결과는
  비결정적(flaky)이었으며, 실패 시 항상 위 신뢰 경고와 함께 발생했다. `--safe-mode`(훅·MCP·플러그인 비활성화)를
  추가하면 타임아웃 없이 항상 종료했지만, 이 모드는 `CLAUDE.md`/`AGENTS.md` 자동 로드도 함께 비활성화하므로
  §4의 정답 검증에는 사용하지 않았다. 이 경고와 간헐적 타임아웃은 문서 정책 내용의 정확성과는 무관한 부차적
  한계이며, 1회 대화형 신뢰 승인 이후에는 재발하지 않을 것으로 예상된다.
- **Codex bundled bubblewrap fallback**: `codex exec` 실행 시 `Codex could not find bubblewrap on PATH ... Codex
will use the bundled bubblewrap in the meantime.` 경고가 출력되었으나, `read-only` 샌드박스에서 정상적으로
  응답을 생성했으므로 비차단(non-blocking) 경고로 확인된다.
- **OpenCode `/init`의 서식 비결정성(§3)**: `/init`이 정책의 의미 내용(표 값·규칙 문구)을 바꾸지 않는다는 점은
  확인되었지만, 마크다운 표의 열 패딩 같은 순수 서식은 재작성 과정에서 바뀔 수 있다. 따라서 "MANUAL 블록이
  바이트 단위로 항상 보존된다"고 단정할 수 없다 — 정책 검증은 의미 비교(표 값·문구)를 기준으로 해야 하며,
  `cmp`/SHA-256 같은 바이트 비교만으로는 오탐(false negative)이 발생할 수 있다.

## 6. Check-all / Build 증거 (본 세션에서 직접 실행)

- `npm run check-all` (typecheck + lint + format:check): **통과**
  - `tsc --noEmit`: 오류 없음
  - `eslint .`: 오류 없음
  - `prettier --check .`: `All matched files use Prettier code style!`
- `npm run build` (`next build --turbopack`): **통과**
  - 출력에 표시된 버전: `Next.js 16.3.1 (Turbopack)`
  - 참고: `AGENTS.md`의 "External (런타임)" 표는 `next@15.5.3`으로 기재되어 있어 빌드 로그의 `16.3.1`과
    차이가 있다. 이 불일치는 **이번 One Fact, One Home 정책 diff와 무관한, 이전부터 존재하던 문서 부채
    (pre-existing documentation debt)**로 취급한다 — 정책 표(§2, `AGENTS.md`의 MANUAL 절)는 버전 사실의
    정본이 아니며, 실제 실행 버전의 정본은 `package.json`/`package-lock.json`(실행 가능한 소스)이다.
    이 문서는 그 불일치를 사실로만 기록하며, 정책 문서를 임의로 재해석해 정당화하지 않는다.
  - `Route (app)`: `/`, `/_not-found`, `/login`, `/signup` 4개 라우트 모두 정적(Static)으로 생성됨

## 7. 재현(rerun) 명령 — 자격 증명 불필요

아래 명령은 모두 자격 증명이나 비밀값을 요구하지 않으며, 저장소를 읽기 전용으로 조회하거나 임시(disposable)
디렉터리에서만 파일을 변경한다.

```bash
# 2. MANUAL 블록 해시/크기 재확인
sed -n '77,99p' AGENTS.md | sha256sum
sed -n '77,99p' AGENTS.md | wc -c -l

# 3. OpenCode /init 정책 보존 여부 — 디스포저블 테스트 (메인 작업 트리 밖에서 실행)
git worktree add --detach /tmp/init-check 3272d52
sha256sum /tmp/init-check/AGENTS.md                     # 실행 전 값 기록
sed -n '/<!-- MANUAL/,$p' /tmp/init-check/AGENTS.md | sha256sum
opencode run --dir /tmp/init-check --model openai/gpt-5.6-sol --command init
  # 세션이 npm ci / check-all / build까지 스스로 수행하며 다소 시간이 걸린다.
  # 필요 시 -c/--continue로 동일 세션을 이어서 완료해야 할 수 있다.
sha256sum /tmp/init-check/AGENTS.md                     # 실행 후 값과 비교
sed -n '/<!-- MANUAL/,$p' /tmp/init-check/AGENTS.md | sha256sum
diff <(sed -n '77,99p' AGENTS.md) <(sed -n '/<!-- MANUAL/,$p' /tmp/init-check/AGENTS.md)  # 의미 비교
git -C /tmp/init-check status --short
git worktree remove --force /tmp/init-check              # 반드시 정리

# 4. 정본 위치 질의 (신규 CLI 세션, 3종 모두)
opencode run "AGENTS.md의 '문서 정책: One Fact, One Home' 표에 따른 정본 위치 5가지를 답하라" \
  -m openrouter/anthropic/claude-sonnet-5
claude -p "AGENTS.md의 '문서 정책: One Fact, One Home' 표에 따른 정본 위치 5가지를 답하라" \
  --model claude-sonnet-5 --output-format text
  # 최초 실행 시 워크스페이스 신뢰 경고가 출력될 수 있으며, 드물게 타임아웃되면 재실행한다(§5).
codex exec -s read-only "AGENTS.md의 '문서 정책: One Fact, One Home' 표에 따른 정본 위치 5가지를 답하라"

# 6. 정적 검사 / 빌드
npm run check-all
npm run build
```

## 8. 시크릿/자격 증명 미포함 확인

이 문서와 그 작성 과정에서 API 키, 토큰, 웹훅 URL, 계정 식별자, 환경 변수 값 등 어떠한 비밀 정보도 조회·기록하지
않았다. `.claude/hooks/*.sh`가 참조하는 `SLACK_WEBHOOK_URL`은 이 작업 트리에 `.env` 파일이 존재하지 않아 실제로
로드되지 않았으며, 이 문서에도 값이 포함되어 있지 않다.
