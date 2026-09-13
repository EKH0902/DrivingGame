import * as THREE from 'three';

export type BuildingArchetype =
  | 'curtain_glass'      // High-rise glass tower with reflective mullions
  | 'stepped_artdeco'    // Tiered setback skyscraper with spire
  | 'commercial_mall'    // Wide commercial mall with LED media facade
  | 'cylindrical_tower'  // Futuristic round tower with observation deck
  | 'residential_block'  // Modern apartment with balconies
  | 'high_tech_truss'    // Diagonal braced industrial high-tech tower
  | 'boutique_shops';    // Low-rise street cafe/shops (12-22m) for realistic height contrast

export interface BuildingConfig {
  position: THREE.Vector3;
  width: number;
  depth: number;
  height: number;
  rotationY: number;
  archetype: BuildingArchetype;
  primaryColor: number;
  accentColor: number;
  signText?: string;
  hasHelipad?: boolean;
  hasSpire?: boolean;
}

// Reusable Procedural Canvas Textures for Realistic Building Facades
let _glassTexture: THREE.CanvasTexture | null = null;
let _windowTexture: THREE.CanvasTexture | null = null;
let _residentialTexture: THREE.CanvasTexture | null = null;
let _stoneTexture: THREE.CanvasTexture | null = null;

function getGlassTexture(): THREE.CanvasTexture {
  if (_glassTexture) return _glassTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Bright white & crystal blue glass base gradient
  const grad = ctx.createLinearGradient(0, 0, 256, 512);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#e0f2fe');
  grad.addColorStop(1, '#f8fafc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Glass panel grid with illuminated office lights
  const cols = 8;
  const rows = 16;
  const pw = 256 / cols;
  const ph = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.45;
      const litColor = Math.random() > 0.3 ? '#fef08a' : '#38bdf8'; // warm yellow or crisp cyan
      ctx.fillStyle = isLit ? litColor : '#e2e8f0';
      ctx.fillRect(c * pw + 2, r * ph + 2, pw - 4, ph - 4);

      // Glass reflection diagonal stripe
      if ((r + c) % 5 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(c * pw + 2, r * ph + 2, pw - 4, ph - 4);
      }
    }
  }

  _glassTexture = new THREE.CanvasTexture(canvas);
  _glassTexture.wrapS = THREE.RepeatWrapping;
  _glassTexture.wrapT = THREE.RepeatWrapping;
  return _glassTexture;
}

function getWindowGridTexture(): THREE.CanvasTexture {
  if (_windowTexture) return _windowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Clean white architectural wall
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 256);

  const cols = 8;
  const rows = 8;
  const cw = 256 / cols;
  const ch = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = Math.random() > 0.4;
      ctx.fillStyle = lit ? (Math.random() > 0.5 ? '#fef08a' : '#bae6fd') : '#e2e8f0';
      ctx.fillRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cw + 4, r * ch + 4, cw - 8, ch - 8);
    }
  }

  _windowTexture = new THREE.CanvasTexture(canvas);
  _windowTexture.wrapS = THREE.RepeatWrapping;
  _windowTexture.wrapT = THREE.RepeatWrapping;
  return _windowTexture;
}

function getResidentialTexture(): THREE.CanvasTexture {
  if (_residentialTexture) return _residentialTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff'; // Pristine white apartment wall
  ctx.fillRect(0, 0, 256, 256);

  // Balcony windows and architectural frames
  const cols = 4;
  const rows = 6;
  const cw = 256 / cols;
  const ch = 256 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Window frame
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(c * cw + 6, r * ch + 4, cw - 12, ch - 16);

      // Glass
      ctx.fillStyle = Math.random() > 0.35 ? '#fef08a' : '#38bdf8';
      ctx.fillRect(c * cw + 8, r * ch + 6, cw - 16, ch - 20);

      // Balcony glass railing
      ctx.fillStyle = 'rgba(186, 230, 253, 0.6)';
      ctx.fillRect(c * cw + 4, r * ch + ch - 12, cw - 8, 8);
    }
  }

  _residentialTexture = new THREE.CanvasTexture(canvas);
  _residentialTexture.wrapS = THREE.RepeatWrapping;
  _residentialTexture.wrapT = THREE.RepeatWrapping;
  return _residentialTexture;
}

function createBillboardTexture(title: string, subtitle?: string, bgColor = '#0f172a', accent = '#38bdf8'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, bgColor);
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Glowing neon frame
  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  // Main text
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 46px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.fillText(title, 256, subtitle ? 105 : 128);

  if (subtitle) {
    ctx.shadowBlur = 4;
    ctx.fillStyle = accent;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(subtitle, 256, 175);
  }

  return new THREE.CanvasTexture(canvas);
}

// Rooftop Mechanical Units (AC condensers, water towers, elevator shafts)
function addRooftopMechanicals(group: THREE.Group, roofY: number, width: number, depth: number) {
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });

  // 1. Elevator penthouse room
  const phW = Math.min(width * 0.45, 10);
  const phD = Math.min(depth * 0.45, 10);
  const phH = 4.2;
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(phW, phH, phD), concreteMat);
  penthouse.position.set(0, roofY + phH / 2, 0);
  penthouse.castShadow = true;
  group.add(penthouse);

  // 2. HVAC Cooling units (환기/냉각탑)
  const acCount = Math.min(4, Math.floor((width + depth) / 16));
  for (let i = 0; i < acCount; i++) {
    const ac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.0), metalMat);
    const offsetX = (i % 2 === 0 ? 1 : -1) * (width * 0.28);
    const offsetZ = (i < 2 ? 1 : -1) * (depth * 0.28);
    ac.position.set(offsetX, roofY + 0.9, offsetZ);
    ac.castShadow = true;
    group.add(ac);

    // Fan fan cylinder on top
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.3, 12), metalMat);
    fan.position.set(offsetX, roofY + 1.95, offsetZ);
    group.add(fan);
  }

  // 3. Water tank (원통형 물탱크)
  if (Math.random() > 0.4) {
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3 });
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 3.2, 16), tankMat);
    tank.position.set(-width * 0.25, roofY + 1.6, depth * 0.2);
    tank.castShadow = true;
    group.add(tank);
  }

  // 4. Parapet roof border wall (옥상 난간)
  const borderThick = 0.4;
  const borderH = 1.1;
  const pFront = new THREE.Mesh(new THREE.BoxGeometry(width, borderH, borderThick), concreteMat);
  pFront.position.set(0, roofY + borderH / 2, depth / 2 - borderThick / 2);
  group.add(pFront);

  const pBack = new THREE.Mesh(new THREE.BoxGeometry(width, borderH, borderThick), concreteMat);
  pBack.position.set(0, roofY + borderH / 2, -depth / 2 + borderThick / 2);
  group.add(pBack);

  const pLeft = new THREE.Mesh(new THREE.BoxGeometry(borderThick, borderH, depth), concreteMat);
  pLeft.position.set(-width / 2 + borderThick / 2, roofY + borderH / 2, 0);
  group.add(pLeft);

  const pRight = new THREE.Mesh(new THREE.BoxGeometry(borderThick, borderH, depth), concreteMat);
  pRight.position.set(width / 2 - borderThick / 2, roofY + borderH / 2, 0);
  group.add(pRight);
}

// Helipad Creator
function createHelipadMesh(size: number): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc'; // Clean white helipad surface
  ctx.fillRect(0, 0, 256, 256);

  // Outer safety circle
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();

  // Yellow inner circle
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0, Math.PI * 2);
  ctx.stroke();

  // Bold 'H' symbol
  ctx.fillStyle = '#0284c7';
  ctx.font = '900 110px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('H', 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

// Communication Spire with Aviation Warning Beacon
function addSpire(group: THREE.Group, roofY: number, height = 22) {
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, height, 8), poleMat);
  spire.position.y = roofY + height / 2;
  group.add(spire);

  // Cross antenna arms
  const cross1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.1), poleMat);
  cross1.position.y = roofY + height * 0.7;
  group.add(cross1);

  const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.4), poleMat);
  cross2.position.y = roofY + height * 0.85;
  group.add(cross2);

  // Red blinking hazard sphere
  const redBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  redBeacon.position.y = roofY + height + 0.3;
  group.add(redBeacon);
}

// Main Factory: Create Diverse Building by Archetype
export function createDetailedBuilding(config: BuildingConfig): THREE.Group {
  const group = new THREE.Group();
  group.position.set(config.position.x, 0, config.position.z);
  group.rotation.y = config.rotationY;

  const { width, depth, height, archetype, primaryColor, accentColor } = config;

  switch (archetype) {
    // -------------------------------------------------------------
    // 1. MODERN CURTAIN-WALL GLASS SKYSCRAPER (80m - 150m)
    // -------------------------------------------------------------
    case 'curtain_glass': {
      const glassTex = getGlassTexture().clone();
      glassTex.repeat.set(Math.max(2, Math.round(width / 8)), Math.max(4, Math.round(height / 10)));
      glassTex.needsUpdate = true;

      const glassMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.15,
        metalness: 0.7,
        map: glassTex,
      });

      // Main Glass Shaft
      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), glassMat);
      tower.position.y = height / 2;
      tower.castShadow = true;
      tower.receiveShadow = true;
      group.add(tower);

      // Vertical Accent Mullions (루버 기둥) on corners
      const mullionMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.9, roughness: 0.2 });
      const mSize = 0.45;
      const cornerOffsets = [
        [-width / 2, -depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, depth / 2],
        [width / 2, depth / 2],
      ];
      for (const [cx, cz] of cornerOffsets) {
        const mullion = new THREE.Mesh(new THREE.BoxGeometry(mSize, height + 1, mSize), mullionMat);
        mullion.position.set(cx, height / 2, cz);
        group.add(mullion);
      }

      // Slanted or Stepped Glass Crown
      const crownH = Math.min(14, height * 0.1);
      const crown = new THREE.Mesh(
        new THREE.CylinderGeometry(width * 0.35, width * 0.48, crownH, 4),
        mullionMat
      );
      crown.position.y = height + crownH / 2;
      crown.rotation.y = Math.PI / 4;
      group.add(crown);

      // Ground Floor Entrance Canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 0.4, 4.5), mullionMat);
      canopy.position.set(0, 4.2, depth / 2 + 2.2);
      group.add(canopy);

      // Glass entrance lobby
      const lobbyMat = new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.7 });
      const lobby = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 4.0, 1.2), lobbyMat);
      lobby.position.set(0, 2.0, depth / 2 + 0.6);
      group.add(lobby);

      addRooftopMechanicals(group, height + crownH, width * 0.7, depth * 0.7);

      if (config.hasHelipad) {
        const hp = createHelipadMesh(Math.min(width * 0.65, 14));
        hp.position.set(0, height + crownH + 0.1, 0);
        group.add(hp);
      }

      if (config.hasSpire) {
        addSpire(group, height + crownH, 20);
      }
      break;
    }

    // -------------------------------------------------------------
    // 2. STEPPED ART-DECO / CLASSICAL TOWER (75m - 130m)
    // -------------------------------------------------------------
    case 'stepped_artdeco': {
      const stoneMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.8,
        metalness: 0.15,
      });
      const trimMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.7, roughness: 0.3 });
      const winTex = getWindowGridTexture().clone();
      winTex.repeat.set(3, 8);
      const winMat = new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.4 });

      // Tier 1: Wide Base Podium (35% height)
      const h1 = height * 0.35;
      const t1 = new THREE.Mesh(new THREE.BoxGeometry(width, h1, depth), stoneMat);
      t1.position.y = h1 / 2;
      t1.castShadow = true;
      group.add(t1);

      // Cornice trim 1
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.8, depth + 0.8), trimMat);
      c1.position.y = h1;
      group.add(c1);

      // Tier 2: Mid Tower (35% height, 80% width)
      const h2 = height * 0.35;
      const w2 = width * 0.8;
      const d2 = depth * 0.8;
      const t2 = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), winMat);
      t2.position.y = h1 + h2 / 2;
      t2.castShadow = true;
      group.add(t2);

      // Cornice trim 2
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(w2 + 0.8, 0.8, d2 + 0.8), trimMat);
      c2.position.y = h1 + h2;
      group.add(c2);

      // Tier 3: Upper Tower (20% height, 60% width)
      const h3 = height * 0.20;
      const w3 = width * 0.6;
      const d3 = depth * 0.6;
      const t3 = new THREE.Mesh(new THREE.BoxGeometry(w3, h3, d3), stoneMat);
      t3.position.y = h1 + h2 + h3 / 2;
      t3.castShadow = true;
      group.add(t3);

      // Tier 4: Pinnacle Crown (10% height)
      const h4 = height * 0.10;
      const w4 = width * 0.38;
      const d4 = depth * 0.38;
      const t4 = new THREE.Mesh(new THREE.CylinderGeometry(w4 * 0.3, w4 * 0.5, h4, 8), trimMat);
      t4.position.y = h1 + h2 + h3 + h4 / 2;
      group.add(t4);

      addSpire(group, h1 + h2 + h3 + h4, 24);
      break;
    }

    // -------------------------------------------------------------
    // 3. COMMERCIAL MEGA-MALL & MEDIA PLAZA (28m - 48m)
    // -------------------------------------------------------------
    case 'commercial_mall': {
      const mallWallMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.4,
      });

      // Wide Commercial Building Body
      const mall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mallWallMat);
      mall.position.y = height / 2;
      mall.castShadow = true;
      group.add(mall);

      // Ground floor glass storefront (쇼핑몰 쇼윈도우)
      const storeGlassMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        emissive: 0x1e3a8a,
        emissiveIntensity: 0.3,
        roughness: 0.1,
      });
      const storefront = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 4.5, depth + 0.2), storeGlassMat);
      storefront.position.y = 2.25;
      group.add(storefront);

      // Giant Glowing LED Media Billboard on front facade
      const bbTitle = config.signText || 'METRO MALL';
      const bbTex = createBillboardTexture(bbTitle, 'GRAND OPENING • TAX FREE', '#090d16', '#38bdf8');
      const billboardMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.75, Math.min(height * 0.45, 16)),
        new THREE.MeshBasicMaterial({ map: bbTex })
      );
      billboardMesh.position.set(0, height * 0.58, depth / 2 + 0.15);
      group.add(billboardMesh);

      // Rooftop Green Park & Patio (옥상 정원 및 휴식 테라스)
      const lawnMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 });
      const roofLawn = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.2, depth * 0.85), lawnMat);
      roofLawn.position.y = height + 0.1;
      group.add(roofLawn);

      // Rooftop decorative glass railing
      const railMat = new THREE.MeshPhysicalMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.5 });
      const railing = new THREE.Mesh(new THREE.BoxGeometry(width - 0.4, 1.2, depth - 0.4), railMat);
      railing.position.y = height + 0.6;
      group.add(railing);

      addRooftopMechanicals(group, height, width * 0.3, depth * 0.3);
      break;
    }

    // -------------------------------------------------------------
    // 4. CYLINDRICAL / OVAL LANDMARK TOWER (85m - 140m)
    // -------------------------------------------------------------
    case 'cylindrical_tower': {
      const radius = width / 2;
      const cylGlassMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.15,
        metalness: 0.8,
      });

      // Main Cylinder Tower
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.85, radius, height, 32), cylGlassMat);
      cyl.position.y = height / 2;
      cyl.castShadow = true;
      cyl.receiveShadow = true;
      group.add(cyl);

      // Metallic floor bands every 6 meters
      const bandMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.85, roughness: 0.2 });
      for (let y = 6; y < height - 6; y += 6) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.95 + 0.1, radius * 0.95 + 0.1, 0.6, 32), bandMat);
        band.position.y = y;
        group.add(band);
      }

      // Observation Deck / Sky Lounge (스카이라운지)
      const deckH = 7.5;
      const obsDeckMat = new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.75,
        roughness: 0.1,
      });
      const obsDeck = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.15, radius * 1.05, deckH, 32), obsDeckMat);
      obsDeck.position.y = height - deckH / 2;
      group.add(obsDeck);

      // Crown Ring Truss
      const crown = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.7, 0.4, 8, 32), bandMat);
      crown.position.y = height + 0.5;
      crown.rotation.x = Math.PI / 2;
      group.add(crown);

      addSpire(group, height, 22);

      if (config.hasHelipad) {
        const hp = createHelipadMesh(radius * 1.2);
        hp.position.set(0, height + 0.2, 0);
        group.add(hp);
      }
      break;
    }

    // -------------------------------------------------------------
    // 5. RESIDENTIAL HIGH-RISE APARTMENT (45m - 90m)
    // -------------------------------------------------------------
    case 'residential_block': {
      const resTex = getResidentialTexture().clone();
      resTex.repeat.set(2, Math.max(4, Math.round(height / 12)));
      resTex.needsUpdate = true;

      const resMat = new THREE.MeshStandardMaterial({
        map: resTex,
        roughness: 0.85,
        metalness: 0.1,
      });

      const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), resMat);
      body.position.y = height / 2;
      body.castShadow = true;
      group.add(body);

      // Balcony Ledges on front and back
      const balconyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
      const floors = Math.floor(height / 3.6);
      for (let f = 2; f < floors; f++) {
        const fy = f * 3.6;
        const bFront = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.25, 1.2), balconyMat);
        bFront.position.set(0, fy, depth / 2 + 0.6);
        group.add(bFront);

        const bBack = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.25, 1.2), balconyMat);
        bBack.position.set(0, fy, -depth / 2 - 0.6);
        group.add(bBack);
      }

      addRooftopMechanicals(group, height, width, depth);
      break;
    }

    // -------------------------------------------------------------
    // 6. HIGH-TECH TRUSS SKYSCRAPER (80m - 125m)
    // -------------------------------------------------------------
    case 'high_tech_truss': {
      const crystalGlassMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.15,
        metalness: 0.5,
      });

      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), crystalGlassMat);
      tower.position.y = height / 2;
      tower.castShadow = true;
      group.add(tower);

      // Exterior Diagonal Steel X-Braces
      const trussMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.9, roughness: 0.3 });
      const sectionH = height / 4;

      for (let s = 0; s < 4; s++) {
        const sy = s * sectionH + sectionH / 2;
        const diagLen = Math.hypot(width, sectionH);
        const diagAngle = Math.atan2(sectionH, width);

        // Front Face X
        const d1 = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.45, 0.45), trussMat);
        d1.position.set(0, sy, depth / 2 + 0.25);
        d1.rotation.z = diagAngle;
        group.add(d1);

        const d2 = new THREE.Mesh(new THREE.BoxGeometry(diagLen, 0.45, 0.45), trussMat);
        d2.position.set(0, sy, depth / 2 + 0.25);
        d2.rotation.z = -diagAngle;
        group.add(d2);
      }

      addRooftopMechanicals(group, height, width, depth);
      addSpire(group, height, 26);
      break;
    }

    // -------------------------------------------------------------
    // 7. LOW-RISE STREET BOUTIQUE SHOPS & CAFES (12m - 22m)
    // -------------------------------------------------------------
    case 'boutique_shops':
    default: {
      const shopMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.7,
      });

      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), shopMat);
      building.position.y = height / 2;
      building.castShadow = true;
      group.add(building);

      // Ground floor cafe storefront
      const cafeGlassMat = new THREE.MeshStandardMaterial({
        color: 0x93c5fd,
        emissive: 0xfef08a,
        emissiveIntensity: 0.25,
      });
      const storefront = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 3.2, 0.3), cafeGlassMat);
      storefront.position.set(0, 1.6, depth / 2 + 0.15);
      group.add(storefront);

      // Striped Fabric Awning (카페 차양막)
      const awningMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.9 });
      const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.8, 0.15, 2.0), awningMat);
      awning.position.set(0, 3.4, depth / 2 + 1.0);
      awning.rotation.x = 0.25;
      group.add(awning);

      // Store Sign
      const signText = config.signText || 'CAFE & BAKERY';
      const signTex = createBillboardTexture(signText, undefined, '#1e293b', '#f59e0b');
      const signBoard = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.7, 1.6),
        new THREE.MeshBasicMaterial({ map: signTex })
      );
      signBoard.position.set(0, 4.3, depth / 2 + 0.2);
      group.add(signBoard);

      addRooftopMechanicals(group, height, width * 0.6, depth * 0.6);
      break;
    }
  }

  return group;
}
