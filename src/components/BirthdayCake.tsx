import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

interface BirthdayCakeProps {
  size?: 'sm' | 'md' | 'lg';
  onBlow?: () => void;
}

// Procedural texture: Realistic subtle spatula buttercream stippling
function createButtercreamBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 14) {
      const alpha = 0.05 + Math.random() * 0.06;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(0, y, 256, 7);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
      ctx.fillRect(0, y + 7, 256, 7);
    }
    const imgData = ctx.getImageData(0, 0, 256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

// Procedural texture: Soft ground contact shadow for the pedestal
function createShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(20, 24, 35, 0.18)');
    grad.addColorStop(0.45, 'rgba(20, 24, 35, 0.06)');
    grad.addColorStop(1, 'rgba(20, 24, 35, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

// Procedural texture: Soft luminous flame glow billboard
function createFlameGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 220, 140, 0.65)');
    grad.addColorStop(0.25, 'rgba(255, 140, 40, 0.3)');
    grad.addColorStop(0.65, 'rgba(255, 80, 10, 0.08)');
    grad.addColorStop(1, 'rgba(255, 50, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(canvas);
}

// Procedural teardrop curve for photorealistic flame
function createFlameTeardropGeo(scaleR: number, scaleH: number): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.03 * scaleR, 0.04 * scaleH),
    new THREE.Vector2(0.08 * scaleR, 0.12 * scaleH),
    new THREE.Vector2(0.09 * scaleR, 0.18 * scaleH),
    new THREE.Vector2(0.07 * scaleR, 0.25 * scaleH),
    new THREE.Vector2(0.035 * scaleR, 0.32 * scaleH),
    new THREE.Vector2(0, 0.38 * scaleH),
  ];
  return new THREE.LatheGeometry(points, 24);
}

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({
  size = 'md',
  onBlow,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  // blowCount: 0 = lit, 1 = first puff, 2 = second puff, 3 = extinguished
  const [blowCount, setBlowCount] = useState<number>(0);
  const blowCountRef = useRef<number>(0);
  blowCountRef.current = blowCount;

  const flameGroupRef = useRef<THREE.Group | null>(null);
  const flameGlowSpriteRef = useRef<THREE.Sprite | null>(null);
  const flameLightRef = useRef<THREE.PointLight | null>(null);
  const smokeParticlesRef = useRef<{ mesh: THREE.Mesh; vy: number; vx: number; vz: number; life: number }[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);

  const firePastelConfetti = () => {
    // Rich, visible celebration palette
    const celebrationColors = [
      '#FF5252', '#FF4081', '#7C4DFF', '#536DFE', 
      '#00B0FF', '#00E676', '#FFD700', '#FF9100', 
      '#F06292', '#BA68C8', '#4DD0E1', '#81C784'
    ];

    // Cannon 1: Left far edge shooting inward & upward (angle: 60)
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.75 },
      colors: celebrationColors,
      ticks: 300,
      gravity: 0.9,
      scalar: 1.2,
      startVelocity: 55,
    });

    // Cannon 2: Right far edge shooting inward & upward (angle: 120)
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.75 },
      colors: celebrationColors,
      ticks: 300,
      gravity: 0.9,
      scalar: 1.2,
      startVelocity: 55,
    });

    // Follow-up volley at slightly higher angle from edges for a cascading canopy
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 50,
        spread: 60,
        origin: { x: -0.02, y: 0.6 },
        colors: celebrationColors,
        ticks: 280,
        gravity: 0.85,
        scalar: 1.1,
        startVelocity: 60,
      });
      confetti({
        particleCount: 60,
        angle: 130,
        spread: 60,
        origin: { x: 1.02, y: 0.6 },
        colors: celebrationColors,
        ticks: 280,
        gravity: 0.85,
        scalar: 1.1,
        startVelocity: 60,
      });
    }, 150);
  };

  const spawnSmokeParticles = () => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    smokeParticlesRef.current.forEach((p) => scene.remove(p.mesh));
    smokeParticlesRef.current = [];

    const smokeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x94A3B8,
      transparent: true,
      opacity: 0.55,
    });

    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 0.05,
        1.68 + Math.random() * 0.08,
        (Math.random() - 0.5) * 0.05
      );
      scene.add(mesh);
      smokeParticlesRef.current.push({
        mesh,
        vy: 0.01 + Math.random() * 0.013,
        vx: (Math.random() - 0.5) * 0.006,
        vz: (Math.random() - 0.5) * 0.006,
        life: 1.0,
      });
    }
  };

  const handleClick = () => {
    const current = blowCountRef.current;
    if (current < 2) {
      setBlowCount(current + 1);
    } else if (current === 2) {
      setBlowCount(3);
      spawnSmokeParticles();
      firePastelConfetti();
      if (onBlow) onBlow();
    } else {
      setBlowCount(0);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Generous canvas dimensions: significantly bigger for 'lg' with calibrated clearance
    const width = size === 'sm' ? 320 : size === 'lg' ? 460 : 360;
    const height = size === 'sm' ? 270 : size === 'lg' ? 380 : 300;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Perfectly framed camera: bring camera closer so cake looks prominent and appetizing with calibrated clearance
    const cameraDist = size === 'lg' ? 5.2 : size === 'md' ? 5.3 : 6.0;
    const cameraY = size === 'lg' ? 2.35 : size === 'md' ? 2.35 : 2.55;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, cameraY, cameraDist);
    camera.lookAt(0, 1.02, 0);

    // 2. High-Fidelity Renderer with ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Studio 3-Point Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.05);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFF9F0, 1.7);
    keyLight.position.set(3.5, 5.5, 4.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xE0F2FE, 0.95);
    rimLight.position.set(-4.0, 4.0, -3.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xFDFBF7, 0.5);
    fillLight.position.set(0, -1.5, 2.5);
    scene.add(fillLight);

    // Warm Candle Point Light
    const flameLight = new THREE.PointLight(0xF59E0B, 2.2, 5.0, 1.6);
    flameLight.position.set(0, 1.85, 0);
    scene.add(flameLight);
    flameLightRef.current = flameLight;

    // 4. Ground Shadow Plane (Realistic contact shadow on web surface)
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: createShadowTexture(),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.y = -0.19;
    scene.add(shadowPlane);

    // 5. Cake Turntable Group
    const cakeGroup = new THREE.Group();
    scene.add(cakeGroup);

    // ==========================================
    // 5a. Fine Glazed Porcelain Pedestal Stand
    // ==========================================
    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xFDFEFE,
      roughness: 0.14,
      metalness: 0.08,
    });

    // Stand Base
    const standBaseGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.08, 48);
    const standBase = new THREE.Mesh(standBaseGeo, porcelainMat);
    standBase.position.y = -0.14;
    standBase.receiveShadow = true;
    cakeGroup.add(standBase);

    // Stand Stem
    const standStemGeo = new THREE.CylinderGeometry(0.32, 0.48, 0.28, 32);
    const standStem = new THREE.Mesh(standStemGeo, porcelainMat);
    standStem.position.y = 0.01;
    standStem.receiveShadow = true;
    cakeGroup.add(standStem);

    // Platter Disc (Diameter 3.24 - fits with ample breathing room on left & right)
    const platterRadius = 1.62;
    const platterGeo = new THREE.CylinderGeometry(platterRadius, platterRadius - 0.05, 0.07, 64);
    const platter = new THREE.Mesh(platterGeo, porcelainMat);
    platter.position.y = 0.17;
    platter.receiveShadow = true;
    cakeGroup.add(platter);

    // Platter Rim Torus
    const platterRimGeo = new THREE.TorusGeometry(platterRadius - 0.02, 0.035, 16, 64);
    platterRimGeo.rotateX(Math.PI / 2);
    const platterRim = new THREE.Mesh(platterRimGeo, porcelainMat);
    platterRim.position.y = 0.20;
    cakeGroup.add(platterRim);

    // ==========================================
    // 5b. Artisan Cake Body with Character & Rich Color
    // Warm Strawberry-Vanilla Buttercream Base
    // ==========================================
    const bumpMap = createButtercreamBumpMap();
    const cakeColorMat = new THREE.MeshStandardMaterial({
      color: 0xFDE2E4, // Charming soft strawberry blush
      roughness: 0.32,
      metalness: 0.02,
      bumpMap: bumpMap,
      bumpScale: 0.012,
    });

    const cakeHeight = 0.95;
    const cakeRadius = 1.38;
    const cakeGeo = new THREE.CylinderGeometry(cakeRadius, cakeRadius, cakeHeight, 64);
    const cakeMesh = new THREE.Mesh(cakeGeo, cakeColorMat);
    cakeMesh.position.y = 0.20 + cakeHeight / 2;
    cakeMesh.castShadow = true;
    cakeMesh.receiveShadow = true;
    cakeGroup.add(cakeMesh);

    // Decorative Rich Whipped Cream Drip / Crown Tier on Top
    const dripCreamMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFF8, // Glossy fresh mascarpone cream
      roughness: 0.22,
      metalness: 0.04,
    });
    const dripRimGeo = new THREE.CylinderGeometry(cakeRadius + 0.025, cakeRadius + 0.015, 0.12, 64);
    const dripRim = new THREE.Mesh(dripRimGeo, dripCreamMat);
    dripRim.position.y = 0.20 + cakeHeight - 0.04;
    dripRim.castShadow = true;
    cakeGroup.add(dripRim);

    // Scalloped frosting drips around the top perimeter
    const dripCount = 24;
    const scallopGeo = new THREE.SphereGeometry(0.048, 12, 12);
    scallopGeo.scale(1.0, 1.45, 0.75);
    for (let d = 0; d < dripCount; d++) {
      const ang = (d / dripCount) * Math.PI * 2;
      const drop = new THREE.Mesh(scallopGeo, dripCreamMat);
      const rad = cakeRadius + 0.018;
      const dripY = 0.20 + cakeHeight - 0.08 - (d % 2 === 0 ? 0.045 : 0.015);
      drop.position.set(Math.cos(ang) * rad, dripY, Math.sin(ang) * rad);
      drop.rotation.y = -ang;
      cakeGroup.add(drop);
    }

    // Bottom Base Piping Ring (Whipped Cream Pearls around base)
    const basePipingCount = 30;
    const pearlGeo = new THREE.SphereGeometry(0.05, 12, 12);
    pearlGeo.scale(1.0, 0.85, 1.0);
    const pearlMat = new THREE.MeshStandardMaterial({
      color: 0xFFFBF4,
      roughness: 0.25,
    });
    for (let b = 0; b < basePipingCount; b++) {
      const ang = (b / basePipingCount) * Math.PI * 2;
      const pearl = new THREE.Mesh(pearlGeo, pearlMat);
      const rad = cakeRadius + 0.03;
      pearl.position.set(Math.cos(ang) * rad, 0.23, Math.sin(ang) * rad);
      cakeGroup.add(pearl);
    }

    // ==========================================
    // 5c. Two-Tone Rosettes & Juicy Berry Pearls on Top
    // ==========================================
    const rosetteCount = 14;
    const creamRosetteMat = new THREE.MeshStandardMaterial({
      color: 0xFFFAF3,
      roughness: 0.28,
      metalness: 0.02,
    });
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xE63946, // Vibrant raspberry red pearl
      roughness: 0.18,
      metalness: 0.12,
    });
    const shellGeo = new THREE.SphereGeometry(0.065, 16, 16);
    shellGeo.scale(1.0, 0.72, 1.3);
    const berryGeo = new THREE.SphereGeometry(0.038, 14, 14);

    for (let i = 0; i < rosetteCount; i++) {
      const angle = (i / rosetteCount) * Math.PI * 2;
      const dist = cakeRadius - 0.08;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;

      // Swirled Cream Rosette
      const shell = new THREE.Mesh(shellGeo, creamRosetteMat);
      shell.position.set(rx, 0.20 + cakeHeight + 0.035, rz);
      shell.rotation.y = -angle + Math.PI / 2;
      shell.castShadow = true;
      cakeGroup.add(shell);

      // Raspberry Pearl nestled on top of each rosette
      const berry = new THREE.Mesh(berryGeo, berryMat);
      berry.position.set(rx, 0.20 + cakeHeight + 0.085, rz);
      berry.castShadow = true;
      cakeGroup.add(berry);
    }

    // ==========================================
    // 5d. Vibrant Funfetti Sprinkles (Character & Joy!)
    // Rainbow Cylindrical Sprinkles on top & side of cake
    // ==========================================
    const sprinkleColors = [
      0xFF3366, // Electric Strawberry Pink
      0x38BDF8, // Sky Blue
      0xFFD166, // Sunny Lemon
      0x06D6A0, // Mint Green
      0x8338EC, // Royal Purple
      0xFF9F1C, // Vibrant Tangerine
    ];

    const sprinkleGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.065, 8);
    sprinkleGeo.rotateX(Math.PI / 2);

    // Top Sprinkles: Scattered joyfully across the top disc
    for (let s = 0; s < 46; s++) {
      const col = sprinkleColors[s % sprinkleColors.length];
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.35,
        metalness: 0.08,
      });
      const sprinkle = new THREE.Mesh(sprinkleGeo, mat);
      const rad = 0.18 + Math.random() * 0.95;
      const ang = Math.random() * Math.PI * 2;
      sprinkle.position.set(Math.cos(ang) * rad, 0.20 + cakeHeight + 0.008, Math.sin(ang) * rad);
      sprinkle.rotation.y = Math.random() * Math.PI * 2;
      sprinkle.castShadow = true;
      cakeGroup.add(sprinkle);
    }

    // Side Sprinkles: Lightly studded along the lower cake perimeter
    for (let ss = 0; ss < 28; ss++) {
      const col = sprinkleColors[ss % sprinkleColors.length];
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.35,
      });
      const sprinkle = new THREE.Mesh(sprinkleGeo, mat);
      const ang = Math.random() * Math.PI * 2;
      const rad = cakeRadius + 0.006;
      const yPos = 0.32 + Math.random() * 0.45;
      sprinkle.position.set(Math.cos(ang) * rad, yPos, Math.sin(ang) * rad);
      sprinkle.rotation.y = -ang;
      sprinkle.rotation.z = Math.random() * 1.2 - 0.6;
      cakeGroup.add(sprinkle);
    }

    // ==========================================
    // 5e. Festive Birthday Candle with Colorful Spiral Stripe
    // ==========================================
    const candleHeight = 0.82;
    const candleRadius = 0.040;
    const candleMat = new THREE.MeshStandardMaterial({
      color: 0xFDFAF5,
      roughness: 0.22,
    });
    const candleGeo = new THREE.CylinderGeometry(candleRadius * 0.92, candleRadius, candleHeight, 32);
    const candle = new THREE.Mesh(candleGeo, candleMat);
    candle.position.y = 0.20 + cakeHeight + candleHeight / 2;
    candle.castShadow = true;
    cakeGroup.add(candle);

    // Festive Pink & Mint Alternating Spiral Stripes on the candle
    const stripeColors = [0xFF3366, 0x06D6A0];
    const stripeCount = 10;
    for (let st = 0; st < stripeCount; st++) {
      const ringGeo = new THREE.TorusGeometry(candleRadius + 0.003, 0.007, 10, 24);
      ringGeo.rotateX(Math.PI / 2);
      ringGeo.rotateZ(0.22); // subtle tilt for spiral effect
      const stripeMat = new THREE.MeshStandardMaterial({
        color: stripeColors[st % stripeColors.length],
        roughness: 0.24,
      });
      const ring = new THREE.Mesh(ringGeo, stripeMat);
      ring.position.y = 0.20 + cakeHeight + 0.08 + (st / stripeCount) * (candleHeight - 0.16);
      cakeGroup.add(ring);
    }

    // Natural melted wax bead drop at base of wick
    const waxBeadGeo = new THREE.TorusGeometry(0.03, 0.012, 12, 24);
    waxBeadGeo.rotateX(Math.PI / 2);
    const waxBead = new THREE.Mesh(waxBeadGeo, candleMat);
    waxBead.position.y = 0.20 + cakeHeight + candleHeight - 0.01;
    cakeGroup.add(waxBead);

    // Curved charred cotton wick
    const wickGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.08, 12);
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x1E2229 });
    const wick = new THREE.Mesh(wickGeo, wickMat);
    wick.position.set(0, 0.20 + cakeHeight + candleHeight + 0.035, 0);
    wick.rotation.z = 0.07;
    cakeGroup.add(wick);

    // ==========================================
    // 5f. Photorealistic Curved Teardrop Flame & Glow
    // ==========================================
    const flameGroup = new THREE.Group();
    const flameBaseY = 0.20 + cakeHeight + candleHeight + 0.065;
    flameGroup.position.set(0, flameBaseY, 0);

    // 1. Blue Combustion Base
    const flameBlueGeo = new THREE.ConeGeometry(0.028, 0.055, 16);
    flameBlueGeo.translate(0, 0.022, 0);
    const flameBlueMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.85,
    });
    const flameBlue = new THREE.Mesh(flameBlueGeo, flameBlueMat);
    flameGroup.add(flameBlue);

    // 2. Inner Incandescent White-Yellow Teardrop
    const flameInnerGeo = createFlameTeardropGeo(0.65, 0.65);
    const flameInnerMat = new THREE.MeshBasicMaterial({
      color: 0xFFFBEB,
      transparent: true,
      opacity: 0.98,
    });
    const flameInner = new THREE.Mesh(flameInnerGeo, flameInnerMat);
    flameGroup.add(flameInner);

    // 3. Outer Amber Teardrop with Additive Blending
    const flameOuterGeo = createFlameTeardropGeo(0.92, 0.92);
    const flameOuterMat = new THREE.MeshBasicMaterial({
      color: 0xF97316,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
    });
    const flameOuter = new THREE.Mesh(flameOuterGeo, flameOuterMat);
    flameGroup.add(flameOuter);

    // 4. Soft Luminous Glow Billboard Sprite
    const glowSpriteMat = new THREE.SpriteMaterial({
      map: createFlameGlowTexture(),
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowSpriteMat);
    glowSprite.scale.set(0.60, 0.60, 1.0);
    glowSprite.position.set(0, 0.16, 0);
    flameGroup.add(glowSprite);
    flameGlowSpriteRef.current = glowSprite;

    cakeGroup.add(flameGroup);
    flameGroupRef.current = flameGroup;

    // 6. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const stage = blowCountRef.current;

      // Turntable rotation
      cakeGroup.rotation.y = elapsedTime * 0.32;

      // Realistic flame animation
      if (flameGroupRef.current && flameLightRef.current && flameGlowSpriteRef.current) {
        if (stage === 0) {
          flameGroupRef.current.visible = true;
          const flicker = Math.sin(elapsedTime * 14) * 0.05 + Math.sin(elapsedTime * 23) * 0.035;
          flameGroupRef.current.scale.set(1 + flicker * 0.35, 1 + flicker * 0.7, 1 + flicker * 0.35);
          flameGroupRef.current.rotation.z = Math.sin(elapsedTime * 11) * 0.06;
          flameGroupRef.current.rotation.x = Math.cos(elapsedTime * 9) * 0.04;
          flameLightRef.current.intensity = 2.2 + flicker * 0.5;
          flameGlowSpriteRef.current.scale.set(0.60 + flicker * 0.1, 0.60 + flicker * 0.1, 1.0);
        } else if (stage === 1) {
          flameGroupRef.current.visible = true;
          const flicker = Math.sin(elapsedTime * 22) * 0.1;
          flameGroupRef.current.scale.set(0.7 + flicker * 0.2, 0.72 + flicker * 0.35, 0.7);
          flameGroupRef.current.rotation.z = 0.32 + Math.sin(elapsedTime * 18) * 0.16;
          flameLightRef.current.intensity = 1.3 + flicker * 0.4;
          flameGlowSpriteRef.current.scale.set(0.45, 0.45, 1.0);
        } else if (stage === 2) {
          flameGroupRef.current.visible = true;
          const flicker = Math.sin(elapsedTime * 35) * 0.15;
          flameGroupRef.current.scale.set(0.36 + flicker * 0.15, 0.36 + flicker * 0.2, 0.36);
          flameGroupRef.current.rotation.z = 0.48 + Math.sin(elapsedTime * 30) * 0.22;
          flameLightRef.current.intensity = 0.5 + flicker * 0.25;
          flameGlowSpriteRef.current.scale.set(0.28, 0.28, 1.0);
        } else {
          flameGroupRef.current.visible = false;
          flameLightRef.current.intensity = 0;
        }
      }

      // Smoke particles
      const smokeList = smokeParticlesRef.current;
      for (let i = smokeList.length - 1; i >= 0; i--) {
        const p = smokeList[i];
        p.life -= 0.012;
        p.mesh.position.y += p.vy;
        p.mesh.position.x += p.vx;
        p.mesh.position.z += p.vz;
        p.mesh.scale.multiplyScalar(1.02);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life * 0.5);

        if (p.life <= 0) {
          scene.remove(p.mesh);
          smokeList.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      bumpMap.dispose();
      container.innerHTML = '';
    };
  }, [size]);

  return (
    <div className="cake-widget-3d">
      <div
        className="cake-canvas-wrapper"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={
          blowCount < 3
            ? `Click to blow the candle (${blowCount}/3 clicks)`
            : 'Candle blown out! Click to relight'
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <div ref={mountRef} className="three-cake-mount" />

        {/* Pure plain text hint below cake, only visible on hover */}
        <div className="cake-hover-hint">
          {blowCount === 0 && 'Tap to blow out (0/3)'}
          {blowCount === 1 && 'Tap again (1/3)'}
          {blowCount === 2 && 'One more tap (2/3)'}
          {blowCount === 3 && 'Candle blown. Tap to relight'}
        </div>
      </div>
    </div>
  );
};
