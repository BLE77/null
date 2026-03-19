import { useEffect, useRef, useState } from "react";
// @ts-ignore
import * as THREE from "three";
// @ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface ThreeModelViewerProps {
  src: string;
  className?: string;
}

export function ThreeModelViewer({ src, className = "" }: ThreeModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Proactively check WebGL support before creating anything
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.log("WebGL not supported, 3D viewer disabled");
      setWebGLSupported(false);
      return;
    }

    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null; // Transparent background
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer - wrapped in try-catch for additional safety
    let renderer: any;
    try {
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (error) {
      console.log("WebGL renderer creation failed, 3D viewer disabled");
      setWebGLSupported(false);
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight1.position.set(5, 5, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x5fff5f, 0.8);
    directionalLight2.position.set(-3, 3, -3);
    scene.add(directionalLight2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controlsRef.current = controls;

    // Load model
    const loader = new GLTFLoader();
    console.log("[ThreeModelViewer] Loading GLB from URL:", src);
    loader.load(
      src,
      (gltf: any) => {
        console.log("[ThreeModelViewer] GLB loaded successfully");
        const model = gltf.scene;
        modelRef.current = model;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.multiplyScalar(scale);
        
        model.position.sub(center.multiplyScalar(scale));
        
        // Enable shadows
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
      },
      (progress: any) => {
        if (progress.lengthComputable) {
          console.log("[ThreeModelViewer] Loading progress:", Math.round((progress.loaded / progress.total) * 100), "%");
        }
      },
      (error: any) => {
        console.error("[ThreeModelViewer] Error loading GLB model:", error);
        console.error("[ThreeModelViewer] URL was:", src);
        console.error("[ThreeModelViewer] Error details:", {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
        });
      }
    );

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      
      // Cancel animation loop
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Dispose of loaded model resources
      if (modelRef.current) {
        modelRef.current.traverse((child: any) => {
          if (child.isMesh) {
            if (child.geometry) {
              child.geometry.dispose();
            }
            if (child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((material: any) => {
                // Dispose all textures by iterating over material properties
                Object.keys(material).forEach((prop) => {
                  const value = material[prop];
                  // Check if property is a Texture or an array of Textures
                  if (value && typeof value === 'object') {
                    if (value.isTexture) {
                      value.dispose();
                    } else if (Array.isArray(value)) {
                      value.forEach((item) => {
                        if (item && item.isTexture) {
                          item.dispose();
                        }
                      });
                    }
                  }
                });
                // Dispose material itself
                material.dispose();
              });
            }
          }
        });
        if (sceneRef.current) {
          sceneRef.current.remove(modelRef.current);
        }
      }
      
      // Dispose renderer and controls
      if (container && rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [src]);

  if (!webGLSupported) {
    return (
      <div 
        className={`${className} flex items-center justify-center`}
        style={{ width: "100%", height: "100%" }}
        data-testid="three-model-viewer-fallback"
      >
        <div className="text-center p-8">
          <p className="text-foreground/60 mb-2" style={{ fontFamily: "var(--font-display)" }}>
            3D Viewer requires WebGL
          </p>
          <p className="text-sm text-white/50">
            Your browser or environment doesn't support 3D graphics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ width: "100%", height: "100%" }}
      data-testid="three-model-viewer"
    />
  );
}
