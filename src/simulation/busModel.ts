import * as THREE from 'three';
import { VehicleState } from '../types';

export interface BusModelHandles {
  root: THREE.Group;
  steeringWheel: THREE.Object3D;
  frontLeftWheel: THREE.Object3D;
  frontRightWheel: THREE.Object3D;
  rearLeftWheels: THREE.Object3D[];
  rearRightWheels: THREE.Object3D[];
  headlights: THREE.SpotLight[];
  headlightLensMaterials: THREE.MeshStandardMaterial[];
  brakeLights: THREE.MeshStandardMaterial[];
  reverseLights: THREE.MeshStandardMaterial[];
  interiorLights: THREE.PointLight;
  bodyMesh: THREE.Mesh;
  driftParticleSystem: {
    update: (dt: number, isDrifting: boolean, pos: THREE.Vector3, rot: number, speed: number) => void;
  };
  exhaustParticleSystem: {
    update: (dt: number, throttle: number, pos: THREE.Vector3, rot: number) => void;
  };
  cockpitAnchor: THREE.Object3D;
  chaseAnchor: THREE.Object3D;
  topAnchor: THREE.Object3D;
}

export function createBusModel(scene: THREE.Scene): BusModelHandles {
  const root = new THREE.Group();

  // Materials
  const busBodyColor = new THREE.Color(0x1a73e8); // Vivid Transit Blue
  const busWhiteColor = new THREE.Color(0xf1f3f4); // Clean White upper roof
  const darkTrimColor = new THREE.Color(0x202124); // Dark anthracite bumper/trim
  const glassColor = new THREE.Color(0x102030);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: busBodyColor,
    roughness: 0.35,
    metalness: 0.25,
  });

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: busWhiteColor,
    roughness: 0.4,
    metalness: 0.1,
  });

  const darkTrimMaterial = new THREE.MeshStandardMaterial({
    color: darkTrimColor,
    roughness: 0.6,
    metalness: 0.2,
  });

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: glassColor,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.6,
    ior: 1.5,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.85,
    roughness: 0.2,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f1f1f,
    roughness: 0.8,
    metalness: 0.05,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd0d4d8,
    metalness: 0.7,
    roughness: 0.3,
  });

  const headlightLensMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff4d0,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  const brakeLightMaterial = new THREE.MeshStandardMaterial({
    color: 0x880000,
    emissive: 0xff1111,
    emissiveIntensity: 0.3,
    roughness: 0.3,
  });

  const reverseLightMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    emissive: 0xffffff,
    emissiveIntensity: 0.0,
    roughness: 0.3,
  });

  // Bus Dimensions
  // Length: 10.4m, Width: 2.5m, Height: 3.1m
  const busLength = 10.4;
  const busWidth = 2.5;
  const busHeight = 2.7;
  const floorHeight = 0.55;

  // 1. Main Chassis & Lower Body
  const lowerBodyGeo = new THREE.BoxGeometry(busWidth, 1.1, busLength);
  const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
  lowerBody.position.y = floorHeight + 0.55;
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  root.add(lowerBody);

  // 2. Upper Body / Window Pillars
  const upperBodyGeo = new THREE.BoxGeometry(busWidth, 1.4, busLength);
  const upperBody = new THREE.Mesh(upperBodyGeo, bodyMaterial);
  upperBody.position.y = floorHeight + 1.1 + 0.7;
  upperBody.castShadow = true;
  root.add(upperBody);

  // 3. Roof with rounded top
  const roofGeo = new THREE.BoxGeometry(busWidth - 0.08, 0.35, busLength - 0.2);
  const roof = new THREE.Mesh(roofGeo, roofMaterial);
  roof.position.y = floorHeight + busHeight + 0.15;
  roof.castShadow = true;
  root.add(roof);

  // 4. Roof AC Units (Transit Bus Climate Pods)
  for (const zOffset of [-1.5, 1.5]) {
    const acPodGeo = new THREE.BoxGeometry(1.6, 0.35, 2.2);
    const acPod = new THREE.Mesh(acPodGeo, darkTrimMaterial);
    acPod.position.set(0, floorHeight + busHeight + 0.45, zOffset);
    acPod.castShadow = true;
    root.add(acPod);

    // AC Grille
    const ventGeo = new THREE.BoxGeometry(1.3, 0.05, 1.8);
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(0, floorHeight + busHeight + 0.63, zOffset);
    root.add(vent);
  }

  // 5. Large Panoramic Windshield (Front)
  const windshieldGeo = new THREE.BoxGeometry(busWidth - 0.2, 1.25, 0.08);
  const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshield.position.set(0, floorHeight + 1.75, busLength / 2 - 0.02);
  root.add(windshield);

  // Windshield wipers
  const wiperMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (const wx of [-0.5, 0.5]) {
    const wiperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8), wiperMat);
    wiperArm.rotation.z = wx > 0 ? 0.3 : -0.3;
    wiperArm.position.set(wx, floorHeight + 1.45, busLength / 2 + 0.05);
    root.add(wiperArm);
  }

  // 6. LED Destination Display Box ("7016 도심순환")
  const ledBoxGeo = new THREE.BoxGeometry(1.8, 0.32, 0.15);
  const ledBoxMat = new THREE.MeshStandardMaterial({ color: 0x050505 });
  const ledBox = new THREE.Mesh(ledBoxGeo, ledBoxMat);
  ledBox.position.set(0, floorHeight + 2.5, busLength / 2 - 0.05);
  root.add(ledBox);

  // LED Canvas Texture
  const ledCanvas = document.createElement('canvas');
  ledCanvas.width = 512;
  ledCanvas.height = 128;
  const ledCtx = ledCanvas.getContext('2d');
  if (ledCtx) {
    ledCtx.fillStyle = '#0a0a0a';
    ledCtx.fillRect(0, 0, 512, 128);
    ledCtx.fillStyle = '#ffaa00'; // Amber LED
    ledCtx.font = 'bold 54px sans-serif';
    ledCtx.textAlign = 'center';
    ledCtx.textBaseline = 'middle';
    ledCtx.fillText('7016 도심순환 🚌', 256, 64);
  }
  const ledTex = new THREE.CanvasTexture(ledCanvas);
  const ledScreenMat = new THREE.MeshBasicMaterial({ map: ledTex });
  const ledScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.28), ledScreenMat);
  ledScreen.position.set(0, floorHeight + 2.5, busLength / 2 + 0.03);
  root.add(ledScreen);

  // 7. Large Side Windows (Left and Right)
  const sideWindowGeo = new THREE.BoxGeometry(0.08, 1.25, busLength - 1.2);
  const leftSideWindows = new THREE.Mesh(sideWindowGeo, glassMaterial);
  leftSideWindows.position.set(-busWidth / 2 + 0.02, floorHeight + 1.75, 0);
  root.add(leftSideWindows);

  const rightSideWindows = new THREE.Mesh(sideWindowGeo, glassMaterial);
  rightSideWindows.position.set(busWidth / 2 - 0.02, floorHeight + 1.75, 0);
  root.add(rightSideWindows);

  // Rear Window
  const rearWindowGeo = new THREE.BoxGeometry(busWidth - 0.4, 0.9, 0.08);
  const rearWindow = new THREE.Mesh(rearWindowGeo, glassMaterial);
  rearWindow.position.set(0, floorHeight + 1.85, -busLength / 2 + 0.02);
  root.add(rearWindow);

  // 8. Front & Rear Bumpers with Trim
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(busWidth + 0.05, 0.45, 0.35), darkTrimMaterial);
  frontBumper.position.set(0, floorHeight + 0.25, busLength / 2 + 0.12);
  root.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(busWidth + 0.05, 0.45, 0.35), darkTrimMaterial);
  rearBumper.position.set(0, floorHeight + 0.25, -busLength / 2 - 0.12);
  root.add(rearBumper);

  // Korean License Plates (Front & Rear)
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 256;
  plateCanvas.height = 64;
  const plateCtx = plateCanvas.getContext('2d');
  if (plateCtx) {
    plateCtx.fillStyle = '#f8f9fa';
    plateCtx.fillRect(0, 0, 256, 64);
    plateCtx.strokeStyle = '#222';
    plateCtx.lineWidth = 4;
    plateCtx.strokeRect(2, 2, 252, 60);
    plateCtx.fillStyle = '#111';
    plateCtx.font = 'bold 36px sans-serif';
    plateCtx.textAlign = 'center';
    plateCtx.textBaseline = 'middle';
    plateCtx.fillText('서울 74 사 1004', 128, 34);
  }
  const plateTex = new THREE.CanvasTexture(plateCanvas);
  const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });

  const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), plateMat);
  frontPlate.position.set(0, floorHeight + 0.25, busLength / 2 + 0.31);
  root.add(frontPlate);

  const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), plateMat);
  rearPlate.position.set(0, floorHeight + 0.25, -busLength / 2 - 0.31);
  rearPlate.rotation.y = Math.PI;
  root.add(rearPlate);

  // 9. Side Rearview Mirrors
  for (const side of [-1, 1]) {
    const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6), chromeMaterial);
    mirrorArm.rotation.z = side * 1.1;
    mirrorArm.position.set(side * (busWidth / 2 + 0.25), floorHeight + 2.1, busLength / 2 - 0.4);
    root.add(mirrorArm);

    const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.18), darkTrimMaterial);
    mirrorHead.position.set(side * (busWidth / 2 + 0.45), floorHeight + 2.2, busLength / 2 - 0.35);
    root.add(mirrorHead);

    // Reflective glass
    const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.32), chromeMaterial);
    mirrorGlass.position.set(side * (busWidth / 2 + 0.45), floorHeight + 2.2, busLength / 2 - 0.45);
    mirrorGlass.rotation.y = side === 1 ? -Math.PI / 8 : Math.PI / 8;
    root.add(mirrorGlass);
  }

  // 10. Interior: Driver Cockpit & Passenger Cabin
  // Driver Seat
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2b303a, roughness: 0.8 });
  const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.5), seatMat);
  driverSeat.position.set(-0.65, floorHeight + 0.75, busLength / 2 - 1.4);
  root.add(driverSeat);

  // Driver Dashboard
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
  const dashboard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.65, 0.75), dashMat);
  dashboard.position.set(-0.65, floorHeight + 0.95, busLength / 2 - 0.85);
  root.add(dashboard);

  // Working Steering Wheel (anchored for rotation)
  const steeringAnchor = new THREE.Group();
  steeringAnchor.position.set(-0.65, floorHeight + 1.22, busLength / 2 - 1.05);
  steeringAnchor.rotation.x = 0.55; // tilted towards driver

  const wheelRimGeo = new THREE.TorusGeometry(0.24, 0.025, 8, 24);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 });
  const wheelRim = new THREE.Mesh(wheelRimGeo, wheelMat);
  steeringAnchor.add(wheelRim);

  const wheelCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04), chromeMaterial);
  wheelCenter.rotation.x = Math.PI / 2;
  steeringAnchor.add(wheelCenter);

  root.add(steeringAnchor);

  // Passenger Handrail Poles (Yellow transit poles)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xf5b700, roughness: 0.3 });
  for (const pz of [-3.5, -1.8, 0, 1.8, 3.2]) {
    const poleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, busHeight - 0.4), poleMat);
    poleLeft.position.set(-0.4, floorHeight + (busHeight / 2) + 0.1, pz);
    root.add(poleLeft);

    const poleRight = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, busHeight - 0.4), poleMat);
    poleRight.position.set(0.4, floorHeight + (busHeight / 2) + 0.1, pz);
    root.add(poleRight);
  }

  // Passenger Seats rows
  for (const sz of [-3.8, -2.8, -1.8, -0.8, 0.8, 1.8, 2.8]) {
    // Left pair
    const pSeatL = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.45), seatMat);
    pSeatL.position.set(-0.8, floorHeight + 0.65, sz);
    root.add(pSeatL);
    // Right pair
    const pSeatR = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.6, 0.45), seatMat);
    pSeatR.position.set(0.8, floorHeight + 0.65, sz);
    root.add(pSeatR);
  }

  // 11. Headlights (Physical SpotLights + Glowing Lenses)
  const headlights: THREE.SpotLight[] = [];
  const headlightLensMaterials = [headlightLensMaterial];

  for (const hx of [-0.85, 0.85]) {
    // Lens mesh
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16), headlightLensMaterial);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(hx, floorHeight + 0.5, busLength / 2 + 0.15);
    root.add(lens);

    // SpotLight
    const spot = new THREE.SpotLight(0xfff5db, 3.5, 95, Math.PI / 5.5, 0.4, 1.2);
    spot.position.set(hx, floorHeight + 0.55, busLength / 2 + 0.2);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(hx, 0, busLength / 2 + 35);
    root.add(targetObj);
    spot.target = targetObj;
    spot.castShadow = true;
    spot.shadow.mapSize.width = 512;
    spot.shadow.mapSize.height = 512;
    spot.shadow.bias = -0.001;
    root.add(spot);
    headlights.push(spot);
  }

  // 12. Taillights / Brake Lights & Reverse Lights
  const brakeLights: THREE.MeshStandardMaterial[] = [brakeLightMaterial];
  const reverseLights: THREE.MeshStandardMaterial[] = [reverseLightMaterial];

  for (const bx of [-0.9, 0.9]) {
    // Brake light
    const brakeLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.04), brakeLightMaterial);
    brakeLens.position.set(bx, floorHeight + 0.85, -busLength / 2 - 0.03);
    root.add(brakeLens);

    // Reverse light
    const revLens = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.15, 0.04), reverseLightMaterial);
    revLens.position.set(bx, floorHeight + 0.55, -busLength / 2 - 0.03);
    root.add(revLens);
  }

  // Cabin interior warm light
  const interiorLight = new THREE.PointLight(0xffeedd, 0.8, 12);
  interiorLight.position.set(0, floorHeight + busHeight - 0.3, 0);
  root.add(interiorLight);

  // 13. Wheels Assembly
  // Front Axle: z ~ +2.8, Rear Axle: z ~ -2.8 (Wheelbase ~ 5.6m)
  const wheelRadius = 0.54;
  const wheelWidth = 0.32;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
  wheelGeo.rotateZ(Math.PI / 2);

  const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelWidth + 0.02, 16);
  rimGeo.rotateZ(Math.PI / 2);

  function makeWheel(): THREE.Group {
    const wGroup = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tireMaterial);
    tire.castShadow = true;
    wGroup.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMaterial);
    wGroup.add(rim);

    // Hubcap bolts detail
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, wheelWidth + 0.04, 8), chromeMaterial);
    cap.rotateZ(Math.PI / 2);
    wGroup.add(cap);

    return wGroup;
  }

  // Front Wheels (pivotable groups for steering)
  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(-busWidth / 2 - 0.02, wheelRadius, 2.8);
  const frontLeftWheel = makeWheel();
  frontLeftPivot.add(frontLeftWheel);
  root.add(frontLeftPivot);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(busWidth / 2 + 0.02, wheelRadius, 2.8);
  const frontRightWheel = makeWheel();
  frontRightPivot.add(frontRightWheel);
  root.add(frontRightPivot);

  // Rear Wheels (Dual wheel pairs for heavy bus authenticity)
  const rearLeftWheels: THREE.Object3D[] = [];
  const rearRightWheels: THREE.Object3D[] = [];

  for (const offset of [-0.08, 0.16]) {
    const rwL = makeWheel();
    rwL.position.set(-busWidth / 2 - offset, wheelRadius, -2.8);
    root.add(rwL);
    rearLeftWheels.push(rwL);

    const rwR = makeWheel();
    rwR.position.set(busWidth / 2 + offset, wheelRadius, -2.8);
    root.add(rwR);
    rearRightWheels.push(rwR);
  }

  // 14. Camera Anchors
  // Cockpit View (driver's eyes)
  const cockpitAnchor = new THREE.Object3D();
  cockpitAnchor.position.set(-0.65, floorHeight + 1.55, busLength / 2 - 1.2);
  root.add(cockpitAnchor);

  // Chase View (smooth 3rd-person follow)
  const chaseAnchor = new THREE.Object3D();
  chaseAnchor.position.set(0, 4.4, -9.5);
  root.add(chaseAnchor);

  // Top / High Angle View
  const topAnchor = new THREE.Object3D();
  topAnchor.position.set(0, 16.0, -12.0);
  root.add(topAnchor);

  // 15. Drift & Exhaust Particle Systems
  // Drift smoke particles
  const maxParticles = 60;
  const particleGeo = new THREE.PlaneGeometry(0.6, 0.6);
  const particleMat = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });

  const particles: { mesh: THREE.Mesh; life: number; maxLife: number; vx: number; vz: number }[] = [];
  for (let i = 0; i < maxParticles; i++) {
    const pMesh = new THREE.Mesh(particleGeo, particleMat.clone());
    pMesh.rotation.x = -Math.PI / 2;
    pMesh.visible = false;
    scene.add(pMesh);
    particles.push({ mesh: pMesh, life: 0, maxLife: 0.8, vx: 0, vz: 0 });
  }

  let particleIdx = 0;
  const driftParticleSystem = {
    update: (dt: number, isDrifting: boolean, pos: THREE.Vector3, rot: number, speed: number) => {
      // Spawn new particles if drifting
      if (isDrifting && Math.abs(speed) > 15) {
        for (let k = 0; k < 2; k++) {
          const p = particles[particleIdx];
          particleIdx = (particleIdx + 1) % maxParticles;
          p.life = 0.75;
          p.maxLife = 0.75;

          // Spawn near rear tires
          const side = k === 0 ? -1.1 : 1.1;
          const spawnX = pos.x + Math.sin(rot) * -2.8 + Math.cos(rot) * side;
          const spawnZ = pos.z + Math.cos(rot) * -2.8 - Math.sin(rot) * side;
          p.mesh.position.set(spawnX, 0.15, spawnZ);
          p.mesh.scale.set(0.6, 0.6, 0.6);
          p.mesh.visible = true;
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.45;
          p.vx = (Math.random() - 0.5) * 1.5;
          p.vz = (Math.random() - 0.5) * 1.5;
        }
      }

      // Update active particles
      for (const p of particles) {
        if (p.life > 0) {
          p.life -= dt;
          const progress = 1.0 - p.life / p.maxLife;
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.z += p.vz * dt;
          p.mesh.position.y += 0.4 * dt;
          const scale = 0.6 + progress * 2.2;
          p.mesh.scale.set(scale, scale, scale);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.45 * (1.0 - progress));
          if (p.life <= 0) p.mesh.visible = false;
        }
      }
    },
  };

  // Exhaust puff system (low frequency black/gray puff on throttle)
  const exhaustParticleSystem = {
    update: (_dt: number, _throttle: number, _pos: THREE.Vector3, _rot: number) => {
      // Handled smoothly in scene
    },
  };

  scene.add(root);

  return {
    root,
    steeringWheel: steeringAnchor,
    frontLeftWheel: frontLeftPivot,
    frontRightWheel: frontRightPivot,
    rearLeftWheels,
    rearRightWheels,
    headlights,
    headlightLensMaterials,
    brakeLights,
    reverseLights,
    interiorLights: interiorLight,
    bodyMesh: lowerBody,
    driftParticleSystem,
    exhaustParticleSystem,
    cockpitAnchor,
    chaseAnchor,
    topAnchor,
  };
}

export function updateBusVisuals(handles: BusModelHandles, state: VehicleState, dt: number) {
  // 1. Root Position and Heading Rotation (Clean horizontal plane)
  handles.root.position.set(state.position.x, state.position.y, state.position.z);
  handles.root.rotation.set(0, state.rotation, 0);

  // Body Roll & Pitch (Weight transfer inertia applied to body)
  const speedMs = (state.speed * 1000) / 3600;
  const pitchAmount = (state.brake * 0.03) - (state.throttle * 0.015);
  const rollAmount = (state.steeringAngle * Math.min(1.0, Math.abs(speedMs) / 18)) * 0.05;

  if (handles.bodyMesh) {
    handles.bodyMesh.rotation.x = pitchAmount;
    handles.bodyMesh.rotation.z = rollAmount;
  }

  // 2. Steering Wheel (in cockpit)
  // Steers up to ~450 degrees (1.25 turns) like a real commercial bus steering wheel
  handles.steeringWheel.rotation.z = state.steeringAngle * 4.2;

  // 3. Front Wheels Steering Pivots (negative Y rotation turns left)
  handles.frontLeftWheel.rotation.y = -state.steeringAngle;
  handles.frontRightWheel.rotation.y = -state.steeringAngle;

  // 4. Wheels Rolling Rotation (around X axis)
  const rollDelta = (speedMs / 0.54) * dt;
  (handles.frontLeftWheel.children[0] as THREE.Object3D).rotation.x += rollDelta;
  (handles.frontRightWheel.children[0] as THREE.Object3D).rotation.x += rollDelta;
  for (const rw of handles.rearLeftWheels) rw.rotation.x += rollDelta;
  for (const rw of handles.rearRightWheels) rw.rotation.x += rollDelta;

  // 5. Brake Lights & Reverse Lights
  const brakeMat = handles.brakeLights[0];
  if (brakeMat) {
    brakeMat.emissiveIntensity = state.isBraking ? 1.8 : 0.25;
  }

  const revMat = handles.reverseLights[0];
  if (revMat) {
    revMat.emissiveIntensity = state.gear === 'R' ? 1.5 : 0.0;
  }

  // 6. Headlights Intensity
  for (const h of handles.headlights) {
    h.intensity = state.headlights ? 3.8 : 0.0;
  }

  // 7. Update Drift Smoke Particles
  const busPos = new THREE.Vector3(state.position.x, state.position.y, state.position.z);
  handles.driftParticleSystem.update(dt, state.isDrifting, busPos, state.rotation, state.speed);
}
