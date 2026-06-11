# Trip Planner 프로젝트 초기 세팅 스크립트 (Windows PowerShell)
# 사용법: .\scripts\setup.ps1

Write-Host "Trip Planner 의존성 설치 중..." -ForegroundColor Cyan

npm install `
  "@supabase/supabase-js" `
  "@vis.gl/react-google-maps" `
  "lucide-react" `
  "@dnd-kit/core" `
  "@dnd-kit/sortable" `
  "@dnd-kit/utilities"

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.local.example" ".env.local"
  Write-Host ".env.local 파일이 생성되었습니다. API 키를 입력하세요." -ForegroundColor Yellow
} else {
  Write-Host ".env.local 파일이 이미 존재합니다." -ForegroundColor Gray
}

Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Green
Write-Host "1. .env.local 에 Google Maps / Supabase 키 입력"
Write-Host "2. Supabase SQL Editor에서 supabase/schema.sql 실행"
Write-Host "3. npm run dev 로 개발 서버 시작"
