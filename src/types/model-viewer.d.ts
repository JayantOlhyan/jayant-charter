import type { DetailedHTMLProps, HTMLAttributes } from "react";

export interface ModelViewerElement extends HTMLElement {
  src: string;
  poster: string;
  alt: string;
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  minCameraOrbit: string;
  maxCameraOrbit: string;
  environmentImage: string;
  exposure: number;
  shadowIntensity: number;
  autoRotate: boolean;
  cameraControls: boolean;
  disablePan: boolean;
  disableZoom: boolean;
  interactionPrompt: "auto" | "none";
  interpolationDecay: number;
  loaded: boolean;
  dismissPoster?: () => void;
  jumpCameraToGoal?: () => void;
  resetTurntableRotation?: () => void;
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<ModelViewerElement>,
        ModelViewerElement
      > & {
        src?: string;
        poster?: string;
        alt?: string;
        "camera-controls"?: boolean | "";
        "touch-action"?: string;
        "disable-pan"?: boolean | "";
        "disable-zoom"?: boolean | "";
        "camera-orbit"?: string;
        "camera-target"?: string;
        "min-camera-orbit"?: string;
        "max-camera-orbit"?: string;
        "field-of-view"?: string;
        "min-field-of-view"?: string;
        "max-field-of-view"?: string;
        "environment-image"?: string;
        exposure?: string | number;
        "shadow-intensity"?: string | number;
        "shadow-softness"?: string | number;
        "interaction-prompt"?: "auto" | "none";
        "interpolation-decay"?: string | number;
        "auto-rotate"?: boolean | "";
        "auto-rotate-delay"?: string | number;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "manual";
        "tone-mapping"?: string;
      };
    }
  }
}
