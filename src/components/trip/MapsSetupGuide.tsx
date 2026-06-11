type MapsSetupGuideProps = {
  compact?: boolean;
};

export function MapsSetupGuide({ compact = false }: MapsSetupGuideProps) {
  return (
    <div
      className={`text-left ${compact ? "text-xs" : "text-sm"} leading-relaxed text-zinc-600`}
    >
      <p className={`font-semibold text-zinc-800 ${compact ? "text-sm" : "text-base"}`}>
        Google Maps API 키 설정이 필요합니다
      </p>
      <p className="mt-2">
        현재 키가 없거나 형식이 올바르지 않습니다. Google Maps 키는{" "}
        <code className="rounded bg-zinc-200 px-1">AIza</code>로 시작합니다.
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5">
        <li>
          <a
            href="https://console.cloud.google.com/google/maps-apis"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Google Cloud Console
          </a>
          에서 프로젝트 생성
        </li>
        <li>
          Maps JavaScript API, Places API, Routes API 활성화
        </li>
        <li>API 키 발급 후 HTTP 리퍼러에 localhost 허용</li>
        <li>
          <code className="rounded bg-zinc-200 px-1">.env.local</code>에
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza... 입력
        </li>
        <li>개발 서버 재시작</li>
      </ol>
    </div>
  );
}
