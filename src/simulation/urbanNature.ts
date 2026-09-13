import * as THREE from 'three';

// Reusable Materials for Performance
const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x4a3525, // Deep bark brown
  roughness: 0.9,
});

const leafGreenMat1 = new THREE.MeshStandardMaterial({
  color: 0x2e7d32, // Lush vibrant green
  roughness: 0.7,
});

const leafGreenMat2 = new THREE.MeshStandardMaterial({
  color: 0x388e3c, // Forest green
  roughness: 0.75,
});

const leafGreenMat3 = new THREE.MeshStandardMaterial({
  color: 0x4caf50, // Lime garden green
  roughness: 0.65,
});

const treeGrateMat = new THREE.MeshStandardMaterial({
  color: 0x27272a, // Cast iron dark metal
  metalness: 0.8,
  roughness: 0.4,
});

const benchWoodMat = new THREE.MeshStandardMaterial({
  color: 0x854d0e, // Warm teak wood
  roughness: 0.7,
});

const benchSteelMat = new THREE.MeshStandardMaterial({
  color: 0x1e293b,
  metalness: 0.8,
  roughness: 0.3,
});

const hydrantMat = new THREE.MeshStandardMaterial({
  color: 0xdc2626, // Bright red
  metalness: 0.4,
  roughness: 0.3,
});

const bollardMat = new THREE.MeshStandardMaterial({
  color: 0xfacc15, // Yellow safety bollard
  metalness: 0.2,
  roughness: 0.4,
});

// Reusable Geometries
const trunkGeo = new THREE.CylinderGeometry(0.22, 0.35, 3.2, 8);
const leafSphereGeo1 = new THREE.DodecahedronGeometry(1.9, 1);
const leafSphereGeo2 = new THREE.DodecahedronGeometry(1.5, 1);
const leafSphereGeo3 = new THREE.DodecahedronGeometry(1.3, 1);
const pineConeGeo = new THREE.ConeGeometry(2.0, 4.8, 8);

/**
 * Creates a lush urban street deciduous tree (풍성한 가로수)
 */
export function createStreetTree(hasGrate = true): THREE.Group {
  const tree = new THREE.Group();

  // Cast-Iron Tree Grate at base on sidewalk
  if (hasGrate) {
    const grate = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 1.8), treeGrateMat);
    grate.position.y = 0.025;
    grate.receiveShadow = true;
    tree.add(grate);
  }

  // Trunk
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.6;
  trunk.castShadow = true;
  tree.add(trunk);

  // Multi-cluster leafy canopy for organic, realistic look
  const cluster1 = new THREE.Mesh(leafSphereGeo1, leafGreenMat1);
  cluster1.position.set(0, 3.8, 0);
  cluster1.scale.set(1.1, 1.2, 1.1);
  cluster1.castShadow = true;
  tree.add(cluster1);

  const cluster2 = new THREE.Mesh(leafSphereGeo2, leafGreenMat2);
  cluster2.position.set(0.6, 4.4, 0.5);
  cluster2.castShadow = true;
  tree.add(cluster2);

  const cluster3 = new THREE.Mesh(leafSphereGeo2, leafGreenMat3);
  cluster3.position.set(-0.5, 4.2, -0.4);
  cluster3.castShadow = true;
  tree.add(cluster3);

  const clusterTop = new THREE.Mesh(leafSphereGeo3, leafGreenMat1);
  clusterTop.position.set(0.1, 5.3, 0.1);
  clusterTop.castShadow = true;
  tree.add(clusterTop);

  return tree;
}

/**
 * Creates a conical evergreen pine tree for park plazas
 */
export function createPineTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.2, 8), trunkMat);
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  // 3-tiered pine needles
  for (let i = 0; i < 3; i++) {
    const scale = 1.0 - i * 0.22;
    const cone = new THREE.Mesh(pineConeGeo, leafGreenMat2);
    cone.scale.set(scale, scale, scale);
    cone.position.y = 2.8 + i * 1.5;
    cone.castShadow = true;
    tree.add(cone);
  }

  return tree;
}

/**
 * Creates an elegant park bench (우드/스틸 벤치)
 */
export function createParkBench(): THREE.Group {
  const bench = new THREE.Group();

  // Wood seat planks
  const seatPlank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), benchWoodMat);
  seatPlank.position.set(0, 0.45, 0);
  seatPlank.castShadow = true;
  bench.add(seatPlank);

  // Wood backrest
  const backPlank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.08), benchWoodMat);
  backPlank.position.set(0, 0.75, -0.22);
  backPlank.castShadow = true;
  bench.add(backPlank);

  // Steel legs
  const legGeo = new THREE.BoxGeometry(0.08, 0.5, 0.55);
  for (const x of [-0.85, 0.85]) {
    const leg = new THREE.Mesh(legGeo, benchSteelMat);
    leg.position.set(x, 0.25, 0);
    bench.add(leg);
  }

  return bench;
}

/**
 * Creates a pedestrian safety bollard (안전 볼라드)
 */
export function createBollard(): THREE.Group {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.85, 12), bollardMat);
  post.position.y = 0.425;
  post.castShadow = true;
  group.add(post);

  // Reflective tape ring
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ring.position.y = 0.7;
  group.add(ring);

  return group;
}

/**
 * Creates a red urban fire hydrant (소화전)
 */
export function createFireHydrant(): THREE.Group {
  const hydrant = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.75, 12), hydrantMat);
  body.position.y = 0.375;
  body.castShadow = true;
  hydrant.add(body);

  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), hydrantMat);
  cap.position.y = 0.75;
  hydrant.add(cap);

  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 8), hydrantMat);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0, 0.45, 0);
  hydrant.add(nozzle);

  return hydrant;
}

/**
 * Creates a sidewalk planter box with colorful blooming flowers
 */
export function createFlowerPlanter(): THREE.Group {
  const planter = new THREE.Group();

  // Stone planter box
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 1.2), boxMat);
  box.position.y = 0.3;
  box.castShadow = true;
  box.receiveShadow = true;
  planter.add(box);

  // Soil
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.1, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 })
  );
  soil.position.y = 0.58;
  planter.add(soil);

  // Foliage and flowers
  const colors = [0xec4899, 0xf59e0b, 0x8b5cf6, 0xffffff]; // pink, yellow, purple, white
  for (let i = 0; i < 6; i++) {
    const flowerMat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), flowerMat);
    const fx = -0.8 + (i % 3) * 0.8;
    const fz = (i < 3 ? -0.25 : 0.25);
    flower.position.set(fx, 0.75, fz);
    planter.add(flower);

    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.26, 6, 6), leafGreenMat1);
    bush.position.set(fx, 0.68, fz);
    planter.add(bush);
  }

  return planter;
}
