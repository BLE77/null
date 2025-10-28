import { useEffect, useRef } from "react";
import "@google/model-viewer";

interface ModelViewerProps {
  src: string;
  alt?: string;
  className?: string;
  poster?: string;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          "exposure"?: string;
          ar?: boolean;
          "ar-modes"?: string;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

export function ModelViewer({ src, alt = "3D Model", className = "", poster }: ModelViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Model viewer is loaded via the import
  }, []);

  return (
    <model-viewer
      ref={viewerRef as any}
      src={src}
      alt={alt}
      poster={poster}
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      ar
      ar-modes="webxr scene-viewer quick-look"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent"
      }}
      data-testid="model-viewer-3d"
    />
  );
}
