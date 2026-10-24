import { useEffect, useState } from "react";

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window !== "undefined" ? window.deferredPwaPrompt || null : null),
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA (standalone)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(Boolean(isStandaloneMode));
    };

    checkStandalone();

    // Pick up prompt if already captured globally
    if (window.deferredPwaPrompt && !deferredPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt);
    }

    // Check for iOS Safari
    const userAgent = window.navigator.userAgent || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      window.deferredPwaPrompt = event;
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      window.deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowInstructions(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [deferredPrompt]);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch {
        // Fallback to instruction modal on unexpected prompt errors
        setShowInstructions(true);
      }
    } else {
      // iOS Safari or desktop browser where beforeinstallprompt didn't trigger
      setShowInstructions(true);
    }
  };

  return {
    isInstalled: isStandalone,
    isIOS,
    hasNativePrompt: Boolean(deferredPrompt),
    showInstructions,
    setShowInstructions,
    installApp,
  };
}

export default usePwaInstall;
