export type Gear = 'R' | 'N' | '1' | '2' | '3' | '4' | '5';

export type CameraView = 'cockpit' | 'chase' | 'top';

export type DrivingMode = 'normal' | 'race';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface GearData {
  name: string;
  ratio: number;
  maxSpeed: number; // km/h
  minSpeed: number; // km/h (recommended downshift threshold)
  torqueMultiplier: number;
  optimalRpm: number;
}

export const GEAR_CONFIG: Record<Gear, GearData> = {
  'R': { name: '후진 (R)', ratio: -2.8, maxSpeed: -25, minSpeed: 0, torqueMultiplier: 0.85, optimalRpm: 1500 },
  'N': { name: '중립 (N)', ratio: 0, maxSpeed: 0, minSpeed: 0, torqueMultiplier: 0, optimalRpm: 750 },
  '1': { name: '1단 (출발/등판)', ratio: 3.8, maxSpeed: 25, minSpeed: 0, torqueMultiplier: 1.4, optimalRpm: 1700 },
  '2': { name: '2단 (시내 가속)', ratio: 2.3, maxSpeed: 45, minSpeed: 10, torqueMultiplier: 1.1, optimalRpm: 1750 },
  '3': { name: '3단 (일반 주행)', ratio: 1.5, maxSpeed: 65, minSpeed: 25, torqueMultiplier: 0.85, optimalRpm: 1800 },
  '4': { name: '4단 (고속 진입)', ratio: 1.0, maxSpeed: 85, minSpeed: 45, torqueMultiplier: 0.65, optimalRpm: 1850 },
  '5': { name: '5단 (고속 순환)', ratio: 0.75, maxSpeed: 115, minSpeed: 65, torqueMultiplier: 0.50, optimalRpm: 1900 },
};

export interface VehicleState {
  speed: number; // km/h (positive = forward, negative = reverse)
  velocity: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation: number; // heading angle in radians (yaw)
  steeringAngle: number; // current front wheel angle in radians
  gear: Gear;
  rpm: number; // 600 - 2800 RPM
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  handbrake: boolean;
  driftFactor: number; // 0 to 1
  driftAngle: number; // degrees
  driftScore: number;
  drivingMode: DrivingMode;
  comfortScore: number;
  isDrifting: boolean;
  isBraking: boolean;
  isReversing: boolean;
  isOffroad: boolean;
  engineStalled: boolean;
  gearShiftCooldown: number;
  distanceTraveled: number;
  headlights: boolean;
  hazardLights: boolean;
  leftSignal: boolean;
  rightSignal: boolean;
  horn: boolean;
  isEngineRunning: boolean;
  isManualTransmission: boolean;
}

export type NavDirection = 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'sharp-left' | 'sharp-right' | 'u-turn' | 'finish';

export interface NavigationInfo {
  nextInstruction: string;
  nextDistance: number; // meters to primary waypoint
  direction: NavDirection;
  targetSpeedLimit: number; // km/h
  currentRoadName: string; // e.g. "중앙대로 (시청 방면)"
  nextRoadName: string; // e.g. "동부 순환 고속대로"
  routeProgress: number; // 0 to 1
  totalRemainingDistance: number; // meters remaining on lap
  estimatedTimeRemaining: number; // seconds
  destinationName: string;
  recommendedLane: number; // 1, 2, or 3
  totalLanes: number; // typically 3
  isOverSpeed: boolean;
  secondNextInstruction?: string;
  secondNextDirection?: NavDirection;
  secondNextDistance?: number;
}

export interface Checkpoint {
  id: number;
  name: string;
  position: { x: number; z: number };
  radius: number;
  sector: number;
}

export interface LapState {
  currentLap: number;
  currentSector: number;
  lapStartTime: number;
  currentLapTime: number;
  bestLapTime: number | null;
  sectorTimes: number[];
  checkpointsPassed: Set<number>;
  totalCheckpoints: number;
  isCompleted: boolean;
  targetLapTime: number; // ~120 seconds (2 mins)
}

export interface DrivingAdvice {
  id: string;
  type: 'info' | 'gear' | 'warning' | 'success';
  message: string;
  timestamp: number;
}
