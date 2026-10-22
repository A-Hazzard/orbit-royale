// The Gilded Comet lobby: the casino itself, in 3D.  The room, the roulette table and wheel, the six slot cabinets and the blackjack
// table are the game's own Blender models (models/*.glb, exported by _Work/export_lobby.py from the casino scene, the slot cabinet
// and the blackjack table art).  Hover a game to light it, click or tap to fly the camera up to it, then press Play.
// What moves here is decoration only: the ball, the reels' lights, the dealt cards pay nothing and decide nothing.
import * as THREE from "./lib/three.module.min.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";

const Y0 = -0.79;                                  // the casino floor in the exported scene (metres)
const GAMES = [
  { id: "roulette", tag: "European roulette", name: "Orbit Royale", href: "../index.html",
    blurb: "European roulette with a single zero. Bet on the felt or the racetrack, then watch the ball settle.",
    facts: [["Returns to player", "97.3%"], ["Chips", "1 to 500"]], play: "Play roulette",
    cam: [0.75, 1.15, 1.45], look: [-0.05, 0.05, 0.0], label: [0, 0.62, 1.3] },
  { id: "slots", tag: "Five-reel video slot", name: "Lucky Orbit", href: "../index.html?slots=1",
    blurb: "A five-reel video slot with 20 lines. Three Shooting Stars start the free spins, and every win in them is multiplied.",
    facts: [["Reels and lines", "5 and 20"], ["Bets", "20 to 400"], ["Free spins", "10 to 50"]], play: "Play Lucky Orbit",
    cam: [-0.4, 1.2, 0.45], look: [-0.4, 0.65, -2.7], label: [-0.4, 0.2, -1.3] },
  { id: "blackjack", tag: "Six decks, 3 to 2", name: "Blackjack", href: "../index.html?bj=1",
    blurb: "Six decks, dealer stands on soft 17, blackjack pays 3 to 2. Choose your table rules and see what each one costs.",
    facts: [["House edge", "0.43%"], ["Chips", "1 to 500"], ["Boxes", "1 to 3"]], play: "Play blackjack",
    cam: [0.55, 1.3, 3.3], look: [2.0, 0.05, 1.25], label: [2.0, 0.75, 1.25] },
];
const OVERVIEW = { cam: [0.3, 1.65, 3.95], look: [0.3, 0.05, -0.9] };
const SLOT_X = [-2.15, -1.45, -0.75, -0.05, 0.65, 1.35], SLOT_Z = -2.7;      // the bank along the back wall
const PAINT = [[0.42, 0.012, 0.03], [0.17, 0.02, 0.32], [0.012, 0.055, 0.36], [0.012, 0.055, 0.36], [0.17, 0.02, 0.32], [0.42, 0.012, 0.03]]; // Halo Wheel, Nebula Bloom, Lucky Orbit

const $ = (s) => document.querySelector(s);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GOLD = "#F2C14E", IVORY = "#F1E9D8";

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $("#stage"), antialias: true, powerPreference: "high-performance" }); }
catch (e) { document.body.classList.add("no3d"); throw e; }

(async function main() {
  try { await Promise.race([document.fonts.load('48px "Limelight"'), document.fonts.load('600 24px "Figtree"'), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* serif fallback */ }
  const isTouch = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0414);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.05, 40);

  // ---------------------------------------------------------------- helpers
  function canvasTex(w, h, draw) {
    const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t;
  }
  const glowTex = canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,240,200,1)"); r.addColorStop(0.25, "rgba(255,210,120,0.55)"); r.addColorStop(1, "rgba(255,200,100,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
  const eachMat = (root, fn) => root.traverse((o) => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => fn(o, m)); });

  // a small studio for the reflections
  { const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene(); es.background = new THREE.Color(0x2a1a3a);
    const panel = (c, i, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
    panel(0xffd9a0, 4, 0, 8, 0, 9, 9); panel(0xffb070, 2, 6, 3, 4, 4, 4); panel(0x9a7cff, 1.6, -6, 3, -3, 4, 4); panel(0xffffff, 1, 0, 2, 8, 6, 3);
    scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose(); }

  // ---------------------------------------------------------------- lights (the casino scene's own, converted to this scene's axes)
  scene.add(new THREE.HemisphereLight(0xb89ae0, 0x4a1530, 0.9));
  const pl = (c, i, x, y, z, d = 7) => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); scene.add(l); return l; };
  const lamp = pl(0xff9540, 14, 0.5, 1.6, -0.6, 8);
  pl(0x36e5ff, 7, -0.9, 0.55, -1.0); pl(0xff41a1, 6, 1.2, 0.9, 1.4);
  pl(0xff0a58, 8, -1.1, 2.05, -3.15, 6); pl(0xff0533, 8, -2.55, 2.25, 0.9, 7); pl(0x4605ff, 10, -0.6, 2.2, -1.5, 8);
  const slotSpills = [[-2.15, 0xff0a58], [-1.45, 0x03ffdf], [-0.75, 0x66ff03], [-0.05, 0xff0a88], [0.65, 0xff8a03], [1.35, 0x03dbff]].map(([x, c]) => pl(c, 3.2, x, 0.5, -2.1, 3.5));
  const wheelSpot = new THREE.SpotLight(0xffc27a, 40, 8, 0.45, 0.6, 2); wheelSpot.position.set(-0.55, 2.3, 0.35); wheelSpot.target.position.set(0, 0, 0); scene.add(wheelSpot, wheelSpot.target);
  const bjLight = pl(0xffd9a0, 12, 2.0, 1.9, 1.25, 6);

  // ---------------------------------------------------------------- stations: one per game, with a hit box, a name card and a ring of light
  const stations = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  function station(def, hitCenter, hitSize, extra) {
    const st = { def, glow: 0, glowTarget: 0, anim: () => {}, pulse: [], ...extra };
    const lab = canvasTex(768, 220, (c, w, h) => {
      c.fillStyle = "rgba(20,8,34,0.84)"; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 40); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 5; c.stroke();
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = GOLD; c.font = '76px "Limelight", Georgia, serif'; c.fillText(def.name, w / 2, h * 0.42);
      c.fillStyle = IVORY; c.font = '600 38px "Figtree", system-ui, sans-serif'; c.fillText(def.tag, w / 2, h * 0.78);
    });
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.93, 0.267), new THREE.MeshBasicMaterial({ map: lab, transparent: true, depthWrite: false, toneMapped: false }));
    lm.position.set(...def.label); scene.add(lm); st.label = lm;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(...hitSize), hitMat); hit.position.set(...hitCenter); hit.userData.station = st; scene.add(hit); st.hit = hit;
    stations.push(st); return st;
  }

  // ---------------------------------------------------------------- the models
  const loader = new GLTFLoader();
  const gltf = (u) => new Promise((res, rej) => loader.load(u, res, undefined, rej));
  const V = "?v=3";
  const [roomG, rouG, slotG, bjG] = await Promise.all(["room", "roulette", "slot", "blackjack"].map((n) => gltf("models/" + n + ".glb" + V).catch((e) => { console.warn("model", n, e); return null; })));

  const roomPulse = [];
  if (roomG) {
    const room = roomG.scene; scene.add(room);
    eachMat(room, (o, m) => {
      m.side = THREE.DoubleSide; m.envMapIntensity = 0.5;
      const n = (m.name || "") + " " + o.name;
      if (m.emissiveIntensity > 0 && /Neon|Bokeh|LED|Canopy/i.test(n)) roomPulse.push({ m, base: m.emissiveIntensity, ph: Math.random() * 6, kind: /Bokeh/i.test(n) ? 2 : /Neon/i.test(n) ? 1 : 0 });
      if (/Carpet/i.test(n) && m.map) { m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(1, 1); }
    });
  }

  // ---- roulette (in place: the wheel's centre is the scene's origin)
  if (rouG) {
    const root = rouG.scene; scene.add(root);
    const rotor = root.getObjectByName("RotorPivot"), ballp = root.getObjectByName("BallPivot");
    eachMat(root, (o, m) => { m.envMapIntensity = 0.5; });
    const b = new THREE.Box3().setFromObject(root), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    const st = station(GAMES[0], [c.x, c.y, c.z], [s.x + 0.2, s.y + 0.2, s.z + 0.2], {});
    st.anim = (t, dt) => { if (rotor) rotor.rotation.y += dt * 0.5; if (ballp) ballp.rotation.y -= dt * 2.4; };
  }

  // ---- the slot bank: six copies of the real cabinet, each in its game's paint
  const slotMachines = [];
  if (slotG) {
    SLOT_X.forEach((x, i) => {
      const m = i === 0 ? slotG.scene : slotG.scene.clone(true);
      const wrap = new THREE.Group(); wrap.add(m); scene.add(wrap);
      const chair = m.getObjectByName("Slot_C_Chair"); if (chair) chair.visible = false;
      const bb = new THREE.Box3().setFromObject(wrap), cc = bb.getCenter(new THREE.Vector3());
      wrap.position.set(x - cc.x, Y0 - bb.min.y, SLOT_Z - cc.z);
      const lights = [];
      m.traverse((o) => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const out = mats.map((mt) => {
          const k = mt.clone(); k.envMapIntensity = 0.6;
          if (/Paint/i.test(k.name)) k.color.setRGB(...PAINT[i]);
          if (k.emissiveIntensity > 0 || k.emissiveMap) lights.push([k, k.emissiveIntensity || 1]);
          return k;
        });
        o.material = Array.isArray(o.material) ? out : out[0];
      });
      slotMachines.push({ lights, ph: i * 1.3 });
    });
    const st = station(GAMES[1], [-0.4, Y0 + 1.1, SLOT_Z + 0.1], [1.7, 2.4, 1.0], {});
    st.anim = (t) => {
      slotMachines.forEach((s, i) => {
        const lucky = i === 2 || i === 3;
        const k = 0.85 + 0.15 * Math.sin(t * 3.1 + s.ph) + (Math.sin(t * 7.3 + s.ph * 2) > 0.92 ? 0.35 : 0) + (lucky ? st.glow * 0.4 : 0);
        s.lights.forEach(([m, i0]) => { m.emissiveIntensity = i0 * k; });
      });
    };
  }

  // ---- blackjack: the table from the game's art, real-size cards and chips, a hand dealt now and then
  if (bjG) {
    const hold = new THREE.Group(); hold.add(bjG.scene); scene.add(hold);
    hold.position.set(2.0, Y0, 1.25); hold.rotation.y = -0.5;
    eachMat(bjG.scene, (o, m) => { m.envMapIntensity = 0.5; });
    const TOP = 0.91, CS = 1.5;
    const atlas = new THREE.TextureLoader().load("models/BJ_Cards.png" + V); atlas.colorSpace = THREE.SRGBColorSpace; atlas.anisotropy = 8;
    const AW = 2600, AH = 1400, CW = 200, CH = 280, GUT = 6;
    const card = (suit, rank, back) => {                                   // suit 0 clubs, 1 diamonds, 2 hearts, 3 spades; rank 0 = A .. 12 = K
      const g = new THREE.PlaneGeometry(0.0635 * CS, 0.0889 * CS), rk = back ? 0 : rank, row = back ? 4 : suit;
      const u0 = (rk * CW + GUT) / AW, u1 = ((rk + 1) * CW - GUT) / AW, v0 = (row * CH + GUT) / AH, v1 = ((row + 1) * CH - GUT) / AH;
      const uv = g.attributes.uv; uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: atlas, alphaTest: 0.5, side: THREE.DoubleSide, color: 0xdddddd }));
      m.rotation.x = -Math.PI / 2; hold.add(m); return m;
    };
    const shoe = new THREE.Vector3(0.775, TOP + 0.06, -0.02);
    const hands = [{ x: -0.6, z: 0.24, cs: [[1, 9], [0, 8]] }, { x: 0.0, z: 0.385, cs: [[3, 0], [2, 12]] }, { x: 0.6, z: 0.24, cs: [[2, 7], [3, 7]] }, { x: 0.0, z: 0.075, cs: [[0, 6], "back"] }];
    const cards = [];
    hands.forEach((h, hi) => h.cs.forEach((c, i) => {
      const m = c === "back" ? card(0, 0, true) : card(c[0], c[1], false);
      cards.push({ m, to: new THREE.Vector3(h.x - 0.03 + i * 0.05, TOP + 0.002 + i * 0.0006, h.z - i * 0.012), from: shoe, delay: 0.21 * (i * 4 + hi) + 0.1, yaw: (hi - 1.2) * 0.08 + i * 0.05 });
    }));
    const CHIPC = ["#eeeeee", "#d0293d", "#2b5dd6", "#f08a1a", "#222222", "#6a2bbf", "#F2C14E"];
    const face = CHIPC.map((col) => canvasTex(128, 128, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 7; c.beginPath(); c.arc(64, 64, 52, 0, 7); c.stroke(); c.lineWidth = 10; c.setLineDash([14, 14]); c.beginPath(); c.arc(64, 64, 60, 0, 7); c.stroke(); }));
    const chipGeo = new THREE.CylinderGeometry(0.0195, 0.0195, 0.0033, 28);
    const chipMats = CHIPC.map((col, k) => [new THREE.MeshStandardMaterial({ color: col, roughness: 0.45 }), new THREE.MeshStandardMaterial({ map: face[k], roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: face[k], roughness: 0.4 })]);
    const stack = (k, x, z, n) => { for (let i = 0; i < n; i++) { const c = new THREE.Mesh(chipGeo, chipMats[k]); c.position.set(x + 0.0007 * ((i * 7) % 3 - 1), TOP + 0.00165 + i * 0.0033, z); c.rotation.y = i * 0.7; hold.add(c); } };
    stack(2, -0.6, 0.45, 3); stack(3, 0.0, 0.60, 5); stack(1, 0.6, 0.45, 2);
    for (let row = 0; row < 2; row++) for (let k = 0; k < 7; k++) stack(k, -0.26 + 0.087 * k, -0.135 - 0.05 * row, 11 + (k * 3 + row * 5) % 4);
    const shoeM = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.11), new THREE.MeshStandardMaterial({ color: 0x0d1020, roughness: 0.55, metalness: 0.2 }));
    shoeM.position.set(0.82, TOP + 0.05, -0.085); shoeM.rotation.y = 0.15; hold.add(shoeM);
    hold.updateMatrixWorld(true);
    const st = station(GAMES[2], [2.0, Y0 + 0.7, 1.25], [2.6, 1.6, 2.2], {});
    st.anim = (t) => {
      const cyc = t % 9.0;
      cards.forEach((cd) => {
        const k = THREE.MathUtils.clamp((cyc - cd.delay) / 0.55, 0, 1), e = 1 - Math.pow(1 - k, 3);
        const hide = cyc > 8.2 ? THREE.MathUtils.clamp((cyc - 8.2) / 0.6, 0, 1) : 0;
        cd.m.position.lerpVectors(cd.from, cd.to, e); cd.m.position.y += Math.sin(Math.PI * k) * 0.12;
        cd.m.rotation.z = cd.yaw * e; cd.m.visible = k > 0 && hide < 1; cd.m.scale.setScalar(1 - hide * 0.3);
      });
    };
  }
  stations.sort((a, b) => GAMES.indexOf(a.def) - GAMES.indexOf(b.def));

  // ---------------------------------------------------------------- life: sweeping beams, drifting glints
  const beams = [];
  [[-1.8, 0xff3d9a, 0], [0.6, 0x3de5ff, 2], [2.4, 0xffc45a, 4]].forEach(([x, col, ph]) => {
    const g = new THREE.Group(); g.position.set(x, 2.55, -0.4);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.3, 24, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    cone.position.y = -1.65; g.add(cone); scene.add(g); beams.push({ g, ph });
  });
  const N = 140, dust = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { dust[i * 3] = -3.4 + Math.random() * 7.6; dust[i * 3 + 1] = Y0 + Math.random() * 3.3; dust[i * 3 + 2] = -3.2 + Math.random() * 7; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  scene.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTex, size: 0.045, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffdca0 })));

  // ---------------------------------------------------------------- camera
  const asp = () => camera.aspect;
  function pose(st) {
    const d = st ? st.def : null, src = d ? { cam: d.cam, look: d.look } : OVERVIEW;
    const cam = new THREE.Vector3(...src.cam), look = new THREE.Vector3(...src.look);
    const a = asp();
    if (a < 1) { const back = (1 / a - 1) * (d ? 0.9 : 1.2); const dir = cam.clone().sub(look).setY(0).normalize(); cam.addScaledVector(dir, back); if (d) look.y -= 0.12 * (1 / a); }
    else if (d && a > 1.2) { const dir = cam.clone().sub(look).setY(0).normalize(); const side = new THREE.Vector3(dir.z, 0, -dir.x); look.addScaledVector(side, -0.28); }   // leave room for the info card on the left
    return { cam, look };
  }
  let curPos = new THREE.Vector3(...OVERVIEW.cam), curLook = new THREE.Vector3(...OVERVIEW.look);
  camera.position.copy(curPos);
  let focused = null, hovered = null, interacted = false;
  const ptr = { x: 0, y: 0 };

  // ---------------------------------------------------------------- UI
  const panel = $("#panel"), tabs = [...document.querySelectorAll("[data-tab]")], hint = $("#hint");
  function setFocus(id) {
    focused = id ? stations.find((s) => s.def.id === id) || null : null;
    document.body.classList.toggle("focused", !!focused);
    tabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === id)));
    if (focused) {
      const d = focused.def;
      $("#p-name").textContent = d.name; $("#p-blurb").textContent = d.blurb;
      $("#p-facts").innerHTML = d.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
      const a = $("#p-play"); a.textContent = d.play; a.href = d.href;
      panel.hidden = false; requestAnimationFrame(() => panel.classList.add("on"));
    } else { panel.classList.remove("on"); setTimeout(() => { if (!focused) panel.hidden = true; }, 300); }
    if (!interacted) { interacted = true; hint.classList.add("gone"); }
  }
  tabs.forEach((b) => b.addEventListener("click", () => setFocus(focused && focused.def.id === b.dataset.tab ? null : b.dataset.tab)));
  $("#p-back").addEventListener("click", () => setFocus(null));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") setFocus(null);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const i = focused ? stations.indexOf(focused) : -1, n = stations.length;
      setFocus(stations[i < 0 ? (e.key === "ArrowRight" ? 0 : n - 1) : (e.key === "ArrowRight" ? (i + 1) % n : (i - 1 + n) % n)].def.id);
    }
  });

  // ---------------------------------------------------------------- pointer
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), cv = renderer.domElement;
  function pick(ev) {
    const r = cv.getBoundingClientRect(); v2.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera);
    const hit = ray.intersectObjects(stations.map((s) => s.hit), false)[0];
    return hit ? hit.object.userData.station : null;
  }
  cv.addEventListener("pointermove", (ev) => {
    const r = cv.getBoundingClientRect(); ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1; ptr.y = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    if (ev.pointerType === "mouse") { hovered = pick(ev); cv.style.cursor = hovered && hovered !== focused ? "pointer" : "default"; }
  });
  cv.addEventListener("pointerleave", () => { hovered = null; });
  let down = null;
  cv.addEventListener("pointerdown", (ev) => { down = { x: ev.clientX, y: ev.clientY }; });
  cv.addEventListener("pointerup", (ev) => {
    if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 8) { down = null; return; }
    down = null; const s = pick(ev);
    if (s) { if (focused !== s) setFocus(s.def.id); } else if (focused) setFocus(null);
  });

  // ---------------------------------------------------------------- loop
  function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 66 : 58; camera.updateProjectionMatrix(); }
  addEventListener("resize", resize); resize();

  const clock = new THREE.Clock(); let t = 0; const tmp = new THREE.Vector3(), tgtP = new THREE.Vector3(), tgtL = new THREE.Vector3();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05); t += dt;
    const p = pose(focused), rate = reduceMotion ? 30 : 2.4, k = 1 - Math.exp(-dt * rate);
    const px = reduceMotion ? 0 : ptr.x, py = reduceMotion ? 0 : ptr.y;
    const orbit = reduceMotion || focused ? 0 : Math.sin(t * 0.16) * 0.7;           // the lobby view drifts slowly side to side
    tgtP.set(p.cam.x + px * 0.18 + orbit, p.cam.y + py * 0.07, p.cam.z); tgtL.set(p.look.x + px * 0.35 - orbit * 0.3, p.look.y + py * 0.1, p.look.z);
    curPos.lerp(tgtP, k); curLook.lerp(tgtL, k); camera.position.copy(curPos); camera.lookAt(curLook);

    for (const st of stations) {
      st.glowTarget = hovered === st || focused === st ? 1 : 0; st.glow += (st.glowTarget - st.glow) * (1 - Math.exp(-dt * 6));
      st.label.visible = !focused; st.label.lookAt(camera.position);
      st.anim(t, dt);
    }
    wheelSpot.intensity = 36 + (stations[0] ? stations[0].glow * 50 : 0);
    bjLight.intensity = 10 + (stations[2] ? stations[2].glow * 22 : 0);
    slotSpills.forEach((l, i) => { l.intensity = 2.6 + 1.2 * Math.sin(t * 2.2 + i * 1.1) + (stations[1] ? stations[1].glow * ((i === 2 || i === 3) ? 3 : 0) : 0); });
    lamp.intensity = 13 + Math.sin(t * 1.7) * 1.2;
    for (const r of roomPulse) {
      const w = r.kind === 2 ? 0.55 + 0.45 * Math.sin(t * 5 + r.ph * 7) * Math.sin(t * 1.3 + r.ph) : r.kind === 1 ? 0.8 + 0.2 * Math.sin(t * 2.2 + r.ph) - (Math.sin(t * 13 + r.ph) > 0.97 ? 0.5 : 0) : 0.85 + 0.15 * Math.sin(t * 1.1 + r.ph);
      r.m.emissiveIntensity = r.base * w;
    }
    beams.forEach((b) => { b.g.rotation.z = Math.sin(t * 0.5 + b.ph) * 0.45; b.g.rotation.x = Math.cos(t * 0.37 + b.ph) * 0.35; });
    const dp = dustGeo.attributes.position; for (let i = 0; i < N; i++) { dp.array[i * 3 + 1] += dt * (0.03 + (i % 5) * 0.012); dp.array[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.02; if (dp.array[i * 3 + 1] > Y0 + 3.4) dp.array[i * 3 + 1] = Y0; }
    dp.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  document.body.classList.add("ready", "loaded");
  frame();
  window.__lobby = { setFocus, stations, camera, scene };
})();
