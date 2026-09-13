import * as THREE from 'three';

export interface Pedestrian {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  walkPhase: number;
  walkSpeed: number; // speed of limb swing
  moveSpeed: number; // m/s (1.1 - 1.6 m/s walking speed)
  waypoints: THREE.Vector3[];
  currentWaypointIdx: number;
  isStationary: boolean;
}

export class PedestrianManager {
  private pedestrians: Pedestrian[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public init() {
    // Variety of clothing colors
    const shirtColors = [
      0x2563eb, // Royal Blue
      0xdc2626, // Crimson Red
      0x16a34a, // Emerald Green
      0xf59e0b, // Amber Orange
      0x6b7280, // Slate Gray
      0x1e293b, // Navy Suit
      0x9333ea, // Purple
      0x0d9488, // Teal
      0xffffff, // White Tee
      0xf43f5e, // Rose
    ];

    const pantsColors = [
      0x1e293b, // Navy Dark
      0x334155, // Charcoal
      0x2563eb, // Denim Blue
      0x78716c, // Khaki
      0x0f172a, // Black
    ];

    const skinTones = [0xfbcfe8, 0xfde68a, 0xfbbf24, 0xd97706, 0xb45309];

    // Helper: Create a single humanoid pedestrian
    const createPerson = (
      initialPos: THREE.Vector3,
      waypoints: THREE.Vector3[],
      isStationary = false
    ) => {
      const pGroup = new THREE.Group();
      pGroup.position.copy(initialPos);

      const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      const pantsColor = pantsColors[Math.floor(Math.random() * pantsColors.length)];
      const skinTone = skinTones[Math.floor(Math.random() * skinTones.length)];

      const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.8 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9 });
      const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.58, 0.24), shirtMat);
      torso.position.y = 1.15;
      torso.castShadow = true;
      pGroup.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
      head.position.y = 1.62;
      head.castShadow = true;
      pGroup.add(head);

      // Hair or Hat
      if (Math.random() > 0.4) {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 8, 6), hairMat);
        hair.position.set(0, 1.66, -0.02);
        pGroup.add(hair);
      }

      // Left Leg
      const legGeo = new THREE.BoxGeometry(0.14, 0.68, 0.14);
      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.12, 0.86, 0);
      const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
      leftLegMesh.position.y = -0.34;
      leftLegMesh.castShadow = true;
      leftLegPivot.add(leftLegMesh);

      const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), shoeMat);
      leftShoe.position.set(0, -0.68, 0.04);
      leftLegPivot.add(leftShoe);
      pGroup.add(leftLegPivot);

      // Right Leg
      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.12, 0.86, 0);
      const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
      rightLegMesh.position.y = -0.34;
      rightLegMesh.castShadow = true;
      rightLegPivot.add(rightLegMesh);

      const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.22), shoeMat);
      rightShoe.position.set(0, -0.68, 0.04);
      rightLegPivot.add(rightShoe);
      pGroup.add(rightLegPivot);

      // Left Arm
      const armGeo = new THREE.BoxGeometry(0.1, 0.52, 0.1);
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.27, 1.38, 0);
      const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
      leftArmMesh.position.y = -0.26;
      leftArmPivot.add(leftArmMesh);
      pGroup.add(leftArmPivot);

      // Right Arm
      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.27, 1.38, 0);
      const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
      rightArmMesh.position.y = -0.26;
      rightArmPivot.add(rightArmMesh);
      pGroup.add(rightArmPivot);

      this.scene.add(pGroup);

      this.pedestrians.push({
        group: pGroup,
        leftLeg: leftLegPivot as unknown as THREE.Mesh,
        rightLeg: rightLegPivot as unknown as THREE.Mesh,
        leftArm: leftArmPivot as unknown as THREE.Mesh,
        rightArm: rightArmPivot as unknown as THREE.Mesh,
        walkPhase: Math.random() * Math.PI * 2,
        walkSpeed: 6.5 + Math.random() * 2.5,
        moveSpeed: 1.2 + Math.random() * 0.6,
        waypoints,
        currentWaypointIdx: 0,
        isStationary,
      });
    };

    // 1. Bus Stop Waiting Passengers (터미널 및 정류장 대기 승객들)
    // Central Terminal Platform (x: 12, z: -15)
    for (let i = 0; i < 6; i++) {
      const ox = 11.5 + (Math.random() - 0.5) * 2.0;
      const oz = -18 + i * 1.5;
      createPerson(new THREE.Vector3(ox, 0.15, oz), [], true);
    }

    // Financial Station Platform (x: 275, z: 90)
    for (let i = 0; i < 4; i++) {
      const ox = 276 + (Math.random() - 0.5) * 1.5;
      const oz = 88 + i * 2.0;
      createPerson(new THREE.Vector3(ox, 0.15, oz), [], true);
    }

    // Tech Valley Platform (x: -250, z: -110)
    for (let i = 0; i < 4; i++) {
      const ox = -252 + (Math.random() - 0.5) * 1.5;
      const oz = -112 + i * 2.0;
      createPerson(new THREE.Vector3(ox, 0.15, oz), [], true);
    }

    // 2. Sidewalk Walkers along Central Skyscraper Avenue (Z: -60 to 120, X: -9.5 and +9.5)
    for (let i = 0; i < 10; i++) {
      const side = i % 2 === 0 ? 9.2 : -9.2;
      const startZ = -50 + i * 16;
      const endZ = startZ + 35;
      createPerson(
        new THREE.Vector3(side, 0.08, startZ),
        [new THREE.Vector3(side, 0.08, endZ), new THREE.Vector3(side, 0.08, startZ)],
        false
      );
    }

    // 3. Sidewalk Walkers on East-West Cross Streets (Z = 0, Z = 75, Z = -75)
    const streetZLevels = [-75, 0, 75];
    for (const sz of streetZLevels) {
      for (let j = 0; j < 4; j++) {
        const sideY = sz + (j % 2 === 0 ? 9.2 : -9.2);
        const startX = -120 + j * 60;
        const endX = startX + 45;
        createPerson(
          new THREE.Vector3(startX, 0.08, sideY),
          [new THREE.Vector3(endX, 0.08, sideY), new THREE.Vector3(startX, 0.08, sideY)],
          false
        );
      }
    }

    // 4. North-South Grid Avenue Sidewalks (X = -75, X = 75)
    for (const sx of [-75, 75]) {
      for (let k = 0; k < 4; k++) {
        const sideX = sx + (k % 2 === 0 ? 9.2 : -9.2);
        const startZ = -100 + k * 50;
        const endZ = startZ + 40;
        createPerson(
          new THREE.Vector3(sideX, 0.08, startZ),
          [new THREE.Vector3(sideX, 0.08, endZ), new THREE.Vector3(sideX, 0.08, startZ)],
          false
        );
      }
    }

    // 5. Crosswalk Pedestrians (보행자 횡단보도 건너는 사람들)
    const crosswalkLocations = [
      { x1: -9.2, z1: 0, x2: 9.2, z2: 0 },
      { x1: -9.2, z1: 75, x2: 9.2, z2: 75 },
      { x1: -75, z1: -9.2, x2: -75, z2: 9.2 },
      { x1: 75, z1: -9.2, x2: 75, z2: 9.2 },
    ];

    for (const cw of crosswalkLocations) {
      createPerson(
        new THREE.Vector3(cw.x1, 0.08, cw.z1),
        [new THREE.Vector3(cw.x2, 0.08, cw.z2), new THREE.Vector3(cw.x1, 0.08, cw.z1)],
        false
      );
    }

    // 6. Central Park & Plaza Strollers (도심 공원 산책하는 시민들)
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const r = 24 + (p % 3) * 6;
      const px = Math.cos(angle) * r;
      const pz = -75 + Math.sin(angle) * r;
      const nextAngle = angle + 0.8;
      const nx = Math.cos(nextAngle) * r;
      const nz = -75 + Math.sin(nextAngle) * r;

      createPerson(
        new THREE.Vector3(px, 0.08, pz),
        [new THREE.Vector3(nx, 0.08, nz), new THREE.Vector3(px, 0.08, pz)],
        false
      );
    }
  }

  public update(dt: number) {
    for (let i = 0; i < this.pedestrians.length; i++) {
      const ped = this.pedestrians[i];

      if (ped.isStationary) {
        // Idle breathing / gentle sway
        ped.walkPhase += dt * 1.5;
        ped.group.position.y = 0.15 + Math.sin(ped.walkPhase) * 0.02;
        continue;
      }

      // Walking Movement along waypoints
      if (ped.waypoints.length > 0) {
        const target = ped.waypoints[ped.currentWaypointIdx];
        const dx = target.x - ped.group.position.x;
        const dz = target.z - ped.group.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.8) {
          // Reached waypoint, move to next
          ped.currentWaypointIdx = (ped.currentWaypointIdx + 1) % ped.waypoints.length;
        } else {
          // Move towards target
          const angle = Math.atan2(dx, dz);
          ped.group.rotation.y = angle;

          const moveStep = Math.min(dist, ped.moveSpeed * dt);
          ped.group.position.x += Math.sin(angle) * moveStep;
          ped.group.position.z += Math.cos(angle) * moveStep;

          // Leg and arm swinging walk cycle
          ped.walkPhase += dt * ped.walkSpeed;
          const legSwing = Math.sin(ped.walkPhase) * 0.55;
          const armSwing = Math.sin(ped.walkPhase) * 0.4;

          ped.leftLeg.rotation.x = legSwing;
          ped.rightLeg.rotation.x = -legSwing;
          ped.leftArm.rotation.x = -armSwing;
          ped.rightArm.rotation.x = armSwing;

          // Natural vertical bob
          ped.group.position.y = 0.08 + Math.abs(Math.sin(ped.walkPhase * 2)) * 0.04;
        }
      }
    }
  }
}
