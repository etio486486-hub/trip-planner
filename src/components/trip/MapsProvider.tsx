"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export function isMapsConfigured(): boolean {
  return MAPS_API_KEY.startsWith("AIza");
}

type MapsProviderProps = {
  children: React.ReactNode;
};

export function MapsProvider({ children }: MapsProviderProps) {
  if (!isMapsConfigured()) {
    return <>{children}</>;
  }

  return (
    <APIProvider apiKey={MAPS_API_KEY} libraries={["places"]}>
      {children}
    </APIProvider>
  );
}
