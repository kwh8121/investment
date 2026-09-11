# KRX Open API ETF 일별매매정보 리포트

> 기준일: 2026-09-11
> 범위: 사용자 지정 KRX ETF 일별매매정보 명세, 프로젝트 capture 구현, 실제 read-only 수집 결과 및 DG2 역할 경계

## 요약

KRX ETF 일별매매정보 API는 기준일별 ETF 행을 제공하며, 프로젝트에서는 종가·NAV·거래량·거래대금을 read-only EOD 교차검증에 사용한다. 이 endpoint는 Kiwoom 일별 데이터와의 가격/NAV/거래량 대조 및 원본 보존 가능한 capture에는 적합하다.

반대로 이 endpoint만으로 ETF 분배금 금액, 분배락일, 기준일, 지급일, total-return 처리, 과거 특정 시점의 적격 ETF universe를 확정할 수 없다. 따라서 KRX `ACC_TRDVAL`은 DG2 final top-30 selection을 대체하지 않으며, Kiwoom이 최종 선택의 유일한 정본이다.

## API 계약

| 항목               | 내용                                                   |
| ------------------ | ------------------------------------------------------ |
| endpoint           | `https://data-dbg.krx.co.kr/svc/apis/etp/etf_bydd_trd` |
| 요청 기준일        | `basDd` (`YYYYMMDD`)                                   |
| 인증               | `AUTH_KEY` header                                      |
| 응답 block         | `OutBlock_1`                                           |
| 프로젝트 호출 형태 | `GET .../etf_bydd_trd?basDd=<YYYYMMDD>`                |
| 접근 방식          | 서버 측 read-only capture; API key는 `.env`에서만 읽음 |

프로젝트 구현 `src/lib/etf/krx-etf-daily-market-data.ts`는 HTTP redirect를 거부하고, 성공 응답의 raw bytes를 메모리에서 parse한 뒤 SHA-256과 수집 시각을 만든다. raw response와 key는 Git에 저장하지 않는다.

## 확인된 응답 필드

`OutBlock_1`의 각 행에서 다음 필드를 필수로 검증한다.

| 필드         | 의미      | 프로젝트 검증                              |
| ------------ | --------- | ------------------------------------------ |
| `BAS_DD`     | 기준일    | 요청한 `basDd`와 정확히 일치하는 유효 날짜 |
| `ISU_CD`     | 종목 코드 | 6자리 대문자 영숫자                        |
| `ISU_NM`     | 종목명    | 비어 있지 않은 문자열                      |
| `TDD_CLSPRC` | 종가      | 숫자 문자열                                |
| `NAV`        | NAV       | 숫자 문자열                                |
| `ACC_TRDVOL` | 거래량    | 음이 아닌 정수 문자열                      |
| `ACC_TRDVAL` | 거래대금  | 음이 아닌 정수 문자열                      |

실제 KRX 응답에는 `0184E0`처럼 숫자만으로 구성되지 않은 `ISU_CD`가 포함되므로, KRX 코드 검증은 6자리 대문자 영숫자를 허용한다. 이는 Kiwoom final sample의 6자리 숫자 ticker 요구와 별개다.

## 수집 무결성 및 운영 방식

capture 구현은 다음 오류를 즉시 실패로 처리한다.

- `basDd` 형식 또는 달력 날짜 오류
- 비성공 HTTP 응답 또는 JSON이 아닌 응답
- 누락되었거나 비어 있는 `OutBlock_1`
- 요청일과 다른 `BAS_DD`
- 필수 필드 누락, 숫자 필드 형식 오류
- 동일 `(BAS_DD, ISU_CD)` 중복 행

운영 명령은 다음과 같다.

```text
npm run capture:krx-etf-daily -- YYYYMMDD
```

명령은 `.env`의 서버 전용 key를 사용하여 raw response와 key 없는 metadata를 저장소 밖 evidence storage에 최초 1회 기록하며, 동일 기준일 artifact 덮어쓰기를 거부한다.

## 수집 결과의 기록 원칙

실제 capture의 기준일, 행 수, SHA-256, 저장 위치, overwrite 결과와 교차검증 결과는 Gate evidence record에서 관리한다. 이 API 리포트에는 재현 가능한 capture 계약만 남긴다. EOD price/NAV/volume 접근과 교차검증 가능성은 분배금 또는 Gate 승인을 뜻하지 않는다.

## 과거 데이터 확보 범위

실제 확보 범위는 기존 `2026-09-04`·`2026-09-08` snapshot과, 최근 완료 기준일 `2026-09-10`에서 역산한 `2026-06-19`~`2026-09-10`의 60개 평일 read-only backfill이다. 이 범위는 API의 날짜별 조회 가능성을 확인하지만, historical universe를 독립적으로 확정하는 listing master는 아니다.

60개 평일 기준일 backfill에서는 rate-limit 응답 없이 모든 기준일이 nonempty·date-bound 응답과 중복 없는 `ISU_CD` 집합을 반환했다. 다만 `2026-07-17`, `2026-08-17`은 `INVSTASST_NETASST_TOTAMT`, `ACC_TRDVAL`, `TDD_CLSPRC`, `NAV`, `ACC_TRDVOL`이 전 행 공란이었다. 따라서 이들 다섯 필드가 과거 날짜에 항상 채워진다고 말할 수 없다.

각 기준일의 행 수, SHA-256, field completeness, raw-only 예외 artifact, pilot 교차검증 및 overwrite 정책은 [DG2 data source gap report](../plan/gates/DG2-data-source-gap-report.md)에 기록한다. 이 API 리포트의 응답 필드 표는 validated capture contract를 설명하며, raw bytes와 key-free metadata는 저장소 밖 evidence storage에만 보관한다.

## DG2에서의 역할

### 허용 역할

1. Kiwoom 일별 가격·NAV·거래량과의 read-only EOD 교차검증
2. 원본 URI, SHA-256, 수집 시각을 갖는 source-backed evidence capture
3. signal date와 row date를 결속한 가격 기반 derived input의 보조 증거

`src/lib/etf/krx-dg2-adapter.ts`는 승인된 KRX host, ticker/date binding, source hash, publish/fetch time, transform version, reviewer 및 계산식/관측 window를 요구한다. KRX-derived 값은 이런 provenance를 갖춘 전략 입력 일부가 될 수 있지만, 나머지 비가격 입력 증거를 대신하지 않는다.

### 금지 역할

| 금지                                                                                        | 이유                                                                                                        |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| KRX `ACC_TRDVAL`로 final top-30 선택                                                        | 프로젝트 계약은 Kiwoom `tradeValue`를 유일한 selection source로 지정                                        |
| ETF 일별매매정보만으로 분배금 검증                                                          | amount, ex-date, record date, payment date, total-return 의미를 제공하지 않음                               |
| KRX 전종목 행으로 complete eligible Kiwoom universe 또는 cross-source ticker mapping을 대체 | Kiwoom selection 계약의 historical universe/eligibility와 식별자 mapping을 이 endpoint만으로 완결할 수 없음 |
| KRX 영숫자 `ISU_CD`를 Kiwoom numeric ticker로 추정 변환                                     | 공식 mapping과 historical membership이 없는 임의 연결은 미래 누수·universe 오류를 초래                      |

## DG2 상태와 재개 조건

KRX ETF 일별매매정보의 성공적인 API 호출은 기술적 접근 증거일 뿐 최종 selection이나 Gate 승격의 근거가 아니다. 현재 Gate 상태와 검증 flag는 정본 Gate 문서에서만 관리한다.

최종 top-30을 만들려면 먼저 historical `signalAsOf`의 Kiwoom universe와 eligibility를 공식 원천으로 입증해야 한다. 그 뒤에만 Kiwoom `tradeValue`로 정확히 30개를 선택하고, 각 ETF의 분배금·전략 시점 입력을 독립적으로 검토한 evidence bundle로 완성할 수 있다.

Gate 판정, 누락 증거, 현재 access closure 및 재개 조건의 정본은 [DG2 data source gap report](../plan/gates/DG2-data-source-gap-report.md)다. 이 문서는 KRX endpoint의 기능·검증·역할 경계를 설명하며 Gate 정본을 대체하지 않는다.

## 근거

- `docs/references/ETF 일별매매정보_Spec.docx`
- `src/lib/etf/krx-etf-daily-market-data.ts`
- `src/lib/etf/krx-dg2-adapter.ts`
- `scripts/capture-krx-etf-daily.ts`
- `docs/jobs/2026-09-10-krx-openapi-handoff.md`
- `docs/plan/gates/DG2-data-source-gap-report.md`
