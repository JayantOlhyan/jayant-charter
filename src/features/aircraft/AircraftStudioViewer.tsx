"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Box,
  Compass,
  Hand,
  Lock,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Sunset,
  Unlock,
  AlertCircle,
} from "lucide-react";
import type { AircraftRecord, LightingMode, MediaAsset } from "@/content/schemas";
import type { ModelViewerElement } from "@/types/model-viewer";
import {
  detectViewerCapability,
  ensureModelViewerLoaded,
  type DeviceCapability,
} from "./model-viewer-loader";
import { trackSafeEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const DEFAULT_LIGHTING_MODES: LightingMode[] = [
  {
    id: "twilight",
    label: "Twilight hangar",
    exposure: 1.12,
    shadowIntensity: 0.48,
    shadowSoftness: 0.85,
    surface: "dark",
  },
  {
    id: "daylight",
    label: "Daylight apron",
    exposure: 1.24,
    shadowIntensity: 0.62,
    shadowSoftness: 0.92,
    surface: "light",
  },
  {
    id: "dusk",
    label: "Evening silhouette",
    exposure: 0.86,
    shadowIntensity: 0.35,
    shadowSoftness: 0.9,
    surface: "dark",
  },
];

interface AircraftStudioViewerProps {
  aircraftList: AircraftRecord[];
  mediaById: Record<string, MediaAsset>;
  lightingModes?: LightingMode[];
  initialAircraftId?: string;
  enableLive3D?: boolean;
  mode?: "hangar" | "detail";
  onSelectAircraftPreference?: (aircraftId: string) => void;
}

type ViewerStatus = "poster" | "loading" | "ready" | "error" | "timeout";

const LOAD_TIMEOUT_MS = 10_000;

export function AircraftStudioViewer({
  aircraftList,
  mediaById,
  lightingModes = DEFAULT_LIGHTING_MODES,
  initialAircraftId,
  enableLive3D = true,
  mode = "detail",
  onSelectAircraftPreference,
}: AircraftStudioViewerProps) {
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>(
    initialAircraftId || aircraftList[0]?.id || ""
  );
  const [lightingId, setLightingId] = useState<LightingMode["id"]>(
    lightingModes[0]?.id || "twilight"
  );
  const activeLighting = useMemo(
    () => lightingModes.find((m) => m.id === lightingId) || lightingModes[0],
    [lightingId, lightingModes]
  );
  const aircraft = useMemo(
    () => aircraftList.find((a) => a.id === selectedAircraftId) || aircraftList[0],
    [aircraftList, selectedAircraftId]
  );

  const [configId, setConfigId] = useState<"flight" | "parked" | "boarding">("flight");
  const [activePresetId, setActivePresetId] = useState<string>("hero");
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [viewerActivated, setViewerActivated] = useState<boolean>(false);
  const [status, setStatus] = useState<ViewerStatus>("poster");
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>(
    "Studio preview shown. Select Explore in 3D to load the interactive exterior."
  );
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(false);
  const [mobileTouchLocked, setMobileTouchLocked] = useState<boolean>(false);
  const [capability, setCapability] = useState<DeviceCapability | null>(null);
  const [inView, setInView] = useState<boolean>(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const mvRef = useRef<ModelViewerElement | null>(null);
  const requestSeqRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const loadStartRef = useRef<number>(0);
  const hasTrackedInteractionRef = useRef<boolean>(false);

  const activeConfig = useMemo(() => {
    return (
      aircraft.configurations.find((c) => c.id === configId) ||
      aircraft.configurations[0]
    );
  }, [aircraft, configId]);

  const activePoster = mediaById[activeConfig.posterId] || mediaById[aircraft.posterId];
  const visibleHotspots = useMemo(
    () =>
      aircraft.hotspots.filter((h) => h.supportedConfigs.includes(activeConfig.id)),
    [aircraft, activeConfig.id]
  );

  // Detect browser WebGL, reduced-motion, and mobile constraints on mount
  useEffect(() => {
    const cap = detectViewerCapability();
    setCapability(cap);
    trackSafeEvent({
      name: "aircraft_view",
      aircraftId: aircraft.id,
      deviceClass: cap.qualityTier,
    });
  }, [aircraft.id]);

  // Pause nonessential motion when offscreen or tab hidden (PRD 15.3)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = Boolean(entries[0]?.isIntersecting);
        setInView(visible);
        if (!visible) {
          setAutoRotateEnabled(false);
        }
      },
      { rootMargin: "140px 0px", threshold: 0.1 }
    );
    observer.observe(el);

    const onVisibility = () => {
      if (document.hidden) setAutoRotateEnabled(false);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startModelLoad = useCallback(
    async (trigger: "explicit" | "auto") => {
      if (!enableLive3D) return;
      const cap = capability || detectViewerCapability();
      if (!cap.supportsWebGL) {
        setStatus("error");
        setStatusAnnouncement(
          "Interactive 3D requires WebGL, which is unavailable on this browser. High-resolution studio imagery remains available."
        );
        trackSafeEvent({
          name: "viewer_failed",
          errorCode: "WEBGL_UNSUPPORTED",
          assetId: aircraft.id,
        });
        return;
      }

      const token = ++requestSeqRef.current;
      setViewerActivated(true);
      setStatus("loading");
      loadStartRef.current = performance.now();
      setStatusAnnouncement(`Loading ${aircraft.displayTitle} (${activeConfig.label}) in 3D.`);
      trackSafeEvent({
        name: "viewer_requested",
        sceneId: `${aircraft.id}-${activeConfig.id}`,
        qualityTier: cap.qualityTier,
        trigger,
      });

      clearPendingTimeout();
      timeoutRef.current = window.setTimeout(() => {
        if (requestSeqRef.current !== token) return;
        setStatus("timeout");
        setStatusAnnouncement(
          "The 3D model is taking longer than expected. You can retry or continue with the studio renders."
        );
        trackSafeEvent({
          name: "viewer_failed",
          errorCode: "LOAD_TIMEOUT",
          assetId: `${aircraft.id}-${activeConfig.id}`,
        });
      }, LOAD_TIMEOUT_MS);

      try {
        await ensureModelViewerLoaded();
      } catch {
        if (requestSeqRef.current !== token) return;
        clearPendingTimeout();
        setStatus("error");
        setStatusAnnouncement(
          "Could not initialize the 3D viewer runtime. Studio renders remain available."
        );
        trackSafeEvent({
          name: "viewer_failed",
          errorCode: "RUNTIME_LOAD_FAILED",
          assetId: aircraft.id,
        });
      }
    },
    [aircraft.displayTitle, aircraft.id, activeConfig.id, activeConfig.label, capability, clearPendingTimeout, enableLive3D]
  );

  // Auto-upgrade ONLY on capable desktop once intersecting viewport (PRD 17.1)
  useEffect(() => {
    if (
      enableLive3D &&
      inView &&
      !viewerActivated &&
      status === "poster" &&
      capability?.shouldAutoLoad
    ) {
      startModelLoad("auto");
    }
  }, [capability, enableLive3D, inView, startModelLoad, status, viewerActivated]);

  // Wire model-viewer DOM events with stale-completion guard & context-loss recovery (AC05, AC06)
  const modelSrc =
    capability?.qualityTier === "mobile"
      ? activeConfig.mobileUrl
      : activeConfig.desktopUrl;

  useEffect(() => {
    if (!viewerActivated) return;
    const mv = mvRef.current;
    if (!mv) return;

    const token = ++requestSeqRef.current;
    setStatus("loading");
    loadStartRef.current = performance.now();
    clearPendingTimeout();
    timeoutRef.current = window.setTimeout(() => {
      if (requestSeqRef.current !== token) return;
      setStatus("timeout");
      setStatusAnnouncement(
        "Loading timed out after 10 seconds. High-resolution studio renders remain active."
      );
      trackSafeEvent({
        name: "viewer_failed",
        errorCode: "LOAD_TIMEOUT",
        assetId: `${aircraft.id}-${activeConfig.id}`,
      });
    }, LOAD_TIMEOUT_MS);

    const onLoad = () => {
      if (requestSeqRef.current !== token) return;
      clearPendingTimeout();
      setStatus("ready");
      const elapsed = performance.now() - loadStartRef.current;
      const elapsedBucket = elapsed < 1200 ? "fast" : elapsed < 3500 ? "normal" : "slow";
      trackSafeEvent({
        name: "viewer_ready",
        assetVersion: `${aircraft.id}-${activeConfig.id}-v1`,
        elapsedBucket,
      });
      setStatusAnnouncement(
        `${aircraft.displayTitle} (${activeConfig.label}) ready in 3D. Drag to orbit or select a camera angle.`
      );

      // Re-apply active preset camera safely
      const preset =
        aircraft.cameraPresets.find((p) => p.id === activePresetId) ||
        aircraft.cameraPresets[0];
      if (preset) {
        mv.cameraTarget = preset.target;
        mv.cameraOrbit = preset.orbit;
        mv.fieldOfView = preset.fieldOfView;
      }
    };

    const onError = () => {
      if (requestSeqRef.current !== token) return;
      clearPendingTimeout();
      setStatus("error");
      setStatusAnnouncement(
        "The 3D asset could not be displayed. High-resolution studio imagery remains available."
      );
      trackSafeEvent({
        name: "viewer_failed",
        errorCode: "MODEL_LOAD_ERROR",
        assetId: `${aircraft.id}-${activeConfig.id}`,
      });
    };

    const onPointerDown = () => {
      setAutoRotateEnabled(false);
      if (!hasTrackedInteractionRef.current) {
        hasTrackedInteractionRef.current = true;
        trackSafeEvent({
          name: "viewer_interaction",
          sceneId: `${aircraft.id}-${activeConfig.id}`,
          interactionKind: "orbit",
        });
      }
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      clearPendingTimeout();
      setStatus("error");
      setStatusAnnouncement(
        "Graphics context paused by the browser. Use Retry 3D or continue browsing the studio stills."
      );
      trackSafeEvent({
        name: "viewer_failed",
        errorCode: "WEBGL_CONTEXT_LOST",
        assetId: `${aircraft.id}-${activeConfig.id}`,
      });
    };

    mv.addEventListener("load", onLoad);
    mv.addEventListener("error", onError);
    mv.addEventListener("pointerdown", onPointerDown);
    mv.addEventListener("webglcontextlost", onContextLost);

    return () => {
      clearPendingTimeout();
      mv.removeEventListener("load", onLoad);
      mv.removeEventListener("error", onError);
      mv.removeEventListener("pointerdown", onPointerDown);
      mv.removeEventListener("webglcontextlost", onContextLost);
    };
  }, [
    activeConfig.id,
    activeConfig.label,
    activePresetId,
    aircraft.cameraPresets,
    aircraft.displayTitle,
    aircraft.id,
    clearPendingTimeout,
    modelSrc,
    viewerActivated,
  ]);

  const applyPreset = (presetId: string) => {
    const preset = aircraft.cameraPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setAutoRotateEnabled(false);

    if (preset.requiredConfig && preset.requiredConfig !== configId) {
      const hasConfig = aircraft.configurations.some((c) => c.id === preset.requiredConfig);
      if (hasConfig) {
        setConfigId(preset.requiredConfig);
      }
    }

    if (mvRef.current) {
      mvRef.current.cameraTarget = preset.target;
      mvRef.current.cameraOrbit = preset.orbit;
      mvRef.current.fieldOfView = preset.fieldOfView;
      if (capability?.prefersReducedMotion && mvRef.current.jumpCameraToGoal) {
        mvRef.current.jumpCameraToGoal();
      }
    }

    trackSafeEvent({
      name: "viewer_interaction",
      sceneId: `${aircraft.id}-${activeConfig.id}`,
      interactionKind: "preset",
    });
  };

  const handleSelectAircraft = (nextId: string) => {
    if (nextId === selectedAircraftId) return;
    setSelectedAircraftId(nextId);
    setConfigId("flight");
    setActivePresetId("hero");
    setActiveHotspotId(null);
    setAutoRotateEnabled(false);
    hasTrackedInteractionRef.current = false;
  };

  const handleSelectConfig = (nextConfigId: "flight" | "parked" | "boarding") => {
    if (nextConfigId === configId) return;
    setConfigId(nextConfigId);
    setActivePresetId("hero");
    setActiveHotspotId(null);
    trackSafeEvent({
      name: "viewer_interaction",
      sceneId: `${aircraft.id}-${nextConfigId}`,
      interactionKind: "config",
    });
  };

  const handleResetView = () => {
    setActiveHotspotId(null);
    applyPreset("hero");
  };

  const handleSelectHotspot = (hotspotId: string, presetId: string) => {
    setActiveHotspotId((prev) => (prev === hotspotId ? null : hotspotId));
    applyPreset(presetId);
    trackSafeEvent({
      name: "viewer_interaction",
      sceneId: `${aircraft.id}-${activeConfig.id}`,
      interactionKind: "hotspot",
    });
  };

  const handleContinueStatic = () => {
    clearPendingTimeout();
    setViewerActivated(false);
    setStatus("poster");
    setStatusAnnouncement("Showing high-resolution studio preview.");
  };

  const allowCameraControls =
    !capability?.isMobileOrConstrained || mobileTouchLocked;

  const activeHotspot = visibleHotspots.find((h) => h.id === activeHotspotId) || null;
  const sizeLabelMb = (
    (capability?.qualityTier === "mobile"
      ? activeConfig.mobileBytes
      : activeConfig.desktopBytes) / 1_048_576
  ).toFixed(2);
  const isLightStage = activeLighting.surface === "light";

  // =========================================================================
  // HOMEPAGE FULL-BLEED DIGITAL JETS SHOWROOM MODE (90% pure aircraft canvas)
  // =========================================================================
  if (mode === "hangar") {
    return (
      <div
        ref={stageRef}
        data-surface={activeLighting.surface}
        className={cn(
          "relative flex min-h-[82svh] w-full flex-col justify-between transition-colors duration-300",
          activeLighting.id === "daylight"
            ? "jc-stage-daylight text-[var(--jc-ink)]"
            : activeLighting.id === "dusk"
              ? "jc-stage-dusk text-[var(--jc-ivory)]"
              : "jc-stage-twilight text-[var(--jc-ivory)]"
        )}
      >
        {/* Top whisper showroom header: Aircraft tabs left | Studio lighting modes right */}
        <div
          className={cn(
            "relative z-10 border-b transition-colors duration-300",
            isLightStage ? "border-[var(--jc-line-light)]" : "border-[var(--jc-line-dark)]"
          )}
        >
          <div className="mx-auto flex w-full max-w-[1520px] flex-wrap items-center justify-between gap-4 px-[var(--gutter)] py-5">
            <div className="flex flex-wrap items-baseline gap-7">
              {aircraftList.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Choose aircraft example"
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-6"
                >
                  {aircraftList.map((item) => {
                    const active = item.id === aircraft.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => handleSelectAircraft(item.id)}
                        className={cn(
                          "min-h-11 border-b-2 pb-1 font-serif text-[20px] leading-none whitespace-nowrap transition-colors duration-150 cursor-pointer min-[375px]:text-[23px] sm:text-[32px]",
                          active
                            ? isLightStage
                              ? "border-[var(--jc-teal)] text-[var(--jc-ink)]"
                              : "border-[var(--jc-gold)] text-[var(--jc-ivory)]"
                            : isLightStage
                              ? "border-transparent text-[var(--jc-muted)] hover:text-[var(--jc-ink)]"
                              : "border-transparent text-[var(--jc-ivory-muted)] hover:text-[var(--jc-ivory)]"
                        )}
                      >
                        {item.model}
                      </button>
                    );
                  })}
                </div>
              )}

              <p
                className={cn(
                  "m-0 hidden text-[14px] xl:block",
                  isLightStage ? "text-[var(--jc-muted)]" : "text-[var(--jc-ivory-soft)]"
                )}
              >
                {aircraft.variant}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center gap-1"
                role="group"
                aria-label="Studio lighting atmosphere"
              >
                {lightingModes.map((lMode) => {
                  const active = lMode.id === activeLighting.id;
                  const Icon =
                    lMode.id === "daylight"
                      ? Sun
                      : lMode.id === "dusk"
                        ? Sunset
                        : Moon;
                  return (
                    <button
                      key={lMode.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setLightingId(lMode.id)}
                      title={lMode.label}
                      className={cn(
                        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                        active
                          ? isLightStage
                            ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                            : "border-[var(--jc-ivory)] bg-[var(--jc-ivory)] text-[var(--jc-teal)]"
                          : isLightStage
                            ? "border-[var(--jc-line-strong)] text-[var(--jc-muted)] hover:border-[var(--jc-teal)] hover:text-[var(--jc-ink)]"
                            : "border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-3.5" />
                      <span className="hidden sm:inline">{lMode.label}</span>
                    </button>
                  );
                })}
              </div>

              {viewerActivated &&
                status === "ready" &&
                !capability?.prefersReducedMotion && (
                  <button
                    type="button"
                    onClick={() => setAutoRotateEnabled((v) => !v)}
                    aria-pressed={autoRotateEnabled}
                    aria-label={
                      autoRotateEnabled
                        ? "Pause turntable rotation"
                        : "Play gentle turntable rotation"
                    }
                    className={cn(
                      "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium whitespace-nowrap cursor-pointer",
                      isLightStage
                        ? "border-[var(--jc-line-strong)] text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                        : "border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                    )}
                  >
                    {autoRotateEnabled ? (
                      <>
                        <Pause aria-hidden="true" className="size-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play aria-hidden="true" className="size-3.5" />
                        <span>Turntable</span>
                      </>
                    )}
                  </button>
                )}

              {viewerActivated &&
                status === "ready" &&
                capability?.isMobileOrConstrained && (
                  <button
                    type="button"
                    onClick={() => setMobileTouchLocked((v) => !v)}
                    aria-pressed={mobileTouchLocked}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[12px] font-medium cursor-pointer",
                      mobileTouchLocked
                        ? "border-[var(--jc-gold)] bg-[var(--jc-gold)] text-[var(--jc-teal)]"
                        : isLightStage
                          ? "border-[var(--jc-line-strong)] text-[var(--jc-ink)]"
                          : "border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory)]"
                    )}
                  >
                    {mobileTouchLocked ? (
                      <>
                        <Unlock aria-hidden="true" className="size-3.5" />
                        <span>Done rotating</span>
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden="true" className="size-3.5" />
                        <span>Rotate 3D</span>
                      </>
                    )}
                  </button>
                )}

              <Link
                href={`/aircraft/${aircraft.slug}`}
                className={cn(
                  "ml-1 hidden min-h-10 items-center text-[13px] font-medium underline underline-offset-4 lg:inline-flex",
                  isLightStage
                    ? "text-[var(--jc-teal)] hover:text-[var(--jc-ink)]"
                    : "text-[var(--jc-gold)] hover:text-[var(--jc-gold-hover)]"
                )}
              >
                Full specifications
              </Link>
            </div>
          </div>
        </div>

        {/* Center: Unobstructed full-bleed aircraft cinema stage */}
        <div className="relative flex flex-1 items-center justify-center px-[var(--gutter)] py-6">
          {(!viewerActivated || status === "error" || status === "timeout") && (
            <div className="relative flex w-full max-w-[1100px] flex-col items-center justify-center py-6">
              <img
                src={activePoster.path}
                alt={activePoster.alt}
                width={activePoster.width}
                height={activePoster.height}
                className={cn(
                  "max-h-[460px] w-full max-w-[920px] object-contain",
                  isLightStage ? "jc-aircraft-shadow-light" : "jc-aircraft-shadow"
                )}
              />

              {enableLive3D && status === "poster" && (
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startModelLoad("explicit")}
                    className="jc-btn-gold !rounded-full !px-6 !text-[14px]"
                  >
                    <Box aria-hidden="true" className="size-4" />
                    <span>Explore in 3D ({sizeLabelMb} MB)</span>
                  </button>
                </div>
              )}

              {(status === "error" || status === "timeout") && (
                <div
                  role="alert"
                  className="mt-5 flex max-w-md flex-col items-center gap-3 rounded-[4px] border border-[var(--jc-line-dark-strong)] bg-[var(--jc-panel-dark-strong)] px-5 py-4 text-center text-[var(--jc-ivory)]"
                >
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--jc-gold)]">
                    <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                    <span>
                      {status === "timeout"
                        ? "3D load timed out"
                        : "3D view unavailable on this session"}
                    </span>
                  </div>
                  <p className="m-0 text-[13px] text-[var(--jc-ivory-soft)]">
                    {statusAnnouncement}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startModelLoad("explicit")}
                      className="jc-btn-gold !min-h-[40px] !px-4 !text-[13px]"
                    >
                      Retry 3D view
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueStatic}
                      className="jc-btn-outline-light !min-h-[40px] !px-4 !text-[13px]"
                    >
                      Keep studio render
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewerActivated && status !== "error" && status !== "timeout" && (
            <div className="relative h-[360px] w-full max-w-[1320px] sm:h-[480px] lg:h-[min(62svh,580px)]">
              <model-viewer
                ref={mvRef}
                src={modelSrc}
                poster={activePoster.path}
                alt={`Interactive 3D exterior model of ${aircraft.displayTitle} in ${activeConfig.label} configuration`}
                camera-controls={allowCameraControls ? "" : undefined}
                touch-action="pan-y"
                disable-pan=""
                camera-orbit={aircraft.cameraPresets[0]?.orbit || "-36deg 76deg 76%"}
                camera-target={aircraft.cameraPresets[0]?.target || "auto auto auto"}
                min-camera-orbit="auto 25deg 3m"
                max-camera-orbit="auto 98deg 140%"
                field-of-view="30deg"
                min-field-of-view="18deg"
                max-field-of-view="42deg"
                environment-image={aircraft.environmentUrl}
                exposure={activeLighting.exposure}
                shadow-intensity={activeLighting.shadowIntensity}
                shadow-softness={activeLighting.shadowSoftness}
                interaction-prompt="none"
                interpolation-decay={capability?.prefersReducedMotion ? "0" : "120"}
                auto-rotate={autoRotateEnabled && inView ? "" : undefined}
                loading="eager"
                reveal="auto"
              >
                <img
                  slot="poster"
                  src={activePoster.path}
                  alt={activePoster.alt}
                  className={cn(
                    "h-full w-full object-contain",
                    isLightStage ? "jc-aircraft-shadow-light" : "jc-aircraft-shadow"
                  )}
                />
                <div slot="progress-bar" aria-hidden="true" hidden />
              </model-viewer>

              {status === "loading" && (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                  <span className="rounded-full border border-[var(--jc-line-dark-strong)] bg-[var(--jc-panel-dark-strong)] px-4 py-1.5 text-[13px] text-[var(--jc-ivory)]">
                    Preparing {activeConfig.label.toLowerCase()} 3D model ({sizeLabelMb} MB)…
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom architectural control rail: Configurations | Angles | Inspection notes */}
        <div
          className={cn(
            "relative z-10 border-t transition-colors duration-300",
            isLightStage
              ? "border-[var(--jc-line-light)] bg-[var(--jc-dock-light)]"
              : "border-[var(--jc-line-dark)] bg-[var(--jc-dock-dark)]"
          )}
        >
          <div className="mx-auto w-full max-w-[1520px] px-[var(--gutter)] py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Configuration toggles */}
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Aircraft configuration"
              >
                {aircraft.configurations.map((cfg) => {
                  const selected = cfg.id === activeConfig.id;
                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleSelectConfig(cfg.id)}
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer",
                        selected
                          ? isLightStage
                            ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                            : "border-[var(--jc-gold)] bg-[var(--jc-gold)] text-[var(--jc-teal)]"
                          : isLightStage
                            ? "border-[var(--jc-line-strong)] bg-transparent text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                            : "border-[var(--jc-line-dark-strong)] bg-transparent text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                      )}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Camera angles + Reset */}
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Camera angles"
              >
                {aircraft.cameraPresets.map((preset) => {
                  const isSelected = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => applyPreset(preset.id)}
                      className={cn(
                        "min-h-9 rounded-full border px-3 text-[12px] whitespace-nowrap transition-colors duration-150 cursor-pointer",
                        isSelected
                          ? isLightStage
                            ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                            : "border-[var(--jc-ivory)] bg-[var(--jc-teal-elevated)] text-[var(--jc-ivory)]"
                          : isLightStage
                            ? "border-[var(--jc-line-light)] bg-transparent text-[var(--jc-muted)] hover:border-[var(--jc-teal)] hover:text-[var(--jc-ink)]"
                            : "border-[var(--jc-line-dark)] bg-transparent text-[var(--jc-ivory-soft)] hover:border-[var(--jc-line-dark-strong)] hover:text-[var(--jc-ivory)]"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleResetView}
                  className={cn(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors cursor-pointer",
                    isLightStage
                      ? "border-[var(--jc-line-light)] text-[var(--jc-muted)] hover:border-[var(--jc-teal)] hover:text-[var(--jc-ink)]"
                      : "border-[var(--jc-line-dark)] text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                  )}
                >
                  <RotateCcw aria-hidden="true" className="size-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Contextual inquiry attachment */}
              <div className="flex items-center gap-4">
                {onSelectAircraftPreference ? (
                  <a
                    href="#inquire"
                    onClick={() => onSelectAircraftPreference(aircraft.id)}
                    className={cn(
                      "text-[13px] font-semibold underline underline-offset-4 whitespace-nowrap",
                      isLightStage
                        ? "text-[var(--jc-teal)] hover:text-[var(--jc-ink)]"
                        : "text-[var(--jc-gold)] hover:text-[var(--jc-gold-hover)]"
                    )}
                  >
                    Inquire about {aircraft.model}
                  </a>
                ) : null}
              </div>
            </div>

            {/* Quiet second line: Exterior hotspots + live accessibility status + disclaimer */}
            <div
              className={cn(
                "mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[12px]",
                isLightStage
                  ? "border-[var(--jc-line-light)] text-[var(--jc-muted)]"
                  : "border-[var(--jc-line-dark)] text-[var(--jc-ivory-muted)]"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Compass aria-hidden="true" className="size-3.5 text-[var(--jc-gold-muted)]" />
                  <span>Inspect:</span>
                </span>
                {visibleHotspots.map((hotspot) => {
                  const isOpen = activeHotspotId === hotspot.id;
                  return (
                    <button
                      key={hotspot.id}
                      type="button"
                      aria-pressed={isOpen}
                      onClick={() => handleSelectHotspot(hotspot.id, hotspot.presetId)}
                      className={cn(
                        "underline underline-offset-4 transition-colors cursor-pointer",
                        isOpen
                          ? isLightStage
                            ? "font-semibold text-[var(--jc-ink)]"
                            : "font-semibold text-[var(--jc-gold)]"
                          : isLightStage
                            ? "hover:text-[var(--jc-ink)]"
                            : "hover:text-[var(--jc-ivory)]"
                      )}
                    >
                      {hotspot.label}
                    </button>
                  );
                })}
              </div>

              <p role="status" aria-live="polite" className="m-0 flex items-center gap-1.5">
                <Hand aria-hidden="true" className="size-3.5 shrink-0" />
                <span>
                  {activeHotspot
                    ? `${activeHotspot.label}: ${activeHotspot.summary}`
                    : viewerActivated && status === "ready"
                      ? capability?.isMobileOrConstrained && !mobileTouchLocked
                        ? "Swipe page normally, or tap Rotate 3D to orbit."
                        : `Drag to orbit, scroll to zoom. ${aircraft.disclaimer}`
                      : statusAnnouncement}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      data-surface="dark"
      className="grid grid-cols-1 overflow-hidden rounded-[4px] border border-[var(--jc-line-dark)] bg-[var(--jc-teal-deep)] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
    >
      {/* Interactive Stage */}
      <div
        data-surface={activeLighting.surface}
        className={cn(
          "relative flex min-h-[380px] flex-col justify-between transition-colors duration-300 sm:min-h-[480px] lg:min-h-[600px]",
          activeLighting.id === "daylight"
            ? "jc-stage-daylight text-[var(--jc-ink)]"
            : activeLighting.id === "dusk"
              ? "jc-stage-dusk text-[var(--jc-ivory)]"
              : "jc-stage-twilight text-[var(--jc-ivory)]"
        )}
      >
        {/* Top stage bar: Configurations + Digital Jets Studio Lighting Modes */}
        <div
          className={cn(
            "relative z-10 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5",
            activeLighting.surface === "light"
              ? "border-[var(--jc-line-light)] bg-[var(--jc-scrim-light)]"
              : "border-[var(--jc-line-dark)]"
          )}
        >
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Aircraft configuration">
            {aircraft.configurations.map((cfg) => {
              const selected = cfg.id === activeConfig.id;
              return (
                <button
                  key={cfg.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleSelectConfig(cfg.id)}
                  className={cn(
                    "min-h-10 rounded-[3px] border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer",
                    selected
                      ? activeLighting.surface === "light"
                        ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                        : "border-[var(--jc-gold)] bg-[var(--jc-gold)] text-[var(--jc-teal)]"
                      : activeLighting.surface === "light"
                        ? "border-[var(--jc-line-strong)] bg-transparent text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                        : "border-[var(--jc-line-dark-strong)] bg-transparent text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Studio Lighting Presentation Switcher (Digital Jets lighting reference) */}
            <div className="flex items-center gap-1" role="group" aria-label="Studio lighting atmosphere">
              {lightingModes.map((lMode) => {
                const active = lMode.id === activeLighting.id;
                const Icon =
                  lMode.id === "daylight"
                    ? Sun
                    : lMode.id === "dusk"
                      ? Sunset
                      : Moon;
                return (
                  <button
                    key={lMode.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLightingId(lMode.id)}
                    title={lMode.label}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer",
                      active
                        ? activeLighting.surface === "light"
                          ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                          : "border-[var(--jc-ivory)] bg-[var(--jc-teal-elevated)] text-[var(--jc-ivory)]"
                        : activeLighting.surface === "light"
                          ? "border-[var(--jc-line-light)] text-[var(--jc-muted)] hover:border-[var(--jc-teal)] hover:text-[var(--jc-ink)]"
                          : "border-[var(--jc-line-dark)] text-[var(--jc-ivory-muted)] hover:border-[var(--jc-line-dark-strong)] hover:text-[var(--jc-ivory)]"
                    )}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    <span className="hidden sm:inline">{lMode.label}</span>
                  </button>
                );
              })}
            </div>

            {viewerActivated && status === "ready" && !capability?.prefersReducedMotion && (
              <button
                type="button"
                onClick={() => setAutoRotateEnabled((v) => !v)}
                aria-pressed={autoRotateEnabled}
                aria-label={autoRotateEnabled ? "Pause turntable rotation" : "Play gentle turntable rotation"}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border px-3 text-[13px] cursor-pointer",
                  activeLighting.surface === "light"
                    ? "border-[var(--jc-line-strong)] text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                    : "border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                )}
              >
                {autoRotateEnabled ? (
                  <>
                    <Pause aria-hidden="true" className="size-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play aria-hidden="true" className="size-3.5" />
                    <span>Turntable</span>
                  </>
                )}
              </button>
            )}

            {viewerActivated && status === "ready" && capability?.isMobileOrConstrained && (
              <button
                type="button"
                onClick={() => setMobileTouchLocked((v) => !v)}
                aria-pressed={mobileTouchLocked}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border px-3 text-[13px] font-medium cursor-pointer",
                  mobileTouchLocked
                    ? "border-[var(--jc-gold)] bg-[var(--jc-gold)] text-[var(--jc-teal)]"
                    : activeLighting.surface === "light"
                      ? "border-[var(--jc-line-strong)] text-[var(--jc-ink)]"
                      : "border-[var(--jc-line-dark-strong)] text-[var(--jc-ivory)]"
                )}
              >
                {mobileTouchLocked ? (
                  <>
                    <Unlock aria-hidden="true" className="size-3.5" />
                    <span>Done rotating</span>
                  </>
                ) : (
                  <>
                    <Lock aria-hidden="true" className="size-3.5" />
                    <span>Rotate 3D</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Viewport canvas / poster region */}
        <div className="relative flex flex-1 items-center justify-center px-4 py-6 sm:px-8">
          {/* Always-present crisp studio poster when 3D is inactive or errored */}
          {(!viewerActivated || status === "error" || status === "timeout") && (
            <div className="relative flex w-full flex-col items-center justify-center">
              <img
                src={activePoster.path}
                alt={activePoster.alt}
                width={activePoster.width}
                height={activePoster.height}
                className="jc-aircraft-shadow max-h-[340px] w-full max-w-[760px] object-contain sm:max-h-[420px]"
              />

              {enableLive3D && status === "poster" && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => startModelLoad("explicit")}
                    className="jc-btn-gold !min-h-[44px] !px-5 !text-[14px]"
                  >
                    <Box aria-hidden="true" className="size-4" />
                    <span>Explore in 3D ({sizeLabelMb} MB)</span>
                  </button>
                </div>
              )}

              {(status === "error" || status === "timeout") && (
                <div
                  role="alert"
                  className="mt-5 flex max-w-md flex-col items-center gap-3 rounded-[3px] border border-[var(--jc-line-dark-strong)] bg-[var(--jc-panel-dark-strong)] px-5 py-4 text-center"
                >
                  <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--jc-gold)]">
                    <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                    <span>
                      {status === "timeout"
                        ? "3D load timed out"
                        : "3D view unavailable on this session"}
                    </span>
                  </div>
                  <p className="m-0 text-[13px] text-[var(--jc-ivory-soft)]">
                    {statusAnnouncement}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => startModelLoad("explicit")}
                      className="jc-btn-gold !min-h-[40px] !px-4 !text-[13px]"
                    >
                      Retry 3D view
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueStatic}
                      className="jc-btn-outline-light !min-h-[40px] !px-4 !text-[13px]"
                    >
                      Keep studio render
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active live model-viewer instance (single renderer on page) */}
          {viewerActivated && status !== "error" && status !== "timeout" && (
            <div className="relative h-[320px] w-full sm:h-[420px] lg:h-[460px]">
              <model-viewer
                ref={mvRef}
                src={modelSrc}
                poster={activePoster.path}
                alt={`Interactive 3D exterior model of ${aircraft.displayTitle} in ${activeConfig.label} configuration`}
                camera-controls={allowCameraControls ? "" : undefined}
                touch-action="pan-y"
                disable-pan=""
                camera-orbit={aircraft.cameraPresets[0]?.orbit || "-36deg 76deg 76%"}
                camera-target={aircraft.cameraPresets[0]?.target || "auto auto auto"}
                min-camera-orbit="auto 35deg 3m"
                max-camera-orbit="auto 98deg 140%"
                field-of-view="30deg"
                min-field-of-view="18deg"
                max-field-of-view="42deg"
                environment-image={aircraft.environmentUrl}
                exposure={activeLighting.exposure}
                shadow-intensity={activeLighting.shadowIntensity}
                shadow-softness={activeLighting.shadowSoftness}
                interaction-prompt="none"
                interpolation-decay={capability?.prefersReducedMotion ? "0" : "120"}
                auto-rotate={autoRotateEnabled && inView ? "" : undefined}
                loading="eager"
                reveal="auto"
              >
                <img
                  slot="poster"
                  src={activePoster.path}
                  alt={activePoster.alt}
                  className="jc-aircraft-shadow h-full w-full object-contain"
                />
                <div slot="progress-bar" aria-hidden="true" hidden />
              </model-viewer>

              {status === "loading" && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
                  <span className="rounded-[3px] border border-[var(--jc-line-dark-strong)] bg-[var(--jc-panel-dark-strong)] px-3.5 py-1.5 text-[13px] text-[var(--jc-ivory)]">
                    Preparing {activeConfig.label.toLowerCase()} 3D model ({sizeLabelMb} MB)…
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom preset toolbar + status live region */}
        <div
          className={cn(
            "relative z-10 border-t px-5 py-3.5 transition-colors duration-300",
            activeLighting.surface === "light"
              ? "border-[var(--jc-line-light)] bg-[var(--jc-scrim-light)]"
              : "border-[var(--jc-line-dark)] bg-[var(--jc-scrim-dark)]"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Camera angles">
              {aircraft.cameraPresets.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      "min-h-10 rounded-[3px] border px-3 text-[13px] whitespace-nowrap transition-colors duration-150 cursor-pointer",
                      isSelected
                        ? activeLighting.surface === "light"
                          ? "border-[var(--jc-teal)] bg-[var(--jc-teal)] text-[var(--jc-ivory)]"
                          : "border-[var(--jc-ivory)] bg-[var(--jc-teal-elevated)] text-[var(--jc-ivory)]"
                        : activeLighting.surface === "light"
                          ? "border-[var(--jc-line-strong)] bg-transparent text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                          : "border-[var(--jc-line-dark)] bg-transparent text-[var(--jc-ivory-soft)] hover:border-[var(--jc-line-dark-strong)] hover:text-[var(--jc-ivory)]"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleResetView}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-[3px] border px-3 text-[13px] transition-colors cursor-pointer",
                  activeLighting.surface === "light"
                    ? "border-[var(--jc-line-strong)] text-[var(--jc-ink)] hover:border-[var(--jc-teal)]"
                    : "border-[var(--jc-line-dark)] text-[var(--jc-ivory-soft)] hover:border-[var(--jc-ivory)] hover:text-[var(--jc-ivory)]"
                )}
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <p
              role="status"
              aria-live="polite"
              className={cn(
                "m-0 flex items-center gap-1.5 text-[12px]",
                activeLighting.surface === "light"
                  ? "text-[var(--jc-muted)]"
                  : "text-[var(--jc-ivory-muted)]"
              )}
            >
              <Hand aria-hidden="true" className="size-3.5 shrink-0" />
              <span>
                {viewerActivated && status === "ready"
                  ? capability?.isMobileOrConstrained && !mobileTouchLocked
                    ? "Swipe page normally, or tap Rotate 3D to orbit."
                    : "Drag to orbit, scroll or pinch to zoom."
                  : statusAnnouncement}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right-hand editorial panel: Aircraft switcher, overview, HTML hotspots & contextual CTA */}
      <div className="flex flex-col justify-between border-t border-[var(--jc-line-dark)] bg-[var(--jc-teal)] p-6 sm:p-8 lg:border-l lg:border-t-0">
        <div>
          {aircraftList.length > 1 && (
            <div
              role="tablist"
              aria-label="Choose aircraft example"
              className="mb-7 inline-flex w-full rounded-[3px] border border-[var(--jc-line-dark-strong)] p-1"
            >
              {aircraftList.map((item) => {
                const active = item.id === aircraft.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSelectAircraft(item.id)}
                    className={cn(
                      "min-h-11 flex-1 rounded-[2px] px-3 text-[14px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer",
                      active
                        ? "bg-[var(--jc-ivory)] text-[var(--jc-teal)]"
                        : "text-[var(--jc-ivory-soft)] hover:text-[var(--jc-ivory)]"
                    )}
                  >
                    {item.model}
                  </button>
                );
              })}
            </div>
          )}

          <p className="m-0 text-[13px] text-[var(--jc-gold)]">{aircraft.category}</p>
          <h3 className="mt-2 font-serif text-[32px] leading-[1.12] text-[var(--jc-ivory)]">
            {aircraft.displayTitle}
          </h3>
          <p className="mt-1.5 text-[14px] text-[var(--jc-ivory-muted)]">
            {aircraft.variant}
          </p>

          <p className="mt-5 text-[15px] leading-relaxed text-[var(--jc-ivory-soft)]">
            {aircraft.summary}
          </p>

          <div className="mt-5 rounded-[3px] border border-[var(--jc-line-dark)] bg-[var(--jc-panel-dark)] p-4">
            <p className="m-0 text-[13px] font-medium text-[var(--jc-ivory)]">
              Active configuration: {activeConfig.label}
            </p>
            <p className="mt-1 m-0 text-[13px] text-[var(--jc-ivory-soft)]">
              {activeConfig.description}
            </p>
          </div>

          {/* Accessible HTML hotspot list (PRD 15.4 & AC08) */}
          {visibleHotspots.length > 0 && (
            <div className="mt-6">
              <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--jc-ivory)]">
                <Compass aria-hidden="true" className="size-3.5 text-[var(--jc-gold)]" />
                <span>Exterior features to inspect</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {visibleHotspots.map((hotspot) => {
                  const isOpen = activeHotspotId === hotspot.id;
                  return (
                    <button
                      key={hotspot.id}
                      type="button"
                      aria-pressed={isOpen}
                      onClick={() => handleSelectHotspot(hotspot.id, hotspot.presetId)}
                      className={cn(
                        "min-h-10 rounded-[3px] border px-3 text-left text-[13px] transition-colors duration-150 cursor-pointer",
                        isOpen
                          ? "border-[var(--jc-gold)] bg-[var(--jc-teal-elevated)] text-[var(--jc-ivory)]"
                          : "border-[var(--jc-line-dark)] text-[var(--jc-ivory-soft)] hover:border-[var(--jc-line-dark-strong)] hover:text-[var(--jc-ivory)]"
                      )}
                    >
                      {hotspot.label}
                    </button>
                  );
                })}
              </div>

              {activeHotspot && (
                <div className="mt-3 rounded-[3px] border-l-2 border-[var(--jc-gold)] bg-[var(--jc-panel-dark)] px-4 py-3 text-[13px] leading-relaxed text-[var(--jc-ivory-soft)]">
                  <strong className="block font-medium text-[var(--jc-ivory)]">
                    {activeHotspot.label}
                  </strong>
                  {activeHotspot.summary}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-[var(--jc-line-dark)] pt-6">
          <div className="flex flex-wrap gap-3">
            {onSelectAircraftPreference ? (
              <a
                href="#inquire"
                onClick={() => onSelectAircraftPreference(aircraft.id)}
                className="jc-btn-gold flex-1"
              >
                Request a callback
              </a>
            ) : (
              <Link
                href={`/inquire?service=private-jet&aircraft=${aircraft.id}`}
                className="jc-btn-gold flex-1"
              >
                Request a callback
              </Link>
            )}
          </div>

          <p className="mt-4 mb-0 text-[12px] leading-relaxed text-[var(--jc-ivory-muted)]">
            {aircraft.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
