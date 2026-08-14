# 관세청 Newtrade API 메모

- 데이터 형식: XML
- 엔드포인트: `https://apis.data.go.kr/1220000/Newtrade`

## 보안

인증키와 프로젝트 키는 저장소·문서·클라이언트 코드에 기록하지 않습니다. 이미 문서에 포함되었던 키는 Data.go.kr에서 즉시 폐기하고 새 키를 발급하세요.

서버 환경 변수에만 `DATA_GO_KR_SERVICE_KEY`를 설정하고, `src/lib/env.ts`의 서버 전용 스키마를 통해 접근합니다. `NEXT_PUBLIC_` 접두사는 사용하지 않습니다.
