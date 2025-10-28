import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import splashLogo from "@assets/off human simple_1761649401547.png";

// Check for WebGL support
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export function CharacterController() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const sceneRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    mixer?: THREE.AnimationMixer;
    actions?: Record<string, THREE.AnimationAction>;
    activeAction?: THREE.AnimationAction;
    modelRoot?: THREE.Object3D;
    animationId?: number;
  }>({});

  // Splash screen handler
  const handleSplashClick = () => {
    setSplashFade(true);
    setTimeout(() => setShowSplash(false), 1600);
  };

  useEffect(() => {
    // Check WebGL support
    if (!isWebGLAvailable()) {
      console.warn('WebGL is not supported in this environment');
      setWebGLSupported(false);
      setShowSplash(false);
      return;
    }

    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Setup renderer with error handling
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch (error) {
      console.error('Failed to create WebGL renderer:', error);
      setWebGLSupported(false);
      setShowSplash(false);
      return;
    }

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 5000);
    camera.position.set(0, 1.8, -4.5);
    camera.lookAt(0, 1.2, 0);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.49;

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    // Store refs
    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
    };

    // Load GLB model
    const loader = new GLTFLoader();
    loader.load(
      '/attached_assets/THG_1761649401547.glb',
      (gltf: any) => {
        const model = gltf.scene;
        scene.add(model);

        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y = 0;
        model.rotation.y = Math.PI;

        sceneRef.current.modelRoot = model;

        // Setup animations
        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          sceneRef.current.mixer = mixer;
          sceneRef.current.actions = {};

          // Find and setup animations
          const idleClip = gltf.animations.find((clip: any) => 
            (clip.name || '').toLowerCase().includes('idle')
          );
          const walkClip = gltf.animations.find((clip: any) => 
            (clip.name || '').toLowerCase().includes('walk')
          );
          const runClip = gltf.animations.find((clip: any) => 
            (clip.name || '').toLowerCase().includes('run')
          );

          if (idleClip) {
            sceneRef.current.actions.idle = mixer.clipAction(idleClip);
            sceneRef.current.actions.idle.play();
            sceneRef.current.activeAction = sceneRef.current.actions.idle;
          }
          if (walkClip) {
            sceneRef.current.actions.walk = mixer.clipAction(walkClip);
          }
          if (runClip) {
            sceneRef.current.actions.run = mixer.clipAction(runClip);
          }
        }
      },
      undefined,
      (error: any) => {
        console.error('Error loading model:', error);
      }
    );

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      sceneRef.current.animationId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      
      if (sceneRef.current.mixer) {
        sceneRef.current.mixer.update(delta);
      }

      if (sceneRef.current.controls) {
        sceneRef.current.controls.update();
      }

      if (sceneRef.current.renderer && sceneRef.current.scene && sceneRef.current.camera) {
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      if (sceneRef.current.camera) {
        sceneRef.current.camera.aspect = width / height;
        sceneRef.current.camera.updateProjectionMatrix();
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
        if (containerRef.current?.contains(sceneRef.current.renderer.domElement)) {
          containerRef.current.removeChild(sceneRef.current.renderer.domElement);
        }
      }
      
      if (sceneRef.current.scene) {
        sceneRef.current.scene.traverse((object: any) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((m: any) => m.dispose());
              } else {
                object.material.dispose();
              }
            }
          }
        });
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen" data-testid="character-controller">
      {/* Splash Screen */}
      {showSplash && webGLSupported && (
        <div 
          id="splash"
          className="splash"
          onClick={handleSplashClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSplashClick();
            }
          }}
          tabIndex={0}
          data-testid="splash-screen"
        >
          <img 
            src={splashLogo} 
            alt="Off Human" 
            className={splashFade ? 'splash-fade' : ''}
          />
        </div>
      )}

      {/* WebGL Not Supported Fallback */}
      {!webGLSupported && (
        <div className="absolute inset-0 flex items-center justify-center" data-testid="webgl-fallback">
          <div className="text-center px-4">
            <div className="mb-6">
              <img 
                src={splashLogo} 
                alt="OFF HUMAN" 
                className="w-64 mx-auto opacity-90"
                data-testid="fallback-logo"
              />
            </div>
            <div className="h-1 w-24 bg-primary mx-auto mb-6" />
            <p className="text-xl md:text-2xl text-white mb-10 font-medium drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Streetwear for the Singularity
            </p>
            <p className="text-base md:text-lg text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              Built at the edge of human and machine. Made for what comes next.
            </p>
            <button 
              onClick={() => {
                const productsSection = document.getElementById('products');
                productsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="metallic-nav px-10 py-3 rounded-md uppercase tracking-wider text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
              data-testid="button-explore"
            >
              Explore ↓
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas Container */}
      {webGLSupported && (
        <div 
          ref={containerRef} 
          className="absolute inset-0"
          style={{ pointerEvents: showSplash ? 'none' : 'auto' }}
          data-testid="canvas-container"
        />
      )}

      {/* Instructions Overlay */}
      {!showSplash && webGLSupported && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-white/60 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" data-testid="instructions">
            Click and drag to rotate • Scroll to zoom
          </p>
        </div>
      )}
    </div>
  );
}
