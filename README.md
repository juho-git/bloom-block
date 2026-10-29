# 블룸 블록 (Bloom Block)

모바일 세로 화면용 HTML5 블록 퍼즐 MVP입니다. 조각을 드래그해 11×11 보드에 놓고, 가로·세로 줄을 완성하면 지워집니다. 씨앗 목표·같은 색 블룸 보너스·정원 수집 메타가 있습니다.

기획서: `uploads/bloom-block-gdd_8b16.txt` (원본 JSX 기획 캔버스 텍스트)

## 기술 스택

- **Phaser 3 + TypeScript + Vite** (기획서 12절)
- 게임 규칙은 `src/core` 순수 TypeScript (Phaser 비의존)
- 저장: `localStorage` (`bloomblocks.save.v1`)
- 광고: `AdsAdapter` + Dummy(실사용) / Poki·GD·Playgama는 **스텁** (문서 미검증 SDK는 호출하지 않음)
- 테스트: Vitest

## 비주얼·에셋 (코지 가든 톤)

캐주얼 퍼즐을 즐기는 여성 유저를 겨냥해 blush / peach / mint / lavender / cream 파스텔과 젤리 블록, 꽃 마스코트, 줄 지움 꽃잎 파티클로 다듬었습니다. 규칙은 그대로입니다.

| 항목 | 내용 |
|------|------|
| 배경 | `#FFF4F0` cream, soft blush wash |
| 블록 5색 | blush `#FF8FAB` · butter `#FFD56B` · mint `#7DCEB8` · sky `#7EB6E8` · lavender `#B8A0E0` (+ 하트/줄무늬/점/링/꽃잎 패턴) |
| 본문·강조색 | text `#5A4450`, accent `#F48FB1` |
| 디스플레이 폰트 | **Jua** (SIL OFL 1.1) — `public/fonts/Jua-Regular.ttf` 셀프 호스트 |
| 본문 폰트 | **Noto Sans KR** (SIL OFL 1.1) — Google Fonts CDN 서브셋 |
| 아트 | 전부 코드 드로우 (마스코트·젤리·정원·파티클). 저작권 에셋 없음 |
| 사운드 | Web Audio 소프트 사인/트라이앵글 (내장) |

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://127.0.0.1:43127 을 엽니다. (포트 `43127`)

```bash
npm test          # 단위 테스트
npm run build     # 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
npm run validate-stages  # 스테이지 JSON 검증 + 솔버 샘플
```

### 포털별 빌드

```bash
VITE_PORTAL=dummy npm run build      # 기본 (로컬/모의 광고)
VITE_PORTAL=poki npm run build       # Poki 스텁 어댑터
VITE_PORTAL=gd npm run build         # GameDistribution 스텁
VITE_PORTAL=playgama npm run build   # Playgama 스텁
```

실제 SDK 연동은 각 포털 최신 문서를 확인한 뒤 `src/platform/*Ads.ts`에 구현하세요.

## MVP에 포함된 것

- 11×11 보드, 드래그 배치, 줄 지움, 점수·콤보·블룸·퍼펙트
- 스테이지 30개 + 엔드리스
- 부스터 4종 (되돌리기 / 새로고침 / 폭탄 / 줄 비우기)
- 홈·지도·게임·결과·정원·설정, 일시정지·부활(모의 광고)
- localStorage 저장, 한/영 i18n, Web Audio 효과음·루프 BGM
- core 단위 테스트

## 이후(기획서 MVP 제외)로 남은 것

- 데일리 챌린지 / 미션 / 출석
- 실제 Poki·GD·Playgama SDK 호출
- 스테이지 31+ 절차 생성, Playwright 스모크(환경에 따라 미포함)
- 장애물 칸, 리더보드, 분석 이벤트

## 폴더

```
src/core/       순수 규칙
src/data/       shapes, stages, flowers, i18n
src/scenes/     Boot, Home, StageMap, Game, Result, Garden, Settings
src/platform/   AdsAdapter + Dummy/스텁
src/services/   save, audio, i18n, haptics
tools/          stage 생성·검증·솔버
tests/          vitest
```

## 태스크 T01–T16 요약

| 태스크 | 상태 |
|--------|------|
| T01 프로젝트 골격 | 완료 |
| T02 보드·조각 | 완료 |
| T03 점수·콤보 | 완료 |
| T04 시드 난수·스폰 | 완료 |
| T05 목표·스테이지 로더 | 완료 |
| T06 게임 씬 드래그 | 완료 (Playwright 시나리오는 스모크 수동/부분) |
| T07 HUD·게임오버 | 완료 |
| T08 부스터 4종 | 완료 |
| T09 스테이지 30개 | 완료 (솔버 100회는 `validate-stages`에서 샘플 횟수) |
| T10 엔드리스 | 완료 |
| T11 저장·설정 | 완료 |
| T12 화면 흐름 | 완료 (데일리 화면은 MVP 제외) |
| T13 정원·도감 | 완료 |
| T14 광고 어댑터 | 완료 (Dummy 실동작, 포털은 스텁) |
| T15 오디오·연출 | 부분 (Web Audio 비프 + 기본 트윈, 파티클은 최소) |
| T16 i18n·마감 | 부분 (한/영 JSON·README·번들 빌드, Playwright E2E는 생략) |
