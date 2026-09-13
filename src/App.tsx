import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BusPhysicsEngine, ControlInputs } from './simulation/physicsEngine';
import { createBusModel, updateBusVisuals, BusModelHandles } from './simulation/busModel';
import { buildWorld, WorldObjects } from './simulation/worldBuilder';
import { generateTrackData, TRACK_CURVE } from './simulation/trackData';
import { PedestrianManager } from './simulation/pedestrianManager';
import { soundEngine } from './audio/soundEngine';
import { NavigationSystem } from './simulation/navigationSystem';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { LapSummaryModal } from './components/LapSummaryModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { CameraView, LapState, TimeOfDay, VehicleState, DrivingMode, Gear, NavigationInfo } from './types';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation instances refs
  const physicsRef = useRef<BusPhysicsEngine | null>(null);
  const busModelRef = useRef<BusModelHandles | null>(null);
  const worldRef = useRef<WorldObjects | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const trackDataRef = useRef(generateTrackData());

  // Free-look orbit camera refs
  const orbitYawRef = useRef<number>(0);
  const orbitPitchRef = useRef<number>(0);
  const isRightDraggingRef = useRef<boolean>(false);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);

  // Driving mode & controls modal state
  const [drivingMode, setDrivingMode] = useState<DrivingMode>('normal');
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);

  // Live Navigation State
  const [navigationInfo, setNavigationInfo] = useState<NavigationInfo>({
    nextInstruction: '출발선 직진 후 중앙대로 진입',
    nextDistance: 60,
    direction: 'straight',
    targetSpeedLimit: 50,
    routeProgress: 0,
    destinationName: '메트로폴리스 중앙 터미널',
  });

  // Input states ref
  const inputsRef = useRef<ControlInputs>({
    accelerate: false,
    brake: false,
    steerLeft: false,
    steerRight: false,
    handbrake: false,
  });

  // UI state synchronized with animation loop
  const [vehicleState, setVehicleState] = useState<VehicleState>(() => {
    const engine = new BusPhysicsEngine();
    return engine.getState();
  });

  const [cameraView, setCameraView] = useState<CameraView>('chase');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [maxSpeedReached, setMaxSpeedReached] = useState<number>(0);

  // Lap State
  const [lapState, setLapState] = useState<LapState>({
    currentLap: 1,
    currentSector: 1,
    lapStartTime: Date.now(),
    currentLapTime: 0,
    bestLapTime: (() => {
      const saved = localStorage.getItem('bus_simulator_best_lap');
      return saved ? parseFloat(saved) : null;
    })(),
    sectorTimes: [],
    checkpointsPassed: new Set<number>([0]),
    totalCheckpoints: 10,
    isCompleted: false,
    targetLapTime: 120, // 2 minutes (120 seconds)
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize Three.js Simulation
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f7ff);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(62, width / height, 0.2, 1200);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. World & Track Construction
    const world = buildWorld(scene);
    worldRef.current = world;

    // Pedestrian Life System (보행자 시스템)
    const pedManager = new PedestrianManager(scene);
    pedManager.init();

    // 4. Bus 3D Model
    const busModel = createBusModel(scene);
    busModelRef.current = busModel;

    // 5. Bus Physics Initializer
    // Place bus on Start Line heading forward along Track Curve
    const startPt = TRACK_CURVE.getPointAt(0);
    const startTan = TRACK_CURVE.getTangentAt(0);
    const startAngle = Math.atan2(startTan.x, startTan.z);

    const physics = new BusPhysicsEngine(
      { x: startPt.x, y: 0.54, z: startPt.z },
      startAngle
    );
    physicsRef.current = physics;

    // Camera initial position
    camera.position.set(startPt.x, 5, startPt.z - 12);
    camera.lookAt(startPt.x, 2, startPt.z + 10);

    // 6. Audio Engine Startup Trigger on user interaction
    const handleFirstUserAction = () => {
      soundEngine.init();
      soundEngine.resume();
      window.removeEventListener('keydown', handleFirstUserAction);
      window.removeEventListener('click', handleFirstUserAction);
      window.removeEventListener('touchstart', handleFirstUserAction);
    };
    window.addEventListener('keydown', handleFirstUserAction);
    window.addEventListener('click', handleFirstUserAction);
    window.addEventListener('touchstart', handleFirstUserAction);

    // 7. Animation & Physics Loop
    let lastTime = performance.now();
    let animFrameId: number;

    const smoothCamPos = new THREE.Vector3(startPt.x, 5, startPt.z - 10);
    const smoothCamLook = new THREE.Vector3(startPt.x, 2, startPt.z + 10);

    const animate = (time: number) => {
      animFrameId = requestAnimationFrame(animate);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!physicsRef.current || !busModelRef.current) return;

      // Update Physics with current user inputs
      const state = physicsRef.current.update(dt, inputsRef.current);
      updateBusVisuals(busModelRef.current, state, dt);
      pedManager.update(dt);

      // Track max speed
      const curSpeed = Math.abs(state.speed);
      setMaxSpeedReached((prev) => Math.max(prev, curSpeed));

      // Synchronize vehicle state to React UI (throttled slightly by browser render cadence)
      setVehicleState({ ...state });

      // Compute Real-time Route Navigation (내비게이션)
      const nav = NavigationSystem.getNavigation(state.position, state.rotation);
      setNavigationInfo(nav);

      // Checkpoint and Finish Line Lap timing logic
      const busPos = state.position;
      const checkpoints = trackDataRef.current.checkpoints;

      setLapState((prevLap) => {
        if (prevLap.isCompleted) return prevLap;

        const updatedTime = Date.now() - prevLap.lapStartTime;
        const newCheckpoints = new Set(prevLap.checkpointsPassed);

        for (let i = 0; i < checkpoints.length; i++) {
          const cp = checkpoints[i];
          const distToCp = Math.hypot(busPos.x - cp.position.x, busPos.z - cp.position.z);
          if (distToCp < cp.radius) {
            // Checkpoint 0 is the Start / Finish Line
            if (cp.id === 0) {
              // Crossed Finish line after completing the circuit (at least 7 checkpoints passed and >15 seconds)
              if (newCheckpoints.size >= 7 && updatedTime > 15000) {
                const finalLapTime = updatedTime;
                let newBest = prevLap.bestLapTime;
                if (!newBest || finalLapTime < newBest) {
                  newBest = finalLapTime;
                  localStorage.setItem('bus_simulator_best_lap', finalLapTime.toString());
                }

                soundEngine.playLapFinish();
                setIsModalOpen(true);
                return {
                  ...prevLap,
                  currentLapTime: finalLapTime,
                  bestLapTime: newBest,
                  isCompleted: true,
                };
              }
            } else {
              // Intermediate checkpoint passed
              newCheckpoints.add(cp.id);
              world.updateCheckpoints((cp.id + 1) % checkpoints.length);
            }
          }
        }

        return {
          ...prevLap,
          currentLapTime: updatedTime,
          checkpointsPassed: newCheckpoints,
        };
      });

      // Free-look decay when not actively holding right-click
      if (!isRightDraggingRef.current) {
        const returnDamp = Math.min(1.0, dt * 4.0);
        orbitYawRef.current += (0 - orbitYawRef.current) * returnDamp;
        orbitPitchRef.current += (0 - orbitPitchRef.current) * returnDamp;
      }

      // Camera Positioning based on CameraView
      const busWorldPos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
      const busYaw = state.rotation;

      if (cameraView === 'cockpit') {
        // First Person Driver Seat Camera
        // Positioned right at driver's head level inside front cabin
        const driverSeatOffset = new THREE.Vector3(-0.65, 2.02, 3.75);
        driverSeatOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), busYaw);
        camera.position.copy(busWorldPos).add(driverSeatOffset);

        // Driver look direction with free-look yaw & pitch + slight steering anticipation
        const lookYaw = busYaw + orbitYawRef.current + state.steeringAngle * 0.12;
        const lookPitch = orbitPitchRef.current - 0.04;

        const lookDirX = Math.sin(lookYaw) * Math.cos(lookPitch);
        const lookDirY = Math.sin(lookPitch);
        const lookDirZ = Math.cos(lookYaw) * Math.cos(lookPitch);

        camera.lookAt(
          camera.position.x + lookDirX * 30,
          camera.position.y + lookDirY * 30,
          camera.position.z + lookDirZ * 30
        );
        camera.fov = 72;
        camera.updateProjectionMatrix();
      } else if (cameraView === 'chase') {
        // Third Person Chase Follow Camera with 360-degree free orbital look
        const speedKmh = Math.abs(state.speed);
        const camDistance = 11.5 + (speedKmh / 100) * 3.5;
        const camHeight = 4.6 + (speedKmh / 100) * 0.8;

        const effectiveYaw = busYaw + orbitYawRef.current;
        const effectivePitch = orbitPitchRef.current;

        const targetCamX = busWorldPos.x - Math.sin(effectiveYaw) * camDistance * Math.cos(effectivePitch);
        const targetCamZ = busWorldPos.z - Math.cos(effectiveYaw) * camDistance * Math.cos(effectivePitch);
        const targetCamY = Math.max(1.2, busWorldPos.y + camHeight + Math.sin(effectivePitch) * camDistance);

        // Responsive tracking when actively rotating, smooth dampening during driving
        const dampFactor = isRightDraggingRef.current ? Math.min(1.0, dt * 18.0) : Math.min(1.0, dt * 6.5);
        smoothCamPos.x += (targetCamX - smoothCamPos.x) * dampFactor;
        smoothCamPos.y += (targetCamY - smoothCamPos.y) * dampFactor;
        smoothCamPos.z += (targetCamZ - smoothCamPos.z) * dampFactor;
        camera.position.copy(smoothCamPos);

        const targetLookX = busWorldPos.x + Math.sin(busYaw) * 3;
        const targetLookZ = busWorldPos.z + Math.cos(busYaw) * 3;
        const targetLookY = busWorldPos.y + 1.8;

        smoothCamLook.x += (targetLookX - smoothCamLook.x) * Math.min(1.0, dt * 10.0);
        smoothCamLook.y += (targetLookY - smoothCamLook.y) * Math.min(1.0, dt * 10.0);
        smoothCamLook.z += (targetLookZ - smoothCamLook.z) * Math.min(1.0, dt * 10.0);
        camera.lookAt(smoothCamLook);

        // Dynamic FOV for speed sensation
        const targetFov = 60 + (speedKmh / 110) * 16 + (state.isDrifting ? 6 : 0);
        camera.fov += (targetFov - camera.fov) * Math.min(1.0, dt * 5.0);
        camera.updateProjectionMatrix();
      } else {
        // Top Overview Camera
        const effectiveYaw = busYaw + orbitYawRef.current;
        const topCamX = busWorldPos.x - Math.sin(effectiveYaw) * 18;
        const topCamZ = busWorldPos.z - Math.cos(effectiveYaw) * 18;
        const topCamY = Math.max(14, busWorldPos.y + 24 + orbitPitchRef.current * 14);
        camera.position.set(topCamX, topCamY, topCamZ);
        camera.lookAt(busWorldPos.x, busWorldPos.y + 1.2, busWorldPos.z);
        camera.fov = 55;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // 8. Resize Observer
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleFirstUserAction);
      window.removeEventListener('click', handleFirstUserAction);
      window.removeEventListener('touchstart', handleFirstUserAction);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cameraView]);

  // Mouse Right-Click Free Look Event Handlers
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        isRightDraggingRef.current = true;
        setIsOrbiting(true);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isRightDraggingRef.current) return;
      // Dragging right rotates camera view right, dragging up tilts up
      orbitYawRef.current -= e.movementX * 0.005;
      orbitPitchRef.current = Math.max(-0.65, Math.min(0.75, orbitPitchRef.current - e.movementY * 0.004));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button === 2 || isRightDraggingRef.current) {
        isRightDraggingRef.current = false;
        setIsOrbiting(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Suppress browser context menu on right click
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Toggle Driving Mode (Normal vs Race)
  const handleToggleDrivingMode = useCallback(() => {
    if (physicsRef.current) {
      const nextMode = physicsRef.current.toggleDrivingMode();
      setDrivingMode(nextMode);
    }
  }, []);

  // Engine Start/Stop Ignition Toggle
  const handleToggleEngine = useCallback(() => {
    if (physicsRef.current) {
      const running = physicsRef.current.toggleEngine();
      if (running) {
        soundEngine.init();
        soundEngine.resume();
        soundEngine.playEngineStart();
      } else {
        soundEngine.playEngineStop();
      }
    }
  }, []);

  // Manual Transmission Toggle
  const handleToggleTransmission = useCallback(() => {
    if (physicsRef.current) {
      physicsRef.current.toggleTransmission();
    }
  }, []);

  // Direct Gear Selection
  const handleSelectGear = useCallback((gear: Gear) => {
    if (physicsRef.current) {
      physicsRef.current.setGear(gear);
      soundEngine.playGearShift();
    }
  }, []);

  // Reset simulation to start line (다시시도)
  const resetSimulation = useCallback(() => {
    const startPt = TRACK_CURVE.getPointAt(0);
    const startTan = TRACK_CURVE.getTangentAt(0);
    const startAngle = Math.atan2(startTan.x, startTan.z);

    if (physicsRef.current) {
      physicsRef.current.reset({ x: startPt.x, y: 0.54, z: startPt.z }, startAngle);
    }

    worldRef.current?.updateCheckpoints(0);
    setIsModalOpen(false);

    setLapState((prev) => ({
      ...prev,
      currentSector: 1,
      lapStartTime: Date.now(),
      currentLapTime: 0,
      checkpointsPassed: new Set<number>([0]),
      isCompleted: false,
    }));
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on arrow keys, space, and Tab
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();

      // Acceleration: Up Arrow or 'W'
      if (e.key === 'ArrowUp' || key === 'w') {
        inputsRef.current.accelerate = true;
      }
      // Brake: Down Arrow or 'S'
      if (e.key === 'ArrowDown' || key === 's') {
        inputsRef.current.brake = true;
      }
      // Steering: Left Arrow or 'A'
      if (e.key === 'ArrowLeft' || key === 'a') {
        inputsRef.current.steerLeft = true;
      }
      // Steering: Right Arrow or 'D'
      if (e.key === 'ArrowRight' || key === 'd') {
        inputsRef.current.steerRight = true;
      }
      // Handbrake / Drift: Spacebar
      if (e.key === ' ') {
        inputsRef.current.handbrake = true;
      }

      // Engine Ignition: 'I'
      if (key === 'i') {
        handleToggleEngine();
      }

      // Transmission Mode (Manual/Auto): 'T'
      if (key === 't') {
        handleToggleTransmission();
      }

      // Manual Gear Shifting: 'Q' for Downshift, 'E' for Upshift
      if (key === 'q') {
        if (physicsRef.current) {
          physicsRef.current.shiftDown();
          soundEngine.playGearShift();
        }
      }
      if (key === 'e') {
        if (physicsRef.current) {
          physicsRef.current.shiftUp();
          soundEngine.playGearShift();
        }
      }

      // Direct gear hotkeys 1-5, N, R
      if (['1', '2', '3', '4', '5'].includes(key)) {
        handleSelectGear(key as Gear);
      }
      if (key === 'n') {
        handleSelectGear('N');
      }
      if (key === 'b') {
        handleSelectGear('R');
      }

      // Camera view toggle: 'C'
      if (key === 'c') {
        setCameraView((prev) => (prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'top' : 'chase'));
      }

      // Driving mode toggle: 'M'
      if (key === 'm') {
        handleToggleDrivingMode();
      }

      // Controls guide window: 'F1', 'Tab', or '?'
      if (e.key === 'F1' || e.key === 'Tab' || key === '?') {
        setIsControlsOpen((prev) => !prev);
      }

      // Close modal on Escape
      if (e.key === 'Escape') {
        setIsControlsOpen(false);
      }

      // Reset vehicle: 'R'
      if (key === 'r') {
        resetSimulation();
      }

      // Horn: 'H'
      if (key === 'h') {
        soundEngine.setHorn(true);
      }

      // Headlights: 'L'
      if (key === 'l') {
        if (physicsRef.current) {
          const s = physicsRef.current.getState();
          s.headlights = !s.headlights;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowUp' || key === 'w') {
        inputsRef.current.accelerate = false;
      }
      if (e.key === 'ArrowDown' || key === 's') {
        inputsRef.current.brake = false;
      }
      if (e.key === 'ArrowLeft' || key === 'a') {
        inputsRef.current.steerLeft = false;
      }
      if (e.key === 'ArrowRight' || key === 'd') {
        inputsRef.current.steerRight = false;
      }
      if (e.key === ' ') {
        inputsRef.current.handbrake = false;
      }
      if (key === 'h') {
        soundEngine.setHorn(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleToggleDrivingMode, handleToggleEngine, handleToggleTransmission, handleSelectGear, resetSimulation]);

  // Time of Day change
  const handleTimeOfDayChange = (mode: TimeOfDay) => {
    setTimeOfDay(mode);
    worldRef.current?.setTimeOfDay(mode);
  };

  // Sound mute toggle
  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Touch controls handlers
  const handleTouchStart = (action: 'accel' | 'brake' | 'left' | 'right' | 'handbrake') => {
    soundEngine.init();
    soundEngine.resume();
    if (action === 'accel') inputsRef.current.accelerate = true;
    if (action === 'brake') inputsRef.current.brake = true;
    if (action === 'left') inputsRef.current.steerLeft = true;
    if (action === 'right') inputsRef.current.steerRight = true;
    if (action === 'handbrake') inputsRef.current.handbrake = true;
  };

  const handleTouchEnd = (action: 'accel' | 'brake' | 'left' | 'right' | 'handbrake') => {
    if (action === 'accel') inputsRef.current.accelerate = false;
    if (action === 'brake') inputsRef.current.brake = false;
    if (action === 'left') inputsRef.current.steerLeft = false;
    if (action === 'right') inputsRef.current.steerRight = false;
    if (action === 'handbrake') inputsRef.current.handbrake = false;
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className={`absolute inset-0 h-full w-full ${isOrbiting ? 'cursor-grabbing' : 'cursor-default'}`}
      />

      {/* Simulator HUD overlay */}
      <HUD
        vehicleState={vehicleState}
        lapState={lapState}
        cameraView={cameraView}
        timeOfDay={timeOfDay}
        isMuted={isMuted}
        drivingMode={drivingMode}
        isOrbiting={isOrbiting}
        navigationInfo={navigationInfo}
        onShiftUp={() => {
          physicsRef.current?.shiftUp();
          soundEngine.playGearShift();
        }}
        onShiftDown={() => {
          physicsRef.current?.shiftDown();
          soundEngine.playGearShift();
        }}
        onSelectGear={handleSelectGear}
        onToggleEngine={handleToggleEngine}
        onToggleTransmission={handleToggleTransmission}
        onCameraChange={() =>
          setCameraView((prev) => (prev === 'chase' ? 'cockpit' : prev === 'cockpit' ? 'top' : 'chase'))
        }
        onTimeOfDayChange={handleTimeOfDayChange}
        onReset={resetSimulation}
        onToggleMute={handleToggleMute}
        onHorn={(active) => soundEngine.setHorn(active)}
        onOpenControls={() => setIsControlsOpen(true)}
        onToggleDrivingMode={handleToggleDrivingMode}
      />

      {/* Touch & Mobile Controls */}
      <TouchControls
        onInputStart={handleTouchStart}
        onInputEnd={handleTouchEnd}
        onShiftUp={() => physicsRef.current?.shiftUp()}
        onShiftDown={() => physicsRef.current?.shiftDown()}
        onHorn={(active) => soundEngine.setHorn(active)}
      />

      {/* Controls Guide Window / Modal */}
      <ControlsGuideModal
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
        drivingMode={drivingMode}
        onToggleMode={handleToggleDrivingMode}
      />

      {/* Lap Completion Summary Modal */}
      <LapSummaryModal
        isOpen={isModalOpen}
        lapTime={lapState.currentLapTime}
        targetTime={lapState.targetLapTime}
        bestTime={lapState.bestLapTime}
        driftScore={vehicleState.driftScore}
        maxSpeed={maxSpeedReached}
        onRestart={resetSimulation}
      />
    </div>
  );
}
