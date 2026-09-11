<!-- prettier-ignore-start -->

핸드오프 컨텍스트
=================

사용자 요청 원문
----------------
- "계속 ㅈ가업"
- "작업 순서에 따라 작업 완료하고 수집이 현재 수준에서 불가능한것은 종결로 처리 합니다."
- "미완료 작업이 있다면 작업을 완료하기 위한 방법을 찾아 해결책을 구체적으로 제시하세요. 프로젝트의 상황만 파악하는것은 사용자나 프로젝트 목적에 도움이 되지 않습니다. 최종  목적은 현재 시점에서 확보할수 없거나 기술적으로 불가한 계획은 과감하게 드롭하고 현실적인 가능한 목표를 완료한후 보완하는 작업이 중요합니다. 큰것을 위해 작은것을 버리는 것입니다."
- "20~30개 한국 ETF 표본 확정은 키움에서 거래 대금이 가장 많은 ETF 30개를 우선순위로 정합니다."
- "https://www.kiwoometf.com/service/report/KO03020000M 분배금 정보 입니다. 여기서 필요한 것을 다운로드 해서 처리하세요."
- "\"KRX·KSD·운용사·데이터 제공자 접근권한 신청·계약·로그인\" 에 관해서는 https://openapi.krx.co.kr/contents/OPP/INFO/service/OPPINFO004.cmd 의 서비스 목록을 참고하여 필요한 데이터에 KRX API 를 통해 접근하세요."
- "관련 사항은 이미 @docs/references/코넥스 일별매매정보_Spec.docx  와 .env 파일의 api 키를 활용하면 됩니다."
- "@docs/references/ETF 일별매매정보_Spec.docx 로 정정합니다."
- "현재 까지의 작업 현황을 정리해서 ~/projects/stock-market/docs/jobs 아래에 저장해주세요. 목적은 새로운 새션 시작시에 작업진행을 원활하게 하기위한 사전정보 즉  핸드오프 문서를 작성하는 것입니다."

목표
----
키움을 신호일 기준 거래대금 상위 30종의 유일한 정본 선택 소스로 유지하고, KRX는 읽기 전용 EOD 시장 데이터 교차검증으로만 사용하면서, 모든 공식 증거와 검토가 갖춰지기 전에는 Gate를 승격하지 않는 DG2 증거 경로를 완성한다.

완료한 작업
-----------
- KRX OpenAPI 공식 서비스 목록을 확인했다. ETF 일별매매정보는 가격, NAV, 거래량, 거래대금을 제공하지만 ETF 분배금 이력은 제공하지 않는다.
- 사용자 지정 명세 `docs/references/ETF 일별매매정보_Spec.docx`를 추출했다. endpoint는 `https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd`, 요청값은 `basDd`, 응답은 `OutBlock_1` ETF 행이며 `BAS_DD`, `ISU_CD`, `ISU_NM`, `TDD_CLSPRC`, `NAV`, `ACC_TRDVOL`, `ACC_TRDVAL` 필드를 포함한다.
- `src/lib/etf/krx-etf-daily-market-data.ts`를 추가했다. 이 모듈은 `AUTH_KEY`를 전송하고, 응답을 검증하며, 모든 행을 요청 기준일에 결속하고, 원문 bytes는 메모리에서만 반환하며, SHA-256과 수집 시각을 제공한다.
- `test/krx-etf-daily-market-data.test.ts`를 추가했다. 비성공 응답, 잘못된 JSON, 빈/누락 block, 잘못된 날짜, 잘못된 숫자 필드, 누락 키, 숫자 6자리 코드, 실제 형태의 영숫자 코드에 대한 검증을 포함한다.
- `src/lib/env.ts`에 optional `KRX_API_KEY` 검증을 추가하고, focused test script를 `package.json`과 `npm run check-all`에 연결했다.
- 로컬 `.env` 키를 출력하지 않고 `basDd=20260908`에 대해 실제 읽기 전용 요청을 실행했다. 1,168행, SHA-256 `09d381ad522e790d918f7dc73d2f4ee2d3158e5a4909f2e6f706bc60c2c31727`을 확인했다. 원문 응답은 저장소 밖에만 보관한다.
- 실제 KRX 응답에 `0184E0` 같은 영숫자 `ISU_CD`가 포함됨을 발견했다. 검증을 숫자 전용에서 정확히 6자리 대문자 영숫자로 변경했다. 키움 최종 표본의 6자리 숫자 ticker 규칙은 별도로 그대로 유지한다.
- 앞선 작업으로 `src/lib/etf/kiwoom-dg2-distribution-adapter.ts`와 테스트를 추가했다. 이 모듈은 키움 공식 분배금 AJAX 응답을 원문 JSON bytes와 대조하며, `dividendVerified: false`인 검토 전 후보 증거만 만든다.
- Oracle가 발견한 누적 거래량·거래대금 소수값 허용과 중복 일별 종목 행 허용을 수정했다. 이제 `ACC_TRDVOL`, `ACC_TRDVAL`은 음이 아닌 정수만 허용하고, 동일 `(BAS_DD, ISU_CD)` 중복 행은 거부한다.
- 기존 Samsung raw artifact 3개를 `/home/kwh8121/.local/share/stock-market/evidence-bundle/raw/`로 이동하고, 저장소 raw 경로를 `.gitignore`에 추가했다. 절차 문서도 외부 저장 위치를 명시하도록 변경했다.
- `scripts/capture-krx-etf-daily.ts`와 `capture:krx-etf-daily` 명령을 추가했다. `npm run capture:krx-etf-daily -- YYYYMMDD`는 `.env`의 서버 전용 key를 사용해 외부 저장소에 원문과 key 없는 metadata를 최초 1회 저장하며, 같은 기준일의 덮어쓰기를 거부한다.
- `npm run capture:krx-etf-daily -- 20260908`을 실제 실행했다. 외부 보관 원문은 1,168행, SHA-256 `09d381ad522e790d918f7dc73d2f4ee2d3158e5a4909f2e6f706bc60c2c31727`이며, 즉시 재실행해 overwrite가 `EEXIST`로 차단되는 것도 확인했다.

현재 상태
---------
- 현재 Gate는 DG2 `Conditional Go`, DG3/DG4 `No-Go`이며 Forward Validation은 시작하지 않았다.
- `dividendVerified`, `strategyInputVerified`는 모두 `false`다. 이번 작업에서 Gate 입력, 승인 JSON, 최종 표본 manifest, 실제 선택 결과를 변경하지 않았다.
- 최종 DG2 표본의 정본은 `signalAsOf` 시점 Kiwoom `tradeValue` 기준 정확히 30개 적격 한국 ETF이며, 동점은 ticker 오름차순이다. KRX `ACC_TRDVAL`은 교차검증/증거 준비용이며 정본 선택 소스를 대체하지 않는다.
- 공식 KRX 접근 조건을 확인했다. Data Marketplace 가입/로그인, 인증키 발급, 서비스별 이용신청과 승인, `AUTH_KEY` 헤더, 비상업적 이용, 제3자 재배포 금지, 키당 일 10,000회 제한을 준수해야 한다.
- KRX 변경 이후 `npm run test:krx-etf-daily-market-data` 10/10, `npm run check-all`, `npm run test:gate-validation` 16/16, `npm run build`, Prettier, `git diff --check`, 신규 TypeScript 파일 LSP diagnostics를 통과했다.
- Oracle 초기 감사 task `bg_f0520e7f`가 누적값/중복행과 raw artifact 저장소 문제를 차단 항목으로 지적했고, 해당 항목은 수정 후 독립 검증으로 통과했다. 재감사 task `bg_d3ea3fa6`은 Oracle 사용량 제한으로 판정을 반환하지 못했다. 이 제한은 구현의 Gate 승격 근거가 아니며, 향후 사용 가능 시 재감사할 수 있다.
- 저장소에는 이번 작업보다 앞선 대량의 수정·미추적 파일이 존재한다. 관련 없는 변경을 덮어쓰거나 정리하지 말고, 커밋도 만들지 않았다.

남은 작업
---------
- [대기] 실제 `signalAsOf` 시점 Kiwoom 원문 스냅샷을 보존하고 `selectDg2SampleByTradeValue`로 정확한 최종 30종을 선택한 후, 검토된 selection manifest를 만든다. KRX에서 실제 순위를 추론하면 안 된다.
- [대기] 선택된 모든 ETF에 대해 공식 운용사/KIND/KRX 승인 소스의 분배금 원문을 수집한다. 금액, 통화, 날짜 의미, hash, URI, 수집/발행 시각, reviewer가 필요하다. KRX ETF 일별매매정보만으로 분배금은 검증할 수 없다.
- [대기] 실제 30종 표본의 전략 시점 Momentum/Oversold 입력 provenance를 완결한다. 실제 선택이 생긴 뒤에만 현재 5종 한정 DG2 evidence batch를 일반화한다.
- [차단] DG2가 실제로 승인되기 전에는 DG3 다년 위험 증거 수집을 시작하지 않는다.
- [선택] Oracle 사용량 제한이 해제되면 KRX safeguard 수정 범위만 재감사한다. 현재는 독립 검증 결과로 기록한다.
- 현재 todo: KRX 서비스/접근 조건 확인, DG2 역할 매핑, 명세 추출, 접근 가능한 KRX 수집 준비, Oracle 지적 수정, 외부 raw capture 운영 명령, pipeline/Gate 보존 검증을 완료했다.

핵심 파일
---------
- `src/lib/etf/krx-etf-daily-market-data.ts` - 신규 KRX ETF EOD 수집, 검증, digest, 메모리 내 raw-byte 계약.
- `test/krx-etf-daily-market-data.test.ts` - KRX capture 계약과 실제 영숫자 식별자 회귀 테스트.
- `scripts/capture-krx-etf-daily.ts` - `.env` key를 서버에서만 사용해 KRX 원문과 metadata를 외부 보관소에 저장하는 운영 명령.
- `package.json` - `test:krx-etf-daily-market-data`와 `check-all` 연결.
- `docs/references/ETF 일별매매정보_Spec.docx` - 사용자가 지정한 공식 KRX ETF 일별매매 명세.
- `src/lib/etf/collection.ts` - 정본 Kiwoom 전용 exact top-30 DG2 selector. KRX로 대체 금지.
- `src/lib/etf/gate-validation.ts` - 최종 top-30 source-backed selection과 현재 Conditional/No-Go 상태를 강제.
- `src/lib/etf/kiwoom-dg2-distribution-adapter.ts` - 공식 키움 분배금 응답을 검토 전 후보 증거로 정규화.
- `docs/plan/gates/DG2-data-source-gap-report.md` - 누락된 DG2 데이터 소스의 정본 운영 종결/재개 조건.
- `docs/plan/gates/DG2-evidence-acquisition-plan.md` - 정본 증거 수집 순서, 소스 우선순위, manifest 요구사항.

중요한 결정
-----------
- PRD와 Gate validator가 `signalAsOf` 시점 Kiwoom `tradeValue`를 요구하므로, Kiwoom을 최종 30종 선택의 유일한 정본으로 유지했다.
- KRX `etf_bydd_trd`는 가격, NAV, 거래량, 거래대금을 제공하지만 ETF 분배금 금액/기준일/분배락일/지급일은 제공하지 않으므로 공식 EOD 교차검증으로만 사용한다.
- 프로젝트 정책에 따라 raw source bytes는 Git 밖에 보관하고, 이후 evidence에는 hash/provenance만 기록한다.
- 실제 공식 응답이 `0184E0` 같은 코드를 포함하므로 KRX `ISU_CD`를 6자리 대문자 영숫자로 처리한다. 키움 최종 표본의 6자리 숫자 ticker 조건은 의도적으로 별도다.
- HTTP 라이브러리, persistence, scheduler, retry framework는 추가하지 않았다. capture boundary는 작고 주입 가능하게 유지하여 테스트가 실제 자격 증명/endpoint를 호출하지 않도록 했다.
- 성공한 API 호출은 기술적 접근 증거일 뿐 투자 증거 또는 Gate 승인이 아니다. DG2/DG3/DG4, Forward Validation, `dividendVerified`, `strategyInputVerified`는 변경하지 않았다.

명시적 제약
-----------
- "작업 순서에 따라 작업 완료하고 수집이 현재 수준에서 불가능한것은 종결로 처리 합니다."

재개 시 컨텍스트
-----------------
- `.env`는 서버 셸 또는 신뢰된 서버 경계에서만 로드한다. `KRX_API_KEY`를 출력, 커밋, source URI, 테스트 fixture, `NEXT_PUBLIC_`에 넣으면 안 된다.
- KRX raw artifact 수집은 `npm run capture:krx-etf-daily -- YYYYMMDD`로 실행한다. key/raw bytes가 아니라 command가 출력하는 metadata와 digest만 기록한다. 생성된 동일 기준일 artifact는 의도적으로 덮어쓰지 않는다.
- KRX 영숫자 `ISU_CD`와 Kiwoom 최종 표본의 6자리 숫자 ticker를 혼동하지 않는다. Kiwoom 원문 스냅샷 없이 KRX 전종목을 final sample로 연결하면 안 된다.
- 프로젝트의 One Fact, One Home 정책에 따라 `docs/PRD.md`, `docs/ROADMAP.md`, `docs/architecture.md`, `docs/plan/gates/*.md`를 정본으로 읽는다. historical manifest와 pilot artifact는 최종 선택 증거가 아니다.
- Node test에는 package의 `type: module` 미선언으로 MODULE_TYPELESS_PACKAGE_JSON warning이 나온다. 기존의 비차단 경고이므로 이 증거 작업에서 변경하지 않는다.


Kiwoom historical daily capture 진행 결과 — 2026-09-11
------------------------------------------------------
- `scripts/capture-kiwoom-etf-historical-daily.ts`, `src/lib/etf/kiwoom-etf-historical-daily.ts`, `src/lib/etf/kiwoom-etf-historical-daily-run.ts` 및 focused tests를 추가했다. 이 경계는 Kiwoom ETF 목록과 일별 응답을 secret-safe JSON으로 정규화하고, Kiwoom 가격/NAV의 부호 표기를 절댓값 가격으로 처리한다. 거래량과 누적 거래대금은 음이 아닌 정수로 제한하며, 요청일 행이 없을 때만 명시적인 coverage gap으로 기록하고 그 외 malformed/duplicate row는 중단한다.
- Kiwoom CLI는 병렬 호출에서 실패했고 864건 순차 처리도 한 번의 실행 한도를 넘겼다. Oracle 권고에 따라 concurrency 1, batch 최대 100개, 15분 work budget, capture ID 범위의 immutable run definition/checkpoint/lock/원자적 ticker entry 구조로 전환했다. 목록 요청의 실측 시간이 12.338초여서 list/daily child timeout은 각각 30초로 설정했다.
- 실제 read-only capture를 `npm run capture:kiwoom-etf-historical-daily -- 20260803 dg2-20260911`로 9회 실행했다. 원문은 저장소 밖의 `/home/kwh8121/.local/share/stock-market/evidence-bundle/raw/kiwoom-etf-historical-daily/20260803/dg2-20260911/`에만 보관한다.
- frozen list SHA-256은 `7e945b5986b2b6143202d68dcaaed7b6daf659c498da43f5a8ca9af57b171970`이다. current Kiwoom list는 총 1,168행으로, 6자리 숫자 후보 864개와 매핑되지 않은 비숫자 식별자 304개를 분리해 기록했다. 숫자 후보 864개는 모두 `2026-08-03` 정확 일자 행으로 capture되었고, `missing_requested_date`는 0개다.
- 독립 무결성 검사에서 checkpoint=864, entry directory=864, candidate set=864가 모두 일치했고, 모든 entry의 raw SHA-256/result/status/normalized date 검증 실패는 0건이었다. raw JSON의 API key, authorization, cookie, password, secret, token, account 키 검색도 0건이었다.
- 이 capture는 **최종 DG2 selection이 아니다**. `ka40004` 목록은 현재 목록만 제공하므로 `2026-08-03` 당시 universe, ETF/ETN 및 레버리지/인버스 구분, 상장기간, 평균 거래대금 eligibility를 증명하지 못한다. 또한 304개 비숫자 식별자를 KRX 또는 추정 mapping으로 바꾸지 않았다. 이 두 공백이 해소되기 전에는 `selectDg2SampleByTradeValue` 실행, top-30 ticker/rank 생성, `approvedTickers`/`selection` 입력, DG2 승격을 모두 금지한다.
- 검증: `npm run test:kiwoom-etf-historical-daily` 9/9, `npm run test:kiwoom-etf-historical-daily-run` 3/3, `npm run test:gate-validation` 16/16, `npm run check-all`, `npm run build`, `git diff --check`, `src/lib/etf` 및 `scripts` LSP error diagnostics 0건을 통과했다. 최종 Oracle code review task `bg_cfde6c03`은 usage limit으로 실패했으며, 이는 승인 근거가 아니다.

재개 우선순위
-------------
1. historical `2026-08-03` Kiwoom universe/eligibility를 공식 source로 입증하거나, 현재 Kiwoom API에는 해당 capability가 없음을 DG2 scope closure로 기록한다.
2. 비숫자 식별자 304개의 공식 instrument/ticker mapping 및 historical membership을 얻기 전에는 numeric 864개 subset으로 순위를 만들지 않는다.
3. 위 공백이 해결될 때만 frozen raw entry의 `acc_trde_prica` 단위/의미를 재검토하고 selector/manifest 검토를 재개한다. 해결되지 않으면 이 경로는 현 접근 수준에서 종결하고 DG2 `Conditional Go`를 유지한다.

후속 코드 리뷰 미해결 사항 — 2026-09-11
-------------------------------------
- 독립 reviewer는 capture run의 실제 864-entry 무결성, selection 차단, Gate isolation은 통과로 확인했다. 그러나 비정상 종료 회복은 아직 보완되지 않았다.
- stale lock에는 PID liveness 확인/안전한 reclaim이 없고, write 중 남은 dot-prefixed temporary entry가 다음 resume을 중단시킬 수 있다. 또한 `missing_requested_date` 외 per-ticker 실패를 quarantine해 다음 ticker로 진행하는 처리와 capture-script I/O integration test가 없다.
- 이 문제는 이미 완료된 `dg2-20260911` run을 무효화하지 않으며 해당 external artifact를 수정하거나 삭제해서는 안 된다. 다만 신규 capture run을 시작하기 전에 lock/temp recovery 및 failure-record 상태를 테스트와 함께 구현해야 한다.
- 최종 Oracle review는 usage-limit으로 결과를 제공하지 못했다. 따라서 이 handoff의 code-health 판정은 mechanical verification과 reviewer findings에 한정되며, Oracle 승인을 주장하지 않는다.

<!-- prettier-ignore-end -->
