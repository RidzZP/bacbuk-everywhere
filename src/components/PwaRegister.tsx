"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered with scope:", registration.scope);
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      if (document.readyState === "complete") {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
        return () => window.removeEventListener("load", registerSW);
      }
    }
  }, []);

  return null;
}
