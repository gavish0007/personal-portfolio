import * as THREE from 'three';

/* ============================================================
   PALETTE
   ============================================================ */
const COLOR = {
  canvasTeal: 0x12333A,
  canvasTealDeep: 0x0C2429,
  duskNavy: 0x1B3B4B,
  amber: 0xE8A560,
  amberSoft: 0xF0C08A,
  rose: 0xDB6E86,
  parchment: 0xF3E9D8,
  sage: 0x8FA89C,
  wood: 0x6B4A3A,
  woodLight: 0x8A5D45,
  woodDark: 0x4A3226,
  gold: 0xC9A227,
  skin: 0xD8A579,
  shirt: 0x3E6B6B,
};

/* ============================================================
   RENDERER / SCENE / CAMERA
   ============================================================ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLOR.canvasTealDeep, 0.02);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
const MASTER_POS = new THREE.Vector3(0.4, 2.15, 6.4);
const MASTER_LOOK = new THREE.Vector3(0.1, 1.5, -1.2);
camera.position.copy(MASTER_POS);
camera.lookAt(MASTER_LOOK);

/* ============================================================
   LIGHTING
   ============================================================ */
const hemi = new THREE.HemisphereLight(COLOR.duskNavy, COLOR.woodDark, 0.75);
scene.add(hemi);

const windowLight = new THREE.DirectionalLight(COLOR.amberSoft, 1.4);
windowLight.position.set(0, 3.4, -4);
windowLight.target.position.set(0, 1, 2);
windowLight.castShadow = true;
windowLight.shadow.mapSize.set(2048, 2048);
windowLight.shadow.camera.left = -8;
windowLight.shadow.camera.right = 8;
windowLight.shadow.camera.top = 6;
windowLight.shadow.camera.bottom = -6;
windowLight.shadow.bias = -0.0015;
scene.add(windowLight, windowLight.target);

const lampLight = new THREE.PointLight(COLOR.amber, 6, 8, 2);
lampLight.position.set(-2.6, 2.1, 1.2);
scene.add(lampLight);

const fillLight = new THREE.PointLight(COLOR.rose, 2.5, 10, 2);
fillLight.position.set(3, 2, 3);
scene.add(fillLight);

/* ============================================================
   HELPERS
   ============================================================ */
function box(w, h, d, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.75, metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, color, seg = 16, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.6, metalness: opts.metalness ?? 0.1 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sphere(r, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.6, metalness: opts.metalness ?? 0.05, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0 });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
  m.castShadow = true;
  return m;
}
function torus(r, tube, color) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, 22), new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 }));
  m.castShadow = true;
  return m;
}
function cone(r, h, color) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.3 }));
  m.castShadow = true;
  return m;
}

/* ============================================================
   ROOM SHELL
   ============================================================ */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshStandardMaterial({ color: COLOR.wood, roughness: 0.9 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshStandardMaterial({ color: COLOR.canvasTeal, roughness: 1 }));
backWall.position.set(0, 5, -4.6);
backWall.receiveShadow = true;
scene.add(backWall);

const sideWallL = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 10), new THREE.MeshStandardMaterial({ color: COLOR.duskNavy, roughness: 1 }));
sideWallL.rotation.y = Math.PI / 2;
sideWallL.position.set(-6, 5, 0);
scene.add(sideWallL);

/* ============================================================
   ANIMATED WINDOW / SKY
   ============================================================ */
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 512; skyCanvas.height = 384;
const skyCtx = skyCanvas.getContext('2d');
const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace = THREE.SRGBColorSpace;

let skyPhase = 0;
function drawSky() {
  skyPhase += 0.0016;
  const hueShift = Math.sin(skyPhase) * 0.5 + 0.5; // 0..1 slow cycle
  const top = `rgb(${20 + hueShift * 40}, ${45 + hueShift * 30}, ${70 + hueShift * 20})`;
  const mid = `rgb(${210 + hueShift * 30}, ${140 + hueShift * 40}, ${120 + hueShift * 60})`;
  const bottom = `rgb(${240}, ${190 + hueShift * 30}, ${150 + hueShift * 40})`;
  const grad = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, bottom);
  skyCtx.fillStyle = grad;
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  // sun glow
  const sunX = (Math.sin(skyPhase * 0.5) * 0.5 + 0.5) * skyCanvas.width;
  const sunY = 130 + Math.cos(skyPhase * 0.5) * 20;
  const sunGrad = skyCtx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 90);
  sunGrad.addColorStop(0, 'rgba(255,244,214,0.95)');
  sunGrad.addColorStop(1, 'rgba(255,244,214,0)');
  skyCtx.fillStyle = sunGrad;
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  // clouds
  skyCtx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 4; i++) {
    const cx = ((skyPhase * 30 * (i * 0.4 + 0.6)) % (skyCanvas.width + 200)) - 100;
    const cy = 60 + i * 45;
    for (let j = 0; j < 4; j++) {
      skyCtx.beginPath();
      skyCtx.ellipse(cx + j * 26, cy + (j % 2) * 8, 30, 16, 0, 0, Math.PI * 2);
      skyCtx.fill();
    }
  }
  skyTexture.needsUpdate = true;
}
drawSky();

const windowGroup = new THREE.Group();
const frameMat = new THREE.MeshStandardMaterial({ color: COLOR.woodDark, roughness: 0.8 });
const outerFrame = box(6.4, 4.8, 0.25, COLOR.woodDark);
const pane = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 4.2), new THREE.MeshBasicMaterial({ map: skyTexture }));
pane.position.z = 0.14;
const muntinV1 = box(0.08, 4.2, 0.1, COLOR.woodDark);
muntinV1.position.set(-1, 0, 0.15);
const muntinV2 = box(0.08, 4.2, 0.1, COLOR.woodDark);
muntinV2.position.set(1, 0, 0.15);
const muntinH = box(5.8, 0.08, 0.1, COLOR.woodDark);
muntinH.position.set(0, 0, 0.15);
windowGroup.add(outerFrame, pane, muntinV1, muntinV2, muntinH);
windowGroup.position.set(0, 3.2, -4.45);
scene.add(windowGroup);

// glow bleeding from window
const windowGlow = new THREE.PointLight(COLOR.amberSoft, 4, 10, 2);
windowGlow.position.set(0, 3, -3.8);
scene.add(windowGlow);

// simple birds (two flattened V shapes) drifting across
function makeBird() {
  const g = new THREE.Group();
  const wingMat = new THREE.MeshBasicMaterial({ color: 0x1B1B1B, side: THREE.DoubleSide });
  const wingGeo = new THREE.BufferGeometry();
  wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.12, 0, 0, 0, 0.04, 0, 0.12, 0, 0,
  ], 3));
  const wing = new THREE.Mesh(wingGeo, wingMat);
  g.add(wing);
  return g;
}
const birds = [makeBird(), makeBird()];
birds.forEach((b, i) => { b.position.set(-3 + i, 3.6 + i * 0.3, -4.3); scene.add(b); });

/* ============================================================
   DESK
   ============================================================ */
const deskGroup = new THREE.Group();
const deskTop = box(6.8, 0.12, 1.6, COLOR.wood);
deskTop.position.set(0, 0.9, 0.5);
deskGroup.add(deskTop);
[[-3.2, -0.55], [3.2, -0.55], [-3.2, 1.35], [3.2, 1.35]].forEach(([x, z]) => {
  const leg = box(0.14, 0.9, 0.14, COLOR.woodDark);
  leg.position.set(x, 0.45, z);
  deskGroup.add(leg);
});
const modesty = box(6.6, 0.5, 0.06, COLOR.woodDark);
modesty.position.set(0, 0.55, 1.15);
deskGroup.add(modesty);
scene.add(deskGroup);

const DESK_Y = 0.96;
const DESK_Z = 0.35;

/* ============================================================
   CHAIR + CHARACTER
   ============================================================ */
const chairGroup = new THREE.Group();
const chairSeat = box(0.9, 0.1, 0.9, COLOR.woodDark);
chairSeat.position.set(0, 0.85, -0.65);
const chairBack = box(0.9, 1.0, 0.08, COLOR.woodDark);
chairBack.position.set(0, 1.4, -1.05);
[[-0.4, -0.3], [0.4, -0.3], [-0.4, -1.0], [0.4, -1.0]].forEach(([x, z]) => {
  const leg = cyl(0.04, 0.04, 0.85, COLOR.woodDark, 8);
  leg.position.set(x, 0.42, z);
  chairGroup.add(leg);
});
chairGroup.add(chairSeat, chairBack);
scene.add(chairGroup);

const character = new THREE.Group();
// torso
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 4, 12), new THREE.MeshStandardMaterial({ color: COLOR.shirt, roughness: 0.8 }));
torso.position.set(0, 1.35, -0.75);
torso.castShadow = true;
character.add(torso);
// head
const head = sphere(0.22, COLOR.skin);
head.position.set(0, 1.92, -0.72);
character.add(head);
// simple hair cap
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x2A1E16, roughness: 0.9 }));
hair.position.set(0, 1.98, -0.72);
character.add(hair);
// arms resting toward desk
const armMat = new THREE.MeshStandardMaterial({ color: COLOR.shirt, roughness: 0.8 });
const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 8), armMat);
armL.position.set(-0.32, 1.2, -0.25);
armL.rotation.x = -0.9;
armL.rotation.z = 0.15;
armL.castShadow = true;
const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 8), armMat);
armR.position.set(0.32, 1.2, -0.25);
armR.rotation.x = -0.9;
armR.rotation.z = -0.15;
armR.castShadow = true;
character.add(armL, armR);
// hands
const handL = sphere(0.08, COLOR.skin);
handL.position.set(-0.35, 0.98, 0.05);
const handR = sphere(0.08, COLOR.skin);
handR.position.set(0.35, 0.98, 0.05);
character.add(handL, handR);

scene.add(character);

/* ============================================================
   DESK ITEMS + SECTION REGISTRY
   ============================================================ */
const textureLoader = new THREE.TextureLoader();
const sectionRoots = {};
const hotspots = [];

function addHotspot(key, label, position, sizeMul = 1) {
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.06 * sizeMul, 0),
    new THREE.MeshBasicMaterial({ color: COLOR.amber, transparent: true, opacity: 0.9 })
  );
  marker.position.copy(position);
  marker.userData.section = key;
  marker.userData.label = label;
  marker.userData.baseY = position.y;
  scene.add(marker);
  hotspots.push(marker);

  const glow = new THREE.PointLight(COLOR.amber, 0.8, 1.6, 2);
  glow.position.copy(position);
  scene.add(glow);

  return marker;
}

// ---- About: framed photo + nameplate + mug ----
(function buildAbout() {
  const g = new THREE.Group();
  const frame = box(0.5, 0.65, 0.04, COLOR.woodDark);
  frame.position.set(-3.0, DESK_Y + 0.33, DESK_Z - 0.3);
  frame.rotation.y = 0.35;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), new THREE.MeshStandardMaterial({ color: COLOR.parchment }));
  photo.position.set(-3.0 + 0.02, DESK_Y + 0.33, DESK_Z - 0.28);
  photo.rotation.y = 0.35;
  const mug = cyl(0.08, 0.07, 0.12, COLOR.rose);
  mug.position.set(-2.7, DESK_Y + 0.06, DESK_Z + 0.15);
  const steam = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }));
  steam.position.set(-2.7, DESK_Y + 0.22, DESK_Z + 0.15);
  g.add(frame, photo, mug, steam);
  scene.add(g);
  sectionRoots.about = g;
  addHotspot('about', 'About', new THREE.Vector3(-3.0, DESK_Y + 0.75, DESK_Z - 0.2));
})();

// ---- Academics: books + grad cap ----
(function buildAcademics() {
  const g = new THREE.Group();
  const colors = [COLOR.rose, COLOR.amber, 0x4C7A5E, COLOR.sage];
  let y = DESK_Y;
  colors.forEach((c, i) => {
    const h = 0.07;
    const bk = box(0.34, h, 0.26, c);
    bk.position.set(-2.2, y + h / 2, DESK_Z);
    bk.rotation.y = (Math.random() - 0.5) * 0.15;
    g.add(bk);
    y += h;
  });
  const capBoard = box(0.28, 0.02, 0.28, 0x1B1B1B);
  capBoard.position.set(-2.2, y + 0.03, DESK_Z);
  capBoard.rotation.y = 0.3;
  const capBase = cyl(0.1, 0.11, 0.08, 0x1B1B1B);
  capBase.position.set(-2.2, y + 0.07, DESK_Z);
  g.add(capBoard, capBase);
  scene.add(g);
  sectionRoots.academics = g;
  addHotspot('academics', 'Academics', new THREE.Vector3(-2.2, y + 0.4, DESK_Z));
})();

// ---- Skills: mini toolbox + gear ----
(function buildSkills() {
  const g = new THREE.Group();
  const tbBody = box(0.42, 0.22, 0.28, COLOR.amber, { roughness: 0.5, metalness: 0.2 });
  tbBody.position.set(-1.4, DESK_Y + 0.11, DESK_Z);
  const tbLid = box(0.44, 0.05, 0.3, COLOR.rose, { roughness: 0.5, metalness: 0.2 });
  tbLid.position.set(-1.4, DESK_Y + 0.24, DESK_Z);
  const handle = torus(0.08, 0.015, COLOR.woodDark);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(-1.4, DESK_Y + 0.3, DESK_Z);
  const gear = torus(0.1, 0.03, COLOR.gold);
  gear.position.set(-1.15, DESK_Y + 0.1, DESK_Z + 0.25);
  gear.rotation.x = Math.PI / 2;
  g.add(tbBody, tbLid, handle, gear);
  scene.add(g);
  sectionRoots.skills = g;
  addHotspot('skills', 'Skills', new THREE.Vector3(-1.4, DESK_Y + 0.5, DESK_Z));
})();

// ---- Resume: notebook + pen ----
(function buildResume() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const paper = box(0.42, 0.012, 0.55, COLOR.parchment);
    paper.position.set(-0.55, DESK_Y + 0.01 + i * 0.014, DESK_Z + 0.1 - i * 0.005);
    paper.rotation.z = (Math.random() - 0.5) * 0.04;
    g.add(paper);
  }
  const pen = cyl(0.012, 0.012, 0.32, 0x2C2C2C);
  pen.rotation.z = Math.PI / 2.4;
  pen.position.set(-0.3, DESK_Y + 0.08, DESK_Z + 0.3);
  g.add(pen);
  scene.add(g);
  sectionRoots.resume = g;
  addHotspot('resume', 'Resume', new THREE.Vector3(-0.55, DESK_Y + 0.35, DESK_Z + 0.1));
})();

// ---- Projects: laptop with ambient holographic code ribbon ----
let codeTexture, codeCtx, codeCanvas;
(function buildProjects() {
  const g = new THREE.Group();
  const base = box(0.62, 0.03, 0.42, 0x33393A, { roughness: 0.4, metalness: 0.4 });
  base.position.set(0.25, DESK_Y + 0.015, DESK_Z - 0.05);
  const screen = box(0.62, 0.4, 0.02, 0x33393A, { roughness: 0.4, metalness: 0.4 });
  screen.position.set(0.25, DESK_Y + 0.22, DESK_Z - 0.25);
  screen.rotation.x = -0.3;

  codeCanvas = document.createElement('canvas');
  codeCanvas.width = 128; codeCanvas.height = 96;
  codeCtx = codeCanvas.getContext('2d');
  codeTexture = new THREE.CanvasTexture(codeCanvas);
  const screenLit = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), new THREE.MeshBasicMaterial({ map: codeTexture }));
  screenLit.position.set(0.25, DESK_Y + 0.22, DESK_Z - 0.238);
  screenLit.rotation.x = -0.3;
  g.add(base, screen, screenLit);

  // ambient holographic ribbon rising off the screen
  const ribbonCanvas = document.createElement('canvas');
  ribbonCanvas.width = 96; ribbonCanvas.height = 128;
  const ribbonCtx = ribbonCanvas.getContext('2d');
  const ribbonTex = new THREE.CanvasTexture(ribbonCanvas);
  const ribbon = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.7),
    new THREE.MeshBasicMaterial({ map: ribbonTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ribbon.position.set(0.25, DESK_Y + 0.75, DESK_Z - 0.3);
  scene.add(ribbon);
  g.userData.ribbonCtx = ribbonCtx;
  g.userData.ribbonTex = ribbonTex;
  g.userData.ribbon = ribbon;

  scene.add(g);
  sectionRoots.projects = g;
  addHotspot('projects', 'Projects', new THREE.Vector3(0.25, DESK_Y + 1.0, DESK_Z - 0.3));
})();

// ---- Paintings: mini easel with real painting ----
let easelGroupRef;
function buildEasel(tex) {
  const g = new THREE.Group();
  const legMat = COLOR.woodDark;
  const leg1 = cyl(0.02, 0.02, 0.55, legMat, 8);
  leg1.position.set(1.05, DESK_Y + 0.27, DESK_Z + 0.15);
  leg1.rotation.x = 0.3;
  const leg2 = cyl(0.02, 0.02, 0.55, legMat, 8);
  leg2.position.set(0.95, DESK_Y + 0.27, DESK_Z - 0.1);
  leg2.rotation.x = -0.2;
  leg2.rotation.z = 0.1;
  g.add(leg1, leg2);
  const canvasMat = tex
    ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
    : new THREE.MeshStandardMaterial({ color: COLOR.parchment, roughness: 0.85 });
  const frame = box(0.36, 0.28, 0.02, 0xEDE3D0);
  frame.position.set(1.0, DESK_Y + 0.42, DESK_Z);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), canvasMat);
  art.position.set(1.0, DESK_Y + 0.42, DESK_Z + 0.011);
  g.add(frame, art);
  return g;
}
(function buildPaintings() {
  const g = buildEasel(null);
  scene.add(g);
  sectionRoots.paintings = g;
  easelGroupRef = g;
  addHotspot('paintings', 'Paintings', new THREE.Vector3(1.0, DESK_Y + 0.75, DESK_Z));
})();
textureLoader.load('assets/painting1.jpg', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.remove(sectionRoots.paintings);
  const g = buildEasel(tex);
  scene.add(g);
  sectionRoots.paintings = g;
});

// ---- Music: mini keyboard strip ----
(function buildMusic() {
  const g = new THREE.Group();
  const bed = box(0.55, 0.04, 0.16, COLOR.woodDark);
  bed.position.set(1.75, DESK_Y + 0.02, DESK_Z + 0.05);
  const whiteStrip = box(0.5, 0.015, 0.12, COLOR.parchment);
  whiteStrip.position.set(1.75, DESK_Y + 0.045, DESK_Z + 0.05);
  g.add(bed, whiteStrip);
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x1B1B1B });
  for (let i = 0; i < 7; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.07), blackMat);
    bk.position.set(1.53 + i * 0.065, DESK_Y + 0.06, DESK_Z + 0.01);
    g.add(bk);
  }
  scene.add(g);
  sectionRoots.music = g;
  addHotspot('music', 'Music', new THREE.Vector3(1.75, DESK_Y + 0.35, DESK_Z));
})();

// ---- Contact: vintage phone ----
(function buildContact() {
  const g = new THREE.Group();
  const base = box(0.26, 0.1, 0.22, 0x8A4A3C, { roughness: 0.4 });
  base.position.set(2.7, DESK_Y + 0.05, DESK_Z);
  const body = cyl(0.08, 0.09, 0.1, 0x8A4A3C, 12, { roughness: 0.4 });
  body.position.set(2.7, DESK_Y + 0.15, DESK_Z);
  const receiver = cyl(0.025, 0.025, 0.24, 0x2C2C2C, 10);
  receiver.rotation.z = Math.PI / 2;
  receiver.position.set(2.75, DESK_Y + 0.22, DESK_Z + 0.03);
  g.add(base, body, receiver);
  scene.add(g);
  sectionRoots.contact = g;
  addHotspot('contact', 'Contact', new THREE.Vector3(2.7, DESK_Y + 0.45, DESK_Z));
})();

// ---- Achievements: small wall shelf with trophy ----
(function buildAchievements() {
  const g = new THREE.Group();
  const shelf = box(1.1, 0.06, 0.3, COLOR.wood);
  shelf.position.set(3.6, 2.5, -3.7);
  const bracket = box(0.06, 0.3, 0.3, COLOR.woodDark);
  bracket.position.set(3.6, 2.3, -3.7);
  g.add(shelf, bracket);
  [-0.25, 0.25].forEach((dx) => {
    const cupBase = cyl(0.06, 0.07, 0.06, COLOR.gold, 14, { roughness: 0.3, metalness: 0.7 });
    cupBase.position.set(3.6 + dx, 2.58, -3.7);
    const cupBody = cyl(0.08, 0.04, 0.14, COLOR.gold, 14, { roughness: 0.3, metalness: 0.7 });
    cupBody.position.set(3.6 + dx, 2.68, -3.7);
    g.add(cupBase, cupBody);
  });
  scene.add(g);
  sectionRoots.achievements = g;
  addHotspot('achievements', 'Achievements', new THREE.Vector3(3.6, 2.9, -3.7));
})();

/* ============================================================
   AMBIENT DUST IN THE WINDOW LIGHT
   ============================================================ */
const dustCount = 90;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 5;
  dustPos[i * 3 + 1] = Math.random() * 3 + 0.5;
  dustPos[i * 3 + 2] = -3.5 + Math.random() * 3;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: COLOR.amberSoft, size: 0.025, transparent: true, opacity: 0.5 }));
scene.add(dust);

/* ============================================================
   CAMERA FLIGHT
   ============================================================ */
let flight = null;
let currentLook = MASTER_LOOK.clone();
let activeSection = null;

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function flyTo(targetPos, targetLook, duration = 1400) {
  flight = { fromPos: camera.position.clone(), toPos: targetPos.clone(), fromLook: currentLook.clone(), toLook: targetLook.clone(), start: performance.now(), duration };
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
   BEAM EFFECT (rises from active object)
   ============================================================ */
const beamMat = new THREE.MeshBasicMaterial({ color: COLOR.amber, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.4, 3, 16, 1, true), beamMat);
beam.visible = false;
scene.add(beam);

function showBeamAt(position) {
  beam.position.set(position.x, position.y + 1.5, position.z);
  beam.visible = true;
}
function hideBeam() { beam.visible = false; }

/* ============================================================
   UI WIRING
   ============================================================ */
const hint = document.getElementById('hudHint');
const resetBtn = document.getElementById('resetBtn');
const tooltip = document.getElementById('tooltip');
const holo = document.getElementById('hologram');
const holoBody = document.getElementById('holoBody');
const holoClose = document.getElementById('holoClose');
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');

function focusFor(pos) {
  return {
    cam: new THREE.Vector3(pos.x * 0.5, Math.max(pos.y + 0.9, 1.6), pos.z + 2.6),
    look: new THREE.Vector3(pos.x * 0.85, pos.y + 0.1, pos.z - 0.1),
  };
}

function openSection(key) {
  const marker = hotspots.find((h) => h.userData.section === key);
  if (!marker) return;
  activeSection = key;
  const { cam, look } = focusFor(marker.position);
  flyTo(cam, look);
  showBeamAt(marker.position);
  hint.classList.add('is-faded');
  resetBtn.classList.add('is-visible');
  setTimeout(() => {
    holoBody.innerHTML = CONTENT[key] || '';
    holo.classList.add('is-open');
  }, 500);
}

function resetView() {
  activeSection = null;
  flyTo(MASTER_POS, MASTER_LOOK);
  hideBeam();
  holo.classList.remove('is-open');
  hint.classList.remove('is-faded');
  resetBtn.classList.remove('is-visible');
}

resetBtn.addEventListener('click', resetView);
holoClose.addEventListener('click', resetView);

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.15;
const mouseVec = new THREE.Vector2();
let lastHover = null;

function updatePointer(e) {
  const rect = canvas.getBoundingClientRect();
  mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener('mousemove', (e) => {
  updatePointer(e);
  raycaster.setFromCamera(mouseVec, camera);
  const hits = raycaster.intersectObjects(hotspots, false);
  if (hits.length) {
    const m = hits[0].object;
    lastHover = m;
    canvas.style.cursor = 'pointer';
    tooltip.textContent = m.userData.label;
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
    tooltip.classList.add('is-visible');
  } else {
    lastHover = null;
    canvas.style.cursor = 'default';
    tooltip.classList.remove('is-visible');
  }
});

canvas.addEventListener('click', (e) => {
  updatePointer(e);
  raycaster.setFromCamera(mouseVec, camera);
  const hits = raycaster.intersectObjects(hotspots, false);
  if (hits.length) {
    openSection(hits[0].object.userData.section);
  }
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
    <span class="eyebrow">About</span>
    <h2>The story so far.</h2>
    <p class="lede">Sometimes it's Java or C++. Sometimes it's brushstrokes on a canvas. Sometimes it's the quiet language of music.</p>
    <p>I'm Gavish — a Computer Science student driven by curiosity and creativity. I enjoy building meaningful digital experiences, exploring new technologies, painting ideas into color, and finding inspiration in melodies that stay with me long after they end.</p>
    <p>To me, every project is a chance to blend logic with imagination and create something that feels alive.</p>
  `,
  academics: `
    <span class="eyebrow">Academics</span>
    <h2>Where the foundation was laid.</h2>
    <div class="holo-entry">
      <span class="when">2024 – Expected 2028</span>
      <h4>B.Tech, Computer Science & Engineering</h4>
      <div class="where">Jaypee Institute of Information Technology, Noida</div>
    </div>
    <div class="holo-entry">
      <span class="when">2024</span>
      <h4>Class XII, CBSE</h4>
      <div class="where">Score: 77.4%</div>
    </div>
    <div class="holo-stub">Send coursework, specializations, or CGPA and I'll add them here.</div>
  `,
  skills: `
    <span class="eyebrow">Skills</span>
    <h2>The toolkit.</h2>
    <div class="holo-block">
      <h3>Languages</h3>
      <div class="holo-pills"><span class="holo-pill">C++</span><span class="holo-pill">Java</span><span class="holo-pill">JavaScript</span><span class="holo-pill">Python</span><span class="holo-pill">SQL</span></div>
    </div>
    <div class="holo-block">
      <h3>Tools</h3>
      <div class="holo-pills"><span class="holo-pill">Git</span><span class="holo-pill">GitHub</span><span class="holo-pill">Android Studio</span><span class="holo-pill">MySQL</span></div>
    </div>
    <div class="holo-stub">Send proficiency levels or new tools and I'll refine this.</div>
  `,
  resume: `
    <span class="eyebrow">Resume</span>
    <h2>The formal version.</h2>
    <div class="holo-actions">
      <a class="btn btn-primary" style="color:#0A1F24;" href="assets/gavish-nagar-resume.pdf" download>Download PDF</a>
    </div>
    <div class="holo-block" style="margin-top:1.4rem;">
      <h3>Experience</h3>
      <div class="holo-entry">
        <span class="when">May 2026 – Jul 2026</span>
        <h4>Frontend Developer Intern</h4>
        <div class="where">Tectigon IT Solutions · Remote</div>
        <ul>
          <li>Built a 7-page Intern Management Dashboard (tasks, attendance, standups, resources, profile).</li>
          <li>Implemented search, filtering, and responsive navigation in vanilla JavaScript.</li>
        </ul>
      </div>
    </div>
  `,
  projects: `
    <span class="eyebrow">Projects</span>
    <h2>Things I've built.</h2>
    <div class="holo-entry">
      <h4>Tectigon Intern Hub</h4>
      <div class="where">HTML · CSS · JavaScript</div>
      <p>A responsive 7-page internship management dashboard with modules for tasks, attendance, standups, learning resources and profile management.</p>
    </div>
    <div class="holo-entry">
      <h4>Sammarshya Employee Portal</h4>
      <div class="where">HTML · CSS · JavaScript</div>
      <p>An employee portal with Kanban-style task management, attendance tracking, leave management and LocalStorage persistence.</p>
    </div>
    <div class="holo-entry">
      <h4>MindLog: Mental Health Journal App</h4>
      <div class="where">Java · Android Studio · Room · SQLite</div>
      <p>An in-progress Android app for mood tracking and visualization.</p>
    </div>
    <div class="holo-entry">
      <h4>Terminal Social Network Analyzer</h4>
      <div class="where">C++ · STL</div>
      <p>Dijkstra's Algorithm, PageRank and Label Propagation for graph-based social network analysis.</p>
    </div>
    <div class="holo-stub">Send GitHub links, live demos, and screenshots and I'll turn these into full case studies.</div>
  `,
  paintings: `
    <span class="eyebrow">Side Quests — Paintings</span>
    <h2>Canvas & color.</h2>
    <div class="holo-frame"><img src="assets/painting1.jpg" alt="Oil painting of a campfire by a lake at golden hour"></div>
    <div class="holo-caption">Campfire at Golden Hour — oil on canvas</div>
    <p>A quiet lakeside evening — pine silhouettes, a dusk sky, and firelight reflected on still water.</p>
    <div class="holo-stub">Send more paintings and I'll rotate them onto the easel.</div>
  `,
  music: `
    <span class="eyebrow">Music</span>
    <h2>Piano.</h2>
    <p class="lede">Melodies I return to, and a few of my own.</p>
    <div class="holo-stub">Share how long you've played, favorite pieces, or recordings to embed, and I'll compose this section.</div>
  `,
  achievements: `
    <span class="eyebrow">Achievements</span>
    <h2>Milestones.</h2>
    <div class="holo-stub">Send awards, hackathon wins, certifications or rankings — with dates — and I'll place them on this shelf.</div>
  `,
  contact: `
    <span class="eyebrow">Contact</span>
    <h2>Let's talk.</h2>
    <p class="lede">A message, a project, an idea — I'd genuinely like to hear it.</p>
    <div class="holo-contact-grid">
      <a class="holo-contact-item" href="mailto:gavishnagar38@gmail.com"><span class="label">Email</span>gavishnagar38@gmail.com</a>
      <a class="holo-contact-item" href="tel:+918221853001"><span class="label">Phone</span>+91 82218 53001</a>
      <a class="holo-contact-item" href="https://linkedin.com/in/gavishnagar" target="_blank" rel="noopener"><span class="label">LinkedIn</span>/in/gavishnagar</a>
      <a class="holo-contact-item" href="https://github.com/gavishnagar" target="_blank" rel="noopener"><span class="label">GitHub</span>/gavishnagar</a>
    </div>
  `,
};

/* ============================================================
   RENDER LOOP
   ============================================================ */
let frame = 0;
function drawCode() {
  if (!codeCtx) return;
  codeCtx.fillStyle = '#12333A';
  codeCtx.fillRect(0, 0, codeCanvas.width, codeCanvas.height);
  codeCtx.font = '7px monospace';
  const lines = ['const art =', '  gavish.paint()', 'function build() {', '  return dream;', '}', '<Portfolio />', 'git commit -m', "  'alive'"];
  for (let i = 0; i < lines.length; i++) {
    const y = ((i * 12 + frame * 0.6) % (codeCanvas.height + 12));
    codeCtx.fillStyle = i % 3 === 0 ? '#E8A560' : '#8FA89C';
    codeCtx.fillText(lines[i], 4, y);
  }
  codeTexture.needsUpdate = true;
}

function drawRibbon(root) {
  const ctx = root.userData.ribbonCtx;
  if (!ctx) return;
  ctx.clearRect(0, 0, 96, 128);
  ctx.font = '8px monospace';
  for (let i = 0; i < 10; i++) {
    const y = ((i * 14 + frame * 0.9) % 140) - 10;
    ctx.fillStyle = `rgba(232,165,96,${0.15 + 0.5 * Math.sin(frame * 0.05 + i)})`;
    ctx.fillText(i % 2 === 0 ? '{ }' : '</>', 10 + (i % 3) * 20, y);
  }
  root.userData.ribbonTex.needsUpdate = true;
}

function animate(now) {
  requestAnimationFrame(animate);
  frame++;
  updateFlight(now);

  if (frame % 4 === 0) drawSky();
  if (frame % 6 === 0) drawCode();
  if (frame % 6 === 0 && sectionRoots.projects) drawRibbon(sectionRoots.projects);

  // hotspot pulse
  hotspots.forEach((m, i) => {
    m.rotation.y += 0.02;
    m.position.y = m.userData.baseY + Math.sin(now * 0.002 + i) * 0.03;
    const s = 1 + Math.sin(now * 0.004 + i) * 0.15;
    m.scale.setScalar(s);
  });

  // birds drift
  birds.forEach((b, i) => {
    b.position.x = -4 + ((now * 0.00025 + i * 3) % 8);
    b.position.y = 3.6 + Math.sin(now * 0.002 + i) * 0.15;
    b.rotation.z = Math.sin(now * 0.01 + i) * 0.3;
  });

  dust.rotation.y += 0.0003;

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

/* ============================================================
   LOADER
   ============================================================ */
let progress = 0;
const loadInterval = setInterval(() => {
  progress = Math.min(100, progress + 16);
  loaderFill.style.width = progress + '%';
  if (progress >= 100) {
    clearInterval(loadInterval);
    setTimeout(() => loader.classList.add('is-hidden'), 250);
  }
}, 110);
