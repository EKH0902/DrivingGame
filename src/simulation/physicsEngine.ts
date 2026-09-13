import { Gear, VehicleState, GEAR_CONFIG, DrivingMode } from '../types';
import { getDistanceToTrack, TRACK_WIDTH } from './trackData';
import { soundEngine } from '../audio/soundEngine';

export interface ControlInputs {
  accelerate: boolean;
  brake: boolean;
  steerLeft: boolean;
  steerRight: boolean;
  handbrake: boolean;
}

const GEAR_SEQUENCE: Gear[] = ['R', 'N', '1', '2', '3', '4', '5'];

export class BusPhysicsEngine {
  private state: VehicleState;
  private airBrakeSoundCooldown = 0;
  private shiftCooldownTimer = 0;
  private currentSlip = 0;
  private lateralSpeed = 0;

  constructor(initialPosition = { x: 0, y: 0.7, z: 0 }, initialRotation = 0) {
    this.state = {
      speed: 0,
      velocity: { x: 0, y: 0, z: 0 },
      position: { ...initialPosition },
      rotation: initialRotation,
      steeringAngle: 0,
      gear: '1', // Start in 1st gear ready to drive
      rpm: 750,
      throttle: 0,
      brake: 0,
      handbrake: false,
      driftFactor: 0,
      driftAngle: 0,
      driftScore: 0,
      drivingMode: 'normal',
      comfortScore: 100,
      isDrifting: false,
      isBraking: false,
      isReversing: false,
      isOffroad: false,
      engineStalled: false,
      gearShiftCooldown: 0,
      distanceTraveled: 0,
      headlights: true,
      hazardLights: false,
      leftSignal: false,
      rightSignal: false,
      horn: false,
      isEngineRunning: false, // Starts OFF as requested ("시동걸기도 만들어줘")
      isManualTransmission: true, // Manual transmission by default as requested ("기어도 수동기어야")
    };
  }

  public getState(): VehicleState {
    return this.state;
  }

  public toggleEngine(): boolean {
    if (this.state.isEngineRunning) {
      this.state.isEngineRunning = false;
      soundEngine.playEngineStop();
    } else {
      this.state.isEngineRunning = true;
      this.state.rpm = 750;
      soundEngine.playEngineStart();
    }
    return this.state.isEngineRunning;
  }

  public setEngineRunning(running: boolean) {
    this.state.isEngineRunning = running;
    if (running) {
      this.state.rpm = 750;
      soundEngine.playEngineStart();
    } else {
      soundEngine.playEngineStop();
    }
  }

  public toggleTransmission(): boolean {
    this.state.isManualTransmission = !this.state.isManualTransmission;
    return this.state.isManualTransmission;
  }

  public setDrivingMode(mode: DrivingMode) {
    this.state.drivingMode = mode;
    if (mode === 'normal') {
      this.currentSlip = 0;
      this.lateralSpeed = 0;
      this.state.isDrifting = false;
      this.state.driftFactor = 0;
    }
  }

  public toggleDrivingMode(): DrivingMode {
    const nextMode: DrivingMode = this.state.drivingMode === 'normal' ? 'race' : 'normal';
    this.setDrivingMode(nextMode);
    return nextMode;
  }

  public getDrivingMode(): DrivingMode {
    return this.state.drivingMode;
  }

  public shiftUp(): boolean {
    if (this.shiftCooldownTimer > 0) return false;
    const currentIndex = GEAR_SEQUENCE.indexOf(this.state.gear);
    if (currentIndex < GEAR_SEQUENCE.length - 1) {
      this.state.gear = GEAR_SEQUENCE[currentIndex + 1];
      this.shiftCooldownTimer = 0.22;
      this.state.gearShiftCooldown = 0.22;
      soundEngine.playGearShift();
      return true;
    }
    return false;
  }

  public shiftDown(): boolean {
    if (this.shiftCooldownTimer > 0) return false;
    const currentIndex = GEAR_SEQUENCE.indexOf(this.state.gear);
    if (currentIndex > 0) {
      this.state.gear = GEAR_SEQUENCE[currentIndex - 1];
      this.shiftCooldownTimer = 0.22;
      this.state.gearShiftCooldown = 0.22;
      soundEngine.playGearShift();
      return true;
    }
    return false;
  }

  public setGear(gear: Gear) {
    if (this.state.gear !== gear) {
      this.state.gear = gear;
      soundEngine.playGearShift();
    }
  }

  public reset(position = { x: 0, y: 0.7, z: 0 }, rotation = 0) {
    this.state.speed = 0;
    this.state.velocity = { x: 0, y: 0, z: 0 };
    this.state.position = { ...position };
    this.state.rotation = rotation;
    this.state.steeringAngle = 0;
    this.state.gear = '1';
    this.state.rpm = 850;
    this.state.throttle = 0;
    this.state.brake = 0;
    this.state.driftFactor = 0;
    this.state.driftAngle = 0;
    this.state.comfortScore = 100;
    this.state.isDrifting = false;
    this.state.isBraking = false;
    this.state.isOffroad = false;
    this.state.engineStalled = false;
    this.lateralSpeed = 0;
    this.currentSlip = 0;
  }

  public update(dt: number, inputs: ControlInputs): VehicleState {
    const delta = Math.min(dt, 0.1);

    if (this.shiftCooldownTimer > 0) {
      this.shiftCooldownTimer -= delta;
      this.state.gearShiftCooldown = Math.max(0, this.shiftCooldownTimer);
    }
    if (this.airBrakeSoundCooldown > 0) {
      this.airBrakeSoundCooldown -= delta;
    }

    // 1. Engine Ignition & Transmission Handling
    let targetThrottle = 0;
    let targetBrake = inputs.handbrake ? 0.9 : 0;
    const currentSpeed = this.state.speed;

    if (!this.state.isEngineRunning) {
      // Engine is OFF: no propulsion, only braking or rolling friction
      targetThrottle = 0;
      if (inputs.brake || inputs.handbrake) {
        targetBrake = 1.0;
      }
    } else if (this.state.isManualTransmission) {
      // PURE MANUAL TRANSMISSION (수동 기어):
      // Gears: 'R', 'N', '1', '2', '3', '4', '5'
      // Driver shifts gears manually using E (Up) / Q (Down) or clicking gear on HUD
      if (inputs.accelerate) {
        targetThrottle = 1.0;
      }
      if (inputs.brake) {
        targetBrake = 1.0;
      }
    } else {
      // Automatic Mode (Fallback toggleable)
      if (inputs.accelerate && !inputs.brake) {
        if (this.state.gear === 'R' || currentSpeed < -0.8) {
          targetBrake = 1.0;
          targetThrottle = 0;
          if (Math.abs(currentSpeed) < 1.0) {
            this.setGear('1');
          }
        } else {
          if (this.state.gear === 'N') this.setGear('1');
          targetThrottle = 1.0;
          if (this.state.gear === '1' && currentSpeed > 17) this.setGear('2');
          else if (this.state.gear === '2' && currentSpeed > 34) this.setGear('3');
          else if (this.state.gear === '3' && currentSpeed > 52) this.setGear('4');
          else if (this.state.gear === '4' && currentSpeed > 70) this.setGear('5');
        }
      } else if (inputs.brake && !inputs.accelerate) {
        if (currentSpeed > 1.2) {
          targetBrake = 1.0;
          targetThrottle = 0;
          if (this.state.gear === '5' && currentSpeed < 58) this.setGear('4');
          else if (this.state.gear === '4' && currentSpeed < 42) this.setGear('3');
          else if (this.state.gear === '3' && currentSpeed < 26) this.setGear('2');
          else if (this.state.gear === '2' && currentSpeed < 13) this.setGear('1');
        } else {
          if (this.state.gear !== 'R') this.setGear('R');
          targetThrottle = 1.0;
          targetBrake = 0;
        }
      } else {
        targetThrottle = 0;
        if (inputs.handbrake) targetBrake = 1.0;
      }
    }

    this.state.throttle += (targetThrottle - this.state.throttle) * Math.min(1.0, delta * 10.0);
    this.state.brake += (targetBrake - this.state.brake) * Math.min(1.0, delta * 14.0);
    this.state.handbrake = inputs.handbrake;
    this.state.isBraking = this.state.brake > 0.15;

    // Air brake sound when brake pedal pressed firmly
    if (inputs.brake && this.state.speed > 5 && this.airBrakeSoundCooldown <= 0) {
      soundEngine.playAirBrake();
      this.airBrakeSoundCooldown = 1.4;
    }

    // 2. Road surface check (Drivable asphalt vs. Offroad sidewalk/grass)
    const trackInfo = getDistanceToTrack(this.state.position);
    const halfWidth = TRACK_WIDTH / 2;
    this.state.isOffroad = trackInfo.distance > halfWidth + 1.2;

    const surfaceGrip = this.state.isOffroad ? 0.6 : 1.0;
    const surfaceDrag = this.state.isOffroad ? 1.9 : 1.0;

    // 3. Intuitive & Responsive Steering System
    // Left input (← / A) -> Steers LEFT
    // Right input (→ / D) -> Steers RIGHT
    const currentSpeedKmh = Math.abs(this.state.speed);
    const speedRatio = Math.min(1.0, currentSpeedKmh / 85.0);
    const maxSteer = 0.54 - speedRatio * 0.36; // 31° at crawl, 10° at 85 km/h
    const steerSpeed = 3.4; // Steering turn-in rate (rad/s)
    const returnSpeed = 5.0; // Swift, natural self-centering rate

    if (inputs.steerLeft && !inputs.steerRight) {
      // Turn Left: steering angle increases towards positive steer
      this.state.steeringAngle = Math.min(maxSteer, this.state.steeringAngle + steerSpeed * delta);
    } else if (inputs.steerRight && !inputs.steerLeft) {
      // Turn Right: steering angle decreases towards negative steer
      this.state.steeringAngle = Math.max(-maxSteer, this.state.steeringAngle - steerSpeed * delta);
    } else {
      // Auto-center steering smoothly
      if (Math.abs(this.state.steeringAngle) < returnSpeed * delta) {
        this.state.steeringAngle = 0;
      } else {
        this.state.steeringAngle -= Math.sign(this.state.steeringAngle) * returnSpeed * delta;
      }
    }

    // 4. Transmission & Engine Powertrain Physics
    const gearInfo = GEAR_CONFIG[this.state.gear];
    const idleRpm = 750;
    const maxRpm = this.state.drivingMode === 'race' ? 3100 : 2750;

    let driveForce = 0; // In km/h per second

    if (this.state.gear === 'N') {
      const targetRpm = idleRpm + this.state.throttle * 1900;
      this.state.rpm += (targetRpm - this.state.rpm) * Math.min(1.0, delta * 7.0);
      driveForce = 0;
    } else if (this.state.gear === 'R') {
      const speedInGearRatio = Math.min(1.0, Math.max(0, -this.state.speed / 25.0));
      const targetRpm = idleRpm + Math.max(this.state.throttle * 1200, speedInGearRatio * 1800);
      this.state.rpm += (targetRpm - this.state.rpm) * Math.min(1.0, delta * 8.0);
      if (this.state.speed > -25) {
        driveForce = -15.0 * gearInfo.torqueMultiplier * this.state.throttle;
      }
    } else {
      // Forward gears 1 to 5
      const maxSpeedInGear = this.state.drivingMode === 'race' ? gearInfo.maxSpeed * 1.12 : gearInfo.maxSpeed;
      const speedInGearRatio = Math.max(0, this.state.speed / maxSpeedInGear);

      const gearRpm = idleRpm + speedInGearRatio * (maxRpm - idleRpm);
      const targetRpm = Math.min(maxRpm, Math.max(idleRpm, gearRpm + this.state.throttle * 300));
      this.state.rpm += (targetRpm - this.state.rpm) * Math.min(1.0, delta * 9.0);

      // Torque curve
      let rpmTorqueCurve = 1.0;
      if (this.state.rpm < 1100 && this.state.speed < gearInfo.minSpeed) {
        rpmTorqueCurve = 0.48 + (this.state.rpm / 1100) * 0.4;
      } else if (this.state.rpm > 2500) {
        rpmTorqueCurve = Math.max(0.2, (maxRpm - this.state.rpm) / 300.0);
      }

      if (this.state.speed < maxSpeedInGear) {
        const baseBusAccel = this.state.drivingMode === 'race' ? 21.0 : 16.5;
        driveForce = baseBusAccel * gearInfo.torqueMultiplier * rpmTorqueCurve * this.state.throttle;
      }
    }

    // 5. Resistance & Braking
    const airDrag = 0.0006 * this.state.speed * Math.abs(this.state.speed);
    const rollingDrag = (0.35 * surfaceDrag) * Math.sign(this.state.speed);

    let engineBraking = 0;
    if (this.state.gear !== 'N' && this.state.throttle < 0.1 && Math.abs(this.state.speed) > 2) {
      engineBraking = 2.4 * (gearInfo.ratio > 0 ? gearInfo.ratio * 0.5 : 1.0) * Math.sign(this.state.speed);
    }

    let brakeForce = 0;
    if (this.state.brake > 0.05 && Math.abs(this.state.speed) > 0.1) {
      const brakePower = 35.0 * surfaceGrip;
      brakeForce = brakePower * this.state.brake * Math.sign(this.state.speed);
    }
    if (this.state.handbrake && Math.abs(this.state.speed) > 0.1) {
      brakeForce += 24.0 * surfaceGrip * Math.sign(this.state.speed);
    }

    const netAccel = driveForce - airDrag - rollingDrag - engineBraking - brakeForce;
    const oldSpeed = this.state.speed;
    this.state.speed += netAccel * delta;

    if (oldSpeed > 0 && this.state.speed < 0 && !inputs.accelerate && this.state.gear !== 'R') {
      this.state.speed = 0;
    } else if (oldSpeed < 0 && this.state.speed > 0 && !inputs.accelerate && this.state.gear === 'R') {
      this.state.speed = 0;
    }

    this.state.isReversing = this.state.speed < -0.5;

    // 6. Turning Dynamics & Modes (Normal Bus vs Race Mode)
    const wheelbase = 5.6; // Heavy commercial bus wheelbase (meters)
    const speedMs = (this.state.speed * 1000) / 3600;

    // Responsive low-speed turning assist so turning while starting or backing up responds immediately
    let effectiveTurnSpeed = speedMs;
    if (Math.abs(speedMs) < 2.0 && (inputs.steerLeft || inputs.steerRight)) {
      if (inputs.accelerate || inputs.brake) {
        const directionSign = this.state.gear === 'R' ? -1 : 1;
        effectiveTurnSpeed = directionSign * 2.5;
      }
    }

    // Turning velocity: Inverted to match coordinate system so steerLeft unambiguously turns LEFT and steerRight turns RIGHT
    const angularVelocity = (effectiveTurnSpeed / wheelbase) * Math.tan(this.state.steeringAngle);
    const lateralG = Math.abs(speedMs * angularVelocity) / 9.81;

    if (this.state.drivingMode === 'normal') {
      // NORMAL BUS DRIVING MODE:
      // Electronic Stability Program (ESP) & Anti-Lock Braking (ABS)
      // Bus stays completely stable and composed without wild spinning or violent drifts
      this.currentSlip = 0;
      this.state.driftFactor = 0;
      this.state.isDrifting = false;
      this.lateralSpeed *= Math.max(0, 1.0 - delta * 8.0);
      this.state.driftAngle = 0;

      // Pure Ackerman turning without tail slide
      this.state.rotation += angularVelocity * delta;

      // Passenger comfort scoring: penalize harsh jerky braking (>0.5G) or violent cornering
      if (lateralG > 0.45 || (this.state.brake > 0.8 && Math.abs(this.state.speed) > 40)) {
        this.state.comfortScore = Math.max(60, this.state.comfortScore - delta * 8);
      } else {
        this.state.comfortScore = Math.min(100, this.state.comfortScore + delta * 2);
      }
    } else {
      // RACE / DRIFT MODE:
      // ESP disengaged, allowing controlled drifts with handbrake and throttle-oversteer
      const driftThresholdG = inputs.handbrake ? 0.22 : (this.state.isOffroad ? 0.32 : 0.55);
      const isExceedingGrip = lateralG > driftThresholdG && Math.abs(this.state.speed) > 20;

      if (isExceedingGrip || (inputs.handbrake && Math.abs(this.state.speed) > 15)) {
        const slipTarget = Math.min(1.0, (lateralG - driftThresholdG) * 1.4 + (inputs.handbrake ? 0.65 : 0.0));
        this.currentSlip += (slipTarget - this.currentSlip) * Math.min(1.0, delta * 4.5);
      } else {
        this.currentSlip += (0 - this.currentSlip) * Math.min(1.0, delta * 3.8);
      }

      this.state.driftFactor = Math.max(0, Math.min(1.0, this.currentSlip));
      this.state.isDrifting = this.state.driftFactor > 0.25 && Math.abs(this.state.speed) > 18;

      const yawMultiplier = 1.0 + this.state.driftFactor * 0.8;
      this.state.rotation += angularVelocity * yawMultiplier * delta;

      if (this.state.isDrifting) {
        const slipDir = Math.sign(this.state.steeringAngle || 1);
        this.lateralSpeed += (slipDir * speedMs * 0.32 * this.state.driftFactor - this.lateralSpeed) * delta * 4;
        this.state.driftAngle = Math.min(55, Math.abs(this.state.steeringAngle * 57.3 * (1 + this.state.driftFactor * 1.6)));
        this.state.driftScore += Math.round(this.state.driftAngle * (Math.abs(this.state.speed) / 20) * delta * 12);
      } else {
        this.lateralSpeed *= Math.max(0, 1.0 - delta * 6.0);
        this.state.driftAngle *= Math.max(0, 1.0 - delta * 5.0);
      }
    }

    // 7. Update Position
    const forwardVec = { x: Math.sin(this.state.rotation), z: Math.cos(this.state.rotation) };
    const rightVec = { x: Math.cos(this.state.rotation), z: -Math.sin(this.state.rotation) };

    const moveX = (forwardVec.x * speedMs + rightVec.x * this.lateralSpeed) * delta;
    const moveZ = (forwardVec.z * speedMs + rightVec.z * this.lateralSpeed) * delta;

    this.state.position.x += moveX;
    this.state.position.z += moveZ;
    this.state.distanceTraveled += Math.sqrt(moveX * moveX + moveZ * moveZ);

    this.state.velocity.x = moveX / delta;
    this.state.velocity.z = moveZ / delta;

    // 8. Update Audio
    soundEngine.updateEngine(this.state.rpm, this.state.throttle, this.state.speed);
    soundEngine.updateTireScreech(this.state.driftFactor, this.state.speed);

    return this.state;
  }
}
