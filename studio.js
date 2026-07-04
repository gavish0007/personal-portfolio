import * as THREE from 'three';

/* ============================================================
   PALETTE (mirrors styles.css tokens)
   ============================================================ */
const COLOR = {
  canvasTeal: 0x12333A,
  canvasTealDeep: 0x0C2429,
  duskNavy: 0x1B3B4B,
  amber: 0xE8A560,
  amberSoft: 0xF0C08A,
  rose: 0xDB6E86,
  parchment: 0xF3E9D8,
  parchmentDim: 0xD9CCB4,
  sage: 0x8FA89C,
  wood: 0x6B4A3A,
  woodLight: 0x8A5D45,
  woodDark: 0x4A3226,
  gold: 0xC9A227,
  ink: 0x0A1F24,
};

/* ============================================================
   BASIC SETUP
   ============================================================ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLOR.canvasTealDeep, 0.028);
scene.background = new THREE.Color(COLOR.canvasTealDeep);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const OVERVIEW_POS = new THREE.Vector3(0, 5.2, 15.5);
const OVERVIEW_LOOK = new THREE.Vector3(0, 1.6, -2);
camera.position.copy(OVERVIEW_POS);
camera.lookAt(OVERVIEW_LOOK);

/* ============================================================
   LIGHTING
   ============================================================ */
const hemi = new THREE.HemisphereLight(COLOR.duskNavy, COLOR.woodDark, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(COLOR.amberSoft, 1.6);
sun.position.set(8, 9, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -14;
sun.shadow.camera.far = 40;
sun.shadow.bias = -0.0015;
scene.add(sun);

const windowGlow = new THREE.PointLight(COLOR.amber, 12, 18, 2);
windowGlow.position.set(-9.5, 4.5, -6.5);
scene.add(windowGlow);

const fillGlow = new THREE.PointLight(COLOR.rose, 6, 16, 2);
fillGlow.position.set(6, 3, 2);
scene.add(fillGlow);

/* ============================================================
   ROOM SHELL
   ============================================================ */
const floorGeo = new THREE.PlaneGeometry(46, 30, 1, 1);
const floorMat = new THREE.MeshStandardMaterial({ color: COLOR.wood, roughness: 0.9, metalness: 0.02 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

// subtle floor plank lines
const plankMat = new THREE.MeshStandardMaterial({ color: COLOR.woodDark, roughness: 0.95 });
for (let i = -10; i <= 10; i += 1.4) {
  const plank = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 30), plankMat);
  plank.rotation.x = -Math.PI / 2;
  plank.position.set(i, 0.001, 0);
  scene.add(plank);
}

const backWallMat = new THREE.MeshStandardMaterial({ color: COLOR.canvasTeal, roughness: 1 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(46, 16), backWallMat);
backWall.position.set(0, 8, -8);
backWall.receiveShadow = true;
scene.add(backWall);

// baseboard trim
const trim = new THREE.Mesh(new THREE.BoxGeometry(46, 0.4, 0.15), new THREE.MeshStandardMaterial({ color: COLOR.woodDark }));
trim.position.set(0, 0.2, -7.9);
scene.add(trim);

// window (glowing panel) on back wall, left side
const windowFrameMat = new THREE.MeshStandardMaterial({ color: COLOR.woodDark, roughness: 0.8 });
const windowGroup = new THREE.Group();
const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.6, 0.2), windowFrameMat);
const windowPane = new THREE.Mesh(
  new THREE.PlaneGeometry(3.1, 4.1),
  new THREE.MeshStandardMaterial({ color: COLOR.amberSoft, emissive: COLOR.amber, emissiveIntensity: 1.1, roughness: 0.4 })
);
windowPane.position.z = 0.11;
const muntinV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.1, 0.15), windowFrameMat);
muntinV.position.z = 0.12;
const muntinH = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.15), windowFrameMat);
muntinH.position.z = 0.12;
windowGroup.add(windowFrame, windowPane, muntinV, muntinH);
windowGroup.position.set(-9.5, 4.6, -7.85);
scene.add(windowGroup);

/* ============================================================
   HELPERS
   ============================================================ */
function box(w, h, d, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.75, metalness: opts.metalness ?? 0.05, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, color, seg = 16, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.6, metalness: opts.metalness ?? 0.1 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
function cone(r, h, color, seg = 20) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }));
  m.castShadow = true;
  return m;
}
function torus(r, tube, color) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 24), new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.4 }));
  m.castShadow = true;
  return m;
}

/* ============================================================
   PROP BUILDERS — each returns a THREE.Group
   ============================================================ */

// -- About: reading nook (bench + plant + name plaque) --
function buildAbout() {
  const g = new THREE.Group();
  const bench = box(1.8, 0.15, 0.7, COLOR.wood);
  bench.position.set(0, 0.65, 0);
  const legMat = COLOR.woodDark;
  [[-0.75, -0.25], [0.75, -0.25], [-0.75, 0.25], [0.75, 0.25]].forEach(([x, z]) => {
    const leg = box(0.1, 0.65, 0.1, legMat);
    leg.position.set(x, 0.325, z);
    g.add(leg);
  });
  g.add(bench);

  // plant
  const pot = cyl(0.28, 0.22, 0.4, COLOR.woodLight);
  pot.position.set(-1.5, 0.2, 0.3);
  const foliage = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const leaf = cone(0.22, 0.7, 0x4C7A5E);
    leaf.position.set(Math.cos(i) * 0.12, 0.5 + i * 0.08, Math.sin(i) * 0.12);
    leaf.rotation.z = (Math.random() - 0.5) * 0.4;
    foliage.add(leaf);
  }
  foliage.position.set(-1.5, 0.4, 0.3);
  g.add(pot, foliage);

  // name plaque (portrait frame)
  const frame = box(1.1, 1.4, 0.06, COLOR.woodDark);
  frame.position.set(1.6, 1.4, -0.35);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshStandardMaterial({ color: COLOR.parchment }));
  plaque.position.set(1.6, 1.4, -0.31);
  g.add(frame, plaque);

  return g;
}

// -- Academics: bookshelf + graduation cap --
function buildAcademics() {
  const g = new THREE.Group();
  const shelfMat = COLOR.wood;
  const back = box(2.4, 3, 0.1, COLOR.woodDark);
  back.position.set(0, 1.5, -0.25);
  g.add(back);
  const sides = [-1.2, 1.2];
  sides.forEach((x) => {
    const side = box(0.1, 3, 0.6, shelfMat);
    side.position.set(x, 1.5, 0);
    g.add(side);
  });
  [0.1, 1.1, 2.1, 2.9].forEach((y) => {
    const shelf = box(2.4, 0.08, 0.6, shelfMat);
    shelf.position.set(0, y, 0);
    g.add(shelf);
  });
  const bookColors = [COLOR.rose, COLOR.amber, 0x4C7A5E, COLOR.sage, 0x8A4A3C, COLOR.gold];
  for (let row = 0; row < 2; row++) {
    let x = -1.05;
    for (let i = 0; i < 8; i++) {
      const w = 0.11 + Math.random() * 0.06;
      const h = 0.55 + Math.random() * 0.3;
      const bk = box(w, h, 0.45, bookColors[i % bookColors.length]);
      bk.position.set(x + w / 2, 0.5 + row * 1 + h / 2, 0);
      bk.rotation.z = (Math.random() - 0.5) * 0.03;
      g.add(bk);
      x += w + 0.02;
    }
  }
  // grad cap on top
  const capBoard = box(0.6, 0.06, 0.6, 0x1B1B1B);
  capBoard.position.set(0, 3.2, 0.1);
  capBoard.rotation.y = 0.3;
  const capBase = cyl(0.22, 0.24, 0.2, 0x1B1B1B);
  capBase.position.set(0, 3.08, 0.1);
  const tassel = cyl(0.015, 0.015, 0.35, COLOR.gold);
  tassel.position.set(0.28, 3.05, 0.28);
  g.add(capBoard, capBase, tassel);

  return g;
}

// -- Resume: podium with paper stack + pen --
function buildResume() {
  const g = new THREE.Group();
  const podium = box(0.9, 1.1, 0.6, COLOR.wood);
  podium.position.set(0, 0.55, 0);
  const podiumTop = box(1.1, 0.08, 0.8, COLOR.woodLight);
  podiumTop.position.set(0, 1.14, 0);
  podiumTop.rotation.x = -0.15;
  g.add(podium, podiumTop);

  for (let i = 0; i < 5; i++) {
    const paper = box(0.55, 0.015, 0.7, COLOR.parchment);
    paper.position.set(0, 1.2 + i * 0.02, 0.05 - i * 0.01);
    paper.rotation.x = -0.15;
    paper.rotation.z = (Math.random() - 0.5) * 0.05;
    g.add(paper);
  }
  const pen = cyl(0.015, 0.015, 0.5, 0x2C2C2C);
  pen.rotation.z = Math.PI / 2.3;
  pen.position.set(0.25, 1.3, 0.15);
  g.add(pen);

  return g;
}

// -- Skills: toolbox + gear + wrench --
function buildSkills() {
  const g = new THREE.Group();
  const boxBody = box(1.1, 0.6, 0.65, COLOR.amber, { roughness: 0.5, metalness: 0.2 });
  boxBody.position.set(0, 0.4, 0);
  const boxLid = box(1.15, 0.12, 0.7, COLOR.rose, { roughness: 0.5, metalness: 0.2 });
  boxLid.position.set(0, 0.72, 0);
  const handle = torus(0.18, 0.03, COLOR.woodDark);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, 0.86, 0);
  g.add(boxBody, boxLid, handle);

  const gear = torus(0.28, 0.09, COLOR.gold);
  gear.position.set(-0.9, 0.5, 0.3);
  gear.rotation.x = Math.PI / 2;
  const wrenchHandle = box(0.5, 0.08, 0.05, 0x8A8A8A, { metalness: 0.6, roughness: 0.3 });
  wrenchHandle.position.set(0.85, 0.55, 0.35);
  wrenchHandle.rotation.z = 0.6;
  g.add(gear, wrenchHandle);

  return g;
}

// -- Paintings: easel with canvas + stool + palette --
function buildPaintings(paintingTexture) {
  const g = new THREE.Group();
  const legMat = COLOR.woodDark;
  const legGeoAngle = 0.35;
  const legFront = cyl(0.035, 0.035, 2, legMat, 8);
  legFront.position.set(0, 1, 0.55);
  legFront.rotation.x = legGeoAngle;
  const legBackL = cyl(0.035, 0.035, 2, legMat, 8);
  legBackL.position.set(-0.5, 1, -0.35);
  legBackL.rotation.x = -legGeoAngle * 0.6;
  legBackL.rotation.z = 0.12;
  const legBackR = cyl(0.035, 0.035, 2, legMat, 8);
  legBackR.position.set(0.5, 1, -0.35);
  legBackR.rotation.x = -legGeoAngle * 0.6;
  legBackR.rotation.z = -0.12;
  g.add(legFront, legBackL, legBackR);

  const crossbar = box(1.1, 0.06, 0.06, legMat);
  crossbar.position.set(0, 0.9, 0.1);
  g.add(crossbar);

  const canvasMat = paintingTexture
    ? new THREE.MeshStandardMaterial({ map: paintingTexture, roughness: 0.85 })
    : new THREE.MeshStandardMaterial({ color: COLOR.parchment, roughness: 0.85 });
  const canvasFrame = box(1.35, 1.05, 0.05, 0xEDE3D0);
  canvasFrame.position.set(0, 1.6, 0.05);
  const canvasArt = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.92), canvasMat);
  canvasArt.position.set(0, 1.6, 0.081);
  g.add(canvasFrame, canvasArt);

  // stool
  const stoolSeat = cyl(0.32, 0.32, 0.08, COLOR.wood);
  stoolSeat.position.set(1.1, 0.55, -0.6);
  g.add(stoolSeat);
  [[-0.22, -0.75], [0.22, -0.75], [0, -0.45]].forEach(([dx, dz]) => {
    const leg = cyl(0.025, 0.025, 0.5, COLOR.woodDark, 8);
    leg.position.set(1.1 + dx, 0.28, -0.6 + dz);
    g.add(leg);
  });

  // palette
  const palette = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), new THREE.MeshStandardMaterial({ color: COLOR.woodLight }));
  palette.rotation.x = -Math.PI / 2;
  palette.position.set(-1.1, 0.42, -0.3);
  const dots = [COLOR.amber, COLOR.rose, 0x4C7A5E, COLOR.gold, 0xF3E9D8];
  dots.forEach((c, i) => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 10), new THREE.MeshStandardMaterial({ color: c }));
    dot.rotation.x = -Math.PI / 2;
    const a = (i / dots.length) * Math.PI * 1.6;
    dot.position.set(-1.1 + Math.cos(a) * 0.13, 0.425, -0.3 + Math.sin(a) * 0.13);
    g.add(dot);
  });
  g.add(palette);

  return g;
}

// -- Music: upright piano + bench --
function buildMusic() {
  const g = new THREE.Group();
  const body = box(1.7, 1.3, 0.6, COLOR.woodDark, { roughness: 0.4 });
  body.position.set(0, 0.95, 0);
  const top = box(1.75, 0.1, 0.65, COLOR.woodDark);
  top.position.set(0, 1.65, 0);
  g.add(body, top);

  const keyBedWhite = box(1.5, 0.06, 0.35, 0xF3E9D8);
  keyBedWhite.position.set(0, 0.75, 0.32);
  g.add(keyBedWhite);
  const blackKeyMat = new THREE.MeshStandardMaterial({ color: 0x1B1B1B });
  for (let i = 0; i < 10; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.2), blackKeyMat);
    bk.position.set(-0.68 + i * 0.145, 0.79, 0.38);
    g.add(bk);
  }

  const musicStand = box(0.9, 0.5, 0.03, COLOR.woodDark);
  musicStand.position.set(0, 1.35, 0.15);
  musicStand.rotation.x = -0.35;
  g.add(musicStand);

  // bench
  const benchTop = box(0.9, 0.1, 0.4, COLOR.wood);
  benchTop.position.set(0, 0.55, 0.85);
  g.add(benchTop);
  [[-0.35, -0.15], [0.35, -0.15], [-0.35, 0.15], [0.35, 0.15]].forEach(([dx, dz]) => {
    const leg = cyl(0.03, 0.03, 0.5, COLOR.woodDark, 8);
    leg.position.set(dx, 0.28, 0.85 + dz);
    g.add(leg);
  });

  return g;
}

// -- Projects: desk with laptop + mug --
function buildProjects() {
  const g = new THREE.Group();
  const deskTop = box(1.8, 0.08, 0.9, COLOR.wood);
  deskTop.position.set(0, 0.85, 0);
  g.add(deskTop);
  [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(([x, z]) => {
    const leg = box(0.08, 0.85, 0.08, COLOR.woodDark);
    leg.position.set(x, 0.425, z);
    g.add(leg);
  });

  const laptopBase = box(0.6, 0.04, 0.42, 0x3A3A3A, { metalness: 0.5, roughness: 0.3 });
  laptopBase.position.set(-0.2, 0.91, -0.1);
  const laptopScreen = box(0.6, 0.4, 0.03, 0x3A3A3A, { metalness: 0.5, roughness: 0.3, emissive: COLOR.amberSoft, emissiveIntensity: 0.5 });
  laptopScreen.position.set(-0.2, 1.11, -0.3);
  laptopScreen.rotation.x = -0.25;
  g.add(laptopBase, laptopScreen);

  const mug = cyl(0.08, 0.07, 0.13, COLOR.rose);
  mug.position.set(0.55, 0.95, 0.15);
  g.add(mug);

  return g;
}

// -- Achievements: shelf with trophies + medal --
function buildAchievements() {
  const g = new THREE.Group();
  const shelf = box(1.8, 0.08, 0.5, COLOR.wood);
  shelf.position.set(0, 1.1, 0);
  const bracketL = box(0.08, 0.4, 0.5, COLOR.woodDark);
  bracketL.position.set(-0.8, 0.9, 0);
  const bracketR = box(0.08, 0.4, 0.5, COLOR.woodDark);
  bracketR.position.set(0.8, 0.9, 0);
  g.add(shelf, bracketL, bracketR);

  [-0.55, 0, 0.55].forEach((x, i) => {
    const cupBase = cyl(0.09, 0.11, 0.1, COLOR.gold, 16, { roughness: 0.3, metalness: 0.7 });
    cupBase.position.set(x, 1.2, 0);
    const cupBody = cyl(0.12, 0.06, 0.22, COLOR.gold, 16, { roughness: 0.3, metalness: 0.7 });
    cupBody.position.set(x, 1.35, 0);
    const cupNeck = cyl(0.04, 0.08, 0.1, COLOR.gold, 16, { roughness: 0.3, metalness: 0.7 });
    cupNeck.position.set(x, 1.5, 0);
    g.add(cupBase, cupBody, cupNeck);
  });

  const medal = torus(0.14, 0.03, COLOR.gold);
  medal.position.set(0, 1.75, 0.15);
  const ribbon = box(0.1, 0.2, 0.02, COLOR.rose);
  ribbon.position.set(0, 1.9, 0.15);
  g.add(medal, ribbon);

  return g;
}

// -- Contact: side table with vintage phone --
function buildContact() {
  const g = new THREE.Group();
  const table = cyl(0.4, 0.32, 0.7, COLOR.woodLight);
  table.position.set(0, 0.35, 0);
  g.add(table);

  const phoneBase = box(0.32, 0.14, 0.28, 0x8A4A3C, { roughness: 0.4 });
  phoneBase.position.set(0, 0.77, 0);
  const phoneBody = cyl(0.1, 0.12, 0.14, 0x8A4A3C, 12, { roughness: 0.4 });
  phoneBody.position.set(0, 0.9, 0);
  const receiver = cyl(0.035, 0.035, 0.32, 0x2C2C2C, 10);
  receiver.rotation.z = Math.PI / 2;
  receiver.position.set(0.05, 1.0, 0.05);
  g.add(phoneBase, phoneBody, receiver);

  const envelope = box(0.22, 0.02, 0.16, COLOR.parchment);
  envelope.position.set(-0.18, 0.71, 0.15);
  envelope.rotation.y = 0.3;
  g.add(envelope);

  return g;
}

/* ============================================================
   SECTION REGISTRY
   ============================================================ */
const textureLoader = new THREE.TextureLoader();

const SECTIONS = [
  { key: 'about', x: -10.4, z: -2, build: buildAbout, focus: { x: -10.4, y: 2.6, z: 3.2 }, look: { x: -10.4, y: 1.2, z: -1 } },
  { key: 'academics', x: -7.8, z: -3, build: buildAcademics, focus: { x: -7.8, y: 2.6, z: 2.6 }, look: { x: -7.8, y: 1.6, z: -2 } },
  { key: 'resume', x: -5.2, z: -2.2, build: buildResume, focus: { x: -5.2, y: 2.2, z: 1.8 }, look: { x: -5.2, y: 1.0, z: -1.6 } },
  { key: 'skills', x: -2.6, z: -2.6, build: buildSkills, focus: { x: -2.6, y: 1.8, z: 1.6 }, look: { x: -2.6, y: 0.6, z: -2 } },
  { key: 'paintings', x: 0, z: -1.4, build: () => buildPaintings(null), focus: { x: 0, y: 2.3, z: 3.4 }, look: { x: 0, y: 1.5, z: -1 } },
  { key: 'music', x: 2.8, z: -2.4, build: buildMusic, focus: { x: 2.8, y: 2.2, z: 3.2 }, look: { x: 2.8, y: 1.1, z: -1.8 } },
  { key: 'projects', x: 5.4, z: -2.2, build: buildProjects, focus: { x: 5.4, y: 2.2, z: 2.4 }, look: { x: 5.4, y: 1.0, z: -1.8 } },
  { key: 'achievements', x: 7.9, z: -2.8, build: buildAchievements, focus: { x: 7.9, y: 2.6, z: 2.6 }, look: { x: 7.9, y: 1.6, z: -2.2 } },
  { key: 'contact', x: 10.4, z: -2.2, build: buildContact, focus: { x: 10.4, y: 1.9, z: 2.4 }, look: { x: 10.4, y: 0.8, z: -1.8 } },
];

const sectionGroups = {};
const clickableMeshes = [];

SECTIONS.forEach((s) => {
  const g = s.key === 'paintings' ? buildPaintings(null) : s.build();
  g.position.set(s.x, 0, s.z);
  g.userData.section = s.key;
  scene.add(g);
  sectionGroups[s.key] = g;
  g.traverse((child) => {
    if (child.isMesh) {
      child.userData.section = s.key;
      clickableMeshes.push(child);
    }
  });

  // floor spotlight per prop for a gallery feel
  const spot = new THREE.PointLight(COLOR.amberSoft, 3.2, 7, 2.2);
  spot.position.set(s.x, 3, s.z + 1.5);
  scene.add(spot);
});

// load the real painting onto the easel canvas once available
textureLoader.load('assets/painting1.jpg', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  const oldGroup = sectionGroups.paintings;
  scene.remove(oldGroup);
  const newGroup = buildPaintings(tex);
  newGroup.position.set(0, 0, -1.4);
  newGroup.userData.section = 'paintings';
  newGroup.traverse((child) => {
    if (child.isMesh) {
      child.userData.section = 'paintings';
      clickableMeshes.push(child);
    }
  });
  scene.add(newGroup);
  sectionGroups.paintings = newGroup;
});

/* ============================================================
   AMBIENT DUST PARTICLES
   ============================================================ */
const particleCount = 140;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 26;
  positions[i * 3 + 1] = Math.random() * 6 + 0.2;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particleMat = new THREE.PointsMaterial({ color: COLOR.amberSoft, size: 0.03, transparent: true, opacity: 0.5 });
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

/* ============================================================
   CAMERA FLIGHT
   ============================================================ */
let flight = null; // { fromPos, toPos, fromLook, toLook, start, duration }
let currentLook = OVERVIEW_LOOK.clone();

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function flyTo(targetPos, targetLook, duration = 1800) {
  flight = {
    fromPos: camera.position.clone(),
    toPos: targetPos.clone(),
    fromLook: currentLook.clone(),
    toLook: targetLook.clone(),
    start: performance.now(),
    duration,
  };
}

function updateFlight(now) {
  if (!flight) return;
  const t = Math.min(1, (now - flight.start) / flight.duration);
  const e = easeInOutCubic(t);
  camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
  currentLook.lerpVectors(flight.fromLook, flight.toLook, e);
  camera.lookAt(currentLook);
  if (t >= 1) flight = null;
}

/* ============================================================
   UI WIRING
   ============================================================ */
const menu = document.getElementById('studioMenu');
const panel = document.getElementById('studioPanel');
const panelBody = document.getElementById('panelBody');
const panelClose = document.getElementById('panelClose');
const hint = document.getElementById('studioHint');
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');

function setActiveMenu(key) {
  menu.querySelectorAll('.menu-item').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.section === key);
  });
}

function goToSection(key) {
  setActiveMenu(key);
  if (key === 'overview') {
    flyTo(OVERVIEW_POS, OVERVIEW_LOOK);
    closePanel();
    hint.style.opacity = '1';
    return;
  }
  const s = SECTIONS.find((sec) => sec.key === key);
  if (!s) return;
  flyTo(new THREE.Vector3(s.focus.x, s.focus.y, s.focus.z), new THREE.Vector3(s.look.x, s.look.y, s.look.z));
  hint.style.opacity = '0';
  setTimeout(() => openPanel(key), 550);
}

function openPanel(key) {
  panelBody.innerHTML = CONTENT[key] || '';
  panel.classList.add('is-open');
}
function closePanel() {
  panel.classList.remove('is-open');
}

menu.addEventListener('click', (e) => {
  const btn = e.target.closest('.menu-item');
  if (!btn) return;
  goToSection(btn.dataset.section);
});
panelClose.addEventListener('click', () => goToSection('overview'));

// click-on-object navigation
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
canvas.addEventListener('click', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (hits.length) {
    const key = hits[0].object.userData.section;
    if (key) goToSection(key);
  }
});
canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  canvas.style.cursor = hits.length ? 'pointer' : 'default';
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================================================
   PANEL CONTENT
   ============================================================ */
const CONTENT = {
  about: `
    <span class="eyebrow">Chapter — About</span>
    <h2>The story so far.</h2>
    <p class="lede">Sometimes it's Java or C++. Sometimes it's brushstrokes on a canvas. Sometimes it's the quiet language of music.</p>
    <p>I'm Gavish — a Computer Science student driven by curiosity and creativity. I enjoy building meaningful digital experiences, exploring new technologies, painting ideas into color, and finding inspiration in melodies that stay with me long after they end.</p>
    <p>To me, every project is a chance to blend logic with imagination and create something that feels alive.</p>
  `,
  academics: `
    <span class="eyebrow">Chapter — Academics</span>
    <h2>Where the foundation was laid.</h2>
    <div class="panel-entry">
      <span class="when">2024 – Expected 2028</span>
      <h4>B.Tech, Computer Science & Engineering</h4>
      <div class="where">Jaypee Institute of Information Technology, Noida</div>
    </div>
    <div class="panel-entry">
      <span class="when">2024</span>
      <h4>Class XII, CBSE</h4>
      <div class="where">Score: 77.4%</div>
    </div>
    <div class="panel-stub">Send coursework, specializations, or CGPA and I'll add them here.</div>
  `,
  resume: `
    <span class="eyebrow">Chapter — Resume</span>
    <h2>The formal version.</h2>
    <div class="panel-actions">
      <a class="btn btn-primary" style="color:#0A1F24;" href="assets/gavish-nagar-resume.pdf" download>Download PDF</a>
    </div>
    <div class="panel-block" style="margin-top:1.6rem;">
      <h3>Experience</h3>
      <div class="panel-entry">
        <span class="when">May 2026 – Jul 2026</span>
        <h4>Frontend Developer Intern</h4>
        <div class="where">Tectigon IT Solutions · Remote</div>
        <ul>
          <li>Built a 7-page Intern Management Dashboard (tasks, attendance, standups, resources, profile).</li>
          <li>Implemented search, filtering, and responsive navigation in vanilla JavaScript.</li>
        </ul>
      </div>
    </div>
    <div class="panel-block">
      <h3>Skills at a glance</h3>
      <div class="panel-pills">
        <span class="panel-pill">C++</span><span class="panel-pill">Java</span><span class="panel-pill">JavaScript</span>
        <span class="panel-pill">Python</span><span class="panel-pill">SQL</span><span class="panel-pill">Git</span>
      </div>
    </div>
  `,
  skills: `
    <span class="eyebrow">Chapter — Skills</span>
    <h2>The toolkit.</h2>
    <p class="lede">A closer look at the languages, frameworks and tools I reach for.</p>
    <div class="panel-block">
      <h3>Languages</h3>
      <div class="panel-pills"><span class="panel-pill">C++</span><span class="panel-pill">Java</span><span class="panel-pill">JavaScript</span><span class="panel-pill">Python</span><span class="panel-pill">SQL</span></div>
    </div>
    <div class="panel-block">
      <h3>Web</h3>
      <div class="panel-pills"><span class="panel-pill">HTML5</span><span class="panel-pill">CSS3</span><span class="panel-pill">JavaScript</span></div>
    </div>
    <div class="panel-block">
      <h3>Tools</h3>
      <div class="panel-pills"><span class="panel-pill">Git</span><span class="panel-pill">GitHub</span><span class="panel-pill">Android Studio</span><span class="panel-pill">MySQL</span></div>
    </div>
    <div class="panel-stub">Send proficiency levels or new tools and I'll refine this shelf.</div>
  `,
  paintings: `
    <span class="eyebrow">Side Quests — Paintings</span>
    <h2>Canvas & color.</h2>
    <div class="panel-frame"><img src="assets/painting1.jpg" alt="Oil painting of a campfire by a lake at golden hour"></div>
    <div class="panel-caption">Campfire at Golden Hour — oil on canvas</div>
    <p>A quiet lakeside evening — pine silhouettes, a dusk sky, and firelight reflected on still water.</p>
    <div class="panel-stub">Send more paintings (with titles, medium, and a line about each) and I'll fill the rest of the easel's rotation.</div>
  `,
  music: `
    <span class="eyebrow">Chapter — Music</span>
    <h2>Piano.</h2>
    <p class="lede">Melodies I return to, and a few of my own.</p>
    <div class="panel-stub">Share how long you've played, favorite pieces, or recordings to embed, and I'll compose this chapter.</div>
  `,
  projects: `
    <span class="eyebrow">Chapter — Projects</span>
    <h2>Things I've built.</h2>
    <div class="panel-entry">
      <h4>Tectigon Intern Hub</h4>
      <div class="where">HTML · CSS · JavaScript</div>
      <p>A responsive 7-page internship management dashboard with modules for tasks, attendance, standups, learning resources and profile management.</p>
    </div>
    <div class="panel-entry">
      <h4>Sammarshya Employee Portal</h4>
      <div class="where">HTML · CSS · JavaScript</div>
      <p>An employee portal with Kanban-style task management, attendance tracking, leave management and LocalStorage persistence.</p>
    </div>
    <div class="panel-entry">
      <h4>MindLog: Mental Health Journal App</h4>
      <div class="where">Java · Android Studio · Room · SQLite</div>
      <p>An in-progress Android app for mood tracking and visualization.</p>
    </div>
    <div class="panel-entry">
      <h4>Terminal Social Network Analyzer</h4>
      <div class="where">C++ · STL</div>
      <p>Dijkstra's Algorithm, PageRank and Label Propagation for graph-based social network analysis.</p>
    </div>
    <div class="panel-stub">Send GitHub links, live demos, and screenshots and I'll turn these into full case studies.</div>
  `,
  achievements: `
    <span class="eyebrow">Chapter — Achievements</span>
    <h2>Milestones.</h2>
    <div class="panel-stub">Send awards, hackathon wins, certifications or rankings — with dates — and I'll place them on this shelf.</div>
  `,
  contact: `
    <span class="eyebrow">Chapter — Contact</span>
    <h2>Let's talk.</h2>
    <p class="lede">A message, a project, an idea — I'd genuinely like to hear it.</p>
    <div class="panel-contact-grid">
      <a class="panel-contact-item" href="mailto:gavishnagar38@gmail.com"><span class="label">Email</span>gavishnagar38@gmail.com</a>
      <a class="panel-contact-item" href="tel:+918221853001"><span class="label">Phone</span>+91 82218 53001</a>
      <a class="panel-contact-item" href="https://linkedin.com/in/gavishnagar" target="_blank" rel="noopener"><span class="label">LinkedIn</span>/in/gavishnagar</a>
      <a class="panel-contact-item" href="https://github.com/gavishnagar" target="_blank" rel="noopener"><span class="label">GitHub</span>/gavishnagar</a>
    </div>
  `,
};

/* ============================================================
   RENDER LOOP
   ============================================================ */
function animate(now) {
  requestAnimationFrame(animate);
  updateFlight(now);

  // gentle idle drift when parked at overview
  if (!flight) {
    const t = now * 0.00006;
    windowGlow.intensity = 11 + Math.sin(now * 0.001) * 1.5;
  }

  particles.rotation.y += 0.0002;

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

/* ============================================================
   LOADER
   ============================================================ */
let progress = 0;
const loadInterval = setInterval(() => {
  progress = Math.min(100, progress + 18);
  loaderFill.style.width = progress + '%';
  if (progress >= 100) {
    clearInterval(loadInterval);
    setTimeout(() => loader.classList.add('is-hidden'), 250);
  }
}, 120);
