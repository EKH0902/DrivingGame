export type Gear = 'R' | 'N' | '1' | '2' | '3' | '4' | '5';

export type CameraView = 'cockpit' | 'chase' | 'top';

export interface GearData {
  ratio: number;
  maxSpeed: number; // km/h
  minSpeed: number; // km/h (recommended downshift threshold)
  torqueMultiplier: number;
  optimalRpm: number;
}

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
