# 여행 플래너 (Trip Planner)

Google Maps API + Supabase Realtime을 활용한 **실시간 공유 일차별 여행 계획** 웹 앱입니다.

## 기술 스택

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **Supabase** — DB + Realtime 동기화 + Presence
- **@vis.gl/react-google-maps** — 지도, 마커, 경로선, 장소 검색
- **@dnd-kit** — 장소 순서 드래그 앤 드롭

## 시작하기

### 1. 의존성 설치

```powershell
.\scripts\setup.ps1
```

또는:

```bash
npm install
cp .env.local.example .env.local
```

### 2. 환경 변수 설정 (`.env.local`)

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Google Cloud Console에서 **Maps JavaScript API**와 **Places API**를 활성화하세요.

### 3. Supabase 스키마 적용

Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 내용을 실행합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 앱을 확인할 수 있습니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 일차별 탭 | 1일차, 2일차… 탭으로 일정 분리 |
| 장소 추가 | Google Places Autocomplete 검색 |
| 지도 표시 | 마커 + Polyline 경로 시각화 |
| 드래그 앤 드롭 | 장소 방문 순서 변경 |
| 실시간 동기화 | Supabase Realtime으로 멤버 간 즉시 반영 |
| 온라인 상태 | Presence로 참여 멤버 표시 |

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                 # 홈 (여행 목록 / 생성)
│   └── trips/[id]/page.tsx      # 여행 상세
├── components/trip/
│   ├── TripPlannerClient.tsx    # 메인 클라이언트
│   ├── TripSidebar.tsx          # 좌측 사이드바
│   ├── TripMap.tsx              # 우측 지도
│   ├── PlaceSearch.tsx          # 장소 검색
│   ├── PlaceList.tsx            # 장소 리스트 (DnD)
│   ├── DayTabs.tsx              # 일차 탭
│   └── MemberList.tsx           # 멤버 목록
├── hooks/
│   └── useTripRealtime.ts       # Realtime 구독 Hook
├── lib/
│   ├── supabase/client.ts
│   └── user.ts
└── types/database.ts
```

## 실시간 공유 테스트

1. 여행을 생성하고 URL을 복사합니다 (`/trips/{id}`)
2. 다른 브라우저(또는 시크릿 창)에서 같은 URL을 엽니다
3. 한쪽에서 장소를 추가/삭제/순서 변경하면 다른 쪽에 즉시 반영됩니다
