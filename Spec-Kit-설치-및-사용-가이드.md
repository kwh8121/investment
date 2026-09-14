# GitHub Spec Kit 설치 및 사용 가이드

> 검증일: 2026-09-14 (Asia/Seoul)

## 요약

Spec Kit은 AI 코딩 에이전트와 함께 명세 중심 개발(Spec-Driven Development)을 수행하기 위한 오픈 소스 도구 모음이다. `specify` CLI가 프로젝트에 명세, 계획, 작업, 검증 흐름을 위한 템플릿과 에이전트 명령을 설치한다.

이 환경에는 공식 GitHub 릴리스 태그 `v1.0.6` 기반의 `specify-cli`가 설치되어 있으며, `specify --version`으로 `1.0.6`을 확인했다.

## 주요 기능

- 프로젝트 원칙을 관리하는 `constitution`
- 요구사항을 작성하는 `specify`와, 구현 계획·작업으로 분해하는 `plan`, `tasks`
- 명세·계획·작업의 일관성을 점검하는 `analyze`
- 구현 결과와 산출물을 대조하는 `converge`
- 확장 기능(extension), 프리셋(preset), 역할별 번들(bundle) 관리

## 설치 상태와 전제 조건

- 운영체제: Linux (WSL2), x86_64
- 도구: `uv 0.11.7` 설치됨
- 설치 명령:

  ```bash
  uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v1.0.6
  ```

- 실행 파일: `/home/kwh8121/.local/bin/specify`
- 확인 명령:

  ```bash
  specify --version
  ```

## 현재 프로젝트에서의 사용

일반적인 Codex 프로젝트 초기화 명령은 다음과 같다.

```bash
specify init --here --force --non-interactive --integration codex --integration-options="--skills"
```

초기화 뒤 Codex의 스킬 모드에서는 보통 `$speckit-constitution`, `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`, `$speckit-analyze`, `$speckit-converge`를 사용한다.

이 프로젝트는 이미 확정된 ETF Price Signal PRD를 가지고 있으므로, 프로젝트의 기존 방법론 문서는 `constitution`, `checklist`, `analyze`, `converge`만 사용하는 경량 구성을 권장한다. 이는 프로젝트별 운영 판단이며 Spec Kit의 필수 절차는 아니다.

## 현재 제한 사항

Codex 통합 초기화는 현재 세션에서 완료하지 못했다. 공식 Codex 통합은 `.agents/skills/`에 스킬 파일을 생성하는데, 이 작업공간의 `.agents/` 및 `.codex/`는 읽기 전용 마운트로 제공되어 생성이 거부됐다. CLI 설치에는 영향이 없고, 프로젝트 파일도 새로 생성·변경되지 않았다.

해당 경로가 쓰기 가능한 환경에서는 위 초기화 명령을 다시 실행하면 된다. `--force`는 비어 있지 않은 프로젝트에서 병합·덮어쓰기를 허용하므로, 실행 전 생성 경로와 기존 파일을 확인하는 것이 안전하다.

## 실무 적용 예

- 신규 기능: `constitution` → `specify` → `plan` → `tasks` → 구현 → `converge`
- 요구사항 품질 점검: `checklist`로 도메인별 검증 항목 생성
- 산출물 정합성 점검: `tasks` 뒤 `analyze` 실행
- 기존 PRD가 확정된 프로젝트: PRD를 정본으로 유지하고 `constitution`·`analyze`·`converge`만 보조적으로 사용

## 업데이트와 제거

업데이트 가능 여부 확인(변경 없음):

```bash
specify self check
specify self upgrade --dry-run
```

최신 안정판으로 업데이트:

```bash
specify self upgrade
```

제거:

```bash
uv tool uninstall specify-cli
```

## 주의 사항

- `specify init --here --force`는 기존 프로젝트에 템플릿을 병합할 수 있으므로, 버전 관리 상태를 먼저 확인한다.
- 커뮤니티 extension·preset·bundle은 독립적으로 유지되므로 설치 전에 소스와 신뢰성을 검토한다.
- Spec Kit이 생성하는 명세는 원본 요구사항을 대체하지 않는다. 이 프로젝트에서는 `docs/ETF_Price_Signal_MVP_PRD_v1_7_Final.md`가 구현 기준 정본이다.
- 라이선스는 MIT이다.

## 출처

- Spec Kit 저장소: https://github.com/github/spec-kit
- 최신 릴리스(v1.0.6): https://github.com/github/spec-kit/releases/tag/v1.0.6
- 설치 가이드: https://github.github.io/spec-kit/installation/
- CLI 참조: https://github.github.io/spec-kit/cli-reference/
- 라이선스: https://github.com/github/spec-kit/blob/main/LICENSE

## 검증 기록

```text
$ specify --version
specify 1.0.6

$ command -v specify
/home/kwh8121/.local/bin/specify
```
