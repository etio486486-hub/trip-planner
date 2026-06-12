# Vercel 배포 안내

GitHub main 최신 커밋: `fix vercel build config`

## 잘못된 방법
- 실패한 배포(`Add files via upload`)에서 **Redeploy** 누르기
  → 옛날 커밋 `0e9a943` 이 다시 배포됨

## 올바른 방법
1. Vercel → **Deployments**
2. 맨 위 **Create Deployment** 클릭
3. Branch: **main** 선택
4. **Deploy** 클릭

또는 `push-github.bat` 실행 후 GitHub 푸시로 자동 배포 대기
