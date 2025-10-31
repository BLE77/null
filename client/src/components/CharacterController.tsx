import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { X, ChevronDown } from 'lucide-react';
import splashLogo from "@assets/off human simple_1761649401547.png";
import introAudioFile from "@assets/OFF!_1761649401549.mp3";
import themeAudioFile from "@assets/2hollis - jeans (instrumental) [prod. 2hollis]_1761649401547.mp3";
import auraFont from "@assets/Electroharmonix_1761649401549.otf";

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
  const [showSplash, setShowSplash] = useState(() => {
    // Check if user has seen splash before
    const hasSeenSplash = localStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });
  const [splashGlitching, setSplashGlitching] = useState(false);
  const [splashFade, setSplashFade] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [introStarted, setIntroStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
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
    introAudio?: HTMLAudioElement;
    themeAudio?: HTMLAudioElement;
    locomotionState?: string;
    oneShotPlaying?: boolean;
    keys?: { w: boolean; ArrowUp: boolean; Shift: boolean };
    auraTextMesh?: THREE.Mesh;
    auraTextScaleTarget?: number;
    auraHideTimeout?: number;
    auraVisibilityTimeout?: number;
  }>({
    locomotionState: 'idle',
    oneShotPlaying: false,
    keys: { w: false, ArrowUp: false, Shift: false },
    auraTextScaleTarget: 0.2
  });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Splash screen handler with intro music
  const handleSplashClick = () => {
    if (introStarted) return;
    setIntroStarted(true);
    setSplashGlitching(true);
    
    // Mark splash as seen in localStorage
    localStorage.setItem('hasSeenSplash', 'true');
    
    // Play intro audio
    if (sceneRef.current.introAudio && sceneRef.current.themeAudio) {
      const introAudio = sceneRef.current.introAudio;
      const themeAudio = sceneRef.current.themeAudio;
      
      // MOBILE FIX: Load theme audio immediately on user interaction
      // Mobile browsers block autoplay unless triggered by user gesture
      // We load it here (during click) then play it when intro ends
      themeAudio.load();
      
      // Track whether handler has already run
      let hasHandled = false;
      let fallbackTimerId: number | null = null;
      
      // Use 'ended' event instead of setTimeout for better mobile compatibility
      const handleIntroEnd = () => {
        // Ensure this only runs once
        if (hasHandled) return;
        hasHandled = true;
        
        // Clear fallback timer if it exists
        if (fallbackTimerId !== null) {
          clearTimeout(fallbackTimerId);
          fallbackTimerId = null;
        }
        
        // Clean up event listener
        introAudio.removeEventListener('ended', handleIntroEnd);
        
        // Stop glitching and start fade
        setSplashGlitching(false);
        setSplashFade(true);
        
        // Start theme music (now allowed because it follows user interaction)
        themeAudio.currentTime = 0;
        themeAudio.play().catch(err => {
          console.warn('Theme audio playback failed:', err);
        });
        
        // Hide splash after fade completes (1.6s)
        setTimeout(() => {
          setShowSplash(false);
        }, 1600);
      };
      
      // Listen for intro audio to end
      introAudio.addEventListener('ended', handleIntroEnd);
      
      // Add fallback timeout in case 'ended' event doesn't fire on mobile
      const introDuration = introAudio.duration || 7;
      fallbackTimerId = window.setTimeout(handleIntroEnd, (introDuration + 0.5) * 1000);
      
      // Start intro audio
      introAudio.currentTime = 0;
      introAudio.play().catch(err => {
        console.warn('Intro audio playback failed:', err);
      });
    }
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

    // Setup audio
    const introAudio = new Audio(introAudioFile);
    introAudio.preload = 'auto';
    introAudio.loop = false;
    introAudio.volume = 0.9;
    
    const themeAudio = new Audio(themeAudioFile);
    themeAudio.preload = 'auto';
    themeAudio.loop = true;
    themeAudio.volume = 0.85;

    sceneRef.current.introAudio = introAudio;
    sceneRef.current.themeAudio = themeAudio;

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

    // Env lighting
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment()).texture;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 5000);
    camera.position.set(0, 1.8, -4.5);
    camera.lookAt(0, 1.2, 0);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 1.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI * 0.49;

    // Store refs
    sceneRef.current = {
      ...sceneRef.current,
      renderer,
      scene,
      camera,
      controls,
    };

    // Helper functions
    const findClipByNameLike = (animations: any[], nameLike: string) => {
      const target = nameLike.toLowerCase();
      let match = animations.find((c: any) => (c.name || '').toLowerCase().includes(target));
      if (match) return match;
      
      const aliases: Record<string, string[]> = {
        idle: ['idle', 'stand', 'breath', 'rest'],
        walk: ['walk', 'walking'],
        run: ['run', 'running', 'sprint'],
        punch: ['punch', 'jab', 'attack', 'hit'],
        kick: ['kick', 'attack_kick', 'roundhouse'],
        jump: ['jump', 'hop', 'leap'],
        aura: ['aura', 'aura1', 'aura 1', 'power', 'charge']
      };
      
      for (const alt of (aliases[nameLike] || [])) {
        match = animations.find((c: any) => (c.name || '').toLowerCase().includes(alt));
        if (match) return match;
      }
      return null;
    };

    const makeAction = (clip: any, mixer: THREE.AnimationMixer) => {
      const act = mixer.clipAction(clip);
      if (clip && /(punch|kick|attack|jump|aura)/i.test(clip.name || '')) {
        act.clampWhenFinished = true;
        act.setLoop(THREE.LoopOnce, 1);
      } else {
        act.setLoop(THREE.LoopRepeat, Infinity);
      }
      return act;
    };

    const crossFade = (toAction: THREE.AnimationAction, duration = 0.25) => {
      if (!toAction || sceneRef.current.activeAction === toAction) return;
      toAction.reset().fadeIn(duration).play();
      if (sceneRef.current.activeAction) {
        sceneRef.current.activeAction.fadeOut(duration);
      }
      sceneRef.current.activeAction = toAction;
    };

    const getLocomotionAction = () => {
      const { actions, locomotionState } = sceneRef.current;
      if (!actions) return null;
      if (locomotionState === 'run' && actions.run) return actions.run;
      if (locomotionState === 'walk' && actions.walk) return actions.walk;
      return actions.idle || Object.values(actions).find(Boolean) || null;
    };

    const setLocomotion = (state: string) => {
      if (sceneRef.current.oneShotPlaying || state === sceneRef.current.locomotionState) return;
      sceneRef.current.locomotionState = state;
      const target = getLocomotionAction();
      if (target) crossFade(target, 0.2);
    };

    const playOneShot = (kind: string) => {
      const { actions, mixer } = sceneRef.current;
      const act = actions?.[kind];
      
      if (!act) {
        // For aura, show text even without animation
        if (kind === 'aura') {
          revealAuraText();
          scheduleAuraTextHide();
        }
        return false;
      }
      
      if (sceneRef.current.oneShotPlaying || !mixer) return false;
      
      sceneRef.current.oneShotPlaying = true;
      const baseAction = getLocomotionAction();
      
      act.reset();
      act.setLoop(THREE.LoopOnce, 1);
      act.clampWhenFinished = true;
      act.enabled = true;
      act.play();
      
      if (baseAction && baseAction !== act) {
        baseAction.crossFadeTo(act, 0.12, false);
      }
      sceneRef.current.activeAction = act;
      
      if (kind === 'aura') {
        revealAuraText();
        scheduleAuraTextHide();
      }

      const onFinished = (e: any) => {
        if (e.action !== act) return;
        mixer.removeEventListener('finished', onFinished);
        sceneRef.current.oneShotPlaying = false;
        const target = getLocomotionAction();
        if (target && target !== act) {
          crossFade(target, 0.15);
        }
      };
      mixer.addEventListener('finished', onFinished);
      return true;
    };

    const ensureAuraText = async () => {
      if (sceneRef.current.auraTextMesh) return sceneRef.current.auraTextMesh;
      
      try {
        const ttfLoader = new TTFLoader();
        const fontLoader = new FontLoader();
        
        return new Promise<THREE.Mesh>((resolve) => {
          ttfLoader.load(
            auraFont, 
            (data: any) => {
              const font = fontLoader.parse(data);
              const textGeo = new TextGeometry('+100 Aura!!', {
                font,
                size: 0.6,
                depth: 0.08,
                curveSegments: 10,
                bevelEnabled: true,
                bevelThickness: 0.02,
                bevelSize: 0.015,
                bevelSegments: 2
              });
              textGeo.computeBoundingBox();
              textGeo.center();
              
              const textMat = new THREE.MeshStandardMaterial({
                color: 0x00CC7B,
                emissive: 0x00CC7B,
                emissiveIntensity: 1.4,
                metalness: 0.25,
                roughness: 0.25
              });
              
              const mesh = new THREE.Mesh(textGeo, textMat);
              mesh.visible = false;
              mesh.position.set(-1.5, 2.4, -2);
              mesh.scale.setScalar(0.2);
              scene.add(mesh);
              sceneRef.current.auraTextMesh = mesh;
              resolve(mesh);
            },
            undefined,
            (error: any) => {
              console.error('Failed to load aura font:', error);
              resolve(null as any);
            }
          );
        });
      } catch (err) {
        console.warn('Failed to create aura text:', err);
        return null;
      }
    };

    const revealAuraText = () => {
      ensureAuraText().then((mesh) => {
        if (!mesh) return;
        mesh.visible = true;
        mesh.scale.setScalar(0.2);
        sceneRef.current.auraTextScaleTarget = 0.6;
      });
    };

    const scheduleAuraTextHide = (delay = 1800) => {
      if (sceneRef.current.auraHideTimeout) {
        clearTimeout(sceneRef.current.auraHideTimeout);
      }
      if (sceneRef.current.auraVisibilityTimeout) {
        clearTimeout(sceneRef.current.auraVisibilityTimeout);
      }
      
      sceneRef.current.auraHideTimeout = window.setTimeout(() => {
        sceneRef.current.auraTextScaleTarget = 0.2;
        sceneRef.current.auraVisibilityTimeout = window.setTimeout(() => {
          if (sceneRef.current.auraTextMesh && sceneRef.current.auraTextMesh.scale.x <= 0.24) {
            sceneRef.current.auraTextMesh.visible = false;
          }
        }, 800);
      }, delay);
    };

    // Expose aura trigger for mobile button
    const triggerAura = () => {
      playOneShot('aura');
    };
    (window as any).triggerAura = triggerAura;

    // Keyboard controls
    const normalizeKey = (key: string) => {
      if (key === 'Shift') return 'Shift';
      if (key && key.startsWith('Arrow')) return key;
      return key ? key.toLowerCase() : key;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = normalizeKey(e.key);
      if (sceneRef.current.keys && key in sceneRef.current.keys) {
        sceneRef.current.keys[key as keyof typeof sceneRef.current.keys] = true;
      }
      
      const lower = e.key.toLowerCase();
      if (lower === 'j') playOneShot('punch');
      if (lower === 'k') playOneShot('kick');
      if (lower === 'u') playOneShot('aura');
      if (e.code === 'Space') {
        e.preventDefault();
        playOneShot('jump');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = normalizeKey(e.key);
      if (sceneRef.current.keys && key in sceneRef.current.keys) {
        sceneRef.current.keys[key as keyof typeof sceneRef.current.keys] = false;
      }
    };

    // Only enable keyboard controls on desktop
    const checkMobile = () => window.innerWidth < 768 || 'ontouchstart' in window;
    
    if (!checkMobile()) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    const updateLocomotionFromInput = () => {
      const keys = sceneRef.current.keys;
      if (!keys) return;
      const forward = keys.w || keys.ArrowUp;
      if (!forward) {
        setLocomotion('idle');
        return;
      }
      setLocomotion(keys.Shift ? 'run' : 'walk');
    };

    // Load GLB model
    const loader = new GLTFLoader();
    loader.load(
      '/attached_assets/THG.glb',
      (gltf: any) => {
        const model = gltf.scene;
        model.scale.setScalar(0.6); // Scale down to fit in viewport
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

          const prioritized = ['idle', 'walk', 'run', 'punch', 'kick', 'jump', 'aura'];
          const matched = new Set();

          for (const key of prioritized) {
            const clip = findClipByNameLike(gltf.animations, key);
            if (clip && !matched.has(clip)) {
              sceneRef.current.actions[key] = makeAction(clip, mixer);
              matched.add(clip);
            }
          }

          const defaultAction = sceneRef.current.actions.idle || 
                               sceneRef.current.actions.walk || 
                               Object.values(sceneRef.current.actions)[0];
          if (defaultAction) {
            sceneRef.current.activeAction = defaultAction;
            defaultAction.play();
          }
        }

        // Preload aura text
        ensureAuraText();
      },
      undefined,
      (error: any) => {
        console.error('Error loading model:', error);
      }
    );

    // Animation loop
    const clock = new THREE.Clock();
    let last = performance.now();
    
    const animate = () => {
      sceneRef.current.animationId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = clock.getDelta();
      
      if (sceneRef.current.mixer) {
        sceneRef.current.mixer.update(delta);
      }

      updateLocomotionFromInput();

      // Update aura text
      if (sceneRef.current.auraTextMesh && sceneRef.current.auraTextMesh.visible) {
        sceneRef.current.auraTextMesh.position.y = 2.5 + Math.sin(now * 0.002) * 0.1;
        const nextScale = THREE.MathUtils.lerp(
          sceneRef.current.auraTextMesh.scale.x,
          sceneRef.current.auraTextScaleTarget || 0.2,
          Math.min(1, delta * 6)
        );
        sceneRef.current.auraTextMesh.scale.setScalar(nextScale);
        sceneRef.current.auraTextMesh.lookAt(camera.position.x, sceneRef.current.auraTextMesh.position.y, camera.position.z);
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (sceneRef.current.introAudio) {
        sceneRef.current.introAudio.pause();
        sceneRef.current.introAudio.src = '';
      }
      if (sceneRef.current.themeAudio) {
        sceneRef.current.themeAudio.pause();
        sceneRef.current.themeAudio.src = '';
      }
      
      if (sceneRef.current.auraHideTimeout) {
        clearTimeout(sceneRef.current.auraHideTimeout);
      }
      if (sceneRef.current.auraVisibilityTimeout) {
        clearTimeout(sceneRef.current.auraVisibilityTimeout);
      }
      
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
        <>
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
              alt="Off Human - Click to enter" 
              className={`${splashGlitching ? 'splash-glitching' : ''} ${splashFade ? 'splash-fade' : ''}`}
            />
          </div>
        </>
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

      {/* Desktop Instructions Overlay */}
      {!showSplash && webGLSupported && !isMobile && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-white/60 text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" data-testid="instructions">
            Click and drag to rotate • W/↑: Move • Shift: Run • J: Punch • K: Kick • Space: Jump • U: Aura
          </p>
        </div>
      )}

      {/* Mobile Aura Button */}
      {!showSplash && webGLSupported && isMobile && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <button 
            onClick={() => (window as any).triggerAura?.()}
            className="metallic-nav px-8 py-3 rounded-md uppercase tracking-wider text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50"
            data-testid="button-aura"
          >
            +100 Aura
          </button>
        </div>
      )}

      {/* Mobile Scroll Down Button */}
      {!showSplash && webGLSupported && isMobile && (
        <button
          onClick={() => {
            const productsSection = document.getElementById('products');
            productsSection?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="absolute bottom-24 right-8 w-12 h-12 rounded-full border-2 border-primary bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] z-40 animate-bounce"
          data-testid="button-scroll-down"
          aria-label="Scroll to products"
        >
          <ChevronDown className="w-6 h-6 text-primary" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
