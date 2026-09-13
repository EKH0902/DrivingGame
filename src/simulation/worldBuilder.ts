import * as THREE from 'three';
import { TRACK_CURVE, TRACK_WIDTH, generateTrackData, GRID_LINES_X, GRID_LINES_Z, GRID_ROAD_WIDTH, TrackDataResult } from './trackData';
import { TimeOfDay } from '../types';
import { createDetailedBuilding } from './cityArchitect';
import {
  createStreetTree,
  createPineTree,
  createParkBench,
  createFlowerPlanter,
  createFireHydrant,
  createBollard,
} from './urbanNature';

export interface WorldObjects {
  scene: THREE.Scene;
  sunLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  checkpointMeshes: THREE.Mesh[];
  roadMesh: THREE.Mesh;
  trackData: TrackDataResult;
  setTimeOfDay: (mode: TimeOfDay) => void;
  updateCheckpoints: (activeCheckpointId: number) => void;
}

export function buildWorld(scene: THREE.Scene): WorldObjects {
  const trackData = generateTrackData();

  // 1. Environmental Lighting (브라이트 화이트 데이라이트 조명)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 1.15);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.85);
  sunLight.position.set(160, 240, 120);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 750;
  const shadowRange = 260;
  sunLight.shadow.camera.left = -shadowRange;
  sunLight.shadow.camera.right = shadowRange;
  sunLight.shadow.camera.top = shadowRange;
  sunLight.shadow.camera.bottom = -shadowRange;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Soft ambient fill - bright white
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  // Atmospheric fog - clean bright white sky
  scene.fog = new THREE.FogExp2(0xf0f7ff, 0.0010);

  // 2. City Plaza Base & Sidewalk Pavements (화이트 대리석 도심 광장 & 보도)
  // Circular city ground base
  const cityGroundGeo = new THREE.CircleGeometry(330, 64);
  const cityGroundMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Clean brilliant white/pearl granite plaza
    roughness: 0.8,
    metalness: 0.05,
  });
  const cityGround = new THREE.Mesh(cityGroundGeo, cityGroundMat);
  cityGround.rotation.x = -Math.PI / 2;
  cityGround.position.y = 0.01;
  cityGround.receiveShadow = true;
  scene.add(cityGround);

  // Central Metropolis Park Green Lawn & Plaza (도심 녹지 공원)
  const parkLawnGeo = new THREE.PlaneGeometry(58, 58);
  const parkLawnMat = new THREE.MeshStandardMaterial({
    color: 0x4ade80, // Bright fresh park lawn green
    roughness: 0.85,
  });
  const parkLawn = new THREE.Mesh(parkLawnGeo, parkLawnMat);
  parkLawn.rotation.x = -Math.PI / 2;
  parkLawn.position.set(37.5, 0.03, -37.5);
  parkLawn.receiveShadow = true;
  scene.add(parkLawn);

  // Park Stone Pathway Cross
  const parkPathMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Clean white marble pathway
    roughness: 0.7,
  });
  const parkPath1 = new THREE.Mesh(new THREE.PlaneGeometry(58, 5), parkPathMat);
  parkPath1.rotation.x = -Math.PI / 2;
  parkPath1.position.set(37.5, 0.035, -37.5);
  scene.add(parkPath1);

  const parkPath2 = new THREE.Mesh(new THREE.PlaneGeometry(5, 58), parkPathMat);
  parkPath2.rotation.x = -Math.PI / 2;
  parkPath2.position.set(37.5, 0.035, -37.5);
  scene.add(parkPath2);

  // Raised Sidewalk Curbs along Grid Street Edges (깔끔한 화이트 연석)
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
  for (const gx of GRID_LINES_X) {
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 430), curbMat);
      curb.position.set(gx + side * (GRID_ROAD_WIDTH / 2 + 0.15), 0.075, 0);
      curb.receiveShadow = true;
      scene.add(curb);
    }
  }
  for (const gz of GRID_LINES_Z) {
    for (const side of [-1, 1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(430, 0.15, 0.3), curbMat);
      curb.position.set(0, 0.075, gz + side * (GRID_ROAD_WIDTH / 2 + 0.15));
      curb.receiveShadow = true;
      scene.add(curb);
    }
  }

  // Surrounding outer terrain
  const outerGroundGeo = new THREE.PlaneGeometry(1600, 1600, 32, 32);
  const outerGroundMat = new THREE.MeshStandardMaterial({
    color: 0x86efac, // Fresh bright green meadow outside city
    roughness: 0.9,
  });
  const outerGround = new THREE.Mesh(outerGroundGeo, outerGroundMat);
  outerGround.rotation.x = -Math.PI / 2;
  outerGround.position.y = -0.02;
  outerGround.receiveShadow = true;
  scene.add(outerGround);

  // Distant City Skyline Ring Backdrop (밝고 화사한 화이트 스카이라인 실루엣)
  const distantRingGeo = new THREE.CylinderGeometry(560, 640, 140, 48, 1, true);
  const distantRingMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.7,
    side: THREE.BackSide,
  });
  const distantSkyline = new THREE.Mesh(distantRingGeo, distantRingMat);
  distantSkyline.position.y = 60;
  scene.add(distantSkyline);

  // 3. Grid Streets Network (차도 파란색 포장 + 중앙선 & 차선 마킹 완비)
  // Procedural Grid Road Canvas Texture (중앙선: 복선 황색선, 차선: 백색 점선, 가장자리: 백색 실선)
  const gridCanvas = document.createElement('canvas');
  gridCanvas.width = 512;
  gridCanvas.height = 1024;
  const gctx = gridCanvas.getContext('2d');
  if (gctx) {
    // Blue asphalt base
    gctx.fillStyle = '#1d4ed8'; // Vibrant Transit Blue
    gctx.fillRect(0, 0, 512, 1024);

    // Subtle road grain
    for (let i = 0; i < 3000; i++) {
      gctx.fillStyle = Math.random() > 0.5 ? '#2563eb' : '#1e40af';
      gctx.fillRect(Math.random() * 512, Math.random() * 1024, 2, 2);
    }

    // Outer edge solid white lines (가장자리 백색 실선)
    gctx.fillStyle = '#ffffff';
    gctx.fillRect(14, 0, 8, 1024);
    gctx.fillRect(512 - 22, 0, 8, 1024);

    // Center Double Solid Yellow Lines (선명한 황색 복선 중앙선)
    gctx.fillStyle = '#fbbf24'; // Bright Amber Yellow
    gctx.fillRect(256 - 8, 0, 6, 1024);
    gctx.fillRect(256 + 2, 0, 6, 1024);

    // White Dashed Lane Dividers (백색 점선 차선)
    gctx.fillStyle = '#f8fafc';
    for (let y = 0; y < 1024; y += 80) {
      gctx.fillRect(130, y, 6, 46); // Left direction lane divider
      gctx.fillRect(382, y, 6, 46); // Right direction lane divider
    }
  }

  const gridRoadTex = new THREE.CanvasTexture(gridCanvas);
  gridRoadTex.wrapS = THREE.RepeatWrapping;
  gridRoadTex.wrapT = THREE.RepeatWrapping;
  gridRoadTex.repeat.set(1, 20);

  const gridRoadMat = new THREE.MeshStandardMaterial({
    map: gridRoadTex,
    roughness: 0.82,
    metalness: 0.12,
  });

  // North-South Avenues
  for (const gx of GRID_LINES_X) {
    const avenueGeo = new THREE.PlaneGeometry(GRID_ROAD_WIDTH, 440);
    const avenue = new THREE.Mesh(avenueGeo, gridRoadMat);
    avenue.rotation.x = -Math.PI / 2;
    avenue.position.set(gx, 0.02, 0);
    avenue.receiveShadow = true;
    scene.add(avenue);
  }

  // East-West Streets (Texture rotated 90 degrees for perpendicular street)
  const gridRoadTexEW = gridRoadTex.clone();
  gridRoadTexEW.needsUpdate = true;
  const gridRoadMatEW = new THREE.MeshStandardMaterial({
    map: gridRoadTexEW,
    roughness: 0.82,
    metalness: 0.12,
  });

  for (const gz of GRID_LINES_Z) {
    const streetGeo = new THREE.PlaneGeometry(440, GRID_ROAD_WIDTH);
    const street = new THREE.Mesh(streetGeo, gridRoadMatEW);
    street.rotation.x = -Math.PI / 2;
    street.rotation.z = Math.PI / 2;
    street.position.set(0, 0.022, gz);
    street.receiveShadow = true;
    scene.add(street);
  }

  // Outer Circular Boulevard Ring (원형 순환 대로: r=254 to r=280 - 넓은 26m 광폭 대로)
  const ringRoadMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.82,
    metalness: 0.12,
  });
  const ringRoadGeo = new THREE.RingGeometry(254, 280, 72);
  const ringRoad = new THREE.Mesh(ringRoadGeo, ringRoadMat);
  ringRoad.rotation.x = -Math.PI / 2;
  ringRoad.position.y = 0.025;
  ringRoad.receiveShadow = true;
  scene.add(ringRoad);

  // Ring road center yellow median line
  const ringYellowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const ringYellow1 = new THREE.Mesh(new THREE.RingGeometry(266.6, 267.0, 72), ringYellowMat);
  ringYellow1.rotation.x = -Math.PI / 2;
  ringYellow1.position.y = 0.028;
  scene.add(ringYellow1);

  const ringYellow2 = new THREE.Mesh(new THREE.RingGeometry(267.4, 267.8, 72), ringYellowMat);
  ringYellow2.rotation.x = -Math.PI / 2;
  ringYellow2.position.y = 0.028;
  scene.add(ringYellow2);

  // Crosswalks (횡단보도) at intersections - 파란색 차도 위 선명한 화이트 줄무늬
  const crosswalkCanvas = document.createElement('canvas');
  crosswalkCanvas.width = 128;
  crosswalkCanvas.height = 32;
  const cwctx = crosswalkCanvas.getContext('2d');
  if (cwctx) {
    cwctx.fillStyle = '#1d4ed8'; // 파란색 차도 배경
    cwctx.fillRect(0, 0, 128, 32);
    cwctx.fillStyle = '#ffffff';
    for (let x = 4; x < 128; x += 16) {
      cwctx.fillRect(x, 2, 8, 28);
    }
  }
  const crosswalkTex = new THREE.CanvasTexture(crosswalkCanvas);
  const crosswalkMat = new THREE.MeshBasicMaterial({ map: crosswalkTex, transparent: true });

  for (const gx of GRID_LINES_X) {
    for (const gz of GRID_LINES_Z) {
      const offsets = [
        { x: gx, z: gz + GRID_ROAD_WIDTH / 2 + 2, rot: 0 },
        { x: gx, z: gz - GRID_ROAD_WIDTH / 2 - 2, rot: 0 },
        { x: gx + GRID_ROAD_WIDTH / 2 + 2, z: gz, rot: Math.PI / 2 },
        { x: gx - GRID_ROAD_WIDTH / 2 - 2, z: gz, rot: Math.PI / 2 },
      ];
      for (const off of offsets) {
        const cw = new THREE.Mesh(new THREE.PlaneGeometry(GRID_ROAD_WIDTH - 1, 3.2), crosswalkMat);
        cw.rotation.x = -Math.PI / 2;
        cw.rotation.z = off.rot;
        cw.position.set(off.x, 0.035, off.z);
        scene.add(cw);
      }
    }
  }

  // 4. Extruded Bus Circuit Road Ribbon along CatmullRom Curve
  const numSteps = 420;
  const roadPositions: number[] = [];
  const roadNormals: number[] = [];
  const roadUvs: number[] = [];
  const roadIndices: number[] = [];

  const halfW = TRACK_WIDTH / 2;

  for (let i = 0; i <= numSteps; i++) {
    const u = (i % numSteps) / numSteps;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    const leftX = pt.x + norm.x * halfW;
    const leftZ = pt.z + norm.z * halfW;
    const rightX = pt.x - norm.x * halfW;
    const rightZ = pt.z - norm.z * halfW;

    roadPositions.push(leftX, 0.045, leftZ);
    roadPositions.push(rightX, 0.045, rightZ);

    roadNormals.push(0, 1, 0);
    roadNormals.push(0, 1, 0);

    const vCoord = i * 0.8;
    roadUvs.push(0, vCoord);
    roadUvs.push(1, vCoord);
  }

  for (let i = 0; i < numSteps; i++) {
    const i0 = i * 2;
    const i1 = i0 + 1;
    const i2 = (i + 1) * 2;
    const i3 = i2 + 1;

    roadIndices.push(i0, i1, i2);
    roadIndices.push(i1, i3, i2);
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
  roadGeo.setIndex(roadIndices);

  // Procedural Circuit Road Texture Canvas (파란색 버스 전용 차도 포장)
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 1024;
  const rctx = roadCanvas.getContext('2d');
  if (rctx) {
    // 차도 파란색 베이스 포장
    rctx.fillStyle = '#1d4ed8'; // Vivid Blue Roadway
    rctx.fillRect(0, 0, 512, 1024);

    // Blue asphalt granular texture
    for (let s = 0; s < 4500; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 1024;
      rctx.fillStyle = Math.random() > 0.5 ? '#2563eb' : '#1e40af';
      rctx.fillRect(sx, sy, 2, 2);
    }

    // Crisp white roadway edge curbs
    rctx.fillStyle = '#ffffff';
    rctx.fillRect(16, 0, 8, 1024);
    rctx.fillRect(512 - 24, 0, 8, 1024);

    // Bus priority lane cyan accent
    rctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    rctx.fillRect(360, 0, 130, 1024);
    rctx.fillStyle = '#67e8f9';
    rctx.fillRect(356, 0, 5, 1024);

    // Vivid yellow center dual median line (황색 복선 중앙선)
    rctx.fillStyle = '#fbbf24';
    rctx.fillRect(256 - 8, 0, 6, 1024);
    rctx.fillRect(256 + 2, 0, 6, 1024);

    // White dashed lane divider - Left & Right directions (백색 점선 차선)
    rctx.fillStyle = '#f8fafc';
    for (let y = 0; y < 1024; y += 80) {
      rctx.fillRect(130, y, 6, 46);
      rctx.fillRect(382, y, 6, 46);
    }
  }

  const roadTex = new THREE.CanvasTexture(roadCanvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;
  roadTex.repeat.set(1, 36);

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.85,
    metalness: 0.1,
  });

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  // 4B. 3D In-World Navigation Route Guide Ribbon (길을 따라가는 내비게이션 유도 라인)
  // Generates a glowing luminous cyan guide ribbon running down the bus's designated driving lane
  const navPositions: number[] = [];
  const navIndices: number[] = [];
  const navSteps = 300;
  const navRibbonHalfW = 0.8; // 1.6m wide glowing navigation ribbon
  const laneOffset = 4.8; // positioned in right driving lane

  for (let i = 0; i <= navSteps; i++) {
    const u = (i % navSteps) / navSteps;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

    // Center of designated bus driving lane
    const laneCenter = pt.clone().add(norm.clone().multiplyScalar(laneOffset));

    const leftX = laneCenter.x + norm.x * navRibbonHalfW;
    const leftZ = laneCenter.z + norm.z * navRibbonHalfW;
    const rightX = laneCenter.x - norm.x * navRibbonHalfW;
    const rightZ = laneCenter.z - norm.z * navRibbonHalfW;

    navPositions.push(leftX, 0.065, leftZ);
    navPositions.push(rightX, 0.065, rightZ);
  }

  for (let i = 0; i < navSteps; i++) {
    const i0 = i * 2;
    const i1 = i0 + 1;
    const i2 = (i + 1) * 2;
    const i3 = i2 + 1;
    navIndices.push(i0, i1, i2);
    navIndices.push(i1, i3, i2);
  }

  const navGeo = new THREE.BufferGeometry();
  navGeo.setAttribute('position', new THREE.Float32BufferAttribute(navPositions, 3));
  navGeo.setIndex(navIndices);

  const navMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4, // Cyan navigation guide line
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const navRibbonMesh = new THREE.Mesh(navGeo, navMat);
  scene.add(navRibbonMesh);

  // Spaced glowing chevron navigation arrows pointing forward along the path
  const arrowGeo = new THREE.ConeGeometry(0.7, 1.6, 3);
  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  for (let i = 0; i < navSteps; i += 8) {
    const u = i / navSteps;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const laneCenter = pt.clone().add(norm.clone().multiplyScalar(laneOffset));

    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.set(laneCenter.x, 0.08, laneCenter.z);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.atan2(-tan.x, tan.z);
    scene.add(arrow);
  }

  // 5. Red and White Corner Rumble Curbs along sharp corners
  const curbGeo = new THREE.BoxGeometry(0.8, 0.15, 2.2);
  const curbMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
  const curbMatWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });

  for (let i = 0; i < numSteps; i += 3) {
    const u = i / numSteps;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const angle = Math.atan2(tan.x, tan.z);

    const side = (i % 6 === 0) ? 1 : -1;
    const curbPos = pt.clone().add(norm.clone().multiplyScalar(side * (halfW + 0.4)));
    const curb = new THREE.Mesh(curbGeo, (i / 3) % 2 === 0 ? curbMatRed : curbMatWhite);
    curb.position.set(curbPos.x, 0.075, curbPos.z);
    curb.rotation.y = angle;
    curb.receiveShadow = true;
    scene.add(curb);
  }

  // 6. Start / Finish Line Overhead Gantry
  const startPt = TRACK_CURVE.getPointAt(0);
  const startTan = TRACK_CURVE.getTangentAt(0);
  const startNorm = new THREE.Vector3(-startTan.z, 0, startTan.x).normalize();
  const startAngle = Math.atan2(startTan.x, startTan.z);

  const finishCanvas = document.createElement('canvas');
  finishCanvas.width = 512;
  finishCanvas.height = 64;
  const fctx = finishCanvas.getContext('2d');
  if (fctx) {
    const cols = 16;
    const rows = 4;
    const cw = 512 / cols;
    const ch = 64 / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        fctx.fillStyle = (c + r) % 2 === 0 ? '#ffffff' : '#111111';
        fctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }
  }
  const finishTex = new THREE.CanvasTexture(finishCanvas);
  const finishStrip = new THREE.Mesh(new THREE.PlaneGeometry(TRACK_WIDTH, 2.6), new THREE.MeshBasicMaterial({ map: finishTex }));
  finishStrip.rotation.x = -Math.PI / 2;
  finishStrip.rotation.z = startAngle + Math.PI / 2;
  finishStrip.position.set(startPt.x, 0.055, startPt.z);
  scene.add(finishStrip);

  const gantryPillarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.25 });

  for (const side of [1, -1]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9.5), gantryPillarMat);
    const pos = startPt.clone().add(startNorm.clone().multiplyScalar(side * (halfW + 2.5)));
    pillar.position.set(pos.x, 4.75, pos.z);
    pillar.castShadow = true;
    scene.add(pillar);
  }

  const overheadBeam = new THREE.Mesh(new THREE.BoxGeometry(TRACK_WIDTH + 6.5, 0.9, 1.4), gantryPillarMat);
  overheadBeam.position.set(startPt.x, 8.8, startPt.z);
  overheadBeam.rotation.y = startAngle;
  overheadBeam.castShadow = true;
  scene.add(overheadBeam);

  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 1024;
  bannerCanvas.height = 128;
  const bctx = bannerCanvas.getContext('2d');
  if (bctx) {
    bctx.fillStyle = '#ffffff';
    bctx.fillRect(0, 0, 1024, 128);
    bctx.strokeStyle = '#0284c7';
    bctx.lineWidth = 6;
    bctx.strokeRect(4, 4, 1016, 120);
    bctx.fillStyle = '#0284c7';
    bctx.font = 'bold 50px sans-serif';
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillText('🏁 메트로폴리스 버스 서킷 (2분 완주 코스) 🏁', 512, 64);
  }
  const bannerTex = new THREE.CanvasTexture(bannerCanvas);
  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.5), new THREE.MeshBasicMaterial({ map: bannerTex }));
  bannerMesh.position.set(startPt.x, 8.8, startPt.z + 0.75);
  bannerMesh.rotation.y = startAngle;
  scene.add(bannerMesh);

  // 7. Checkpoint Hologram Gates
  const checkpointMeshes: THREE.Mesh[] = [];
  const checkGateGeo = new THREE.TorusGeometry(8.5, 0.24, 12, 32, Math.PI);

  for (let i = 0; i < trackData.checkpoints.length; i++) {
    const u = i / trackData.checkpoints.length;
    const pt = TRACK_CURVE.getPointAt(u);
    const tan = TRACK_CURVE.getTangentAt(u);
    const angle = Math.atan2(tan.x, tan.z);

    const cpMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x10b981 : 0x0ea5e9,
      transparent: true,
      opacity: 0.65,
    });

    const gate = new THREE.Mesh(checkGateGeo, cpMat);
    gate.position.set(pt.x, 0.05, pt.z);
    gate.rotation.y = angle + Math.PI / 2;
    gate.rotation.z = Math.PI;
    scene.add(gate);
    checkpointMeshes.push(gate);
  }

  // 8. High-Density Diverse Skyscrapers & Urban Architecture (다채롭고 현실적인 건물 디자인)
  for (const b of trackData.buildings) {
    const buildingGroup = createDetailedBuilding(b);
    scene.add(buildingGroup);
  }

  // 8b. Urban Trees (풍성한 느티나무 가로수 & 도심 공원 소나무)
  for (const t of trackData.trees) {
    const treeMesh = t.type === 'pine' ? createPineTree() : createStreetTree(t.hasGrate);
    treeMesh.position.copy(t.position);
    scene.add(treeMesh);
  }

  // 8c. Street Furniture (우드/스틸 벤치, 화단 플랜터, 소화전, 안전 볼라드)
  for (const bench of trackData.furniture.benches) {
    const benchMesh = createParkBench();
    benchMesh.position.copy(bench.position);
    benchMesh.rotation.y = bench.rotationY;
    scene.add(benchMesh);
  }

  for (const planter of trackData.furniture.planters) {
    const planterMesh = createFlowerPlanter();
    planterMesh.position.copy(planter.position);
    planterMesh.rotation.y = planter.rotationY;
    scene.add(planterMesh);
  }

  for (const hyd of trackData.furniture.hydrants) {
    const hydMesh = createFireHydrant();
    hydMesh.position.copy(hyd.position);
    hydMesh.rotation.y = hyd.rotationY;
    scene.add(hydMesh);
  }

  for (const bol of trackData.furniture.bollards) {
    const bolMesh = createBollard();
    bolMesh.position.copy(bol.position);
    scene.add(bolMesh);
  }


  // 9. Traffic Light Posts at Grid Intersections
  const signalPoleMat = new THREE.MeshStandardMaterial({ color: 0x22262d, metalness: 0.8, roughness: 0.3 });
  const redSignalMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const yellowSignalMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const greenSignalMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });

  for (const tl of trackData.trafficLights) {
    const tlGroup = new THREE.Group();
    tlGroup.position.copy(tl.position);
    tlGroup.rotation.y = tl.rotationY;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6.2), signalPoleMat);
    pole.position.y = 3.1;
    tlGroup.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.2), signalPoleMat);
    arm.position.set(0, 5.8, 1.6);
    tlGroup.add(arm);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.35), signalPoleMat);
    box.position.set(0, 5.2, 2.8);
    tlGroup.add(box);

    const redBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), redSignalMat);
    redBulb.position.set(0, 5.55, 2.98);
    tlGroup.add(redBulb);

    const yellowBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), yellowSignalMat);
    yellowBulb.position.set(0, 5.2, 2.98);
    tlGroup.add(yellowBulb);

    const greenBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), greenSignalMat);
    greenBulb.position.set(0, 4.85, 2.98);
    tlGroup.add(greenBulb);

    scene.add(tlGroup);
  }

  // 10. Streetlights with LED Fixtures
  for (const light of trackData.streetlights) {
    const lampGroup = new THREE.Group();
    lampGroup.position.copy(light.position);
    lampGroup.rotation.y = light.rotationY;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 8.0, 8), signalPoleMat);
    pole.position.y = 4.0;
    lampGroup.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), signalPoleMat);
    arm.position.set(0, 7.8, 1.0);
    lampGroup.add(arm);

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, 0.7),
      new THREE.MeshStandardMaterial({ color: 0xfff3cc, emissive: 0xffe885, emissiveIntensity: 0.9 })
    );
    head.position.set(0, 7.7, 2.0);
    lampGroup.add(head);

    scene.add(lampGroup);
  }

  // 11. Bus Stops
  for (const bs of trackData.busStops) {
    const bsGroup = new THREE.Group();
    bsGroup.position.copy(bs.position);
    bsGroup.rotation.y = bs.rotationY;

    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.3, 14.0),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 })
    );
    platform.position.y = 0.15;
    platform.receiveShadow = true;
    bsGroup.add(platform);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.14, 9.0),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.3 })
    );
    canopy.position.set(-0.2, 3.4, 0);
    canopy.castShadow = true;
    bsGroup.add(canopy);

    const glassWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.9, 8.5),
      new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.45 })
    );
    glassWall.position.set(-1.6, 1.6, 0);
    bsGroup.add(glassWall);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 256;
    const sctx = signCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#0284c7';
      sctx.fillRect(0, 0, 512, 256);
      sctx.strokeStyle = '#ffffff';
      sctx.lineWidth = 12;
      sctx.strokeRect(6, 6, 500, 244);
      sctx.fillStyle = '#ffffff';
      sctx.font = 'bold 52px sans-serif';
      sctx.textAlign = 'center';
      sctx.fillText('🚏 버스 정류소', 256, 85);
      sctx.font = 'bold 42px sans-serif';
      sctx.fillText(bs.name, 256, 175);
    }
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: signTex }));
    signBoard.position.set(0, 3.8, 4.8);
    bsGroup.add(signBoard);

    scene.add(bsGroup);
  }

  // 12. Slalom Practice Cones
  const coneGeo = new THREE.ConeGeometry(0.35, 0.85, 16);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.4 });
  const coneBaseGeo = new THREE.BoxGeometry(0.65, 0.08, 0.65);
  const coneBaseMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  for (const conePos of trackData.cones) {
    const coneGroup = new THREE.Group();
    coneGroup.position.set(conePos.x, 0, conePos.z);

    const base = new THREE.Mesh(coneBaseGeo, coneBaseMat);
    base.position.y = 0.04;
    coneGroup.add(base);

    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 0.465;
    cone.castShadow = true;
    coneGroup.add(cone);

    scene.add(coneGroup);
  }

  // Time of Day Controller
  const setTimeOfDay = (mode: TimeOfDay) => {
    if (mode === 'day') {
      scene.background = new THREE.Color(0xf0f7ff);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(0xf0f7ff);
      sunLight.color.set(0xffffff);
      sunLight.intensity = 1.85;
      hemiLight.color.set(0xffffff);
      hemiLight.groundColor.set(0xe2e8f0);
      hemiLight.intensity = 1.15;
    } else if (mode === 'sunset') {
      scene.background = new THREE.Color(0xd97757);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(0xec8c68);
      sunLight.color.set(0xff7733);
      sunLight.intensity = 1.2;
      hemiLight.color.set(0xfba27b);
      hemiLight.groundColor.set(0x38271e);
      hemiLight.intensity = 0.7;
    } else if (mode === 'night') {
      scene.background = new THREE.Color(0x060b14);
      if (scene.fog) (scene.fog as THREE.FogExp2).color.set(0x0a101d);
      sunLight.color.set(0x4466aa);
      sunLight.intensity = 0.25;
      hemiLight.color.set(0x1a2638);
      hemiLight.groundColor.set(0x0d141e);
      hemiLight.intensity = 0.35;
    }
  };

  setTimeOfDay('day');

  const updateCheckpoints = (activeCheckpointId: number) => {
    for (let i = 0; i < checkpointMeshes.length; i++) {
      const gate = checkpointMeshes[i];
      const mat = gate.material as THREE.MeshBasicMaterial;
      if (i === activeCheckpointId) {
        mat.color.set(0x10b981);
        mat.opacity = 0.9;
      } else {
        mat.color.set(0x0ea5e9);
        mat.opacity = 0.3;
      }
    }
  };

  return {
    scene,
    sunLight,
    hemiLight,
    checkpointMeshes,
    roadMesh,
    trackData,
    setTimeOfDay,
    updateCheckpoints,
  };
}
