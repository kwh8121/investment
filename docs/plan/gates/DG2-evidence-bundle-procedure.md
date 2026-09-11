# DG2 증거 번들 확보 절차

이 문서는 2026-08-03 신호일과 2026-09-08 평가 종료일을 사용하는 DG2 pilot-readiness 수집 절차다. 목표는 승인 ETF 5종 모두에 대해 분배금과 전략 시점 입력을 원문에서 재현 가능하게 연결하는 것이다. 최종 DG2 표본은 `signalAsOf` 시점 Kiwoom `tradeValue` 기준 상위 30개 적격 한국 ETF로 정확히 30종이며, 이 다섯 pilot ETF는 그 최종 표본의 필수 구성원이 아니라 pilot-readiness 이력으로만 보존한다. 이 pilot 번들은 단독으로 Gate 승격에 충분하지 않다.

## 1. 고정 범위

- ETF: `069500`, `102110`, `229200`, `360750`, `133690`
- 신호 기준일: `2026-08-03`
- 평가 종료일: `2026-09-08`
- 전략 버전: `strategy-v0.2`
- 평가 통화: `KRW`
- 벤치마크: `KOSPI200`

수집 도중 ETF, 날짜, 전략 버전을 바꾸지 않는다. 바꿔야 하면 새 번들 버전을 만든다.

## 2. 권장 번들 구조

저장소 템플릿은 [`DG2-evidence-bundle.manifest.template.json`](./DG2-evidence-bundle.manifest.template.json)과 [`DG2-evidence-review-checklist.md`](./DG2-evidence-review-checklist.md)를 복사해 사용한다.

원본 파일은 공개 저장소에 무심코 커밋하지 않도록 `/home/kwh8121/.local/share/stock-market/evidence-bundle/raw/`에 별도 보관한다. 저장소에는 외부 원본 파일명과 연결된 매니페스트 및 검토 결과만 기록한다.

KRX ETF 일별매매정보 원문은 `npm run capture:krx-etf-daily -- YYYYMMDD`로 수집한다. 이 명령은 `.env`의 서버 전용 `KRX_API_KEY`를 읽고, 같은 외부 디렉터리에 원문과 key 없는 SHA-256 metadata를 한 번만 생성한다. 이미 같은 기준일 artifact가 있으면 덮어쓰지 않는다.

```text
dg2-evidence-bundle/
  manifest.json
  distribution/
    069500.json
    102110.json
    229200.json
    360750.json
    133690.json
  strategy/
    069500-momentum.json
    069500-oversold.json
    ...
  derived/
    score-recalculation.json
  review/
    reviewer-checklist.md
```

외부 raw 파일은 원문 URL 또는 API 요청 조건과 함께 저장한다. API 키, Bearer 토큰, 쿠키, 계좌 식별자, 개인 정보는 원본과 로그에서 제거하거나 마스킹한다.

## 3. 분배금 원문 확보

소스 우선순위는 다음과 같다.

1. 운용사 공식 분배금 지급현황·공지·상품 문서
2. KRX ETF 이벤트/종가 데이터 — API 접근권한과 필드 의미를 먼저 확인
3. 공공데이터포털 — ETF 분배금 의미를 직접 증명하지 못하므로 보조 근거만 사용

ETF별로 공식 페이지 또는 다운로드 문서에서 다음 행을 확보한다.

- ETF 상품명과 단축코드
- 분배금 금액과 통화
- 분배락일 또는 지급기준일
- 지급일
- 문서 발행일 또는 데이터 기준일
- 해당 ETF와 원문 행의 매핑 근거

확보 직후 원문 파일에 대해 다음을 실행한다.

```bash
sha256sum /home/kwh8121/.local/share/stock-market/evidence-bundle/raw/<file>
stat -c '%n %s bytes' /home/kwh8121/.local/share/stock-market/evidence-bundle/raw/<file>
date -u '+%Y-%m-%dT%H:%M:%SZ'
```

`manifest.json`에는 URL, 파일명, SHA-256, 파일 크기, fetch 시각, publication/effective date, ticker mapping, reviewer를 기록한다. 분배금 행이 동적 화면에서만 보이고 원문 다운로드가 불가능하면 화면 캡처만으로 승인하지 말고, 공식 export/API 응답 또는 운용사 확인 문서를 추가로 확보한다.

## 4. 전략 시점 입력 확보

각 ETF에 대해 Momentum과 Oversold를 별도 번들로 만든다. `strategy.ts`가 받는 최종 0~100 값만 저장하지 말고, 그 값을 산출한 원본 관측치와 계산식을 함께 저장한다.

### Momentum

- `relativeStrength1M`
- `relativeStrength3M`
- `relativeStrength6M`
- `momentumAcceleration`
- `industryFundamental`
- `volumeLiquidity`
- `overheatRisk`

### Oversold

- `drawdownDepth`
- `drawdownDuration`
- `reversalSignal`
- `fundamentalRecovery`
- `volumeLiquidity`
- `dataConfidence`
- `structuralDamage`

### 공통 입력

- `ticker`, `asOf`, `valuationCurrency`, `universeFilterVersion`
- `qualityStatus`, `dataConfidence`, `isEtf`, `isLeveragedOrInverse`
- `fundamentalTriggerPassed`, `thesisEvidence`
- `liquidityScore`, `portfolioRiskPassed`
- `strategyVersion`
- 각 입력의 source URI/문서 ID, source field, publication/effective date, fetch 시각, SHA-256, 변환 버전, reviewer

원본 관측일은 반드시 `2026-08-03` 이전이어야 한다. 1M/3M/6M 상대강도와 낙폭 기간은 시작일·종료일을 명시한다. 2026-08-03 이후에 처음 공개된 값은 신호 입력으로 사용할 수 없다.

## 5. 재계산 및 누수 점검

1. 원본 파일의 SHA-256을 매니페스트와 대조한다.
2. 원본 관측일이 `asOf` 이후인지 검사한다.
3. 동일한 원본으로 Momentum과 Oversold를 각각 재계산한다.
4. `strategy-v0.2`, KRW, `universeFilterVersion`을 확인한다.
5. percentile, G0~G4, exclusion reason을 재생성한다.
6. Scanner를 사용하는 경우 overlap `<=0.5`, correlation `<=0.8`, core industry 최대 1개를 확인한다.
7. 재계산 결과를 `derived/score-recalculation.json`에 기록한다.

## 6. 검토 승인 조건

Reviewer는 ETF별로 다음을 체크한다.

- 분배금 원문이 공식 운용사·KRX 출처인가?
- 원문이 ETF 단축코드와 상품명을 직접 식별하는가?
- 금액·통화·기준일·지급일이 명확한가?
- publication/effective date와 fetch 시각이 기록됐는가?
- SHA-256과 원문 크기가 일치하는가?
- 전략 입력마다 원본 관측일과 계산식이 있는가?
- 신호일 이후 정보가 섞이지 않았는가?
- Momentum과 Oversold 입력이 분리되어 있는가?
- 다섯 pilot ETF 모두 동일 기준을 충족하는가?

하나라도 불명확하면 해당 ETF의 `dividendVerified` 또는 `strategyInputVerified`는 `false`로 유지한다.

## 7. Gate 반영

모든 pilot ETF의 증거 번들이 검토된 뒤에만 `docs/plan/gates/DG2-evidence-input.template.json`의 플래그와 실제 수익률을 갱신한다. 이후 다음을 실행한다.

```bash
npm run test:gate-validation
npm run typecheck
```

Owner/Approver 승인과 결정일을 DG2 문서에 기록한다. 다섯 pilot ETF 중 하나라도 증거가 없으면 DG2는 `Conditional Go`이며 Forward Validation을 시작하지 않는다. `signalAsOf` 시점 Kiwoom `tradeValue` 기준 상위 30개 적격 ETF로 정확히 30종 표본이 완성되기 전에는 `DG2-SAMPLE-SIZE`가 미충족이므로 DG2는 `Conditional Go`다(다섯 pilot ETF가 모두 충족되어도 마찬가지다). 신호일 이후 정보가 섞였거나 날짜 검증에 실패하면 DG2는 blocking `No-Go`다.

최종 30종 표본을 동결할 때는 `DG2-evidence-bundle.manifest.template.json`의 `selection` 블록(`selectorVersion`, `source`, `asOf`, `sourceSnapshot.sha256`, `sourceSnapshot.fetchedAt`, `members[].ticker/tradeValue/rank`)을 그대로 `DG2-evidence-input.template.json`의 `selection` 필드로, 동결한 신호일을 최상위 `signalAsOf` 필드로 옮겨 적는다. `selection.asOf`는 반드시 그 `signalAsOf`와 동일해야 한다 — 다른 날짜에 산출한 정당한 selector 결과라도 `asOf`가 다르면 거부된다. `evaluateDg2`의 non-blocking `DG2-SAMPLE-SELECTION` 검사는 `selection`이 없거나, `selectorVersion`·`source`·`asOf`·해시·시각이 무효거나, `members`나 `approvedTickers`의 ticker가 6자리 숫자 형식(`^\d{6}$`)이 아니거나, `sourceSnapshot.fetchedAt`이 `asOf`보다 이전이거나, `members`의 ticker 집합이 `approvedTickers`와 정확히 일치하지 않거나, 어떤 verification의 `signalAsOf`가 표본 수준 `signalAsOf`와 다르면 실패한다. 이 검사는 non-blocking이므로 출처 없는 표본이나 자기완결적으로 위조한 표본은 `No-Go`가 아니라 `Conditional Go`로 유지되지만, `Go` 판정에는 반드시 통과해야 한다.
