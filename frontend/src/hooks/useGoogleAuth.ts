"use client";

import { useEffect, useCallback, useRef } from "react";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

// Global singleton state
let gsiInitialized = false;
let gsiLoadPromise: Promise<void> | null = null;
const listeners = new Set<(credential: string) => void>();

function loadAndInit(): Promise<void> {
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (!gsiInitialized) {
        window.google?.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            listeners.forEach((fn) => fn(response.credential));
          },
        });
        gsiInitialized = true;
      }
      resolve();
    };
    document.head.appendChild(script);
  });
  return gsiLoadPromise;
}

export function useGoogleAuth(onCredential: (credential: string) => void) {
  const cbRef = useRef(onCredential);
  cbRef.current = onCredential;

  const stableListener = useCallback((credential: string) => {
    cbRef.current(credential);
  }, []);

  useEffect(() => {
    listeners.add(stableListener);
    loadAndInit();
    return () => { listeners.delete(stableListener); };
  }, [stableListener]);

  const prompt = useCallback(() => {
    if (gsiInitialized) {
      window.google?.accounts.id.prompt((notification: any) => {
        // If FedCM is not available or dismissed, fall back to redirect
        if (notification?.getMomentType?.() === "skipped" || notification?.getNotDisplayedReason?.()) {
          // Fallback: redirect to Google OAuth
          const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: window.location.origin + "/auth/callback",
            response_type: "id_token",
            scope: "openid email profile",
            nonce: Math.random().toString(36).slice(2),
          });
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
        }
      });
    }
  }, []);

  return { prompt };
}
