# 마음의 눈금 · MindGauge

HR 분야 성인을 위한 **심리검사 설계·평가 워크숍** (교재: Theresa J. B. Kline, *Psychological Testing: A Practical Approach to Design and Evaluation*, SAGE 2005).
교재의 공통 예시인 팀 플레이어 인벤토리(TPI)를 한국어 12문항으로 재구성하고, 챕터 1–12마다 인터랙티브 활동과 그룹 결과 도표를 제공합니다.

- 준비: TPI 12문항 응답 → 이후 모든 챕터의 계산 재료
- 1 측정 · 2 문항 · 3 응답 형식 · 4 표집 · 5 고전검사이론 · 6 IRT · 7 신뢰도 · 8 평정자 신뢰도 · 9 내용·준거 타당도 · 10 구조 타당도 · 11 윤리·공정성 · 12 종합 리포트
- 정규분포·산점도·히트맵·스크리 도표·문항특성곡선·검사정보함수·레이더 등을 그룹 데이터로 실시간 계산

## 배포 (GitHub Pages)
Settings → Pages → Branch: `main` / root. 주소: `https://yalli2.github.io/psychic-journey/`

## 실시간 공유 켜기
1. https://console.firebase.google.com 에서 프로젝트 → Realtime Database 생성(테스트 모드)
2. 규칙: `{ "rules": { ".read": true, ".write": true } }` (수업 기간에만, 끝나면 닫기)
3. `config.js`의 `firebaseUrl`에 DB 주소 입력
4. 수강생은 같은 방 코드로 입장 (`?room=코드` 링크 공유 가능)

`firebaseUrl`이 비어 있으면 이 기기에서만 동작하는 체험 모드입니다. 방 코드 `demo`에는 가상 참가자 32명이 항상 포함됩니다.
진행자 도구(홈 화면): 링크 복사, 가상 참가자 추가/삭제, 전체 응답 JSON 복사.

## 유의
- 교육용 재구성이며 진단·채용·평가 판단에 사용할 수 없습니다. 별명을 쓰고 민감 정보는 입력하지 않도록 안내하세요.
- 소규모 그룹의 α·요인분석·IRT 값은 학습용 근사치입니다.
