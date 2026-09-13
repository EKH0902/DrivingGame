import React, { useEffect, useRef } from 'react';
import { CameraView, Gear, LapState, TimeOfDay, VehicleState, GEAR_CONFIG, DrivingMode, NavigationInfo } from '../types';
import { TRACK_KEYPOINTS } from '../simulation/trackData';
import {
  Compass,
  Gauge,
  HelpCircle,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  Zap,
  MousePointer,
  Power,
  Navigation,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  ArrowUpLeft,
  ArrowUpRight,
  Flag,
  Settings2,
} from 'lucide-react';

interface HUDProps {
  vehicleState: VehicleState;
  lapState: LapState;
  cameraView: CameraView;
  timeOfDay: TimeOfDay;
  isMuted: boolean;
  drivingMode: DrivingMode;
  isOrbiting?: boolean;
  navigationInfo: NavigationInfo;
  onShiftUp: () => void;
  onShiftDown: () => void;
  onSelectGear: (gear: Gear) => void;
  onToggleEngine: () => void;
  onToggleTransmission: () => void;
  onCameraChange: () => void;
  onTimeOfDayChange: (t: TimeOfDay) => void;
  onReset: () => void;
  onToggleMute: () => void;
  onHorn: (active: boolean) => void;
  onOpenControls: () => void;
  onToggleDrivingMode: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  vehicleState,
  lapState,
  cameraView,
  timeOfDay,
  isMuted,
  drivingMode,
  isOrbiting,
  navigationInfo,
  onShiftUp,
  onShiftDown,
  onSelectGear,
  onToggleEngine,
  onToggleTransmission,
  onCameraChange,
  onTimeOfDayChange,
  onReset,
  onToggleMute,
  onHorn,
  onOpenControls,
  onToggleDrivingMode,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const speed = Math.round(Math.abs(vehicleState.speed));
  const rpm = Math.round(vehicleState.rpm);
  const gear = vehicleState.gear;
  const steerDeg = Math.round(vehicleState.steeringAngle * 57.3);

  // Shift recommendation logic
  const gearInfo = GEAR_CONFIG[gear];
  const needsUpShift =
    vehicleState.isEngineRunning &&
    (gear === '1' || gear === '2' || gear === '3' || gear === '4') &&
    rpm > 2350;
  const needsDownShift =
    vehicleState.isEngineRunning &&
    (gear === '2' || gear === '3' || gear === '4' || gear === '5') &&
    rpm < 1100 &&
    vehicleState.speed < gearInfo.minSpeed + 5;

  // Format lap time
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  // Speedometer needle angle (0 to 120 km/h maps to -125deg to 125deg)
  const speedRatio = Math.min(1.0, speed / 120);
  const speedNeedleDeg = -125 + speedRatio * 250;

  // Tachometer needle angle (0 to 3000 RPM maps to -125deg to 125deg)
  const rpmRatio = Math.min(1.0, rpm / 3000);
  const rpmNeedleDeg = -125 + rpmRatio * 250;

  // Render Minimap
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Track bounds mapping
    const minX = -360;
    const maxX = 540;
    const minZ = -440;
    const maxZ = 560;

    const mapX = (x: number) => 12 + ((x - minX) / (maxX - minX)) * (w - 24);
    const mapZ = (z: number) => 12 + ((z - minZ) / (maxZ - minZ)) * (h - 24);

    // Draw background track ribbon
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < TRACK_KEYPOINTS.length; i++) {
      const pt = TRACK_KEYPOINTS[i];
      const mx = mapX(pt.x);
      const mz = mapZ(pt.z);
      if (i === 0) ctx.moveTo(mx, mz);
      else ctx.lineTo(mx, mz);
    }
    ctx.closePath();
    ctx.stroke();

    // Road center line
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw Start/Finish Line
    const startPt = TRACK_KEYPOINTS[0];
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(mapX(startPt.x), mapZ(startPt.z), 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw Bus position & heading arrow
    const busMx = mapX(vehicleState.position.x);
    const busMz = mapZ(vehicleState.position.z);

    ctx.save();
    ctx.translate(busMx, busMz);
    ctx.rotate(vehicleState.rotation);

    // Bus rectangle
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillRect(-3.5, -7, 7, 14);

    // Front indicator
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -8, 4, 2);
    ctx.restore();
  }, [vehicleState.position, vehicleState.rotation]);

  const gearsList: Gear[] = ['R', 'N', '1', '2', '3', '4', '5'];

  // Navigation Direction Icon Helper
  const renderNavIcon = () => {
    switch (navigationInfo.direction) {
      case 'left':
        return <CornerUpLeft className="h-6 w-6 text-sky-300 animate-pulse" />;
      case 'right':
        return <CornerUpRight className="h-6 w-6 text-sky-300 animate-pulse" />;
      case 'slight-left':
        return <ArrowUpLeft className="h-6 w-6 text-sky-300" />;
      case 'slight-right':
        return <ArrowUpRight className="h-6 w-6 text-sky-300" />;
      case 'finish':
        return <Flag className="h-6 w-6 text-emerald-400 animate-bounce" />;
      default:
        return <ArrowUp className="h-6 w-6 text-emerald-400" />;
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 text-white select-none">
      {/* Top Header Bar: Lap Times, Navigation & System Controls */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: Lap Timer & Record info */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-2.5 backdrop-blur-md border border-slate-700/60 shadow-lg">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-slate-400">CURRENT LAP</span>
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/30">
                목표 02:00
              </span>
            </div>
            <span className="font-mono text-2xl font-bold tracking-tight text-sky-400">
              {formatTime(lapState.currentLapTime)}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
              <span>최고:</span>
              <span className="font-mono text-amber-400 font-semibold">
                {lapState.bestLapTime ? formatTime(lapState.bestLapTime) : '--:--.--'}
              </span>
            </div>
          </div>

          <div className="h-9 w-px bg-slate-800" />

          {/* Sector Checkpoints Indicator */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-slate-400">체크포인트</span>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: lapState.totalCheckpoints }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    lapState.checkpointsPassed.has(i)
                      ? 'bg-sky-400 shadow-sm shadow-sky-400 scale-110'
                      : 'bg-slate-700/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center: Live Navigation Guidance Banner (내비게이션) */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-2 border border-sky-500/40 shadow-xl backdrop-blur-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30">
              {renderNavIcon()}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  코스 내비게이션
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                  권장 {navigationInfo.targetSpeedLimit} km/h
                </span>
              </div>
              <span className="text-sm font-bold text-slate-100">
                {navigationInfo.nextInstruction}
              </span>
            </div>
          </div>

          {/* Route Progress bar */}
          <div className="w-56 h-1 bg-slate-800/80 rounded-full mt-1.5 overflow-hidden border border-slate-700/40">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.round(navigationInfo.routeProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Engine Ignition, Camera, Sound & Retry controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-slate-900/85 p-1.5 backdrop-blur-md border border-slate-700/60 shadow-lg">
          {/* Engine Start/Stop Ignition Button */}
          <button
            id="hud-engine-toggle-btn"
            onClick={onToggleEngine}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 border ${
              vehicleState.isEngineRunning
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-rose-500/30 border-rose-500 text-rose-300 hover:bg-rose-500/40 animate-pulse'
            }`}
            title="엔진 시동 온/오프 [I]"
          >
            <Power className="h-4 w-4" />
            <span>{vehicleState.isEngineRunning ? '시동 ON' : '시동 걸기'}</span>
            <kbd className="rounded bg-slate-800/80 px-1 py-0.5 text-[10px] font-mono text-slate-300">I</kbd>
          </button>

          {/* Manual Transmission Toggle */}
          <button
            id="hud-transmission-toggle-btn"
            onClick={onToggleTransmission}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition active:scale-95 border ${
              vehicleState.isManualTransmission
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="수동/자동 변속기 전환 [T]"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>{vehicleState.isManualTransmission ? '수동(Manual)' : '자동(Auto)'}</span>
          </button>

          {/* Controls Guide Window Button */}
          <button
            id="hud-controls-btn"
            onClick={onOpenControls}
            className="flex items-center gap-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 px-2 py-1.5 text-xs font-bold text-sky-300 hover:bg-sky-500/30 active:scale-95 transition"
            title="조작법 창 열기 (F1 / Tab)"
          >
            <Keyboard className="h-4 w-4" />
            <span className="hidden sm:inline">조작법</span>
          </button>

          {/* Camera View Switcher */}
          <button
            id="hud-camera-toggle-btn"
            onClick={onCameraChange}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition active:scale-95 border ${
              cameraView === 'cockpit'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'text-slate-200 border-transparent hover:bg-slate-800'
            }`}
            title="시점 변경 [C] (1인칭 운전석 / 3인칭 추적 / 탑뷰)"
          >
            <Compass className="h-4 w-4 text-sky-400" />
            <span className="hidden sm:inline">
              {cameraView === 'cockpit' ? '1인칭' : cameraView === 'chase' ? '3인칭' : '탑뷰'}
            </span>
            <kbd className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-mono text-slate-400">C</kbd>
          </button>

          {/* Time of Day Switcher */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5">
            <button
              onClick={() => onTimeOfDayChange('day')}
              className={`rounded p-1 transition ${timeOfDay === 'day' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
              title="주간 (Day)"
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('sunset')}
              className={`rounded p-1 transition ${timeOfDay === 'sunset' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="노을 (Sunset)"
            >
              <Sunset className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onTimeOfDayChange('night')}
              className={`rounded p-1 transition ${timeOfDay === 'night' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              title="야간 (Night)"
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`rounded-lg p-2 transition ${isMuted ? 'text-rose-400 hover:bg-slate-800' : 'text-slate-300 hover:bg-slate-800'}`}
            title="사운드 온/오프"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Reset position & retry button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-300 bg-rose-950/40 border border-rose-800 hover:bg-rose-900/60 active:scale-95 transition"
            title="출발선 재배치 및 다시시도 [R]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>다시시도</span>
            <kbd className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-mono text-slate-400">R</kbd>
          </button>
        </div>
      </div>

      {/* Center Screen: Engine OFF or Warnings Alerts */}
      <div className="self-center flex flex-col items-center gap-2">
        {!vehicleState.isEngineRunning && (
          <div className="animate-bounce pointer-events-auto flex items-center gap-3 rounded-2xl bg-rose-900/90 border border-rose-500 px-5 py-2.5 text-white shadow-2xl backdrop-blur-md">
            <Power className="h-5 w-5 text-rose-300" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">엔진 시동 꺼짐</span>
              <span className="text-xs text-rose-200">[I] 키를 누르거나 시동 걸기 버튼을 클릭하세요</span>
            </div>
            <button
              onClick={onToggleEngine}
              className="rounded-xl bg-white text-slate-950 font-bold px-3 py-1.5 text-xs hover:bg-rose-100 active:scale-95 transition"
            >
              시동 켜기
            </button>
          </div>
        )}

        {vehicleState.isEngineRunning && vehicleState.gear === 'N' && speed < 1 && (
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-amber-950/80 border border-amber-500/60 px-4 py-1.5 text-amber-200 text-xs font-bold shadow-lg backdrop-blur-sm">
            <span>중립(N) 상태입니다. 주행하려면</span>
            <kbd className="rounded bg-amber-500 text-slate-950 px-1.5 py-0.5 font-mono text-xs">E</kbd>
            <span>를 눌러 1단 기어를 넣으세요!</span>
          </div>
        )}

        {needsUpShift && (
          <div className="animate-pulse flex items-center gap-2 rounded-lg bg-sky-500/90 px-3 py-1 font-bold text-slate-950 shadow-md border border-sky-300">
            <span>▲ 기어 올리기 (변속 권장)</span>
            <kbd className="rounded bg-slate-950/30 px-1.5 py-0.5 text-xs font-mono text-white">E</kbd>
          </div>
        )}

        {needsDownShift && (
          <div className="animate-pulse flex items-center gap-2 rounded-lg bg-rose-500/90 px-3 py-1 font-bold text-white shadow-md border border-rose-300">
            <span>▼ 기어 내리기 (저속)</span>
            <kbd className="rounded bg-slate-950/30 px-1.5 py-0.5 text-xs font-mono text-white">Q</kbd>
          </div>
        )}

        {vehicleState.isOffroad && (
          <div className="rounded bg-amber-600/90 px-3 py-1 text-xs font-bold text-white shadow">
            ⚠️ 도로 이탈 (감속 및 그립 저하)
          </div>
        )}
      </div>

      {/* Bottom Control & Gauges Dashboard */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
        {/* Left Bottom: Mini-Map Circuit Radar */}
        <div className="pointer-events-auto relative rounded-2xl bg-slate-900/85 p-2 backdrop-blur-md border border-slate-700/60 shadow-xl">
          <canvas ref={minimapCanvasRef} width={130} height={130} className="rounded-xl bg-slate-950/70" />
          <div className="absolute top-3 left-3 text-[9px] font-bold tracking-wider text-slate-400">
            2-MIN CIRCUIT RADAR
          </div>
          <div className="absolute bottom-3 right-3 text-[9px] font-semibold text-sky-400">
            {vehicleState.distanceTraveled > 0 ? `${(vehicleState.distanceTraveled / 1000).toFixed(1)} km` : '0.0 km'}
          </div>
        </div>

        {/* Center Bottom: 5-Speed Manual Gearbox Bar & Quick Shift Controls */}
        <div className="pointer-events-auto flex flex-col items-center rounded-2xl bg-slate-900/90 px-4 py-2.5 backdrop-blur-md border border-slate-700/70 shadow-2xl">
          <div className="flex items-center justify-between w-full mb-1.5">
            <span className="text-[10px] font-bold tracking-wider text-slate-400">
              {vehicleState.isManualTransmission ? '수동 변속기 (클릭 또는 Q/E 변속)' : '자동 변속기'}
            </span>
            <span className="text-[10px] font-semibold text-sky-400">
              {GEAR_CONFIG[gear].name}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Quick Shift Down Button (Q) */}
            <button
              onClick={onShiftDown}
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 px-2.5 py-2 text-xs font-bold text-slate-200 border border-slate-600 transition"
              title="기어 내리기 [Q]"
            >
              <kbd className="rounded bg-slate-950 px-1.5 py-0.5 text-xs font-mono text-sky-400">Q</kbd>
              <span>DOWN</span>
            </button>

            {/* Gear Selector Slots - Clickable to directly engage gear in manual mode */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {gearsList.map((g) => {
                const isActive = gear === g;
                return (
                  <button
                    key={g}
                    onClick={() => onSelectGear(g)}
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg font-mono text-sm font-black transition-all ${
                      isActive
                        ? g === 'R'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/50 scale-110'
                          : g === 'N'
                          ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/50 scale-110'
                          : 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/50 scale-110'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                    }`}
                    title={`${g}단 기어 선택`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            {/* Quick Shift Up Button (E) */}
            <button
              onClick={onShiftUp}
              className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 px-2.5 py-2 text-xs font-bold text-slate-200 border border-slate-600 transition"
              title="기어 올리기 [E]"
            >
              <span>UP</span>
              <kbd className="rounded bg-slate-950 px-1.5 py-0.5 text-xs font-mono text-sky-400">E</kbd>
            </button>
          </div>

          {/* Key Hints Footer */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-slate-300">↑ / W</kbd> 엑셀 가속
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-slate-300">↓ / S</kbd> 브레이크
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-slate-300">← → / A D</kbd> 좌우 조향
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-slate-300">I</kbd> 시동
            </span>
          </div>
        </div>

        {/* Right Bottom: Dual Analog Gauges (Speedometer & Tachometer) */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-slate-900/90 p-3 backdrop-blur-md border border-slate-700/70 shadow-2xl">
          {/* Tachometer (RPM 0 - 3000) */}
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 flex-col items-center justify-center rounded-full bg-slate-950 border border-slate-800 shadow-inner">
            <div className="absolute inset-1 rounded-full border border-slate-800/80" />
            <div
              className="absolute h-10 sm:h-12 w-1 bg-amber-400 origin-bottom transition-transform duration-75"
              style={{
                bottom: '50%',
                transform: `rotate(${rpmNeedleDeg}deg)`,
                borderRadius: '2px 2px 0 0',
              }}
            />
            <div className="z-10 flex flex-col items-center">
              <span className="font-mono text-base sm:text-lg font-black text-white">{rpm}</span>
              <span className="text-[9px] font-bold text-slate-400">RPM ×1000</span>
            </div>
          </div>

          {/* Speedometer (0 - 120 km/h) */}
          <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full bg-slate-950 border-2 border-sky-500/40 shadow-inner">
            <div className="absolute inset-1.5 rounded-full border border-slate-800" />
            <div
              className="absolute h-12 sm:h-14 w-1 bg-sky-400 origin-bottom transition-transform duration-75"
              style={{
                bottom: '50%',
                transform: `rotate(${speedNeedleDeg}deg)`,
                borderRadius: '2px 2px 0 0',
              }}
            />
            <div className="z-10 flex flex-col items-center">
              <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                {speed}
              </span>
              <span className="text-[10px] font-bold text-sky-400">KM / H</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
