import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================
   PALETTE
   ============================================================ */
const COLOR = {
  amber: 0xE8A560, amberSoft: 0xF0C08A, amberHot: 0xFFB870,
  rose: 0xDB6E86, sage: 0x8FA89C, parchment: 0xF3E9D8,
  wood: 0x4A3226, woodDark: 0x2A1B12, woodLight: 0x6B4A3A,
  gold: 0xC9A227, skinDark: 0x2A1E18, shirtDark: 0x14181C,
  screenGreen: 0x8FE3B8, screenBlue: 0x7FB8E8,
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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0f14, 0.018);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
const MASTER_POS = new THREE.Vector3(0, 1.95, 6.4);
const MASTER_LOOK = new THREE.Vector3(0, 1.7, -3.5);
camera.position.copy(MASTER_POS);
camera.lookAt(MASTER_LOOK);

/* ============================================================
   POSTPROCESSING
   ============================================================ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.55, 0.62);
composer.addPass(bloomPass);

const grainVignetteShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 uv = vUv - 0.5;
      float vig = 1.0 - dot(uv, uv) * 0.85;
      color.rgb *= vig;
      float grain = (rand(vUv * time) - 0.5) * 0.045;
      color.rgb += grain;
      gl_FragColor = color;
    }
  `,
};
const grainPass = new ShaderPass(grainVignetteShader);
composer.addPass(grainPass);
composer.addPass(new OutputPass());

/* ============================================================
   HELPERS
   ============================================================ */
function box(w, h, d, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: opts.roughness ?? 0.8, metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = opts.shadow !== false; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, color, seg = 14, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.6, metalness: opts.metalness ?? 0.1, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function sphere(r, color, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: opts.roughness ?? 0.7, metalness: opts.metalness ?? 0.05 });
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
  m.castShadow = true;
  return m;
}

/* ============================================================
   ROOM SHELL (kept mostly dark — this is a silhouette scene)
   ============================================================ */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 18), new THREE.MeshStandardMaterial({ color: 0x1c130d, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshStandardMaterial({ color: 0x0b1014, roughness: 1 }));
backWall.position.set(0, 5.2, -4.8);
scene.add(backWall);

/* ============================================================
   CITY SKYLINE SUNSET WINDOW
   ============================================================ */
const skyCanvas = document.createElement('canvas');
skyCanvas.width = 640; skyCanvas.height = 420;
const skyCtx = skyCanvas.getContext('2d');
const skyTexture = new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace = THREE.SRGBColorSpace;

let skyPhase = 0;
const buildingSeeds = Array.from({ length: 16 }, () => ({ h: 0.15 + Math.random() * 0.5, w: 0.03 + Math.random() * 0.035, lit: Math.random() > 0.4 }));

function drawSky() {
  skyPhase += 0.0012;
  const grad = skyCtx.createLinearGradient(0, 0, 0, skyCanvas.height);
  grad.addColorStop(0, '#2b3350');
  grad.addColorStop(0.32, '#7a4f5e');
  grad.addColorStop(0.55, '#c96b4a');
  grad.addColorStop(0.72, '#f0a860');
  grad.addColorStop(1, '#ffd9a0');
  skyCtx.fillStyle = grad;
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);

  // sun
  const sunX = skyCanvas.width * 0.55;
  const sunY = skyCanvas.height * 0.68;
  const sunR = 46;
  const halo = skyCtx.createRadialGradient(sunX, sunY, 4, sunX, sunY, sunR * 3);
  halo.addColorStop(0, 'rgba(255,244,214,1)');
  halo.addColorStop(0.3, 'rgba(255,210,150,0.55)');
  halo.addColorStop(1, 'rgba(255,210,150,0)');
  skyCtx.fillStyle = halo;
  skyCtx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
  skyCtx.fillStyle = '#fff6e0';
  skyCtx.beginPath(); skyCtx.arc(sunX, sunY, sunR * 0.55, 0, Math.PI * 2); skyCtx.fill();

  // drifting clouds
  skyCtx.fillStyle = 'rgba(60,40,50,0.35)';
  for (let i = 0; i < 5; i++) {
    const cx = ((skyPhase * 22 * (i * 0.3 + 0.7)) % (skyCanvas.width + 200)) - 100;
    const cy = 60 + i * 30;
    for (let j = 0; j < 3; j++) {
      skyCtx.beginPath();
      skyCtx.ellipse(cx + j * 34, cy + (j % 2) * 10, 40, 14, 0, 0, Math.PI * 2);
      skyCtx.fill();
    }
  }

  // city skyline silhouette
  let x = 0;
  skyCtx.fillStyle = '#0c0a10';
  buildingSeeds.forEach((b) => {
    const w = b.w * skyCanvas.width;
    const h = b.h * skyCanvas.height * 0.62;
    const y = skyCanvas.height - h;
    skyCtx.fillRect(x, y, w, h);
    if (b.lit) {
      skyCtx.fillStyle = 'rgba(255,214,150,0.85)';
      for (let wy = y + 8; wy < skyCanvas.height - 6; wy += 12) {
        for (let wx = x + 4; wx < x + w - 4; wx += 9) {
          if (Math.random() > 0.5) skyCtx.fillRect(wx, wy, 3, 4);
        }
      }
      skyCtx.fillStyle = '#0c0a10';
    }
    x += w;
  });

  skyTexture.needsUpdate = true;
}
drawSky();

const windowGroup = new THREE.Group();
const frameMat = new THREE.MeshStandardMaterial({ color: 0x0e0b08, roughness: 0.85 });
const outerFrame = box(7.4, 5.2, 0.3, 0x0e0b08, { shadow: false });
const pane = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 4.6), new THREE.MeshBasicMaterial({ map: skyTexture }));
pane.position.z = 0.16;
const mV1 = box(0.07, 4.6, 0.08, 0x0e0b08, { shadow: false }); mV1.position.set(-1.1, 0, 0.17);
const mV2 = box(0.07, 4.6, 0.08, 0x0e0b08, { shadow: false }); mV2.position.set(1.1, 0, 0.17);
const mH = box(6.8, 0.07, 0.08, 0x0e0b08, { shadow: false }); mH.position.set(0, 0.4, 0.17);
windowGroup.add(outerFrame, pane, mV1, mV2, mH);
windowGroup.position.set(0, 3.3, -4.6);
scene.add(windowGroup);

/* ============================================================
   LIGHTING — backlit / silhouette composition
   ============================================================ */
const hemi = new THREE.HemisphereLight(0x30405a, 0x0a0806, 0.35);
scene.add(hemi);

// warm rim light streaming through the window, behind the character
const rim = new THREE.DirectionalLight(COLOR.amberHot, 2.6);
rim.position.set(0.6, 3.6, -4.3);
rim.target.position.set(0, 1.3, 2);
rim.castShadow = true;
rim.shadow.mapSize.set(2048, 2048);
rim.shadow.camera.left = -6; rim.shadow.camera.right = 6;
rim.shadow.camera.top = 5; rim.shadow.camera.bottom = -5;
rim.shadow.bias = -0.0018;
scene.add(rim, rim.target);

// secondary soft window fill
const windowFill = new THREE.PointLight(COLOR.amberSoft, 3.5, 9, 2);
windowFill.position.set(0, 2.8, -3.6);
scene.add(windowFill);

// desk lamp (practical warm light)
const lampLight = new THREE.PointLight(COLOR.amber, 3.5, 5, 2);
lampLight.position.set(2.5, 1.85, -1.1);
scene.add(lampLight);

// screen glow bounce (subtle blue-green fill on character's front, very low)
const screenBounce = new THREE.PointLight(COLOR.screenGreen, 0.9, 3, 2);
screenBounce.position.set(0, 1.5, -1.4);
scene.add(screenBounce);

/* ============================================================
   DESK
   ============================================================ */
const DESK_Y = 0.95;
const deskGroup = new THREE.Group();
const deskTop = box(8.4, 0.1, 1.5, COLOR.wood, { roughness: 0.6 });
deskTop.position.set(0, DESK_Y, -1.3);
deskGroup.add(deskTop);
[[-3.9, -0.75], [3.9, -0.75], [-3.9, -1.85], [3.9, -1.85]].forEach(([x, z]) => {
  const leg = box(0.12, 0.95, 0.12, COLOR.woodDark);
  leg.position.set(x, 0.475, z);
  deskGroup.add(leg);
});
scene.add(deskGroup);

/* ============================================================
   CHAIR + CHARACTER (silhouette)
   ============================================================ */
const silMat = new THREE.MeshStandardMaterial({ color: COLOR.shirtDark, roughness: 0.9, metalness: 0 });
const skinMat = new THREE.MeshStandardMaterial({ color: COLOR.skinDark, roughness: 0.9 });

const chair = new THREE.Group();
const chairBack = box(0.85, 1.3, 0.1, 0x0c0c0c);
chairBack.position.set(0, 1.55, 0.75);
chair.add(chairBack);
scene.add(chair);

const character = new THREE.Group();
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.6, 4, 12), silMat);
torso.position.set(0, 1.35, 0.15);
torso.castShadow = true;
character.add(torso);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 12), skinMat);
head.position.set(0, 1.92, 0.2);
head.castShadow = true;
character.add(head);
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshStandardMaterial({ color: 0x0c0805, roughness: 0.95 }));
hair.position.set(0, 1.98, 0.2);
hair.rotation.x = -0.1;
character.add(hair);
const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.5, 4, 8), silMat);
armL.position.set(-0.34, 1.2, -0.25); armL.rotation.x = -1.0; armL.rotation.z = 0.1; armL.castShadow = true;
const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.5, 4, 8), silMat);
armR.position.set(0.34, 1.2, -0.25); armR.rotation.x = -1.0; armR.rotation.z = -0.1; armR.castShadow = true;
character.add(armL, armR);
scene.add(character);

/* ============================================================
   MONITORS (flank the character's silhouette, screens face camera)
   ============================================================ */
function makeCodeTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 96;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  return { c, ctx, tex };
}
const codeScreens = [makeCodeTexture(), makeCodeTexture()];
const monitorGroup = new THREE.Group();
[-0.62, 0.62].forEach((x, i) => {
  const bezel = box(0.62, 0.42, 0.03, 0x050505, { emissive: 0x000000, roughness: 0.5 });
  bezel.position.set(x, 1.55, -2.55);
  bezel.rotation.y = x < 0 ? 0.18 : -0.18;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), new THREE.MeshBasicMaterial({ map: codeScreens[i].tex }));
  screen.position.set(x + (x < 0 ? 0.005 : -0.005), 1.55, -2.535);
  screen.rotation.y = bezel.rotation.y;
  const stand = cyl(0.03, 0.05, 0.22, 0x050505, 10);
  stand.position.set(x, 1.28, -2.55);
  monitorGroup.add(bezel, screen, stand);
});
scene.add(monitorGroup);

/* ============================================================
   LAPTOP
   ============================================================ */
const laptopArt = makeCodeTexture();
const laptopBase = box(0.5, 0.02, 0.36, 0x1a1a1a, { roughness: 0.4, metalness: 0.3 });
laptopBase.position.set(1.85, DESK_Y + 0.01, -1.75);
const laptopScreen = box(0.5, 0.32, 0.02, 0x1a1a1a, { roughness: 0.4, metalness: 0.3 });
laptopScreen.position.set(1.85, DESK_Y + 0.17, -1.93);
laptopScreen.rotation.x = -0.35;
const laptopLit = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.28), new THREE.MeshBasicMaterial({ map: laptopArt.tex }));
laptopLit.position.set(1.85, DESK_Y + 0.17, -1.918);
laptopLit.rotation.x = -0.35;
scene.add(laptopBase, laptopScreen, laptopLit);
const laptopGlow = new THREE.PointLight(COLOR.amberSoft, 0.8, 1.5, 2);
laptopGlow.position.set(1.85, DESK_Y + 0.3, -1.8);
scene.add(laptopGlow);

/* ============================================================
   DESK LAMP
   ============================================================ */
const lampGroup = new THREE.Group();
const lampBase = cyl(0.12, 0.14, 0.03, 0x0c0c0c);
lampBase.position.set(2.5, DESK_Y + 0.015, -1.1);
const lampPole = cyl(0.02, 0.02, 0.9, 0x0c0c0c);
lampPole.position.set(2.5, DESK_Y + 0.47, -1.1);
const lampArm = box(0.03, 0.5, 0.03, 0x0c0c0c);
lampArm.position.set(2.65, DESK_Y + 0.85, -1.0); lampArm.rotation.z = -0.7;
const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.18, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, side: THREE.DoubleSide, emissive: COLOR.amber, emissiveIntensity: 0.6 }));
lampShade.position.set(2.85, DESK_Y + 0.9, -1.1); lampShade.rotation.x = Math.PI;
lampGroup.add(lampBase, lampPole, lampArm, lampShade);
scene.add(lampGroup);

/* ============================================================
   SECTION PROPS + HOTSPOTS
   ============================================================ */
const textureLoader = new THREE.TextureLoader();
const hotspots = [];
function addHotspot(key, label, position) {
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), new THREE.MeshBasicMaterial({ color: COLOR.amber, transparent: true, opacity: 0.95 }));
  marker.position.copy(position);
  marker.userData.section = key;
  marker.userData.label = label;
  marker.userData.baseY = position.y;
  scene.add(marker);
  hotspots.push(marker);
  return marker;
}

// Resume: paper stack (right side, like the "Algorithms" stack in reference)
(function () {
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const p = box(0.34, 0.012, 0.44, COLOR.parchment, { roughness: 0.9 });
    p.position.set(3.3, DESK_Y + 0.01 + i * 0.013, -0.85);
    p.rotation.z = (Math.random() - 0.5) * 0.03;
    g.add(p);
  }
  scene.add(g);
  addHotspot('resume', 'Resume', new THREE.Vector3(3.3, DESK_Y + 0.35, -0.85));
})();

// Contact: small phone beside the papers
(function () {
  const g = new THREE.Group();
  const body = box(0.16, 0.32, 0.02, 0x111111, { roughness: 0.3, metalness: 0.4 });
  body.position.set(3.7, DESK_Y + 0.17, -0.7);
  body.rotation.x = -0.5;
  g.add(body);
  scene.add(g);
  addHotspot('contact', 'Contact', new THREE.Vector3(3.7, DESK_Y + 0.45, -0.7));
})();

// Skills: tablet with a glowing sketch, left of the easel
const tabletArt = makeCodeTexture();
(function () {
  const g = new THREE.Group();
  const body = box(0.34, 0.02, 0.24, 0x1a1a1a, { roughness: 0.3, metalness: 0.4 });
  body.position.set(-2.3, DESK_Y + 0.13, -0.75);
  body.rotation.x = -0.55;
  const screenM = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({ map: tabletArt.tex }));
  screenM.position.set(-2.3, DESK_Y + 0.145, -0.735);
  screenM.rotation.x = -0.55;
  g.add(body, screenM);
  scene.add(g);
  addHotspot('skills', 'Skills', new THREE.Vector3(-2.3, DESK_Y + 0.45, -0.75));
})();

// Music: compact keyboard on the desk
(function () {
  const g = new THREE.Group();
  const bed = box(0.62, 0.035, 0.18, 0x0c0c0c);
  bed.position.set(-3.4, DESK_Y + 0.018, -0.7);
  const whiteStrip = box(0.56, 0.012, 0.13, COLOR.parchment, { roughness: 0.9 });
  whiteStrip.position.set(-3.4, DESK_Y + 0.042, -0.7);
  g.add(bed, whiteStrip);
  const bk = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  for (let i = 0; i < 8; i++) {
    if (i % 7 === 2 || i % 7 === 6) continue;
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.015, 0.08), bk);
    k.position.set(-3.66 + i * 0.075, DESK_Y + 0.055, -0.75);
    g.add(k);
  }
  scene.add(g);
  addHotspot('music', 'Music', new THREE.Vector3(-3.4, DESK_Y + 0.35, -0.7));
})();

// Guitar (decorative, leaning) — pure atmosphere, not a hotspot
(function () {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2c1810, roughness: 0.4 });
  const gbody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.1, 20), bodyMat);
  gbody.rotation.x = Math.PI / 2;
  gbody.position.set(-5.1, 0.75, -0.3);
  const neck = box(0.06, 0.9, 0.03, 0x1a0f08);
  neck.position.set(-5.1, 1.5, -0.32);
  g.add(gbody, neck);
  g.rotation.z = 0.12;
  scene.add(g);
})();

// Violin (decorative)
(function () {
  const g = new THREE.Group();
  const vbody = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.4 }));
  vbody.rotation.x = Math.PI / 2;
  vbody.position.set(4.9, 0.55, -0.5);
  const vneck = box(0.03, 0.45, 0.02, 0x1a0f08);
  vneck.position.set(4.9, 0.95, -0.5);
  g.add(vbody, vneck);
  g.rotation.z = -0.1;
  scene.add(g);
})();

// Easel with real painting (Paintings — standing on the floor beside desk)
let easelRef;
function buildEasel(tex) {
  const g = new THREE.Group();
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.8 });
  const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 8), legMat);
  l1.position.set(-4.9, 0.85, -1.5); l1.rotation.x = 0.25;
  const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 8), legMat);
  l2.position.set(-4.75, 0.85, -1.8); l2.rotation.x = -0.15; l2.rotation.z = 0.08;
  g.add(l1, l2);
  const canvasMat = tex ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }) : new THREE.MeshStandardMaterial({ color: 0x2a2420 });
  const frame = box(0.75, 0.58, 0.03, 0x1a1210, { shadow: false });
  frame.position.set(-4.85, 1.55, -1.55);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.51), canvasMat);
  art.position.set(-4.85, 1.55, -1.53);
  g.add(frame, art);
  return g;
}
easelRef = buildEasel(null);
scene.add(easelRef);
addHotspot('paintings', 'Paintings', new THREE.Vector3(-4.85, 2.0, -1.55));
textureLoader.load('assets/painting1.jpg', (tex) => {
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.remove(easelRef);
  easelRef = buildEasel(tex);
  scene.add(easelRef);
});

// Bookshelf: Academics (books) + Achievements (trophies) — same shelf, different ends
(function () {
  const g = new THREE.Group();
  const shelf = box(2.0, 0.06, 0.35, COLOR.woodDark);
  shelf.position.set(4.6, 2.6, -3.9);
  const bracket = box(0.06, 0.35, 0.35, COLOR.woodDark);
  bracket.position.set(4.6, 2.4, -3.9);
  g.add(shelf, bracket);
  const bookColors = [COLOR.rose, COLOR.amber, 0x3a5a4a, COLOR.sage];
  let bx = 3.85;
  bookColors.forEach((c) => {
    const w = 0.1 + Math.random() * 0.05;
    const h = 0.32 + Math.random() * 0.12;
    const bk = box(w, h, 0.24, c, { roughness: 0.7 });
    bk.position.set(bx + w / 2, 2.63 + h / 2, -3.9);
    g.add(bk);
    bx += w + 0.015;
  });
  [4.9, 5.15].forEach((x) => {
    const cupBase = cyl(0.05, 0.06, 0.05, COLOR.gold, 12, { roughness: 0.25, metalness: 0.8 });
    cupBase.position.set(x, 2.66, -3.9);
    const cupBody = cyl(0.065, 0.03, 0.11, COLOR.gold, 12, { roughness: 0.25, metalness: 0.8 });
    cupBody.position.set(x, 2.74, -3.9);
    g.add(cupBase, cupBody);
  });
  scene.add(g);
  addHotspot('academics', 'Academics', new THREE.Vector3(4.05, 3.0, -3.9));
  addHotspot('achievements', 'Achievements', new THREE.Vector3(5.0, 3.0, -3.9));
})();

// About: wall poster carrying the personal tagline
const posterCanvas = document.createElement('canvas');
posterCanvas.width = 256; posterCanvas.height = 320;
const posterCtx = posterCanvas.getContext('2d');
posterCtx.fillStyle = '#0c0c0c'; posterCtx.fillRect(0, 0, 256, 320);
posterCtx.fillStyle = '#E8A560';
posterCtx.font = 'bold 26px Georgia';
posterCtx.fillText('I create', 24, 120);
posterCtx.fillText('in more than', 24, 160);
posterCtx.fillText('one language.', 24, 200);
const posterTex = new THREE.CanvasTexture(posterCanvas);
const posterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), new THREE.MeshBasicMaterial({ map: posterTex }));
posterMesh.position.set(-5.3, 2.6, -3.85);
posterMesh.rotation.y = 0.35;
scene.add(posterMesh);
addHotspot('about', 'About', new THREE.Vector3(-5.3, 3.4, -3.7));

// Projects hotspot anchors to the monitors
addHotspot('projects', 'Projects', new THREE.Vector3(0, 2.05, -2.55));

/* ============================================================
   AMBIENT DUST + LIGHT SHAFT (fake volumetrics)
   ============================================================ */
const dustCount = 110;
const dustGeo = new THREE.BufferGeometry();
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPos[i * 3] = (Math.random() - 0.5) * 5;
  dustPos[i * 3 + 1] = Math.random() * 3 + 0.4;
  dustPos[i * 3 + 2] = -4 + Math.random() * 3.5;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: COLOR.amberSoft, size: 0.02, transparent: true, opacity: 0.6 }));
scene.add(dust);

const shaftMat = new THREE.MeshBasicMaterial({ color: COLOR.amberSoft, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const shaft = new THREE.Mesh(new THREE.ConeGeometry(2.2, 6, 4, 1, true), shaftMat);
shaft.position.set(0, 3, -1);
shaft.rotation.x = Math.PI / 2 + 0.35;
shaft.rotation.z = 0.2;
scene.add(shaft);

/* ============================================================
   CAMERA FLIGHT
   ============================================================ */
let flight = null;
let currentLook = MASTER_LOOK.clone();
let activeSection = null;

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function flyTo(toPos, toLook, duration = 1300) {
  flight = { fromPos: camera.position.clone(), toPos: toPos.clone(), fromLook: currentLook.clone(), toLook: toLook.clone(), start: performance.now(), duration };
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
const hint = document.getElementById('hudHint');
const resetBtn = document.getElementById('resetBtn');
const promptBar = document.getElementById('promptBar');
const holo = document.getElementById('hologram');
const holoBody = document.getElementById('holoBody');
const holoClose = document.getElementById('holoClose');
const loader = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');
const cutFlash = document.getElementById('cutFlash');

function focusFor(pos) {
  return {
    cam: new THREE.Vector3(pos.x * 0.45, Math.max(pos.y + 0.55, 1.5), pos.z + 2.6),
    look: new THREE.Vector3(pos.x * 0.8, pos.y - 0.1, pos.z - 0.2),
  };
}

function cinematicCut(callback) {
  cutFlash.classList.add('is-active');
  setTimeout(() => {
    callback();
    setTimeout(() => cutFlash.classList.remove('is-active'), 60);
  }, 260);
}

function openSection(key) {
  const marker = hotspots.find((h) => h.userData.section === key);
  if (!marker) return;
  activeSection = key;
  const { cam, look } = focusFor(marker.position);
  cinematicCut(() => {
    camera.position.copy(cam);
    currentLook.copy(look);
    camera.lookAt(currentLook);
  });
  hint.classList.add('is-faded');
  resetBtn.classList.add('is-visible');
  promptBar.classList.remove('is-visible');
  setTimeout(() => {
    holoBody.innerHTML = CONTENT[key] || '';
    holo.classList.add('is-open');
  }, 320);
}

function resetView() {
  activeSection = null;
  holo.classList.remove('is-open');
  cinematicCut(() => {
    camera.position.copy(MASTER_POS);
    currentLook.copy(MASTER_LOOK);
    camera.lookAt(currentLook);
  });
  hint.classList.remove('is-faded');
  resetBtn.classList.remove('is-visible');
}

resetBtn.addEventListener('click', resetView);
holoClose.addEventListener('click', resetView);

const raycaster = new THREE.Raycaster();
const mouseVec = new THREE.Vector2();

function updatePointer(e) {
  const rect = canvas.getBoundingClientRect();
  mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener('mousemove', (e) => {
  if (activeSection) return;
  updatePointer(e);
  raycaster.setFromCamera(mouseVec, camera);
  const hits = raycaster.intersectObjects(hotspots, false);
  if (hits.length) {
    canvas.style.cursor = 'pointer';
    promptBar.innerHTML = `<span class="key">Click</span>Inspect ${hits[0].object.userData.label}`;
    promptBar.classList.add('is-visible');
  } else {
    canvas.style.cursor = 'default';
    promptBar.classList.remove('is-visible');
  }
});

canvas.addEventListener('click', (e) => {
  if (activeSection) return;
  updatePointer(e);
  raycaster.setFromCamera(mouseVec, camera);
  const hits = raycaster.intersectObjects(hotspots, false);
  if (hits.length) openSection(hits[0].object.userData.section);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================================================
   CONTENT
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
    <div class="holo-entry"><span class="when">2024 – Expected 2028</span><h4>B.Tech, Computer Science & Engineering</h4><div class="where">Jaypee Institute of Information Technology, Noida</div></div>
    <div class="holo-entry"><span class="when">2024</span><h4>Class XII, CBSE</h4><div class="where">Score: 77.4%</div></div>
    <div class="holo-stub">Send coursework, specializations, or CGPA and I'll add them here.</div>
  `,
  skills: `
    <span class="eyebrow">Skills</span>
    <h2>The toolkit.</h2>
    <div class="holo-block"><h3>Languages</h3><div class="holo-pills"><span class="holo-pill">C++</span><span class="holo-pill">Java</span><span class="holo-pill">JavaScript</span><span class="holo-pill">Python</span><span class="holo-pill">SQL</span></div></div>
    <div class="holo-block"><h3>Tools</h3><div class="holo-pills"><span class="holo-pill">Git</span><span class="holo-pill">GitHub</span><span class="holo-pill">Android Studio</span><span class="holo-pill">MySQL</span></div></div>
    <div class="holo-stub">Send proficiency levels or new tools and I'll refine this.</div>
  `,
  resume: `
    <span class="eyebrow">Resume</span>
    <h2>The formal version.</h2>
    <div class="holo-actions"><a class="btn btn-primary" style="color:#0A1F24;" href="assets/gavish-nagar-resume.pdf" download>Download PDF</a></div>
    <div class="holo-block" style="margin-top:1.2rem;">
      <h3>Experience</h3>
      <div class="holo-entry">
        <span class="when">May 2026 – Jul 2026</span>
        <h4>Frontend Developer Intern</h4>
        <div class="where">Tectigon IT Solutions · Remote</div>
        <ul><li>Built a 7-page Intern Management Dashboard (tasks, attendance, standups, resources, profile).</li><li>Implemented search, filtering, and responsive navigation in vanilla JavaScript.</li></ul>
      </div>
    </div>
  `,
  projects: `
    <span class="eyebrow">Projects</span>
    <h2>Things I've built.</h2>
    <div class="holo-entry"><h4>Tectigon Intern Hub</h4><div class="where">HTML · CSS · JavaScript</div><p>A responsive 7-page internship management dashboard with modules for tasks, attendance, standups, learning resources and profile management.</p></div>
    <div class="holo-entry"><h4>Sammarshya Employee Portal</h4><div class="where">HTML · CSS · JavaScript</div><p>An employee portal with Kanban-style task management, attendance tracking, leave management and LocalStorage persistence.</p></div>
    <div class="holo-entry"><h4>MindLog: Mental Health Journal App</h4><div class="where">Java · Android Studio · Room · SQLite</div><p>An in-progress Android app for mood tracking and visualization.</p></div>
    <div class="holo-entry"><h4>Terminal Social Network Analyzer</h4><div class="where">C++ · STL</div><p>Dijkstra's Algorithm, PageRank and Label Propagation for graph-based social network analysis.</p></div>
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
function drawCodeTexture(entry, seed) {
  const { ctx, c, tex } = entry;
  ctx.fillStyle = '#05131a';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = '7px monospace';
  const lines = ['function build() {', '  return dream;', '}', 'const art =', '  gavish.paint()', '<Portfolio />', 'git commit -m', "  'alive'", 'while (curious) {', '  learn();', '}'];
  for (let i = 0; i < lines.length; i++) {
    const y = ((i * 10 + frame * 0.5 + seed) % (c.height + 10));
    ctx.fillStyle = i % 3 === 0 ? '#E8A560' : '#8FE3B8';
    ctx.fillText(lines[i], 3, y);
  }
  tex.needsUpdate = true;
}

function animate(now) {
  requestAnimationFrame(animate);
  frame++;

  updateFlight(now);

  // subtle cinematic idle breathing when parked
  if (!flight && !activeSection) {
    camera.position.x = MASTER_POS.x + Math.sin(now * 0.00035) * 0.06;
    camera.position.y = MASTER_POS.y + Math.sin(now * 0.0005) * 0.03;
    camera.lookAt(currentLook);
  }

  if (frame % 5 === 0) drawSky();
  if (frame % 6 === 0) {
    drawCodeTexture(codeScreens[0], 0);
    drawCodeTexture(codeScreens[1], 40);
    drawCodeTexture(laptopArt, 80);
    drawCodeTexture(tabletArt, 20);
  }

  hotspots.forEach((m, i) => {
    m.rotation.y += 0.02;
    m.position.y = m.userData.baseY + Math.sin(now * 0.002 + i) * 0.025;
  });

  dust.rotation.y += 0.0002;
  grainPass.uniforms.time.value = now * 0.001;

  composer.render();
}
requestAnimationFrame(animate);

/* ============================================================
   LOADER
   ============================================================ */
let progress = 0;
const loadInterval = setInterval(() => {
  progress = Math.min(100, progress + 14);
  loaderFill.style.width = progress + '%';
  if (progress >= 100) {
    clearInterval(loadInterval);
    setTimeout(() => loader.classList.add('is-hidden'), 250);
  }
}, 110);
