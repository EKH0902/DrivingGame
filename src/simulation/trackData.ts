import * as THREE from 'three';
import { Checkpoint } from '../types';

// Spline keypoints defining a ~1750 meter circuit loop designed for ~2 minute lap at bus speeds (40-80 km/h)
export const TRACK_KEYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),        // 0: Start / Finish Line
  new THREE.Vector3(120, 0, -20),     // 1: Main Straightaway
  new THREE.Vector3(260, 0, -30),     // 2: End of Main Straight
  new THREE.Vector3(380, 0, -10),     // 3: Approaching Park sweeper
  new THREE.Vector3(470, 0, 60),      // 4: Park Entrance Curve
  new THREE.Vector3(500, 0, 180),     // 5: Bus Stop 1 (중앙공원역)
  new THREE.Vector3(460, 0, 300),     // 6: S-Curve Entry
  new THREE.Vector3(350, 0, 370),     // 7: S-Curve Middle
  new THREE.Vector3(220, 0, 350),     // 8: S-Curve Exit
  new THREE.Vector3(120, 0, 420),     // 9: Hairpin Entry
  new THREE.Vector3(30, 0, 520),      // 10: Hairpin Apex 1 (Drift Zone)
  new THREE.Vector3(-80, 0, 500),     // 11: Hairpin Apex 2 (Drift Zone)
  new THREE.Vector3(-140, 0, 390),    // 12: Hairpin Exit / Downtown approach
  new THREE.Vector3(-180, 0, 240),    // 13: Downtown Avenue (City Hall)
  new THREE.Vector3(-190, 0, 80),     // 14: Bus Stop 2 (시청 환승역)
  new THREE.Vector3(-240, 0, -70),    // 15: Slalom Cone Practice Zone
  new THREE.Vector3(-310, 0, -190),   // 16: Slalom Exit
  new THREE.Vector3(-260, 0, -320),   // 17: High Speed Highway Curve 1
  new THREE.Vector3(-120, 0, -390),   // 18: High Speed Highway Apex (5th gear)
  new THREE.Vector3(60, 0, -360),     // 19: High Speed Highway Exit
  new THREE.Vector3(180, 0, -260),    // 20: Pre-Chicane
  new THREE.Vector3(100, 0, -140),    // 21: Chicane turn
  new THREE.Vector3(-40, 0, -50),     // 22: Final turn onto home straight
];

export const TRACK_CURVE = new THREE.CatmullRomCurve3(TRACK_KEYPOINTS, true, 'catmullrom', 0.5);

export const TRACK_WIDTH = 13.5; // meters (wide enough for 2 lanes + bus margin)
export const ROAD_RESOLUTION = 240; // sampling steps along circuit

export interface TrackDecorItem {
  type: 'building' | 'tree' | 'light' | 'busStop' | 'cone' | 'barrier' | 'sign';
  position: THREE.Vector3;
  rotationY: number;
  scale?: THREE.Vector3;
  extra?: string;
}

export interface TrackDataResult {
  trackLength: number;
  checkpoints: Checkpoint[];
  decorations: TrackDecorItem[];
  busStops: { name: string; position: THREE.Vector3; rotationY: number }[];
  cones: THREE.Vector3[];
}

export function generateTrackData(): TrackDataResult {
  const trackLength = TRACK_CURVE.getLength();
  const checkpoints: Checkpoint[] = [];
  const decorations: TrackDecorItem[] = [];
  const busStops: { name: string; position: THREE.Vector3; rotationY: number }[] = [];
  const cones: THREE.Vector3[] = [];

  // Setup 10 checkpoints around the loop
  const checkpointNames = [
    '출발선 (Start/Finish)',
    '제1 가속구간 (Sector 1)',
    '중앙공원 버스정류장',
    '연속 S자 커브 진입',
    '헤어핀 드리프트 코너 (Sector 2)',
    '도심 상업지구 대로',
    '시청앞 환승정류장',
    '슬라롬 콘 주행 연습존 (Sector 3)',
    '외곽 고속 순환로 (5단 가속)',
    '최종 시케인 코너'
  ];

  const totalCheckpoints = checkpointNames.length;
  for (let i = 0; i < totalCheckpoints; i++) {
    const u = i / totalCheckpoints;
    const pt = TRACK_CURVE.getPointAt(u);
    checkpoints.push({
      id: i,
      name: checkpointNames[i],
      position: { x: pt.x, z: pt.z },
      radius: 20,
      sector: i < 3 ? 1 : i < 7 ? 2 : 3
    });
  }

  // Generate trackside items along the curve
  const sampleCount = 140;
  for (let i = 0; i < sampleCount; i++) {
    const u = i / sampleCount;
    const pt = TRACK_CURVE.getPointAt(u);
    const tangent = TRACK_CURVE.getTangentAt(u);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const angle = Math.atan2(tangent.x, tangent.z);

    // Street lights alternately on left and right
    if (i % 3 === 0) {
      const side = (i % 6 === 0) ? 1 : -1;
      const lightPos = pt.clone().add(normal.clone().multiplyScalar(side * (TRACK_WIDTH / 2 + 2.5)));
      decorations.push({
        type: 'light',
        position: lightPos,
        rotationY: angle + (side === 1 ? Math.PI : 0)
      });
    }

    // Trees alongside track
    if (i % 2 === 0) {
      const side = (i % 4 === 0) ? 1 : -1;
      const offsetDist = TRACK_WIDTH / 2 + 4 + (Math.sin(i * 13) * 2);
      const treePos = pt.clone().add(normal.clone().multiplyScalar(side * offsetDist));
      decorations.push({
        type: 'tree',
        position: treePos,
        rotationY: Math.random() * Math.PI * 2,
        scale: new THREE.Vector3(1 + Math.sin(i) * 0.2, 1 + Math.cos(i) * 0.2, 1 + Math.sin(i) * 0.2)
      });
    }

    // Traffic signs at key spots
    if (i === 5 || i === 25 || i === 45 || i === 70 || i === 95 || i === 115) {
      const signPos = pt.clone().add(normal.clone().multiplyScalar(TRACK_WIDTH / 2 + 2));
      let signText = 'SPEED 60';
      if (i === 45) signText = 'DRIFT ZONE';
      if (i === 25 || i === 70) signText = 'BUS STOP';
      if (i === 95) signText = 'SLALOM';
      decorations.push({
        type: 'sign',
        position: signPos,
        rotationY: angle + Math.PI / 2,
        extra: signText
      });
    }
  }

  // Bus Stop 1: Around index 5 (near Central Park)
  const busStop1Pt = TRACK_CURVE.getPointAt(5 / 23);
  const busStop1Tan = TRACK_CURVE.getTangentAt(5 / 23);
  const busStop1Norm = new THREE.Vector3(-busStop1Tan.z, 0, busStop1Tan.x).normalize();
  const busStop1Pos = busStop1Pt.clone().add(busStop1Norm.clone().multiplyScalar(TRACK_WIDTH / 2 + 3.2));
  busStops.push({
    name: '중앙공원역 (Central Park)',
    position: busStop1Pos,
    rotationY: Math.atan2(busStop1Tan.x, busStop1Tan.z)
  });
  decorations.push({
    type: 'busStop',
    position: busStop1Pos,
    rotationY: Math.atan2(busStop1Tan.x, busStop1Tan.z),
    extra: '중앙공원역'
  });

  // Bus Stop 2: Around index 14 (City Hall)
  const busStop2Pt = TRACK_CURVE.getPointAt(14 / 23);
  const busStop2Tan = TRACK_CURVE.getTangentAt(14 / 23);
  const busStop2Norm = new THREE.Vector3(-busStop2Tan.z, 0, busStop2Tan.x).normalize();
  const busStop2Pos = busStop2Pt.clone().add(busStop2Norm.clone().multiplyScalar(TRACK_WIDTH / 2 + 3.2));
  busStops.push({
    name: '시청앞 광장 (City Hall)',
    position: busStop2Pos,
    rotationY: Math.atan2(busStop2Tan.x, busStop2Tan.z)
  });
  decorations.push({
    type: 'busStop',
    position: busStop2Pos,
    rotationY: Math.atan2(busStop2Tan.x, busStop2Tan.z),
    extra: '시청앞 광장'
  });

  // Slalom Cone Zone: Between keypoint 15 and 16
  const slalomStartU = 15 / 23;
  const slalomEndU = 16.2 / 23;
  const numCones = 10;
  for (let c = 0; c < numCones; c++) {
    const cu = slalomStartU + (slalomEndU - slalomStartU) * (c / (numCones - 1));
    const cpt = TRACK_CURVE.getPointAt(cu);
    const ctan = TRACK_CURVE.getTangentAt(cu);
    const cnorm = new THREE.Vector3(-ctan.z, 0, ctan.x).normalize();
    // Alternating left/center/right slalom pattern
    const lateralShift = (c % 2 === 0 ? 1 : -1) * 2.8;
    const conePos = cpt.clone().add(cnorm.clone().multiplyScalar(lateralShift));
    cones.push(conePos);
    decorations.push({
      type: 'cone',
      position: conePos,
      rotationY: 0
    });
  }

  // City buildings clustered around downtown section (u between 0.45 and 0.65)
  for (let b = 0; b < 24; b++) {
    const bu = 0.45 + (b / 24) * 0.20;
    const bpt = TRACK_CURVE.getPointAt(bu);
    const btan = TRACK_CURVE.getTangentAt(bu);
    const bnorm = new THREE.Vector3(-btan.z, 0, btan.x).normalize();
    const side = (b % 2 === 0 ? 1 : -1);
    const bPos = bpt.clone().add(bnorm.clone().multiplyScalar(side * (TRACK_WIDTH / 2 + 14 + (b % 3) * 6)));
    decorations.push({
      type: 'building',
      position: bPos,
      rotationY: Math.atan2(btan.x, btan.z),
      scale: new THREE.Vector3(14 + (b % 4) * 4, 25 + (b % 5) * 12, 14 + (b % 3) * 5)
    });
  }

  return {
    trackLength,
    checkpoints,
    decorations,
    busStops,
    cones
  };
}

// Distance to track centerline helper for offroad detection
export function getDistanceToTrack(pos: { x: number; z: number }): { distance: number; closestPoint: THREE.Vector3; u: number } {
  // Approximate by testing samples along the curve
  let minDistanceSq = Infinity;
  let closestU = 0;
  const samples = 80;
  const testVec = new THREE.Vector3(pos.x, 0, pos.z);

  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const pt = TRACK_CURVE.getPointAt(u);
    const dSq = testVec.distanceToSquared(pt);
    if (dSq < minDistanceSq) {
      minDistanceSq = dSq;
      closestU = u;
    }
  }

  // Local fine search
  const delta = 1 / samples;
  let bestU = closestU;
  for (let step = -5; step <= 5; step++) {
    const u = (closestU + step * (delta / 10) + 1.0) % 1.0;
    const pt = TRACK_CURVE.getPointAt(u);
    const dSq = testVec.distanceToSquared(pt);
    if (dSq < minDistanceSq) {
      minDistanceSq = dSq;
      bestU = u;
    }
  }

  const closestPoint = TRACK_CURVE.getPointAt(bestU);
  return {
    distance: Math.sqrt(minDistanceSq),
    closestPoint,
    u: bestU
  };
}
