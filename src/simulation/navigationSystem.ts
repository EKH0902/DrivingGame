import * as THREE from 'three';
import { TRACK_CURVE } from './trackData';
import { NavigationInfo } from '../types';

// Named landmarks along the circuit for authentic navigation announcements
interface RouteWayPoint {
  u: number;
  name: string;
  instruction: string;
  direction: NavigationInfo['direction'];
  speedLimit: number;
}

const WAYPOINTS: RouteWayPoint[] = [
  { u: 0.0, name: '메트로폴리스 중앙 터미널', instruction: '출발선 직진 후 중앙대로 진입', direction: 'straight', speedLimit: 50 },
  { u: 0.08, name: '중앙대로 교차로', instruction: '남동대로 방면 완만한 우회전', direction: 'slight-right', speedLimit: 45 },
  { u: 0.16, name: '외곽 순환대로 진입로', instruction: '120m 앞 우회전 (순환대로)', direction: 'right', speedLimit: 40 },
  { u: 0.28, name: '금융지구 동부역', instruction: '동부 순환 고속 코스 직진', direction: 'straight', speedLimit: 65 },
  { u: 0.40, name: '북부 순환 고속대로', instruction: '북부 하이웨이 직선 가속 구간', direction: 'straight', speedLimit: 80 },
  { u: 0.52, name: '북서부 외곽 IC', instruction: '완만한 좌회전 (테크 밸리 방면)', direction: 'slight-left', speedLimit: 55 },
  { u: 0.65, name: '테크 밸리 서부대로', instruction: '서부 순환대로 직진 주행', direction: 'straight', speedLimit: 60 },
  { u: 0.76, name: '남부 번화가 진입로', instruction: '100m 앞 좌회전 (도심 재진입)', direction: 'left', speedLimit: 38 },
  { u: 0.86, name: '시청 앞 상업지구', instruction: '시청 앞 2번가 완만한 우회전', direction: 'slight-right', speedLimit: 45 },
  { u: 0.94, name: '중앙 터미널 진입로', instruction: '최종 결승선 진입 (완주 직전)', direction: 'finish', speedLimit: 40 },
];

export class NavigationSystem {
  private static cachedSampleCount = 200;
  private static samples: { u: number; point: THREE.Vector3; tangent: THREE.Vector3 }[] = [];

  static init() {
    if (this.samples.length > 0) return;
    for (let i = 0; i < this.cachedSampleCount; i++) {
      const u = i / this.cachedSampleCount;
      const point = TRACK_CURVE.getPointAt(u);
      const tangent = TRACK_CURVE.getTangentAt(u);
      this.samples.push({ u, point, tangent });
    }
  }

  static getNavigation(busPos: { x: number; y: number; z: number }, busYaw: number): NavigationInfo {
    this.init();

    // 1. Find closest point on track curve
    let bestDistSq = Infinity;
    let bestIndex = 0;

    for (let i = 0; i < this.samples.length; i++) {
      const sp = this.samples[i].point;
      const dx = busPos.x - sp.x;
      const dz = busPos.z - sp.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestIndex = i;
      }
    }

    const currentU = this.samples[bestIndex].u;

    // 2. Find next upcoming waypoint
    let nextWp = WAYPOINTS[0];
    for (let i = 0; i < WAYPOINTS.length; i++) {
      if (WAYPOINTS[i].u > currentU) {
        nextWp = WAYPOINTS[i];
        break;
      }
    }

    // Distance to next waypoint along track curve
    const trackLength = 1850; // meters approx
    let deltaU = nextWp.u - currentU;
    if (deltaU < 0) deltaU += 1.0;
    const nextDistance = Math.max(10, Math.round(deltaU * trackLength));

    // 3. Local curvature analysis 35m ahead for precise turn indicator
    const lookAheadU = (currentU + 0.035) % 1.0;
    const curTan = TRACK_CURVE.getTangentAt(currentU);
    const futureTan = TRACK_CURVE.getTangentAt(lookAheadU);

    // Cross product Y to determine turn direction
    const crossY = curTan.x * futureTan.z - curTan.z * futureTan.x;
    const dot = curTan.x * futureTan.x + curTan.z * futureTan.z;
    const angleDiff = Math.atan2(crossY, dot);

    let direction: NavigationInfo['direction'] = nextWp.direction;
    let instruction = nextWp.instruction;

    if (currentU > 0.93) {
      direction = 'finish';
      instruction = `결승선 (${nextDistance}m 앞)`;
    } else if (Math.abs(angleDiff) > 0.32) {
      direction = angleDiff > 0 ? 'left' : 'right';
      instruction = `${nextDistance}m 앞 ${direction === 'left' ? '급좌회전' : '급우회전'} (${nextWp.name})`;
    } else if (Math.abs(angleDiff) > 0.12) {
      direction = angleDiff > 0 ? 'slight-left' : 'slight-right';
      instruction = `${nextDistance}m 앞 ${direction === 'slight-left' ? '완만한 좌회전' : '완만한 우회전'}`;
    }

    return {
      nextInstruction: instruction,
      nextDistance,
      direction,
      targetSpeedLimit: nextWp.speedLimit,
      routeProgress: currentU,
      destinationName: nextWp.name,
    };
  }
}
