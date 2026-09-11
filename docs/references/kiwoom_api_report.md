# 키움 REST API ETF 정보 리포트

> 기준일: 2026-09-11
> 범위: 프로젝트에 보관된 키움 REST API 명세, read-only CLI 실조회, 그리고 현재 DG2 증거 계약에서 확인된 ETF 데이터 범위

## 요약

키움 REST API의 ETF 계열 TR은 ETF 수익률, 상품 정보, 일별·시간대별 시세/추이, 체결, 시간대별 NAV 및 수급 현황을 제공한다. 프로젝트에서 검증한 read-only 경로는 상품 목록, 상품 정보, 일별 추이, 기간 수익률이며, 일별 데이터는 종가·거래량·NAV·누적 거래대금과 괴리/추적 관련 값을 제공한다.

이 API는 최종 DG2 표본의 **거래대금 정렬 원천**으로 지정되어 있다. 그러나 현재 `ka40004` 목록은 현재 시점 목록이므로, 과거 `signalAsOf`의 ETF universe와 적격성(ETF/ETN, 레버리지·인버스, 상장기간, 평균 거래대금)을 단독으로 증명하지 못한다. 따라서 기술적으로 수집한 일별 가격 데이터만으로 top-30 선택이나 Gate 승격을 해서는 안 된다.

## 인증 및 공통 호출 계약

로컬 명세 `docs/references/kiwoom-rest-api-spec.json` 기준 공통 계약은 다음과 같다.

| 항목           | 내용                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| 운영 도메인    | `https://api.kiwoom.com`                                                                              |
| 모의 도메인    | `https://mockapi.kiwoom.com`                                                                          |
| ETF API 경로   | `POST /api/dostk/etf`                                                                                 |
| 접근 토큰 발급 | `POST /oauth2/token` (`au10001`)                                                                      |
| 토큰 발급 입력 | `grant_type=client_credentials`, `appkey`, `secretkey`                                                |
| 요청 헤더      | `api-id: <TR>`, `authorization: Bearer <token>`                                                       |
| 연속 조회      | 응답 header의 `cont-yn=Y`이면 응답 header의 `cont-yn`, `next-key` 값을 다음 요청의 동명 header에 전달 |

토큰·앱키·시크릿·계좌 정보는 보고서, 테스트 fixture, URL, Git 저장소에 기록하지 않는다. 기술적 접근 성공은 데이터 사용 권한, 투자 적합성, DG2 Gate 승인을 뜻하지 않는다.

## ETF TR 범위

`ka40005`는 로컬 명세에 존재하지 않는다. 아래 표는 명세에 실제로 있는 ETF TR만 정리한 것이다.

| TR        | 명세상 명칭         | 제공 범주     | 프로젝트 활용 상태                                |
| --------- | ------------------- | ------------- | ------------------------------------------------- |
| `ka40001` | ETF수익율요청       | ETF 수익률    | `profit` read-only 호출 확인                      |
| `ka40002` | ETF종목정보요청     | ETF 상품 정보 | `info` read-only 호출 확인                        |
| `ka40003` | ETF일별추이요청     | 일별 추이     | `daily` read-only 호출 및 historical capture 사용 |
| `ka40004` | ETF전체시세요청     | 전체 ETF 시세 | `list` read-only 호출 및 현재 목록 수집에 사용    |
| `ka40006` | ETF시간대별추이요청 | 시간대별 추이 | 명세 확인, 프로젝트 미검증                        |
| `ka40007` | ETF시간대별체결요청 | 시간대별 체결 | 명세 확인, 프로젝트 미검증                        |
| `ka40008` | ETF일자별체결요청   | 일자별 체결   | 명세 확인, 프로젝트 미검증                        |
| `ka40009` | ETF시간대별NAV현황  | 시간대별 NAV  | 명세 확인, 프로젝트 미검증                        |
| `ka40010` | ETF시간대별수급현황 | 시간대별 수급 | 명세 확인, 프로젝트 미검증                        |

명세에 존재한다는 사실과 특정 입력 조건·과거 범위·응답 의미가 프로젝트에서 검증되었다는 사실은 다르다. 표의 “미검증” TR은 DG2 증거에 사용하지 않는다.

## 프로젝트에서 검증한 데이터

### 상품 목록과 상품 정보

현재 CLI의 `list`/`info` 경로는 ETF 종목 코드와 명칭, 그리고 상품 메타데이터를 제공한다. `info`에서는 ETF명, 추적지수, 액면가, 과세 유형을 확인할 수 있다.

`ka40004`를 정규화하는 `src/lib/etf/kiwoom-etf-historical-daily.ts`는 목록 응답의 `etfall_mrpr`에서 `stk_cd`, `stk_nm`을 읽는다. 6자리 숫자 코드는 국내 ETF 후보로 분리하고, 그 외 식별자는 `unsupportedIdentifiers`로 보존한다. 이 분리는 식별자 미매핑 항목을 임의로 제외하거나 다른 소스로 추정 매핑하지 않기 위한 보호 장치다.

### 일별 추이

`ka40003`의 `etfdaly_trnsn`에서 프로젝트가 정규화·검증하는 필드는 다음과 같다.

| 원본 필드        | 정규화 필드     | 의미 및 검증                                                                 |
| ---------------- | --------------- | ---------------------------------------------------------------------------- |
| `cntr_dt`        | `date`          | 요청일과 정확히 일치하는 단일 행만 허용                                      |
| `cur_prc`        | `closePrice`    | 부호는 방향 표기로 간주하고 절댓값 가격으로 정규화                           |
| `trde_qty`       | `tradeQuantity` | 음이 아닌 정수 거래량                                                        |
| `nav`            | `nav`           | 부호를 제거한 유한 NAV 값                                                    |
| `acc_trde_prica` | `tradeValue`    | 명세상 누적거래대금이나 단위·선택 적합성은 별도 검토가 필요한 음이 아닌 정수 |

프로젝트 정규화기는 응답에서 요청일 행이 없을 때 `KiwoomRequestedDateMissingError`를 명시적 coverage gap으로 기록한다. 동일 요청일의 중복 행, 형식 오류, 또는 선택된 행의 날짜 불일치는 실패로 처리한다.

### 수익률과 분배금 후보

`profit` 경로는 기간 수익률 확인에 사용했지만, 분배금·분배락일·지급일의 원천 증거가 아니다. `info`와 `nav`도 분배금 이력을 제공한다는 근거로 사용할 수 없다.

별도 키움 ETF 웹 분배금 AJAX 응답은 `src/lib/etf/kiwoom-dg2-distribution-adapter.ts`에서 검토 후보로 정규화할 수 있다. 후보에는 기준일, 분배락일, 지급일, 금액, KRW, 비율, 원본 SHA-256, 수집 시각이 포함되지만, 항상 `dividendVerified: false`와 `pending_source_date_review`로 시작한다. 선택된 핵심 원본 필드 일치, HTTPS 호스트, endpoint, 날짜 형식까지 검증하더라도 독립 검토와 total-return 처리 규칙이 없으면 Gate 증거가 아니다.

## 과거 데이터 확보 범위

실제 확보 범위 중 **persisted current-list numeric-candidate bulk capture**는 `2026-08-03` 단일 거래일 observation이다. 이는 연속 기간 시계열이나 최종 DG2 표본을 의미하지 않으며, normalized row는 `ticker`, `productName`, `date`, `closePrice`, `tradeQuantity`, `nav`, `tradeValue`를 보존한다. raw sanitized response에는 `cntr_dt`, `cur_prc`, `trde_qty`, `nav`, `acc_trde_prica` 등의 source field가 남는다.

정확한 candidate 수, `missing_requested_date`, frozen-list hash, raw artifact 위치, 그리고 미매핑 식별자 범위는 [DG2 data source gap report](../plan/gates/DG2-data-source-gap-report.md)에 기록한다. 별도로 승인 ETF 5종과 KOSPI200의 `2026-08-03`~`2026-09-08` pilot-period 일봉 retrieval이 [DG2 strategy validation](../plan/gates/DG2-strategy-validation.md)에 기록되어 있다. 이 bulk capture는 historical universe, ETF/ETN 구분, 레버리지·인버스 여부, 상장기간, 평균 거래대금 eligibility 또는 비숫자 식별자의 historical membership을 입증하지 않는다.

## historical collection의 한계

read-only historical daily capture는 과거 일별 관측값을 보존할 수 있지만, 현재 `ka40004` 목록을 기준으로 시작하므로 과거 universe를 입증하지 않는다. 원본 응답은 저장소 밖 evidence storage에 보관하고, 저장소에는 digest와 metadata만 기록한다. 다음은 현재 접근 범위에서 증명되지 않았다.

1. signal date 당시의 전체 ETF universe와 목록 membership
2. 각 항목의 ETF/ETN 구분 및 레버리지·인버스 여부
3. 상장기간과 평균 거래대금 기준의 eligibility
4. 비숫자 식별자의 공식 ticker mapping 및 historical membership

따라서 numeric subset만으로 ranking을 만들거나, KRX 식별자로 빈 항목을 대체하거나, 현재 목록을 과거 목록으로 간주하면 안 된다.

## DG2에서의 허용 역할과 금지 역할

최종 표본 계약은 `src/lib/etf/collection.ts`에 정의되어 있다. 다만 `acc_trde_prica`의 단위와 selection 적합성이 검토된 뒤에만, 적격 한국 ETF 중 Kiwoom의 `tradeValue`를 `signalAsOf`에서 내림차순 정렬해 정확히 30개를 선택하며 동률은 ticker 오름차순으로 해소한다.

| 허용                                                                                                        | 금지                                                      |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 승인된 historical universe/eligibility와 `acc_trde_prica` 의미 검토 뒤 Kiwoom 일별 거래대금으로 top-30 선택 | 현재 `ka40004` 목록을 historical universe로 사용          |
| 가격 수익률·benchmark ordering·no-future-leakage 검증용 일별 가격/NAV 사용                                  | KRX `ACC_TRDVAL` 또는 임의 매핑으로 Kiwoom selection 대체 |
| 분배금 AJAX 원본을 검토 전 후보로 보관                                                                      | 후보 행만으로 `dividendVerified=true` 설정                |
| 원본 URI, hash, 수집 시각, 변환 버전, reviewer 보관                                                         | raw bytes 또는 credential을 Git에 저장                    |

현재 Gate 상태, 검증 flag, 최종 top-30 및 selection 생성 조건은 정본 Gate 문서에서만 관리한다.

## 재개 조건 및 정본 문서

historical universe와 eligibility를 입증하는 공식 원천이 확보되기 전에는 이 선택 경로를 현 접근 수준에서 종결한다. 재개하려면 공식 원천으로 universe membership, ETF/ETN 상태, 레버리지·인버스 여부, 상장일, 평균 거래대금 eligibility 및 비숫자 식별자 mapping을 `signalAsOf`에 결속해 보관해야 한다.

Gate 상태·증거 요구사항·종결/재개 조건의 정본은 [DG2 data source gap report](../plan/gates/DG2-data-source-gap-report.md)다. 이 문서는 API 기능과 프로젝트 내 검증 범위만 설명하며 Gate 판정을 대체하지 않는다.

## 근거

- `docs/references/kiwoom-rest-api-spec.json`
- `src/lib/etf/kiwoom-etf-historical-daily.ts`
- `src/lib/etf/kiwoom-dg2-distribution-adapter.ts`
- `src/lib/etf/collection.ts`
- `docs/jobs/2026-09-10-krx-openapi-handoff.md`
- `docs/plan/gates/DG2-data-source-gap-report.md`
