"use client";

let loadPromise: Promise<void> | null = null;

/**
 * Dynamically loads the self-hosted pinned Google model-viewer 4.1.0 runtime once
 * so base marketing pages pay zero 3D runtime cost until needed (PRD Section 17.1).
 */
export function ensureModelViewerLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-jc-model-viewer="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("RUNTIME_LOAD_FAILED")), {
        once: true,
      });
      return;
    }

    // Configure self-hosted same-origin Meshopt WASM decoder before model-viewer boots
    const win = window as Window & {
      ModelViewerElement?: { meshoptDecoderLocation?: string };
    };
    win.ModelViewerElement = {
      ...(win.ModelViewerElement ?? {}),
      meshoptDecoderLocation: "/vendor/meshopt_decoder.js",
    };

    const script = document.createElement("script");
    script.type = "module";
    script.src = "/vendor/model-viewer.min.js";
    script.dataset.jcModelViewer = "true";
    script.onload = () => {
      customElements
        .whenDefined("model-viewer")
        .then(() => resolve())
        .catch(() => reject(new Error("CUSTOM_ELEMENT_FAILED")));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("RUNTIME_LOAD_FAILED"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface DeviceCapability {
  supportsWebGL: boolean;
  prefersReducedMotion: boolean;
  isMobileOrConstrained: boolean;
  shouldAutoLoad: boolean;
  qualityTier: "mobile" | "desktop";
}

export function detectViewerCapability(): DeviceCapability {
  if (typeof window === "undefined") {
    return {
      supportsWebGL: false,
      prefersReducedMotion: false,
      isMobileOrConstrained: true,
      shouldAutoLoad: false,
      qualityTier: "mobile",
    };
  }

  let supportsWebGL = false;
  try {
    const canvas = document.createElement("canvas");
    supportsWebGL = Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    supportsWebGL = false;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isNarrow = window.matchMedia("(max-width: 960px)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const saveData = Boolean(nav.connection?.saveData);
  const slowNet =
    nav.connection?.effectiveType === "2g" || nav.connection?.effectiveType === "slow-2g";
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 3;

  const isMobileOrConstrained = isNarrow || isCoarsePointer || saveData || slowNet || lowMemory;
  const qualityTier = isMobileOrConstrained ? "mobile" : "desktop";
  const shouldAutoLoad = supportsWebGL && !isMobileOrConstrained && !prefersReducedMotion;

  return {
    supportsWebGL,
    prefersReducedMotion,
    isMobileOrConstrained,
    shouldAutoLoad,
    qualityTier,
  };
}
