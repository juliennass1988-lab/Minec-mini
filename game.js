import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

const canvas = document.querySelector("#game");
const loading = document.querySelector("#loading");
const resetBtn = document.querySelector("#resetBtn");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ed7ff);
scene.fog = new THREE.Fog(0x9ed7ff, 24, 72);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 120);
camera.position.set(0, 8, 11);

const hemi = new THREE.HemisphereLight(0xf5fbff, 0x4a7a48, 1.7);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 2.45);
sun.position.set(9, 16, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
scene.add(sun);

const materials = {
  grassTop: new THREE.MeshStandardMaterial({ color: 0x48b64a, roughness: 0.82 }),
  grassSide: new THREE.MeshStandardMaterial({ color: 0x2f8d3b, roughness: 0.86 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.95 }),
  path: new THREE.MeshStandardMaterial({ color: 0x62ca58, roughness: 0.8 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xf2bf8f, roughness: 0.72 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x2d7cf6, roughness: 0.75 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x2849a8, roughness: 0.78 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x4a2d1b, roughness: 0.88 }),
  eye: new THREE.MeshStandardMaterial({ color: 0x121516, roughness: 0.4 }),
  cloud: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
};

function cube(width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeVoxelBlock(x, z, h = 1, mat = materials.path) {
  const g = new THREE.Group();
  const side = cube(1, h, 1, materials.dirt);
  side.position.set(x, h / 2 - 0.5, z);
  const top = cube(1.02, 0.08, 1.02, mat);
  top.position.set(x, h - 0.46, z);
  g.add(side, top);
  scene.add(g);
  return g;
}

function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = cube(0.45 * scale, 1.8 * scale, 0.45 * scale, new THREE.MeshStandardMaterial({ color: 0x7b4b2b, roughness: 0.9 }));
  trunk.position.y = 0.4 + 0.9 * scale;
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f9d46, roughness: 0.85 });
  const leaves = [
    cube(1.8 * scale, 1.1 * scale, 1.8 * scale, leafMat),
    cube(1.35 * scale, 1.0 * scale, 1.35 * scale, leafMat),
  ];
  leaves[0].position.y = 2.2 * scale;
  leaves[1].position.y = 3.0 * scale;
  tree.add(trunk, ...leaves);
  tree.position.set(x, -0.5, z);
  scene.add(tree);
}

function makeCloud(x, y, z, scale = 1) {
  const cloud = new THREE.Group();
  [[0,0,0,1.4],[1,0.1,0,1],[-1,0.05,0,1],[0.4,0.25,0,1.2]].forEach(([cx, cy, cz, s]) => {
    const part = cube(s * scale, 0.52 * scale, 0.65 * scale, materials.cloud);
    part.position.set(cx * scale, cy * scale, cz * scale);
    cloud.add(part);
  });
  cloud.position.set(x, y, z);
  scene.add(cloud);
}

function makeCharacter() {
  const player = new THREE.Group();
  player.name = "BlockyCharacter";

  const torso = cube(0.9, 1.25, 0.48, materials.shirt);
  torso.position.y = 1.65;

  const head = cube(0.78, 0.78, 0.78, materials.skin);
  head.position.y = 2.68;

  const hair = cube(0.82, 0.18, 0.82, materials.hair);
  hair.position.y = 3.16;

  const eyeL = cube(0.11, 0.11, 0.04, materials.eye);
  const eyeR = cube(0.11, 0.11, 0.04, materials.eye);
  eyeL.position.set(-0.18, 2.75, 0.41);
  eyeR.position.set(0.18, 2.75, 0.41);

  const armL = cube(0.28, 1.08, 0.32, materials.skin);
  const armR = cube(0.28, 1.08, 0.32, materials.skin);
  armL.position.set(-0.74, 1.58, 0);
  armR.position.set(0.74, 1.58, 0);

  const legL = cube(0.34, 1.0, 0.34, materials.pants);
  const legR = cube(0.34, 1.0, 0.34, materials.pants);
  legL.position.set(-0.23, 0.55, 0);
  legR.position.set(0.23, 0.55, 0);

  player.userData.parts = { torso, head, hair, eyeL, eyeR, armL, armR, legL, legR };
  player.add(torso, head, hair, eyeL, eyeR, armL, armR, legL, legR);
  player.position.set(0, 0.02, 0);
  scene.add(player);
  return player;
}

const world = new THREE.Group();
scene.add(world);

const blockPositions = new Map();
function keyOf(x, z) {
  return `${Math.round(x)},${Math.round(z)}`;
}

function addBlock(x, z, h = 1, material = materials.path) {
  makeVoxelBlock(x, z, h, material);
  blockPositions.set(keyOf(x, z), true);
}

// simple green path/platforms
for (let z = -8; z <= 26; z += 1) {
  addBlock(0, z, 1, materials.path);
  if (z % 3 !== 0) addBlock(-1, z, 1, materials.grassTop);
  if (z % 4 !== 0) addBlock(1, z, 1, materials.grassTop);
}
for (let z = 4; z <= 14; z++) addBlock(2, z, 1, materials.grassTop);
for (let z = 10; z <= 19; z++) addBlock(-2, z, 1, materials.grassTop);
for (let x = -3; x <= 3; x++) addBlock(x, 21, 1, materials.grassTop);
for (let x = -2; x <= 2; x++) addBlock(x, 24, 1, materials.path);

// decorative terrain
for (let x = -10; x <= 10; x++) {
  for (let z = -12; z <= 32; z++) {
    if (blockPositions.has(keyOf(x, z))) continue;
    if (Math.random() < 0.26) {
      makeVoxelBlock(x, z, 0.6 + Math.random() * 0.25, materials.grassTop);
    }
  }
}

makeTree(-5, 4, 0.9);
makeTree(5, 8, 1.15);
makeTree(-6, 18, 1.05);
makeTree(7, 22, 0.95);
makeCloud(-7, 8, 6, 1.0);
makeCloud(6, 9, 15, 1.2);
makeCloud(-4, 10, 26, 0.85);

const player = makeCharacter();

const keys = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
};

const inputMap = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
};

window.addEventListener("keydown", (event) => {
  const key = inputMap[event.code];
  if (key) {
    keys[key] = true;
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  const key = inputMap[event.code];
  if (key) {
    keys[key] = false;
    event.preventDefault();
  }
});

document.querySelectorAll("[data-key]").forEach((button) => {
  const key = button.dataset.key;
  const set = (value) => {
    keys[key] = value;
    button.classList.toggle("active", value);
  };
  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    button.setPointerCapture(e.pointerId);
    set(true);
  });
  button.addEventListener("pointerup", (e) => {
    e.preventDefault();
    set(false);
  });
  button.addEventListener("pointercancel", () => set(false));
  button.addEventListener("pointerleave", () => set(false));
});

let velocityY = 0;
let isGrounded = true;
let clock = new THREE.Clock();
let walkTime = 0;
const spawn = new THREE.Vector3(0, 0.02, 0);

function isOnBlock(x, z) {
  return blockPositions.has(keyOf(x, z));
}

function resetGame() {
  player.position.copy(spawn);
  player.rotation.set(0, 0, 0);
  velocityY = 0;
  isGrounded = true;
}

resetBtn.addEventListener("click", resetGame);

function updatePlayer(delta) {
  const speed = 5.4;
  const move = new THREE.Vector3();

  if (keys.forward) move.z += 1;
  if (keys.back) move.z -= 1;
  if (keys.left) move.x -= 1;
  if (keys.right) move.x += 1;

  const moving = move.lengthSq() > 0;
  if (moving) {
    move.normalize();
    const nextX = player.position.x + move.x * speed * delta;
    const nextZ = player.position.z + move.z * speed * delta;

    if (isOnBlock(nextX, player.position.z)) player.position.x = nextX;
    if (isOnBlock(player.position.x, nextZ)) player.position.z = nextZ;

    const angle = Math.atan2(move.x, move.z);
    player.rotation.y = angle;
    walkTime += delta * 9.5;
  } else {
    walkTime += delta * 2;
  }

  if (keys.jump && isGrounded) {
    velocityY = 6.8;
    isGrounded = false;
  }

  velocityY -= 16 * delta;
  player.position.y += velocityY * delta;

  const groundY = 0.02;
  if (player.position.y <= groundY) {
    player.position.y = groundY;
    velocityY = 0;
    isGrounded = true;
  }

  const { armL, armR, legL, legR, head } = player.userData.parts;
  const swing = moving ? Math.sin(walkTime) * 0.48 : Math.sin(walkTime) * 0.05;
  armL.rotation.x = swing;
  armR.rotation.x = -swing;
  legL.rotation.x = -swing;
  legR.rotation.x = swing;
  head.rotation.y = Math.sin(walkTime * 0.35) * 0.06;
  player.position.y += moving && isGrounded ? Math.abs(Math.sin(walkTime * 2)) * 0.018 : 0;

  if (player.position.y < -8 || player.position.z < -12) resetGame();
}

function updateCamera(delta) {
  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 2.05,
    player.position.z
  );
  const desired = new THREE.Vector3(
    player.position.x - Math.sin(player.rotation.y) * 7.2,
    player.position.y + 6.2,
    player.position.z - Math.cos(player.rotation.y) * 8.8
  );

  camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
  camera.lookAt(target);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("resize", resize);
resize();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  updatePlayer(delta);
  updateCamera(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

setTimeout(() => loading.classList.add("hidden"), 250);
setTimeout(() => loading.remove(), 650);
animate();
