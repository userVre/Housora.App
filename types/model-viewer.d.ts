import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src: string;
        poster?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        "ar-scale"?: string;
        "ar-placement"?: string;
        "tone-mapping"?: string;
        exposure?: string;
        "environment-image"?: string;
        "touch-action"?: string;
      };
    }
  }
}
