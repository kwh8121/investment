# DG0 정합화 작업 실행 계획 (승인본)

> **에이전트 작업자용:** 필수 하위 스킬은 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`다. 작업 단위로 실행하고, 진행 상태는 체크박스(`- [ ]`)로 기록한다.
>
> **상태 (2026-09-15):** 승인됨. 작업 0에서 사람 결정 1~4를 기록했고, 이 파일을 `docs/plan/2026-09-15-dg0-alignment.md` 정본으로 승격했다. 작업 1 이후는 별도 worktree에서 이 정본 계획을 기준으로 실행한다.

**목표:** PRD §11 DG0의 미충족·미결 조건(코드 선정 원천의 KRX 일치, 기존 충돌 계약 폐기)을 코드와 검사로 증명 가능한 상태로 만들고, 사람이 DG0를 판정할 수 있는 자료를 완성한다.

**아키텍처:** 키움 선정 계약(`collection.ts`, `gate-validation.ts`)은 다른 v1.7 경로가 import하지 않는 독립 묶음이므로 `src/lib/legacy/etf/`로 옮겨 CI·`check-all`에서 분리한다. v1.7 경로에는 `SELECTION_SOURCE = 'krx'` 계약과, 레거시 선정 계약이 다시 들어오지 못하게 막는 가드 테스트를 둔다. 상태 검사는 레거시 스냅샷 검사와 v1.7 상태 일관성 검사로 나눠, 사람의 판정 기록과 ROADMAP 표기가 어긋나면 실패하게 한다.

**기술 스택:** TypeScript 5, Node 24 테스트 러너(`node --experimental-strip-types --test`), GitHub Actions, Markdown 정본 문서, Spec Kit CLI 1.0.6(결정 3A').

**스펙:** `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md` §2.1·§11·§12.2·§14·§15; `docs/constitution.md`; `docs/plan/gates/DG0-v17-contract-unification.md`(현재 DG0 증거 패킷); `docs/ROADMAP-v1.7.md`.

## 전역 제약

- 스펙은 PRD v1.7 Final로 확정됐으며, 재설계·재서술하지 않는다.
- `docs/constitution.md` 제I~IX조를 따른다. 특히 VII.1(선행 Gate 전 후속 단계 코드 머지 금지), VII.4(Gate 판정은 사람), IX(사람 전용 결정: DG0 판정·헌법 개정 등)를 지킨다.
- 에이전트는 DG0 통과를 선언하지 않는다. Gate 문서의 조건 상태는 "증거 제출 — 판정 대기"까지만 쓴다.
- DG1 이후 기능(수집·날짜 상태·유니버스·Scanner·선정 엔진·UI 교체)을 구현하지 않는다.
- 역사 문서(`docs/PRD.md`, `docs/ROADMAP.md`, `docs/architecture.md`, 이전 `docs/plan/gates/*`)는 삭제·재작성하지 않는다.
- `test.skip`·`test.only`·`todo`로 검사를 우회하지 않는다.
- 정본 배치는 `docs/guides/one-fact-one-home.md`를 따른다. 결정·판정은 Gate 문서, DG 상태는 ROADMAP, 진행 상태는 Linear에 둔다.
- 각 코드 작업은 RED → 최소 구현 → 대상 테스트 GREEN → `npm run check-all` 순서로 증거를 남기고, PR 단계에서 CI(`Build application` 포함) 결과를 연결한다.

---

## 작업 0: 사람 결정 기록과 계획 승인 [완료]

승인 절차는 `초안 검토 → 결정 기록 → docs/plan 승격 → 별도 worktree 실행` 순서로 완료한다. 이 작업은 DG0 `Go` 판정이 아니라, DG0 정합화 실행 계획과 사람 전용 결정의 승인 기록이다.

| 항목       | 기록                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| 결정자     | `kwh8121`                                                                                                                  |
| Owner      | `kwh8121`                                                                                                                  |
| Approver   | `kwh8121`                                                                                                                  |
| 승인일     | 2026-09-15                                                                                                                 |
| 승인 근거  | 사용자 지시: "최적 권장안 대로 처리해주세요."                                                                              |
| Linear URL | 미연결. 이 세션에는 Linear 도구가 연결되지 않았으므로 Gate 문서와 Git 커밋을 승인 기록으로 둔다.                           |
| 정본 위치  | `docs/plan/2026-09-15-dg0-alignment.md`                                                                                    |
| 이전 초안  | `docs/superpowers/plans/2026-09-15-etf-price-signal-mvp-v17-dg0-alignment.md`에서 승격 후 제거. 중복 사본을 남기지 않는다. |

승인된 결정은 다음과 같다.

| 결정 | 승인값                          | 적용 범위                                                                                                                                        |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1-A  | A1 legacy 격리                  | `collection.ts`·`gate-validation.ts`와 관련 테스트를 legacy 경로로 이동하고, v1.7 경로에는 KRX 선정 원천 계약만 둔다.                            |
| 1-B  | B1 선정 원천 계약만             | 전략·백테스트·Scanner·위험·전향평가·리서치·대시보드 UI는 이번 DG0 코드 이동 대상에서 제외하고, Gate 문서에서 v1.7 완료 증거 제외로 기록한다.     |
| 2    | 2A' 단계별 GREEN 유지           | §12.2 테스트는 해당 단계 착수 시 RED로 도입하고 GREEN 이후 유지한다. #6은 #6-A 현재 master 차단과 #6-B 미래 가격 차단으로 실행 책임을 분리한다.  |
| 3    | 3A' Spec Kit 초기화 + 역할 정정 | `speckit-analyze`와 `speckit-converge`만 보조 도구로 남긴다. `tasks.md`는 정본 계획이 아니라 파생 색인과 converge 잔여 갭 기록이다.              |
| 4    | 4A Owner 읽기 전용 조회         | Supabase 프로젝트가 있으면 Owner가 테이블 존재 여부만 조회해 Gate에 기록한다. 프로젝트가 없으면 "프로젝트 미생성 — 적용 이력 없음"으로 기록한다. |

2A'의 #6 분리는 다음처럼 적용한다.

| 회귀 테스트 조각      | 의미                                                          | 최초 GREEN 책임 |
| --------------------- | ------------------------------------------------------------- | --------------- |
| #6-A 현재 master 차단 | 과거 유니버스·신호 계산에서 현재 master 접근 차단             | P0-02           |
| #6-B 미래 가격 차단   | 기준일 이후 가격·상태 접근 차단. 이후 가격은 평가 모듈만 읽음 | DG2.5           |

3A' 실행 시 `specify init --force` 전후로 기존 추적 `.claude/agents/**`, `.claude/commands/**`, `.claude/hooks/**`, `.claude/settings.local.json` 변경 여부를 확인한다. 변경이 발견되면 자동 복구하지 않고 중단하며, diff를 Gate 증거에 기록한다.

`npm run build` 증거는 로컬과 CI를 분리해 기록한다. 로컬 Turbopack 포트 바인딩 권한 오류는 검증 불가로 남기고 GREEN으로 주장하지 않는다. GitHub Actions의 build 성공은 CI 증거로만 연결한다.

---

## 파일 구조

| 파일                                                                                                                                                                                                    | 변경                      | 책임                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `src/lib/etf/selection-source.ts`                                                                                                                                                                       | 생성                      | v1.7 선정 원천 계약(`SELECTION_SOURCE = 'krx'`)                                                                 |
| `test/v17-selection-source-contract.test.ts`                                                                                                                                                            | 생성                      | v1.7 경로에 레거시 선정 계약·legacy import가 없고, CI·`check-all`이 레거시 gate 검사를 강제하지 않음을 보장     |
| `src/lib/legacy/etf/collection.ts`                                                                                                                                                                      | 이동 (`src/lib/etf/`에서) | 레거시 수집·키움 DG2 표본 선정 계약 보존                                                                        |
| `src/lib/legacy/etf/gate-validation.ts`                                                                                                                                                                 | 이동                      | 레거시 DG2~DG4 기계 판정기 보존                                                                                 |
| `test/legacy/etf-collection.test.ts`, `test/legacy/gate-validation.test.ts`                                                                                                                             | 이동                      | 레거시 동작 검증(수동 `npm run test:legacy`)                                                                    |
| `test/legacy/legacy-gate-status.test.ts`                                                                                                                                                                | 생성                      | 기존 `project-status.test.ts`의 레거시 스냅샷 검사 이관                                                         |
| `test/project-status.test.ts`                                                                                                                                                                           | 교체                      | v1.7 상태 일관성 검사(판정 기록 ↔ ROADMAP)                                                                     |
| `package.json`                                                                                                                                                                                          | 수정                      | `test:v17-contract`·`test:legacy` 추가, `test:task-006`·`test:gate-validation` 제거, `check-all` 앞에 가드 추가 |
| `.github/workflows/quality.yml`                                                                                                                                                                         | 수정                      | `Run gate tests` 단계 제거                                                                                      |
| `docs/architecture-v1.7.md`                                                                                                                                                                             | 수정                      | legacy 경로 해석 추가                                                                                           |
| `docs/constitution.md`                                                                                                                                                                                  | 수정 (2A'·3A')            | VII.5 개정, Gate 검증 문구 정정, 버전 기록                                                                      |
| `AGENTS.md`, `docs/ROADMAP-v1.7.md`, `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md`, `docs/guides/one-fact-one-home.md`, `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md` | 수정 (3A')                | Spec Kit 역할 문구 정정                                                                                         |
| `.claude/skills/speckit-analyze/`, `.claude/skills/speckit-converge/`, `.specify/**`                                                                                                                    | 생성 (3A')                | Spec Kit 보조 도구                                                                                              |
| `docs/plan/gates/speckit/dg0-v17/`                                                                                                                                                                      | 생성 (3A')                | Spec Kit 입력(심볼릭 링크)과 보고서                                                                             |
| `.prettierignore`                                                                                                                                                                                       | 수정 (3A')                | Spec Kit 생성물·보고서 제외                                                                                     |
| `docs/plan/gates/DG0-v17-contract-unification.md`                                                                                                                                                       | 수정                      | 결정 기록, 조건별 증거, 판정 대기 상태                                                                          |

---

## 작업 1: 키움 선정 계약 격리와 KRX 선정 원천 선언 [결정 1-A1·1-B1]

**파일:**

- 생성: `src/lib/etf/selection-source.ts`, `test/v17-selection-source-contract.test.ts`
- 이동: `src/lib/etf/collection.ts` → `src/lib/legacy/etf/collection.ts`, `src/lib/etf/gate-validation.ts` → `src/lib/legacy/etf/gate-validation.ts`, `test/etf-collection.test.ts` → `test/legacy/etf-collection.test.ts`, `test/gate-validation.test.ts` → `test/legacy/gate-validation.test.ts`
- 수정: `test/project-status.test.ts`(import 경로만), `package.json`, `.github/workflows/quality.yml`, `docs/architecture-v1.7.md`

**인터페이스:**

- 사용: 없음
- 제공: `SELECTION_SOURCE: 'krx'`, `type SelectionSource = 'krx'`(`src/lib/etf/selection-source.ts`). 가드 테스트의 `read(filePath)`와 `LEGACY_IMPORT` 정규식(작업 2에서 재사용). npm 스크립트 `test:v17-contract`, `test:legacy`.

- [ ] **1단계: 작업 브랜치 생성**

```bash
git switch main && git pull --ff-only
git switch -c feature/<linear-issue-id>-dg0-alignment   # Linear 이슈가 없으면 feature/dg0-alignment
```

- [ ] **2단계: 실패하는 가드 테스트 작성**

`test/v17-selection-source-contract.test.ts`:

```ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

import { SELECTION_SOURCE } from '../src/lib/etf/selection-source.ts'

const V17_SOURCE_ROOTS = ['src/lib/etf', 'src/app', 'src/components', 'scripts']
const LEGACY_SELECTION_MARKERS = [
  'DG2_SAMPLE_SELECTOR_VERSION',
  'selectDg2SampleByTradeValue',
  'Dg2SampleSelection',
  'kiwoom-trade-value',
]
const LEGACY_IMPORT = /from\s+['"][^'"]*\/legacy\//

const read = (filePath: string) => fs.readFileSync(filePath, 'utf8')

function listSourceFiles(root: string): string[] {
  return fs
    .readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter(entry => /\.tsx?$/.test(entry))
    .map(entry => path.join(root, entry))
}

const v17SourceFiles = V17_SOURCE_ROOTS.flatMap(listSourceFiles)

describe('v1.7 selection source contract (PRD §11 DG0, §15)', () => {
  it('declares KRX as the only v1.7 selection source', () => {
    assert.equal(SELECTION_SOURCE, 'krx')
  })

  it('keeps the legacy Kiwoom selection contract out of v1.7 source paths', () => {
    const offenders = v17SourceFiles.filter(file => {
      const content = read(file)
      return LEGACY_SELECTION_MARKERS.some(marker => content.includes(marker))
    })
    assert.deepEqual(offenders, [])
  })

  it('does not import legacy modules from v1.7 source paths', () => {
    const offenders = v17SourceFiles.filter(file =>
      LEGACY_IMPORT.test(read(file))
    )
    assert.deepEqual(offenders, [])
  })

  it('does not run legacy gate tests in CI or check-all', () => {
    const workflow = read('.github/workflows/quality.yml')
    const checkAll: string = JSON.parse(read('package.json')).scripts[
      'check-all'
    ]
    assert.doesNotMatch(workflow, /test:gate-validation|test:legacy/)
    assert.doesNotMatch(checkAll, /test:gate-validation|test:legacy/)
  })
})
```

- [ ] **3단계: RED 확인 (1) — 계약 모듈 없음**

실행: `node --experimental-strip-types --test test/v17-selection-source-contract.test.ts`

기대 결과: FAIL. `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/lib/etf/selection-source.ts'`

- [ ] **4단계: KRX 선정 원천 계약 작성**

`src/lib/etf/selection-source.ts`:

```ts
export const SELECTION_SOURCE = 'krx' as const

export type SelectionSource = typeof SELECTION_SOURCE
```

- [ ] **5단계: RED 확인 (2) — 레거시 선정 계약이 v1.7 경로와 CI에 있음**

실행: `node --experimental-strip-types --test test/v17-selection-source-contract.test.ts`

기대 결과: `pass 2`, `fail 2`.

- `keeps the legacy Kiwoom selection contract out of v1.7 source paths`: actual이 `[ 'src/lib/etf/collection.ts', 'src/lib/etf/gate-validation.ts' ]`
- `does not run legacy gate tests in CI or check-all`: `quality.yml`의 `run: npm run test:gate-validation`에 매치

- [ ] **6단계: 레거시 선정 계약 이동과 import 경로 갱신**

```bash
mkdir -p src/lib/legacy/etf test/legacy
git mv src/lib/etf/collection.ts src/lib/legacy/etf/collection.ts
git mv src/lib/etf/gate-validation.ts src/lib/legacy/etf/gate-validation.ts
git mv test/etf-collection.test.ts test/legacy/etf-collection.test.ts
git mv test/gate-validation.test.ts test/legacy/gate-validation.test.ts
sed -i "s#'../src/lib/etf/collection.ts'#'../../src/lib/legacy/etf/collection.ts'#; s#'../src/lib/etf/gate-validation.ts'#'../../src/lib/legacy/etf/gate-validation.ts'#" test/legacy/etf-collection.test.ts test/legacy/gate-validation.test.ts
sed -i "s#'../src/lib/etf/gate-validation.ts'#'../src/lib/legacy/etf/gate-validation.ts'#" test/project-status.test.ts
```

`src/lib/legacy/etf/gate-validation.ts`의 `from './collection.ts'`는 두 파일이 함께 이동하므로 그대로 둔다.

- [ ] **7단계: npm 스크립트 수정**

`package.json`의 `scripts`에서:

- 삭제: `"test:task-006": "node --experimental-strip-types --test test/etf-collection.test.ts",`
- 삭제: `"test:gate-validation": "node --experimental-strip-types --test test/gate-validation.test.ts",`
- 추가: `"test:legacy": "node --experimental-strip-types --test \"test/legacy/*.test.ts\"",`
- 추가: `"test:v17-contract": "node --experimental-strip-types --test test/v17-selection-source-contract.test.ts",`
- `check-all` 값의 맨 앞에 `npm run test:v17-contract && `를 붙인다(뒤 내용은 그대로).

- [ ] **8단계: CI에서 레거시 gate 단계 제거**

`.github/workflows/quality.yml`에서 아래 2줄과 바로 뒤의 빈 줄 1줄을 삭제한다(들여쓰기 6칸·8칸 그대로).

```text
      - name: Run gate tests
        run: npm run test:gate-validation
```

- [ ] **9단계: GREEN 확인**

```bash
node --experimental-strip-types --test test/v17-selection-source-contract.test.ts   # 기대: pass 4, fail 0
npm run test:legacy     # 기대: tests 27, pass 27, fail 0
npm run status:check    # 기대: pass 2, fail 0 (작업 2 전까지는 레거시 판정기를 import)
```

- [ ] **10단계: 아키텍처 기준선의 구현 상태 해석 갱신**

`docs/architecture-v1.7.md`의 "구현 상태의 해석" 절 끝에 아래 문단을 추가한다.

```markdown
키움 거래대금 기반 DG2 표본 선정과 이전 DG2~DG4 기계 판정기는 v1.7 선정 원천(KRX)과 충돌하므로 `src/lib/legacy/etf/`와 `test/legacy/`로 격리했다. v1.7 경로(`src/lib/etf/**`, `src/app/**`, `src/components/**`, `scripts/**`)는 legacy 모듈을 import하지 않으며, 선정 원천은 `src/lib/etf/selection-source.ts`의 `SELECTION_SOURCE`(`'krx'`)로만 선언한다. 이 경계는 `test/v17-selection-source-contract.test.ts`가 `check-all`에서 검사한다. legacy 검사는 `npm run test:legacy`로 수동 실행하며 CI·`check-all`에 포함하지 않는다.
```

- [ ] **11단계: 전체 검사**

```bash
npx prettier --write test/v17-selection-source-contract.test.ts src/lib/etf/selection-source.ts docs/architecture-v1.7.md
npm run check-all   # 기대: 종료 코드 0, "All matched files use Prettier code style!"
```

2026-09-15 scratchpad 작업 트리에서 1~9·11단계를 시험 실행해 위 기대 결과를 모두 확인했다.

- [ ] **12단계: 커밋**

```bash
git add src/lib/etf/selection-source.ts src/lib/legacy test/v17-selection-source-contract.test.ts test/legacy test/project-status.test.ts package.json .github/workflows/quality.yml docs/architecture-v1.7.md
git status --short   # 기대: R 4건(이동), A 2건(신규), M 4건. 이동 전 경로는 git mv가 이미 스테이징함
git commit -m "리팩터: 키움 선정 계약을 legacy로 격리하고 KRX 선정 원천 선언"
```

---

## 작업 2: v1.7 상태 검사와 레거시 스냅샷 검사 분리

**파일:**

- 생성: `test/legacy/legacy-gate-status.test.ts`
- 교체: `test/project-status.test.ts`
- 수정: `test/v17-selection-source-contract.test.ts`(테스트 1개 추가)

**인터페이스:**

- 사용: 작업 1의 `read(filePath)`·`LEGACY_IMPORT`, `src/lib/legacy/etf/gate-validation.ts`의 `evaluateProjectState(dg2Input, dg3Input, dg4Input)`
- 제공: 사람 판정 기록 형식 `> **판정:** Go (YYYY-MM-DD, Approver: 이름)`(작업 6에서 사용). ROADMAP 기준선 표의 `DG0`·`DG1~DG4` 행 상태 규칙.

- [ ] **1단계: 실패하는 가드 추가**

`test/v17-selection-source-contract.test.ts`의 `describe` 블록 안, 마지막 `it` 뒤에 빈 줄 하나를 두고 추가한다(2칸 들여쓰기 그대로).

```text
  it('keeps the v1.7 status check independent of legacy evaluators', () => {
    assert.doesNotMatch(read('test/project-status.test.ts'), LEGACY_IMPORT)
  })
```

- [ ] **2단계: RED 확인**

실행: `node --experimental-strip-types --test test/v17-selection-source-contract.test.ts`

기대 결과: `pass 4`, `fail 1`. `✖ keeps the v1.7 status check independent of legacy evaluators`

- [ ] **3단계: 레거시 스냅샷 검사 이관**

`test/legacy/legacy-gate-status.test.ts`:

```ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'

import dg2Input from '../../docs/plan/gates/DG2-evidence-input.template.json' with { type: 'json' }
import dg3Input from '../../docs/plan/gates/DG3-evidence-input.template.json' with { type: 'json' }
import dg4Input from '../../docs/plan/gates/DG4-evidence-input.json' with { type: 'json' }
import { evaluateProjectState } from '../../src/lib/legacy/etf/gate-validation.ts'

const read = (path: string) => fs.readFileSync(path, 'utf8')

describe('legacy gate-evidence snapshot', () => {
  it('derives the historical gate and operation state from legacy evidence inputs', () => {
    const state = evaluateProjectState(dg2Input, dg3Input, dg4Input)

    assert.equal(state.dg2.decision, 'Conditional Go')
    assert.equal(state.dg3.decision, 'No-Go')
    assert.equal(state.dg4.decision, 'No-Go')
    assert.equal(state.canStartForwardValidation, false)
  })

  it('keeps legacy gate documents synchronized with the legacy evaluator', () => {
    const state = evaluateProjectState(dg2Input, dg3Input, dg4Input)
    const legacyRoadmap = read('docs/ROADMAP.md')
    const dg2 = read('docs/plan/gates/DG2-strategy-validation.md')
    const dg3 = read('docs/plan/gates/DG3-strategy-risk.md')
    const dg4 = read('docs/plan/gates/DG4-product-alpha.md')

    assert.match(
      legacyRoadmap,
      new RegExp(`Machine gate status: DG2 ${state.dg2.decision}`)
    )
    assert.match(legacyRoadmap, new RegExp(`DG3 ${state.dg3.decision}`))
    assert.match(legacyRoadmap, new RegExp(`DG4 ${state.dg4.decision}`))
    assert.match(legacyRoadmap, /Forward Validation Not Started/)
    assert.match(legacyRoadmap, /역사적 스냅샷/)
    assert.match(dg2, new RegExp(`Machine status: ${state.dg2.decision}`))
    assert.match(dg3, new RegExp(`Machine status: ${state.dg3.decision}`))
    assert.match(dg4, new RegExp(`Machine status: ${state.dg4.decision}`))
  })
})
```

- [ ] **4단계: v1.7 상태 일관성 검사로 교체**

`test/project-status.test.ts` 전체를 아래로 바꾼다. 기존 테스트는 ROADMAP 문구 `DG0 증거 준비 중 — 사람의 Gate 판정 전`을 고정해 사람이 판정을 기록하면 실패했다. 새 테스트는 문구 대신 **판정 기록과 ROADMAP 표기의 일관성**을 검사한다.

```ts
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'

const ROADMAP_PATH = 'docs/ROADMAP-v1.7.md'
const DG0_GATE_PATH = 'docs/plan/gates/DG0-v17-contract-unification.md'
const HUMAN_GO_DECISION =
  /^> \*\*판정:\*\* Go \(\d{4}-\d{2}-\d{2}, Approver: [^)]+\)/m

const read = (path: string) => fs.readFileSync(path, 'utf8')

function baselineRow(roadmap: string, item: string): string[] {
  const row = roadmap
    .split('\n')
    .filter(line => line.startsWith('|'))
    .map(line => line.split('|').map(cell => cell.trim()))
    .find(cells => cells[1] === item)
  assert.ok(row, `${ROADMAP_PATH} 기준선 표에 ${item} 행이 없다`)
  return row
}

describe('v1.7 execution state', () => {
  const roadmap = read(ROADMAP_PATH)
  const dg0Approved = HUMAN_GO_DECISION.test(read(DG0_GATE_PATH))

  it('links the DG0 baseline row to the v1.7 gate record', () => {
    assert.ok(baselineRow(roadmap, 'DG0')[3].includes(DG0_GATE_PATH))
  })

  it('marks DG0 as passed only when the gate record holds a human Go decision', () => {
    assert.equal(baselineRow(roadmap, 'DG0')[2] === '통과', dg0Approved)
  })

  it('keeps DG1~DG4 not started until DG0 has a human Go decision', () => {
    if (!dg0Approved) {
      assert.equal(baselineRow(roadmap, 'DG1~DG4')[2], '미착수')
    }
  })

  it('does not promote legacy gate status into the v1.7 roadmap', () => {
    assert.doesNotMatch(roadmap, /DG2 Conditional Go/)
  })
})
```

- [ ] **5단계: GREEN 확인**

```bash
npx prettier --write test/project-status.test.ts test/legacy/legacy-gate-status.test.ts test/v17-selection-source-contract.test.ts
node --experimental-strip-types --test test/v17-selection-source-contract.test.ts   # 기대: pass 5, fail 0
npm run status:check    # 기대: pass 4, fail 0
npm run test:legacy     # 기대: tests 29, pass 29, fail 0
```

- [ ] **6단계: 상태 검사가 잘못된 표기를 잡는지 확인 (커밋하지 않음)**

```bash
cp docs/ROADMAP-v1.7.md /tmp/roadmap.bak
sed -i 's/^| DG0                     | 증거 준비 중         |/| DG0                     | 통과                 |/' docs/ROADMAP-v1.7.md
npm run status:check    # 기대: pass 3, fail 1 (판정 기록 없이 '통과' 표기)
cp /tmp/roadmap.bak docs/ROADMAP-v1.7.md && git diff --exit-code docs/ROADMAP-v1.7.md
```

2026-09-15 시험 실행에서, 판정 기록 없이 `통과` 표기, Go 기록 후 ROADMAP 미갱신은 모두 실패하고, Go 기록과 `통과` 표기가 함께 있으면 통과함을 확인했다.

- [ ] **7단계: 전체 검사와 커밋**

```bash
npm run check-all   # 기대: 종료 코드 0
git add test/project-status.test.ts test/legacy/legacy-gate-status.test.ts test/v17-selection-source-contract.test.ts
git commit -m "테스트: v1.7 상태 검사와 레거시 Gate 스냅샷 검사 분리"
```

---

## 작업 3: 헌법 개정 반영 [결정 2A'·3A']

헌법 개정은 사람 전용 결정(IX.7)이다. 작업 0에서 kwh8121이 2A'와 3A'를 승인했으므로 해당 항목을 반영한다. `docs/constitution.md`는 `.prettierignore` 대상이므로 원문 레이아웃(줄 끝 공백 2칸, `*   ` 글머리표와 빈 줄 들여쓰기)을 유지한다.

**파일:** 수정 `docs/constitution.md`

- [ ] **1단계: 버전과 개정 기록 (2A'·3A' 공통)**

| 줄  | 변경 전                                       | 변경 후                                                                                                                                                                                                       |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | `> **Constitution Version:** 0.1.0 (DRAFT)  ` | `> **Constitution Version:** 0.2.0 (DRAFT)  `                                                                                                                                                                 |
| 6   | `> **Last Amended:** [미정]`                  | `> **Last Amended:** <실행일 YYYY-MM-DD> — VII.5 단계별 GREEN 유지로 개정, Gate 검증 도구 역할 정정 (영향: 적용 대상, Art. VII.5, Development Workflow; 근거: PRD §12.2·§14·P0-02, Spec Kit 1.0.6 도구 동작)` |

- [ ] **2단계: VII.5 개정 (2A')**

변경 전:

```text
*   **VII.5** §12.2 필수 회귀 테스트 14개는 DG1 이후 모든 머지에서 GREEN이어야 한다. 테스트 삭제·완화는 헌법 개정 사안이다.
```

변경 후:

```text
*   **VII.5** §12.2 필수 회귀 테스트는 PRD §14 순서상 해당 단계 착수 시 RED로 도입하고, GREEN이 된 이후의 모든 머지에서 GREEN을 유지한다. DG2.5 판정 전까지 14개 모두 GREEN이어야 한다. #6은 #6-A 현재 마스터 차단(P0-02 완료 조건)과 #6-B 미래 가격 차단(DG2.5 완료 조건)으로 나눠 증명한다. 테스트 삭제·완화는 헌법 개정 사안이다.
```

- [ ] **3단계: Gate 검증 문구 정정 (3A')**

| 줄  | 변경 전                                                                                                                                                                  | 변경 후                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7   | ``> **적용 대상:** Spec Kit `/speckit.checklist` · `/speckit.analyze` · `/speckit.converge`의 판정 근거이자, Superpowers 모든 서브에이전트 브리프의 Global Constraints`` | ``> **적용 대상:** Gate 문서의 §11 체크리스트·§15 추적 표와 Spec Kit `/speckit-analyze` · `/speckit-converge`의 판정 근거이자, Superpowers 모든 서브에이전트 브리프의 Global Constraints``                                                                   |
| 228 | ``*   **Gate 검증:** DG 종료 시 `/speckit.checklist`로 통과 조건 대조, `/speckit.analyze`로 §15 수용기준 15개 커버리지 확인. 결과는 사람에게 제출.``                     | ``*   **Gate 검증:** DG 종료 시 Gate 문서의 §11 체크리스트로 통과 조건을, §15 추적 표로 수용기준 15개 커버리지를 대조한다. `/speckit-analyze`(PRD·DG 계획·헌법 정합성)와 `/speckit-converge`(코드 대조) 보고를 보조 자료로 연결한다. 결과는 사람에게 제출.`` |

- [ ] **4단계: 확인과 커밋**

```bash
grep -n "0.2.0 (DRAFT)\|해당 단계 착수 시 RED로 도입\|§11 체크리스트로 통과 조건" docs/constitution.md   # 기대: 3줄
npm run check-all   # 기대: 종료 코드 0
git add docs/constitution.md
git commit -m "문서: 헌법 VII.5 단계별 GREEN 유지와 Gate 검증 도구 역할 개정"
```

---

## 작업 4: Gate 검증 도구 경로 정정 [결정 3A']

**파일:**

- 생성: `.claude/skills/speckit-analyze/`, `.claude/skills/speckit-converge/`, `.specify/**`, `docs/plan/gates/speckit/dg0-v17/{spec.md,plan.md,tasks.md}`
- 수정: `.prettierignore`, `AGENTS.md`, `docs/ROADMAP-v1.7.md`, `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md`, `docs/guides/one-fact-one-home.md`, `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md`

**인터페이스:**

- 사용: 작업 3의 헌법 문구(같은 역할 정의)
- 제공: 보고서 경로 `docs/plan/gates/speckit/dg0-v17/analyze.md`, `docs/plan/gates/speckit/dg0-v17/tasks.md`(converge 잔여 갭 기록). 작업 5에서 링크한다.

- [ ] **1단계: 초기화 전 상태 확인**

```bash
git status --short   # 기대: 출력 없음
git ls-files .claude/agents .claude/commands .claude/hooks .claude/settings.local.json
git diff -- .claude/agents .claude/commands .claude/hooks .claude/settings.local.json   # 기대: 출력 없음
ls .claude/skills 2>/dev/null   # 기대: 없음 (speckit-* 충돌 없음)
```

- [ ] **2단계: Spec Kit 초기화**

```bash
specify init --here --force --non-interactive --integration claude --ignore-agent-tools
git status --short   # 기대: ?? .claude/skills/ 와 ?? .specify/ 만 표시
git diff -- .claude/agents .claude/commands .claude/hooks .claude/settings.local.json   # 기대: 출력 없음
```

기존 추적 `.claude/agents/**`, `.claude/commands/**`, `.claude/hooks/**`, `.claude/settings.local.json` 변경이 발견되면 자동 복구하지 않는다. 그 자리에서 중단하고 diff를 Gate 증거에 기록한 뒤 후속 방침을 별도로 정한다.

- [ ] **3단계: 사용하지 않는 스킬 제거와 헌법 이중화 방지**

```bash
rm -r .claude/skills/speckit-{checklist,clarify,constitution,implement,plan,specify,tasks,taskstoissues}
rm .specify/memory/constitution.md
ln -s ../../docs/constitution.md .specify/memory/constitution.md
ls .claude/skills   # 기대: speckit-analyze  speckit-converge
```

- [ ] **4단계: DG0 입력 디렉터리 구성**

```bash
mkdir -p docs/plan/gates/speckit/dg0-v17
ln -s ../../../../ETF_Price_Signal_MVP_PRD_v1_7_Final.md docs/plan/gates/speckit/dg0-v17/spec.md
ln -s ../../../2026-09-15-dg0-alignment.md docs/plan/gates/speckit/dg0-v17/plan.md
```

`docs/plan/gates/speckit/dg0-v17/tasks.md`(실제 파일):

```markdown
# DG0 작업 색인과 converge 잔여 갭 기록

작업 정본은 `plan.md`(DG0 정합화 실행 계획)이다. 이 파일은 정본이 아니라 Spec Kit 보조 도구가 읽는 파생 색인과 converge 잔여 갭 기록이다.

- [ ] 작업 1: 키움 선정 계약 격리와 KRX 선정 원천 선언
- [ ] 작업 2: v1.7 상태 검사와 레거시 스냅샷 검사 분리
- [ ] 작업 3: 헌법 개정 반영
- [ ] 작업 4: Gate 검증 도구 경로 정정
- [ ] 작업 5: DG0 판정 자료 갱신

## converge 잔여 갭

`/speckit-converge`가 이 절 아래에 잔여 갭을 추가한다. 추가된 항목은 Linear 이슈 또는 계획 수정으로 옮긴 뒤 처리 결과를 적는다.
```

```bash
SPECIFY_FEATURE_DIRECTORY=docs/plan/gates/speckit/dg0-v17 .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
# 기대: FEATURE_DIR이 docs/plan/gates/speckit/dg0-v17로 출력되고 .specify/feature.json(로컬 전용, gitignore)에 저장됨
```

- [ ] **5단계: `.prettierignore`에 생성물 제외 추가**

`# Agent and tool runtime metadata` 절의 `.sisyphus/` 다음 줄에 추가한다.

```text
.specify/
docs/plan/gates/speckit/
```

- [ ] **6단계: 6개 문서의 Spec Kit 역할 문구 정정**

| 파일:줄                                                                    | 변경 전                                                                                                                                                                         | 변경 후                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md:60`                                                             | ``- 각 DG 종료 시 `/speckit.checklist`로 PRD §11 통과 조건을 대조하고 `/speckit.analyze`로 §15의 15개 수용 기준을 대조한다. 결과는 Gate 증거이며 사람 판정을 대체하지 않는다.`` | ``- 각 DG 종료 시 Gate 문서의 §11 체크리스트로 통과 조건을, §15 추적 표로 15개 수용 기준을 대조한다. `/speckit-analyze`(PRD·DG 계획·헌법 정합성)와 `/speckit-converge`(코드 대조) 보고를 보조 증거로 연결한다. 모두 사람 판정을 대체하지 않는다.`` |
| `docs/ROADMAP-v1.7.md:29` (증거 산출물 칸)                                 | `v1.7 차이 매트릭스, 정본 문서 정합화, checklist/analyze 결과`                                                                                                                  | `v1.7 차이 매트릭스, 정본 문서 정합화, §11 체크리스트·§15 추적 표, analyze/converge 보고`                                                                                                                                                          |
| `docs/ROADMAP-v1.7.md:43`                                                  | ``- 각 DG 종료 시 `/speckit.checklist`로 PRD §11을, `/speckit.analyze`로 PRD §15 수용 기준 15개를 대조한다. 두 결과는 사람의 Gate 판정을 대체하지 않는다.``                     | ``- 각 DG 종료 시 Gate 문서의 §11 체크리스트와 §15 추적 표로 통과 조건과 수용 기준 15개를 대조하고, `/speckit-analyze`·`/speckit-converge` 보고를 `docs/plan/gates/speckit/<dg>/`에 연결한다. 이 결과들은 사람의 Gate 판정을 대체하지 않는다.``    |
| `docs/ETF Price Signal MVP_Spec Kit + Superpowers.md:22` (오른쪽 칸)       | ``수작업 체크리스트로는 요구 수준의 추적이 흐트러짐 → Spec Kit의 `constitution / checklist / analyze / converge`만 채택``                                                       | ``수작업 체크리스트로는 요구 수준의 추적이 흐트러짐 → Spec Kit의 `constitution / analyze / converge`만 채택 (Gate 조건 대조 표는 Gate 문서)``                                                                                                      |
| 같은 문서 `:28`                                                            | `### Spec Kit — 쓰는 것 (4개)`                                                                                                                                                  | `### Spec Kit — 쓰는 것 (3개)`                                                                                                                                                                                                                     |
| 같은 문서 `:32`                                                            | ``*   `/speckit.checklist` — DG0~DG4 통과 조건 6개``                                                                                                                            | (이 글머리표와 뒤따르는 빈 줄 삭제)                                                                                                                                                                                                                |
| 같은 문서 `:34`                                                            | ``*   `/speckit.analyze` — 각 DG 종료 시 수용기준 15개 커버리지 대조``                                                                                                          | ``*   `/speckit-analyze` — DG 계획 승인 전·DG 종료 시 PRD(spec)·DG 계획(plan/tasks)·헌법 정합성 보조 점검``                                                                                                                                        |
| 같은 문서 `:36`                                                            | ``*   `/speckit.converge` — DG2.5 실패 후 잔여 갭을 새 `rule_version` 태스크로 추가``                                                                                           | ``*   `/speckit-converge` — DG 종료 시 코드와 PRD·DG 계획 대조, DG2.5 실패 후 잔여 갭을 새 `rule_version` 태스크로 추가``                                                                                                                          |
| 같은 문서 `:41`                                                            | `` *   `specify`, `clarify`, `plan`, `research`, `quickstart`, `implement` ``                                                                                                   | ``*   `specify`, `clarify`, `plan`, `research`, `quickstart`, `implement`, `checklist` (Spec Kit 1.0.6의 checklist는 요구사항 문서 품질 점검용이며 코드·Gate 조건을 대조하지 않는다)``                                                             |
| 같은 문서 `:68`                                                            | `*   **Superpowers 단독으로 축소:** Spec Kit 4개 기능이 …`                                                                                                                      | `*   **Superpowers 단독으로 축소:** Spec Kit 3개 기능이 …` (나머지 문장 그대로)                                                                                                                                                                    |
| `docs/guides/one-fact-one-home.md:75`                                      | ``- Verifier는 diff, 실행 결과, PRD §11 checklist, PRD §15 analyze 결과와 `docs/plan/gates/`의 증거를 대조한다.``                                                               | ``- Verifier는 diff, 실행 결과, Gate 문서의 PRD §11 체크리스트·§15 추적 표, analyze/converge 보조 보고와 `docs/plan/gates/`의 증거를 대조한다.``                                                                                                   |
| `docs/guides/one-fact-one-home.md:139`                                     | ``- [ ] 관련 `docs/plan/gates/` 문서에 실행 결과·input manifest·checklist/analyze 링크가 있다.``                                                                                | ``- [ ] 관련 `docs/plan/gates/` 문서에 실행 결과·input manifest·§11 체크리스트·§15 추적 표와 analyze/converge 보고 링크가 있다.``                                                                                                                  |
| `docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md:24` | ``… DG 종료 때 `/speckit.checklist`와 `/speckit.analyze` 결과를 Gate 증거로 제출한다.``                                                                                         | ``… DG 종료 때 Gate 문서의 §11 체크리스트·§15 추적 표와 `/speckit-analyze`·`/speckit-converge` 보고를 Gate 증거로 제출한다.``                                                                                                                      |
| 같은 문서 `:81`                                                            | ``- [ ] DG0 체크리스트와 `/speckit.analyze` 수용기준 매핑을 작성해 사람에게 판정 자료로 제출한다.``                                                                             | ``- [ ] DG0 §11 체크리스트와 §15 수용기준 추적 표를 작성하고 `/speckit-analyze` 보고를 연결해 사람에게 판정 자료로 제출한다.``                                                                                                                     |
| 같은 문서 `:114`                                                           | ``… 및 `/speckit.checklist`·`/speckit.analyze` 결과를 DG1 증거로 제출한다.``                                                                                                    | ``… 및 §11 체크리스트·§15 추적 표와 `/speckit-analyze`·`/speckit-converge` 보고를 DG1 증거로 제출한다.``                                                                                                                                           |
| 같은 문서 `:220`                                                           | ``3. `/speckit.checklist`는 해당 DG §11 조건을, `/speckit.analyze`는 §15의 15개 기준 커버리지를 대조한다. 둘은 사람의 Gate 판정을 대체하지 않는다.``                            | ``3. Gate 문서의 §11 체크리스트는 해당 DG 통과 조건을, §15 추적 표는 15개 기준 커버리지를 대조한다. `/speckit-analyze`(문서 정합성)와 `/speckit-converge`(코드 대조)는 보조 보고이며, 모두 사람의 Gate 판정을 대체하지 않는다.``                   |

`…`는 해당 줄에서 바꾸지 않는 앞부분 또는 나머지 문장을 뜻한다. 편집 전 각 줄을 `sed -n '<줄>p' <파일>`로 확인하고 줄 번호가 달라졌으면 문구로 찾는다.

- [ ] **7단계: 보조 보고 실행과 저장**

1. Claude Code에서 `/speckit-analyze DG0 정합화 계획이 PRD v1.7 §11 DG0·§14와 헌법 VII·IX에 맞는지 점검`을 실행한다. 출력 보고서를 `docs/plan/gates/speckit/dg0-v17/analyze.md`에 저장하고, 첫 줄에 실행일과 기준 커밋 SHA를 적는다.
2. `/speckit-converge`를 실행한다. `tasks.md`의 "converge 잔여 갭" 절에 추가된 항목을 검토하고, 항목마다 처리(계획 반영, Linear 이관, 해당 없음) 결과를 적는다.

- [ ] **8단계: 전체 검사와 커밋**

```bash
npx prettier --write docs/ROADMAP-v1.7.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md
npm run check-all   # 기대: 종료 코드 0
git add .claude/skills .specify docs/plan/gates/speckit .prettierignore AGENTS.md docs/ROADMAP-v1.7.md "docs/ETF Price Signal MVP_Spec Kit + Superpowers.md" docs/guides/one-fact-one-home.md docs/superpowers/plans/2026-09-14-etf-price-signal-mvp-v17-program.md
git commit -m "문서: Spec Kit 역할을 실제 도구 동작에 맞춰 정정하고 DG0 보조 보고 추가"
```

---

## 작업 5: DG0 판정 자료 갱신 [결정 4A 포함]

**파일:** 수정 `docs/plan/gates/DG0-v17-contract-unification.md`, `docs/ROADMAP-v1.7.md`

**인터페이스:**

- 사용: 작업 1~4의 커밋 SHA, PR URL, CI run URL, `analyze.md`·`tasks.md` 경로
- 제공: 작업 6에서 사람이 판정할 최종 패킷

- [ ] **1단계: migration 적용 여부 조회 [Owner 실행, 결정 4A]**

Supabase SQL Editor에서 읽기 전용으로 실행한다. 결과에는 테이블 이름과 존재 여부만 기록하고, 연결 정보·키는 기록하지 않는다.

```sql
select to_regclass('supabase_migrations.schema_migrations') is not null
  as has_supabase_migration_history;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ingestion_run', 'raw_snapshot', 'etf_master', 'daily_quote',
    'quality_event', 'universe_filter_decision', 'daily_collection_run',
    'daily_quality_flag', 'strategy_scorecard', 'candidate_gate_result'
  )
order by table_name;
```

Supabase 프로젝트가 없으면 "프로젝트 미생성 — 적용 이력 없음"으로 기록한다.

- [ ] **2단계: PR 생성과 CI 확인**

```bash
git push -u origin HEAD
gh pr create --base main --title "리팩터: DG0 정합화 — 키움 선정 계약 격리와 판정 자료 보완" --body-file <PR 본문 파일>
gh pr checks --watch   # 기대: verify pass (Build application, browser QA, repository checks)
```

- [ ] **3단계: Gate 문서 갱신**

`docs/plan/gates/DG0-v17-contract-unification.md`에서 다음을 반영한다. `<...>`는 실행 중 확정되는 값이다.

1. 상단: `상태` 줄을 `> **상태 (<실행일>):** 증거 제출 — 사람 판정 대기<br>`로 바꾸고, `Owner`·`Approver`에 작업 0의 이름을 적는다.
2. "명시적으로 필요한 사람 결정" 절을 "기록된 사람 결정 (<결정일>)" 표로 바꾼다.

   | 결정                    | 선택                             | 결정자  | 반영                                                            |
   | ----------------------- | -------------------------------- | ------- | --------------------------------------------------------------- |
   | 1-A 키움 선정 계약 처리 | A1 legacy 격리                   | <이름>  | 작업 1 `<SHA>`                                                  |
   | 1-B 코드 격리 범위      | B1 선정 원천 계약만              | <이름>  | 비목표 자산은 v1.7 경로·완료 증거에서 제외, 교체는 DG2 이후·DG3 |
   | 2 헌법 VII.5            | 2A' 단계별 GREEN 유지 및 #6 분리 | kwh8121 | 작업 3 `<SHA>`, 헌법 0.2.0                                      |
   | 3 Spec Kit              | 3A' 초기화 + 역할 정정           | kwh8121 | 작업 4 `<SHA>`                                                  |
   | 4 migration 적용 여부   | 4A 조회                          | <이름>  | 1단계 조회 결과 요약                                            |

3. "DG0 §11 체크리스트와 사람 결정 요청" 표:

   | DG0 통과 조건                        | 현재 증거                                                                                                                                                                                                                                                      | 상태                  | 사람 판정 시 확인할 것                            |
   | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------- |
   | 국내 가격·거래량·거래대금 정본이 KRX | PRD §2.1·`docs/architecture-v1.7.md`가 KRX 정본을 선언. `krx-dg2-adapter.ts`는 레거시 결합이 있어 DG1에서 독립 KRX 수집 계약으로 재증명(결정 1-B1)                                                                                                             | 증거 제출 — 판정 대기 | DG1 재증명 조건을 수용하는지                      |
   | 문서·코드의 선정 원천이 KRX로 일치   | `src/lib/etf/selection-source.ts`(`SELECTION_SOURCE = 'krx'`), `test/v17-selection-source-contract.test.ts`가 `check-all`에서 v1.7 경로의 레거시 선정 표식·legacy import·CI 강제를 검사. 키움 선정 계약은 `src/lib/legacy/etf/`로 격리. PR <URL>, CI run <URL> | 증거 제출 — 판정 대기 | 가드 테스트가 조건을 충분히 대표하는지            |
   | 기존 충돌 계약 폐기                  | 키움 선정 계약은 코드 격리, CI 단계 제거. 환율·분배금·리서치·포트폴리오·자동 평가·기존 UI는 결정 1-B1에 따라 v1.7 경로·완료 증거에서 제외하고 교체 DG를 지정. migration: <1단계 결과>                                                                          | 증거 제출 — 판정 대기 | 문서 처분만으로 비목표 자산의 "폐기"를 인정하는지 |

4. §15 추적 색인의 2번 행 DG0 상태를 `` 증거 제출 — 판정 대기: 가드 테스트 `test/v17-selection-source-contract.test.ts` ``로 바꾼다.
5. §12.2 추적 표의 #6 행 다음 증거 위치를 `헌법 VII.5(0.2.0): #6-A 현재 master 차단은 P0-02, #6-B 미래 가격 차단은 DG2.5에서 최초 GREEN 후 유지`로, #1~5·#14 행과 #7~13 행을 `헌법 VII.5(0.2.0) 단계별 도입 — ROADMAP 순차 작업 표의 단계`로 바꾼다.
6. 매트릭스와 인벤토리 커버리지의 경로를 이동 후 경로로 바꾼다: `src/lib/legacy/etf/collection.ts`, `src/lib/legacy/etf/gate-validation.ts`, `test/legacy/etf-collection.test.ts`, `test/legacy/gate-validation.test.ts`. `test/project-status.test.ts` 행은 `test/legacy/legacy-gate-status.test.ts`(`OUT_OF_SCOPE_OR_HISTORICAL`, 레거시 스냅샷)로 바꾸고, 표 아래에 한 줄을 추가한다: "v1.7 신규 자산: `src/lib/etf/selection-source.ts`, `test/v17-selection-source-contract.test.ts`, `test/project-status.test.ts`(v1.7 상태 일관성) — 레거시 감사 대상 아님."
7. "실행 증거"에 절을 추가한다: `### DG0 정합화 PR <URL> (head <SHA>)`. 내용은 `check-all` PASS, `test:legacy` 29/29 PASS, CI run <URL>의 Build application·browser QA·repository checks 결과, 로컬 `npm run build` 결과(실패 시 원인), `analyze.md`·`tasks.md` 링크와 converge 잔여 갭 처리 요약이다.
8. "DG0 통과 전 남은 증거" 절을 `- Approver의 DG0 판정 기록(작업 6)`만 남긴다.

- [ ] **4단계: ROADMAP 상태 갱신**

`docs/ROADMAP-v1.7.md`:

| 위치                     | 변경 전                                                               | 변경 후                                                                                |
| ------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 7행                      | `> **상태 (2026-09-14):** DG0 증거 준비 중 — 사람의 Gate 판정 전<br>` | `> **상태 (<실행일>):** DG0 판정 대기 — 사람의 Gate 판정 전<br>`                       |
| 8행                      | `> **다음 작업:** 기존 문서·코드·테스트·Gate 증거의 v1.7 차이 매핑`   | ``> **다음 작업:** DG0 사람 판정 (`docs/plan/gates/DG0-v17-contract-unification.md`)`` |
| 기준선 표 DG0 행 상태 칸 | `증거 준비 중`                                                        | `판정 대기`                                                                            |

- [ ] **5단계: 검사와 커밋**

```bash
npx prettier --write docs/plan/gates/DG0-v17-contract-unification.md docs/ROADMAP-v1.7.md
npm run check-all   # 기대: 종료 코드 0 (status:check는 '판정 대기'를 허용)
git add docs/plan/gates/DG0-v17-contract-unification.md docs/ROADMAP-v1.7.md
git commit -m "문서: DG0 정합화 증거와 사람 결정 기록 반영"
git push
```

---

## 작업 6: DG0 판정 기록 [사람 전용 — Approver]

에이전트는 이 작업을 수행하지 않는다. Approver가 작업 5의 패킷을 검토한 뒤 기록한다. Approver가 문구를 지정하면 에이전트가 그대로 입력할 수 있으나, 판정 내용은 Approver의 것이다.

- [ ] **1단계: Gate 문서에 판정 기록**

Go인 경우 상단 `상태` 줄 바로 다음에 추가하고, `상태` 줄을 `판정 완료 — Go`로 바꾼다.

```markdown
> **판정:** Go (YYYY-MM-DD, Approver: 이름)<br>
```

문서 끝의 "판정 경계" 절 앞에 판정 절을 추가한다: 판정 근거 PR·SHA, 조건 3개별 확인 내용, 남은 위험(예: KRX 재증명은 DG1 조건), 허용되는 다음 작업(§12.1 보유 자료 검사와 DG1 계획).

No-Go인 경우 `> **판정:** No-Go (YYYY-MM-DD, Approver: 이름)<br>`를 기록하고, 반려 사유와 보완 요구를 판정 절에 적는다.

- [ ] **2단계: ROADMAP 반영**

- Go: 기준선 표 DG0 행 상태 `통과`, 상단 `상태`를 `DG0 통과 — DG1 계획 착수 가능`, `다음 작업`을 `§12.1 보유 자료 검사 및 DG1 계획`으로 바꾼다. DG1~DG4 행은 DG1 착수 시까지 `미착수`로 둔다.
- No-Go: 기준선 표 DG0 행 상태 `반려`, `다음 작업`을 반려 사유의 보완 작업으로 바꾼다.

- [ ] **3단계: 일관성 검사**

```bash
npm run status:check   # 기대: pass 4, fail 0. Go 기록과 '통과' 표기가 어긋나면 실패한다
```

Linear 이슈에는 Gate 문서 링크와 판정 결과만 남긴다.

---

## 계획 자체 검토

- **스펙 대조:** PRD §11 DG0 조건 1(KRX 정본)은 작업 5의 체크리스트 행과 DG1 재증명 결정, 조건 2(선정 원천 일치)는 작업 1의 가드 테스트와 legacy 격리, 조건 3(충돌 계약 폐기)은 작업 1(코드 격리)·작업 5(처분 기록·migration 확인)로 다룬다. 사람 판정은 작업 6에만 둔다. Gate 문서의 사람 결정 1~4는 작업 0에서 모두 선택지로 제시했다.
- **자리표시자 점검:** `<실행일>`, `<SHA>`, `<URL>`, `<이름>`은 실행 중 확정되는 기록 값이다. 설계가 비어 있는 단계는 없다. 승인값 외 선택은 이 계획의 범위 밖이며, 필요하면 새 계획으로 다룬다.
- **이름 일관성:** `SELECTION_SOURCE`, `SelectionSource`, `LEGACY_IMPORT`, `read`, `test:v17-contract`, `test:legacy`, `src/lib/legacy/etf/`, `test/legacy/`, `docs/plan/gates/speckit/dg0-v17/`을 작업 전반에서 같은 이름으로 사용한다.
- **시험 실행:** 작업 1·2의 코드·명령과 기대 결과(RED 두 번, GREEN, `check-all` 통과, 상태 검사의 세 경우)는 2026-09-15 scratchpad 작업 트리에서 확인했고, 저장소에는 반영하지 않았다. 작업 3~6은 문서·도구·사람 작업이라 시험 실행하지 않았다.
