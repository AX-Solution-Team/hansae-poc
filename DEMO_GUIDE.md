# 한세 AI Agent Platform — 로컬 데모 가이드

## 개요

한세실업 AI Agent 통합 플랫폼 프로토타입입니다.  
Next.js 14 + Prisma + SQLite 기반으로 **외부 서비스 의존 없이** 로컬에서 완전히 동작합니다.

---

## 1. 사전 요구사항

| 항목 | 최소 버전 | 확인 명령어 |
|------|-----------|-------------|
| **Node.js** | v18 이상 (권장 v20+) | `node -v` |
| **npm** | v9 이상 | `npm -v` |
| **Git** | 최신 | `git --version` |

> 별도의 DB 서버, Docker, 외부 API 키 등은 **필요 없습니다**.  
> SQLite가 프로젝트 내부에 자동 생성됩니다.

---

## 2. 설치 및 실행

```bash
# 1) 저장소 클론
git clone https://github.com/AX-Solution-Team/hansae-poc.git
cd hansae-poc

# 2) 환경변수 파일 생성
cp .env.example .env
# .env.example이 없을 경우 아래 내용으로 .env 파일을 직접 생성:
cat <<'EOF' > .env
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="hansae-ai-agent-platform-demo-secret-key-32chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF

# 3) 의존성 설치
npm install

# 4) DB 스키마 생성 + 시드 데이터 투입 (한 번에)
npm run db:setup

# 5) 개발 서버 실행
npm run dev
```

브라우저에서 **http://localhost:3000** 접속 → 로그인 화면이 나타나면 성공입니다.

---

## 3. 데모 계정

모든 계정의 비밀번호는 **`demo1234`** 입니다.

| 이메일 | 역할 | 한글명 | 접근 가능 메뉴 |
|--------|------|--------|----------------|
| `admin@hansae.demo` | 관리자 (ADMIN) | 최관리 | **전체** (거버넌스, 감사로그, 사용자관리, 런타임정책 포함) |
| `approver@hansae.demo` | 승인자 (APPROVER) | 박팀장 | 승인함 + 일반 사용자 메뉴 |
| `creator@hansae.demo` | 제작자 (CREATOR) | 이제작 | 빌드, 자산 마이그레이션 + 일반 사용자 메뉴 |
| `user@hansae.demo` | 사용자 (USER) | 김실무 | 홈, 실행, 실행이력, 마켓플레이스, 에이전트 |

> **시연 팁**: `admin@hansae.demo`로 로그인하면 모든 메뉴를 확인할 수 있습니다.  
> 역할별 권한 차이를 보여주려면 각 계정으로 로그인하세요.

---

## 4. 시연 동선 (권장 순서)

### Phase 1 — 전체 플랫폼 개요 (관리자 시점)

`admin@hansae.demo` 로그인

| 순서 | 페이지 | 경로 | 포인트 |
|------|--------|------|--------|
| 1 | **홈 대시보드** | `/` | 전체 에이전트 현황, 최근 실행, 그룹별 통계 |
| 2 | **에이전트 카탈로그** | `/agents` | 7개 업무 그룹별 에이전트 카드 |
| 3 | **마켓플레이스** | `/marketplace` | 전체 에이전트 검색, 필터(그룹/티어/상태), 즐겨찾기 |
| 4 | **에이전트 상세** | 마켓플레이스에서 카드 클릭 | As-Is/To-Be, 워크플로우, 입출력 스키마, 버전 이력 |
| 5 | **에이전트 실행** | `/run` | 에이전트 선택 → 파라미터 입력 → 실행 결과 확인 |
| 6 | **실행 이력** | `/run/jobs` | 실행 기록, 상태 추적, 결과 다운로드 |

### Phase 2 — 거버넌스 & 관리 (관리자 전용)

| 순서 | 페이지 | 경로 | 포인트 |
|------|--------|------|--------|
| 7 | **거버넌스 대시보드** | `/admin/governance` | 보안 로그, 리소스 사용량, 데이터 등급 분포 |
| 8 | **감사 로그** | `/admin/audit` | 이벤트 타입별 필터링, 시간순 이력 |
| 9 | **사용자 관리** | `/admin/users` | 팀별 사용자, 역할 배지 |
| 10 | **에이전트 관리** | `/admin/agents` | 상태/그룹/티어 관리, 보관 처리 |
| 11 | **런타임 정책** | `/admin/runtime` | 실행 환경별 정책 설정 |

### Phase 3 — 빌드 & 제작 (제작자 시점)

`creator@hansae.demo`로 로그인 전환 권장

| 순서 | 페이지 | 경로 | 포인트 |
|------|--------|------|--------|
| 12 | **빌드 허브** | `/build` | No-Code / Low-Code / Pro-Code 3단계 빌드 체계 |
| 13 | **에이전트 스튜디오** | `/build/studio` | 워크플로우 편집, 노드 기반 설계 |
| 14 | **템플릿 관리** | `/build/templates` | 재사용 가능한 에이전트 템플릿 |
| 15 | **개발자 환경** | `/build/developer` | Python 코드 에디터, 직접 개발 |
| 16 | **자산 마이그레이션** | `/build/migration` | 레거시 Python 스크립트 → 플랫폼 에이전트 전환 현황 |

### Phase 4 — 승인 워크플로우 (승인자 시점)

`approver@hansae.demo`로 로그인 전환

| 순서 | 페이지 | 경로 | 포인트 |
|------|--------|------|--------|
| 17 | **승인함** | `/approvals` | 에이전트 게시 승인/반려 프로세스 |

---

## 5. 핵심 데모 에이전트 (실행 가능)

실행(`/run`) 페이지에서 직접 실행하여 결과를 확인할 수 있는 에이전트 목록:

| 에이전트 | 그룹 | 설명 |
|----------|------|------|
| ZARA Trousers 신제품 분석 | 디자인 인텔리전스 | 크롤링 기반 트렌드 리포트 생성 |
| PO 오더리캡 자동화 | PO 처리 | PDF PO → 오더리캡 Excel 자동 변환 |
| POCN 확인서 처리 | PO 처리 | PO 변경사항 자동 비교 |
| PO Style×Week 피벗 | PO 처리 | 다중 PO 피벗 테이블 생성 |
| 한세실업 주가 알림 | 커뮤니케이션 | 실시간 주가 조회 및 알림 시뮬레이션 |
| 검사 리포트 자동화 | 생산/품질 | AQL 기반 자동 검사 리포트 |
| AI 비전 품질검사 | 생산/품질 | 원단/봉제 불량 AI 탐지 |
| Wholesale Linesheet 생성 | 디자인 인텔리전스 | 바이어 제출용 Linesheet 자동 생성 |

> 총 29개 에이전트 중 20개가 `demoRunnable: true`로 설정되어 있습니다.  
> 나머지 9개는 "Phase 2~4" 로드맵 에이전트로, 잠금 상태와 사유가 표시됩니다.

---

## 6. 주요 npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm start` | 프로덕션 모드 실행 (`build` 후) |
| `npm run db:push` | Prisma 스키마 → DB 반영 |
| `npm run db:seed` | 시드 데이터 투입 |
| `npm run db:setup` | `db:push` + `db:seed` 한 번에 실행 |
| `npm run db:studio` | Prisma Studio (DB 브라우저, http://localhost:5555) |

---

## 7. 트러블슈팅

### DB 관련

```bash
# DB를 초기화하고 처음부터 다시 시작하려면:
rm -f prisma/dev.db prisma/dev.db-journal
npm run db:setup
```

### 포트 충돌

```bash
# 3000 포트가 이미 사용 중일 때:
npx next dev -p 3001
```

### node_modules 문제

```bash
# 의존성을 깨끗하게 재설치:
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client 에러

```bash
# Prisma 클라이언트 재생성:
npx prisma generate
npm run db:setup
```

---

## 8. 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **UI** | shadcn/ui, Radix UI, Tailwind CSS |
| **Charts** | Recharts |
| **DB** | SQLite (better-sqlite3, Prisma ORM) |
| **Auth** | iron-session (쿠키 기반 세션) |
| **Icons** | Lucide React |

---

## 9. 프로젝트 구조 요약

```
hansae-poc/
├── prisma/
│   ├── schema.prisma    # DB 스키마 정의
│   └── seed.ts          # 시드 데이터 (계정, 에이전트 29개, 템플릿 등)
├── public/
│   └── brand/           # 로고 등 정적 에셋
├── src/
│   ├── app/
│   │   ├── (app)/       # 인증 후 메인 레이아웃
│   │   │   ├── page.tsx           # 홈 대시보드
│   │   │   ├── agents/            # 에이전트 카탈로그
│   │   │   ├── marketplace/       # 마켓플레이스
│   │   │   ├── run/               # 에이전트 실행 & 이력
│   │   │   ├── build/             # 빌드 허브 (스튜디오/템플릿/개발자/마이그레이션)
│   │   │   ├── approvals/         # 승인 워크플로우
│   │   │   ├── apps/[slug]/       # 에이전트 상세 (마켓플레이스 연결)
│   │   │   └── admin/             # 관리자 메뉴 (거버넌스/감사/사용자/에이전트/런타임)
│   │   ├── api/                   # API 라우트 (34개)
│   │   └── login/                 # 로그인 페이지
│   ├── components/
│   │   ├── layout/app-shell.tsx   # 사이드바 네비게이션 + RBAC
│   │   ├── shared/                # 공용 컴포넌트 (AgentGroupIcon 등)
│   │   └── ui/                    # shadcn/ui 컴포넌트
│   ├── hooks/                     # 커스텀 훅 (useAuth 등)
│   └── lib/
│       ├── executors/             # 에이전트 Mock 실행기 레지스트리
│       └── utils.ts               # 유틸리티
├── storage/
│   └── job-files/                 # 실행 결과 파일 저장 (런타임 생성)
├── .env                           # 환경변수 (git 제외)
└── package.json
```

---

## 10. 주의사항

- 이 프로토타입은 **데모/PoC 목적**이며, 에이전트 실행 결과는 Mock(시뮬레이션) 데이터입니다.
- `SESSION_SECRET` 값은 데모용이므로 프로덕션에서는 반드시 변경하세요.
- SQLite 파일(`prisma/dev.db`)은 `.gitignore`에 포함되어 있으므로, 클론 후 반드시 `npm run db:setup`을 실행해야 합니다.
- 파일 업로드/다운로드 경로(`storage/job-files/`)는 서버 실행 시 자동 생성됩니다.

---

*Powered by TeamSparta AX*
