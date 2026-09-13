import * as THREE from 'three';
import { Checkpoint } from '../types';
import { BuildingArchetype, BuildingConfig } from './cityArchitect';

// Circular Grid Metropolis Track Keypoints (~1850m circuit through city grid and outer circular boulevard)
// Designed for ~2 minute lap at bus speeds (40-75 km/h)
export const TRACK_KEYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(0, 0, -25),        // 0: Start / Finish Line at Central Bus Terminal
  new THREE.Vector3(0, 0, 70),         // 1: Central Skyscraper Avenue
  new THREE.Vector3(35, 0, 140),       // 2: Wide turn towards South Boulevard
  new THREE.Vector3(110, 0, 190),      // 3: Approaching Southeast Ring Boulevard
  new THREE.Vector3(195, 0, 185),      // 4: Southeast Outer Ring
  new THREE.Vector3(265, 0, 90),       // 5: East Ring Boulevard (Financial District Station)
  new THREE.Vector3(270, 0, -20),      // 6: East Ring Mid-Section
  new THREE.Vector3(240, 0, -130),     // 7: Northeast Ring Curve
  new THREE.Vector3(160, 0, -210),     // 8: North Ring Entry
  new THREE.Vector3(75, 0, -260),      // 9: North Ring High-Speed Apex (5th Gear Stretch)
  new THREE.Vector3(-60, 0, -260),     // 10: North Ring High-Speed Exit
  new THREE.Vector3(-170, 0, -200),    // 11: Northwest Outer Ring
  new THREE.Vector3(-245, 0, -110),    // 12: West Ring Boulevard (Tech Valley)
  new THREE.Vector3(-265, 0, 10),      // 13: West Ring Mid-Section
  new THREE.Vector3(-230, 0, 130),     // 14: Southwest Ring Curve
  new THREE.Vector3(-160, 0, 190),     // 15: South Ring Avenue Entry
  new THREE.Vector3(-90, 0, 150),      // 16: South Commercial Avenue
  new THREE.Vector3(-80, 0, 60),       // 17: Turning into 2nd Avenue Grid
  new THREE.Vector3(-75, 0, -50),      // 18: City Hall Commercial District
  new THREE.Vector3(-45, 0, -110),     // 19: Pre-Terminal Wide Chicane
  new THREE.Vector3(-10, 0, -75),      // 20: Final gentle turn back to Central Terminal
];

export const TRACK_CURVE = new THREE.CatmullRomCurve3(TRACK_KEYPOINTS, true, 'catmullrom', 0.5);

export const TRACK_WIDTH = 22.0; // meters (넓은 도로폭 - 버스 좌/우회전 최적화)
export const CITY_RADIUS = 320; // Outer radius of the circular metropolis

// Grid network definitions
export const GRID_LINES_X = [-150, -75, 0, 75, 150];
export const GRID_LINES_Z = [-150, -75, 0, 75, 150];
export const GRID_ROAD_WIDTH = 22.0;

export interface CityTreeData {
  position: THREE.Vector3;
  type: 'street' | 'pine';
  hasGrate: boolean;
}

export interface CityStreetlightData {
  position: THREE.Vector3;
  rotationY: number;
}

export interface CityTrafficLightData {
  position: THREE.Vector3;
  rotationY: number;
}

export interface CityFurnitureData {
  benches: { position: THREE.Vector3; rotationY: number }[];
  planters: { position: THREE.Vector3; rotationY: number }[];
  hydrants: { position: THREE.Vector3; rotationY: number }[];
  bollards: { position: THREE.Vector3 }[];
}

export interface TrackDataResult {
  trackLength: number;
  checkpoints: Checkpoint[];
  buildings: BuildingConfig[];
  trees: CityTreeData[];
  furniture: CityFurnitureData;
  streetlights: CityStreetlightData[];
  trafficLights: CityTrafficLightData[];
  busStops: { name: string; position: THREE.Vector3; rotationY: number }[];
  cones: THREE.Vector3[];
}

export function generateTrackData(): TrackDataResult {
  const trackLength = TRACK_CURVE.getLength();
  const checkpoints: Checkpoint[] = [];
  const buildings: BuildingConfig[] = [];
  const trees: CityTreeData[] = [];
  const benches: { position: THREE.Vector3; rotationY: number }[] = [];
  const planters: { position: THREE.Vector3; rotationY: number }[] = [];
  const hydrants: { position: THREE.Vector3; rotationY: number }[] = [];
  const bollards: { position: THREE.Vector3 }[] = [];
  const streetlights: CityStreetlightData[] = [];
  const trafficLights: CityTrafficLightData[] = [];
  const busStops: { name: string; position: THREE.Vector3; rotationY: number }[] = [];
  const cones: THREE.Vector3[] = [];

  // 10 Checkpoints for the 2-minute City Circuit
  const checkpointNames = [
    '시청 중앙 터미널 (Start/Finish)',
    '도심 고층빌딩 대로 (Sector 1)',
    '남동부 원형 순환대로',
    '금융지구 환승역 (Financial Stn)',
    '동북부 순환 고속로 (Sector 2)',
    '북부 순환 고속구간 (5단 주행)',
    '서부 테크밸리 순환로',
    '남부 슬라롬 주행 코스 (Sector 3)',
    '상업지구 사거리 교차로',
    '터미널 진입 최종 시케인'
  ];

  const totalCheckpoints = checkpointNames.length;
  for (let i = 0; i < totalCheckpoints; i++) {
    const u = i / totalCheckpoints;
    const pt = TRACK_CURVE.getPointAt(u);
    checkpoints.push({
      id: i,
      name: checkpointNames[i],
      position: { x: pt.x, z: pt.z },
      radius: 22,
      sector: i < 3 ? 1 : i < 7 ? 2 : 3,
    });
  }

  // Realistic Bright White Architectural Palette (화이트 & 브라이트 도시 디자인)
  const glassColors = [0xffffff, 0xf8fafc, 0xf1f5f9, 0xe0f2fe, 0xbae6fd, 0xffffff];
  const stoneColors = [0xffffff, 0xf8fafc, 0xf1f5f9, 0xfffbeb, 0xfafafa];
  const techColors = [0xffffff, 0xf8fafc, 0xf1f5f9, 0xe2e8f0];
  const accentColors = [0x38bdf8, 0x60a5fa, 0x0284c7, 0xf59e0b, 0x10b981, 0xec4899];

  const buildingSigns = [
    'SAMSUNG CENTER',
    'HYUNDAI TOWER',
    'METRO BANK',
    'FINANCIAL CENTER',
    'NEXUS TECH',
    'GLOBAL COMMERCE',
    'STARBUCKS COFFEE',
    'CENTRAL CITY MALL',
    'SEOUL SKYLINE',
    'TECH INNOVATION',
    'PARK HYATT',
    'SHINHAN TOWER',
    'LOTTE PLAZA',
    'MEGA BOX CINEMA',
    'CITI GROUP',
    'ART GALLERY',
  ];

  let signIdx = 0;
  const archetypesList: BuildingArchetype[] = [
    'curtain_glass',
    'stepped_artdeco',
    'commercial_mall',
    'cylindrical_tower',
    'residential_block',
    'high_tech_truss',
    'boutique_shops',
  ];

  // Grid Blocks: Centers of each grid cell
  const blockCentersX = [-185, -112.5, -37.5, 37.5, 112.5, 185];
  const blockCentersZ = [-185, -112.5, -37.5, 37.5, 112.5, 185];

  let bCounter = 0;

  for (let xi = 0; xi < blockCentersX.length; xi++) {
    const bx = blockCentersX[xi];
    for (let zi = 0; zi < blockCentersZ.length; zi++) {
      const bz = blockCentersZ[zi];
      const distFromCenter = Math.hypot(bx, bz);

      // Block (37.5, -37.5) is reserved as the CENTRAL METROPOLIS PARK (녹지 도심 공원)
      if (Math.abs(bx - 37.5) < 10 && Math.abs(bz - (-37.5)) < 10) {
        // Place park trees, flower planters, and benches in the park
        for (let px = -22; px <= 22; px += 11) {
          for (let pz = -22; pz <= 22; pz += 11) {
            if (Math.abs(px) < 5 && Math.abs(pz) < 5) continue; // central clearing
            const isPine = (px + pz) % 2 === 0;
            trees.push({
              position: new THREE.Vector3(bx + px, 0.05, bz + pz),
              type: isPine ? 'pine' : 'street',
              hasGrate: false,
            });
          }
        }
        // Park Benches
        benches.push(
          { position: new THREE.Vector3(bx - 6, 0.05, bz - 6), rotationY: Math.PI / 4 },
          { position: new THREE.Vector3(bx + 6, 0.05, bz + 6), rotationY: (Math.PI * 5) / 4 },
          { position: new THREE.Vector3(bx - 6, 0.05, bz + 6), rotationY: -Math.PI / 4 },
          { position: new THREE.Vector3(bx + 6, 0.05, bz - 6), rotationY: (Math.PI * 3) / 4 }
        );
        // Central Flower Planters
        planters.push(
          { position: new THREE.Vector3(bx, 0.05, bz - 8), rotationY: 0 },
          { position: new THREE.Vector3(bx, 0.05, bz + 8), rotationY: 0 }
        );
        continue;
      }

      // Check distance from center to keep within city limits
      if (distFromCenter < 275 && (Math.abs(bx) > 18 || Math.abs(bz) > 22)) {
        // In each city block, place 2-3 buildings with high variation:
        // One primary skyscraper/commercial block + one secondary mid/low-rise building!
        const subOffsets = [
          { x: -14, z: -14, weight: 'high' },
          { x: 14, z: 14, weight: 'mid_low' },
        ];

        for (let s = 0; s < subOffsets.length; s++) {
          const off = subOffsets[s];
          const px = bx + off.x;
          const pz = bz + off.z;

          // Check distance to track curve so buildings don't clip the road
          const trackDist = getDistanceToTrackCurve({ x: px, z: pz }).distance;
          if (trackDist < TRACK_WIDTH / 2 + 13) continue;

          bCounter++;
          const archType = archetypesList[bCounter % archetypesList.length];

          // Dynamic Heights based on archetype and location:
          let bHeight = 45;
          let bWidth = 22;
          let bDepth = 22;
          let primaryColor = glassColors[bCounter % glassColors.length];
          const accentColor = accentColors[bCounter % accentColors.length];

          if (archType === 'curtain_glass') {
            bHeight = 85 + (bCounter % 8) * 9; // 85m - 148m
            bWidth = 20 + (bCounter % 5) * 2;
            bDepth = 20 + ((bCounter + 2) % 5) * 2;
            primaryColor = glassColors[bCounter % glassColors.length];
          } else if (archType === 'stepped_artdeco') {
            bHeight = 78 + (bCounter % 7) * 8; // 78m - 126m
            bWidth = 24 + (bCounter % 4) * 2;
            bDepth = 24 + (bCounter % 4) * 2;
            primaryColor = stoneColors[bCounter % stoneColors.length];
          } else if (archType === 'commercial_mall') {
            bHeight = 26 + (bCounter % 4) * 5; // 26m - 41m (wide commercial mall)
            bWidth = 32 + (bCounter % 3) * 3;
            bDepth = 28 + (bCounter % 4) * 2;
            primaryColor = stoneColors[bCounter % stoneColors.length];
          } else if (archType === 'cylindrical_tower') {
            bHeight = 90 + (bCounter % 6) * 8; // 90m - 130m
            bWidth = 22 + (bCounter % 4) * 2;
            bDepth = bWidth;
            primaryColor = glassColors[bCounter % glassColors.length];
          } else if (archType === 'residential_block') {
            bHeight = 48 + (bCounter % 6) * 7; // 48m - 83m
            bWidth = 24 + (bCounter % 4) * 2;
            bDepth = 18 + (bCounter % 3) * 2;
            primaryColor = stoneColors[bCounter % stoneColors.length];
          } else if (archType === 'high_tech_truss') {
            bHeight = 82 + (bCounter % 6) * 8; // 82m - 122m
            bWidth = 22 + (bCounter % 4) * 2;
            bDepth = 22 + (bCounter % 4) * 2;
            primaryColor = techColors[bCounter % techColors.length];
          } else {
            // boutique_shops (Street cafes/shops)
            bHeight = 14 + (bCounter % 3) * 3; // 14m - 20m (low rise creates realistic contrast!)
            bWidth = 18 + (bCounter % 3) * 2;
            bDepth = 18 + (bCounter % 3) * 2;
            primaryColor = stoneColors[bCounter % stoneColors.length];
          }

          const hasHelipad = (archType === 'curtain_glass' || archType === 'cylindrical_tower') && bHeight > 95;
          const hasSpire = (archType === 'stepped_artdeco' || archType === 'high_tech_truss' || archType === 'curtain_glass') && bHeight > 80;
          const sign = (archType === 'commercial_mall' || archType === 'curtain_glass' || archType === 'boutique_shops')
            ? buildingSigns[signIdx++ % buildingSigns.length]
            : undefined;

          buildings.push({
            position: new THREE.Vector3(px, 0, pz),
            width: bWidth,
            depth: bDepth,
            height: bHeight,
            rotationY: ((Math.floor((px + pz) / 25) % 4) * Math.PI) / 2,
            archetype: archType,
            primaryColor,
            accentColor,
            hasHelipad,
            hasSpire,
            signText: sign,
          });
        }
      }
    }
  }

  // Outer Circular Ring Skyscrapers (Distant City Skyline)
  const outerAngles = 36;
  for (let i = 0; i < outerAngles; i++) {
    const angle = (i / outerAngles) * Math.PI * 2;
    const r = 295 + (i % 3) * 14;
    const ox = Math.cos(angle) * r;
    const oz = Math.sin(angle) * r;

    bCounter++;
    const arch = (i % 2 === 0 ? 'curtain_glass' : i % 3 === 0 ? 'stepped_artdeco' : 'cylindrical_tower') as BuildingArchetype;
    const bHeight = 65 + (i % 7) * 12; // 65m - 137m
    const bWidth = 26 + (i % 4) * 3;
    const bDepth = 26 + (i % 3) * 3;

    buildings.push({
      position: new THREE.Vector3(ox, 0, oz),
      width: bWidth,
      depth: bDepth,
      height: bHeight,
      rotationY: angle,
      archetype: arch,
      primaryColor: glassColors[i % glassColors.length],
      accentColor: accentColors[i % accentColors.length],
      hasHelipad: bHeight > 95,
      hasSpire: bHeight > 105,
      signText: i % 4 === 0 ? buildingSigns[signIdx++ % buildingSigns.length] : undefined,
    });
  }

  // -----------------------------------------------------------------
  // Street Trees (가로수) lining the Circuit Track & Grid Avenues
  // -----------------------------------------------------------------
  const treeStep = 18;
  const circuitTreeSamples = 80;
  for (let i = 0; i < circuitTreeSamples; i++) {
    const u = i / circuitTreeSamples;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    // Alternate left and right side on the sidewalk
    const side = (i % 2 === 0) ? 1 : -1;
    const treePos = pt.clone().add(norm.clone().multiplyScalar(side * (TRACK_WIDTH / 2 + 2.8)));

    trees.push({
      position: treePos,
      type: 'street',
      hasGrate: true,
    });

    // Add park benches and planters periodically along the sidewalk
    if (i % 8 === 0) {
      const benchPos = pt.clone().add(norm.clone().multiplyScalar(side * (TRACK_WIDTH / 2 + 4.2)));
      const angle = Math.atan2(tan.x, tan.z);
      benches.push({
        position: benchPos,
        rotationY: angle + (side === 1 ? Math.PI / 2 : -Math.PI / 2),
      });
    }

    if (i % 10 === 0) {
      const planterPos = pt.clone().add(norm.clone().multiplyScalar(-side * (TRACK_WIDTH / 2 + 3.2)));
      const angle = Math.atan2(tan.x, tan.z);
      planters.push({
        position: planterPos,
        rotationY: angle,
      });
    }
  }

  // Trees along Grid Avenues
  for (const gx of GRID_LINES_X) {
    for (let z = -140; z <= 140; z += treeStep) {
      // Don't place on intersections
      const nearIntersection = GRID_LINES_Z.some((gz) => Math.abs(z - gz) < 14);
      if (nearIntersection) continue;

      for (const side of [-1, 1]) {
        trees.push({
          position: new THREE.Vector3(gx + side * (GRID_ROAD_WIDTH / 2 + 2.4), 0.05, z),
          type: 'street',
          hasGrate: true,
        });
      }
    }
  }

  // Safety Bollards & Fire Hydrants at Grid Intersection Corners
  for (const gx of GRID_LINES_X) {
    for (const gz of GRID_LINES_Z) {
      const corner = GRID_ROAD_WIDTH / 2 + 1.2;
      // 4 safety bollards protecting corner crosswalks
      bollards.push(
        { position: new THREE.Vector3(gx + corner, 0.05, gz + corner) },
        { position: new THREE.Vector3(gx - corner, 0.05, gz + corner) },
        { position: new THREE.Vector3(gx + corner, 0.05, gz - corner) },
        { position: new THREE.Vector3(gx - corner, 0.05, gz - corner) }
      );

      // Red fire hydrant on corner
      hydrants.push({
        position: new THREE.Vector3(gx + corner + 1.8, 0.05, gz + corner + 1.8),
        rotationY: Math.PI / 4,
      });
    }
  }

  // Traffic Lights at Grid Intersections
  for (const gx of GRID_LINES_X) {
    for (const gz of GRID_LINES_Z) {
      const cornerOffset = GRID_ROAD_WIDTH / 2 + 2.2;
      trafficLights.push(
        { position: new THREE.Vector3(gx + cornerOffset, 0, gz + cornerOffset), rotationY: Math.PI / 4 },
        { position: new THREE.Vector3(gx - cornerOffset, 0, gz - cornerOffset), rotationY: (Math.PI * 5) / 4 }
      );
    }
  }

  // Streetlights along the Circuit Track
  const lightSamples = 88;
  for (let i = 0; i < lightSamples; i++) {
    const u = i / lightSamples;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const angle = Math.atan2(tan.x, tan.z);

    const side = i % 2 === 0 ? 1 : -1;
    const lightPos = pt.clone().add(norm.clone().multiplyScalar(side * (TRACK_WIDTH / 2 + 3.8)));

    streetlights.push({
      position: lightPos,
      rotationY: angle + (side === 1 ? Math.PI : 0),
    });
  }

  // Bus Stops with Shelters
  // Bus Stop 1: Central Terminal (u=0)
  busStops.push({
    name: '시청 중앙 터미널',
    position: new THREE.Vector3(12, 0, -15),
    rotationY: 0,
  });

  // Bus Stop 2: Financial District (u = 5/20)
  const bs2Pt = TRACK_CURVE.getPointAt(5 / 20);
  busStops.push({
    name: '금융지구 환승센터',
    position: new THREE.Vector3(bs2Pt.x + 8, 0, bs2Pt.z),
    rotationY: Math.PI / 2,
  });

  // Bus Stop 3: Tech Valley (u = 13/20)
  const bs3Pt = TRACK_CURVE.getPointAt(13 / 20);
  busStops.push({
    name: '테크밸리 비즈니스파크',
    position: new THREE.Vector3(bs3Pt.x - 8, 0, bs3Pt.z),
    rotationY: -Math.PI / 2,
  });

  // Slalom Practice Cones
  const slalomStartU = 15.6 / 20;
  const slalomEndU = 16.8 / 20;
  const numCones = 10;
  for (let c = 0; c < numCones; c++) {
    const cu = slalomStartU + (slalomEndU - slalomStartU) * (c / (numCones - 1));
    const cpt = TRACK_CURVE.getPointAt(cu);
    const ctan = TRACK_CURVE.getTangentAt(cu);
    const cnorm = new THREE.Vector3(-ctan.z, 0, ctan.x).normalize();
    const lateralShift = (c % 2 === 0 ? 1 : -1) * 2.8;
    const conePos = cpt.clone().add(cnorm.clone().multiplyScalar(lateralShift));
    cones.push(conePos);
  }

  return {
    trackLength,
    checkpoints,
    buildings,
    trees,
    furniture: { benches, planters, hydrants, bollards },
    streetlights,
    trafficLights,
    busStops,
    cones,
  };
}

// Distance helper to the track curve
function getDistanceToTrackCurve(pos: { x: number; z: number }): { distance: number; closestPoint: THREE.Vector3; u: number } {
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
  for (let step = -4; step <= 4; step++) {
    const u = (closestU + step * (delta / 8) + 1.0) % 1.0;
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
    u: bestU,
  };
}

// General road surface check: returns distance to nearest drivable road (circuit curve OR grid avenues)
export function getDistanceToTrack(pos: { x: number; z: number }): { distance: number; closestPoint: THREE.Vector3; u: number } {
  // 1. Distance to circuit track curve
  const curveInfo = getDistanceToTrackCurve(pos);

  // 2. Check if the vehicle is on any of the city grid streets
  let minDistToGrid = Infinity;
  for (const gx of GRID_LINES_X) {
    if (Math.abs(pos.z) < 220) {
      const dist = Math.abs(pos.x - gx);
      if (dist < minDistToGrid) minDistToGrid = dist;
    }
  }
  for (const gz of GRID_LINES_Z) {
    if (Math.abs(pos.x) < 220) {
      const dist = Math.abs(pos.z - gz);
      if (dist < minDistToGrid) minDistToGrid = dist;
    }
  }

  // If inside grid street corridor, treat as on-road
  if (minDistToGrid < GRID_ROAD_WIDTH / 2) {
    return {
      distance: 0,
      closestPoint: curveInfo.closestPoint,
      u: curveInfo.u,
    };
  }

  return curveInfo;
}

