/**
 * Custom Zero-Dependency 60FPS 3D Engine (Volcanic Obsidian & Molten Flame)
 * Works seamlessly offline and over file:// or localhost without external CDNs.
 *
 * Powers 3 synchronized 3D experiences:
 * 1. Rising 3D Molten Ember Particle Nebula & Spatial Depth Grid (#bg-3d-canvas)
 * 2. Hero Interactive 3D Stage (#hero-3d-canvas):
 *    - 'portrait': Luminous flame-gold 3D orbital halo, radar ticks & sparks orbiting the 3D portrait
 *    - 'core': Interactive draggable 3D Molten Geodesic Core
 *    - 'grid': Floating 3D Full-Stack Architecture Layers
 *    - 'torus': Pulsing Molten Flame Torus-Knot Flow
 * 3. Interactive 3D Fibonacci Skill Constellation Sphere (#skills-3d-canvas)
 */
(function () {
  "use strict";

  const FLAME = { r: 255, g: 94, b: 26 };    // #FF5E1A vibrant flame orange
  const GOLD = { r: 255, g: 184, b: 64 };    // #FFB840 white-hot solar amber
  const CRIMSON = { r: 225, g: 29, b: 72 };  // #E11D48 deep volcanic ember

  const state = {
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    paused: false,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    scrollRatio: 0,
    heroShape: "portrait" // 'portrait' | 'core' | 'grid' | 'torus'
  };

  /* -------------------------------------------------------------------------- */
  /* Utility 3D Math                                                            */
  /* -------------------------------------------------------------------------- */
  function rotateX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
  }

  function rotateY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
  }

  function rotateZ(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
  }

  function project(p, fov, viewerDist, cx, cy) {
    const denom = viewerDist + p.z;
    if (denom <= 10) return null;
    const scale = fov / denom;
    return {
      x: cx + p.x * scale,
      y: cy + p.y * scale,
      scale: scale,
      z: p.z
    };
  }

  function setupHiDPI(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  /* -------------------------------------------------------------------------- */
  /* 1. Background 3D Rising Molten Ember Nebula & Spatial Horizon Grid         */
  /* -------------------------------------------------------------------------- */
  function createNebulaScene(canvas) {
    if (!canvas) return null;

    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 82 : 175;
    const NEBULA_CLOUDS = isMobile ? 3 : 5;
    const particles = [];
    const clouds = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const layer = Math.random();
      const tint = layer > 0.68 ? GOLD : layer > 0.28 ? FLAME : CRIMSON;
      particles.push({
        x: (Math.random() - 0.5) * 1800,
        y: (Math.random() - 0.5) * 1400,
        z: Math.random() * 1400 - 300,
        vx: (Math.random() - 0.5) * 0.22,
        // Gentle rising ember drift!
        vy: -0.26 - Math.random() * 0.42,
        vz: -0.18 - Math.random() * 0.28,
        size: 1.0 + Math.random() * 2.5,
        tint: tint,
        phase: Math.random() * Math.PI * 2,
        connectable: i < (isMobile ? 28 : 56)
      });
    }

    for (let i = 0; i < NEBULA_CLOUDS; i++) {
      clouds.push({
        x: (Math.random() - 0.5) * 1100,
        y: (Math.random() - 0.5) * 800,
        z: 200 + i * 210,
        radius: 270 + Math.random() * 230,
        tint: i % 2 === 0 ? FLAME : CRIMSON,
        alpha: 0.055 + Math.random() * 0.038,
        speed: 0.00028 + i * 0.00008
      });
    }

    let time = 0;

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      const cx = w * 0.5;
      const cy = h * 0.5;

      ctx.clearRect(0, 0, w, h);

      if (!state.paused && !state.reducedMotion) {
        time += dt;
      }

      const rotY = state.mouseX * 0.22 + Math.sin(time * 0.00018) * 0.08;
      const rotX = state.mouseY * 0.16 + state.scrollRatio * 0.45;
      const scrollZShift = state.scrollRatio * 480;

      // Volumetric Molten Flame Mist Clouds
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        const angle = time * c.speed + i * 1.4;
        const pos = {
          x: c.x + Math.cos(angle) * 90,
          y: c.y + Math.sin(angle * 0.8) * 65 - state.scrollRatio * 140,
          z: c.z
        };
        const p = project(rotateY(pos, rotY * 0.4), 700, 620, cx, cy);
        if (!p) continue;
        const r = c.radius * p.scale * 1.45;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(${c.tint.r}, ${c.tint.g}, ${c.tint.b}, ${c.alpha})`);
        grad.addColorStop(0.55, `rgba(${c.tint.r}, ${c.tint.g}, ${c.tint.b}, ${c.alpha * 0.35})`);
        grad.addColorStop(1, "rgba(11, 6, 5, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Subtle 3D Volcanic Spatial Horizon Grid
      ctx.save();
      ctx.lineWidth = 1;
      const gridRows = 9;
      const gridCols = 11;
      const spacing = 140;
      const baseY = 390 - state.scrollRatio * 90;
      const zOffset = (time * 0.035 + scrollZShift) % spacing;

      for (let r = 0; r < gridRows; r++) {
        const z = r * spacing - zOffset + 60;
        const depthAlpha = Math.max(0, 1 - z / (gridRows * spacing)) * 0.13;
        if (depthAlpha <= 0.005) continue;
        ctx.strokeStyle = `rgba(255, 94, 26, ${depthAlpha.toFixed(3)})`;
        ctx.beginPath();
        let started = false;
        for (let c = -Math.floor(gridCols / 2); c <= Math.floor(gridCols / 2); c++) {
          let pt = { x: c * spacing, y: baseY, z: z };
          pt = rotateY(rotateX(pt, rotX * 0.32), rotY * 0.45);
          const pr = project(pt, 620, 420, cx, cy);
          if (!pr) continue;
          if (!started) {
            ctx.moveTo(pr.x, pr.y);
            started = true;
          } else {
            ctx.lineTo(pr.x, pr.y);
          }
        }
        ctx.stroke();
      }

      for (let c = -Math.floor(gridCols / 2); c <= Math.floor(gridCols / 2); c++) {
        const x = c * spacing;
        const edgeFade = 1 - Math.abs(c) / (gridCols * 0.55);
        ctx.strokeStyle = `rgba(255, 160, 56, ${(Math.max(0, edgeFade) * 0.09).toFixed(3)})`;
        ctx.beginPath();
        let started = false;
        for (let r = 0; r < gridRows; r++) {
          const z = r * spacing - zOffset + 60;
          let pt = { x: x, y: baseY, z: z };
          pt = rotateY(rotateX(pt, rotX * 0.32), rotY * 0.45);
          const pr = project(pt, 620, 420, cx, cy);
          if (!pr) continue;
          if (!started) {
            ctx.moveTo(pr.x, pr.y);
            started = true;
          } else {
            ctx.lineTo(pr.x, pr.y);
          }
        }
        ctx.stroke();
      }
      ctx.restore();

      // Update & Project Rising 3D Flame Embers
      const projectedConnectable = [];
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        if (!state.paused && !state.reducedMotion) {
          pt.x += (pt.vx + Math.sin(time * 0.0014 + pt.phase) * 0.14) * (dt * 0.06);
          pt.y += pt.vy * (dt * 0.06);
          pt.z += pt.vz * (dt * 0.06);
          if (pt.y < -760) {
            pt.y = 740;
            pt.x = (Math.random() - 0.5) * 1800;
          }
          if (pt.z < -280) {
            pt.z = 1100;
            pt.x = (Math.random() - 0.5) * 1800;
          }
        }

        let pos = {
          x: pt.x,
          y: pt.y - state.scrollRatio * 180,
          z: ((pt.z - scrollZShift * 0.35 + 1400) % 1400) - 280
        };
        pos = rotateY(rotateX(pos, rotX * 0.35), rotY * 0.55);
        const pr = project(pos, 650, 480, cx, cy);
        if (!pr || pr.x < -60 || pr.x > w + 60 || pr.y < -60 || pr.y > h + 60) continue;

        const flicker = 0.62 + 0.38 * Math.sin(time * 0.0032 + pt.phase);
        const depthFade = Math.max(0.1, Math.min(1, 1.15 - (pos.z + 250) / 1350));
        const radius = Math.max(0.65, pt.size * pr.scale * 1.18);
        const alpha = depthFade * flicker * 0.9;

        if (pt.connectable && pr.scale > 0.42) {
          projectedConnectable.push({ x: pr.x, y: pr.y, alpha: depthFade, tint: pt.tint });
        }

        if (radius > 1.65) {
          const halo = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, radius * 4.5);
          halo.addColorStop(0, `rgba(${pt.tint.r}, ${pt.tint.g}, ${pt.tint.b}, ${(alpha * 0.52).toFixed(3)})`);
          halo.addColorStop(1, "rgba(255, 94, 26, 0)");
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, radius * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${pt.tint.r}, ${pt.tint.g}, ${pt.tint.b}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fiery Ember Constellation Connections
      ctx.save();
      ctx.lineWidth = 0.85;
      const maxDist = 146;
      const maxDistSq = maxDist * maxDist;
      for (let i = 0; i < projectedConnectable.length; i++) {
        const a = projectedConnectable[i];
        for (let j = i + 1; j < projectedConnectable.length; j++) {
          const b = projectedConnectable[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDistSq) {
            const strength = (1 - Math.sqrt(d2) / maxDist) * Math.min(a.alpha, b.alpha) * 0.23;
            ctx.strokeStyle = `rgba(255, 118, 38, ${strength.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    return { render };
  }

  /* -------------------------------------------------------------------------- */
  /* 2. Hero Interactive 3D Flame Stage (Portrait Halo + 3 Sculptures)          */
  /* -------------------------------------------------------------------------- */
  function createHeroScene(canvas) {
    if (!canvas) return null;

    // Geodesic Icosahedron
    const phi = (1 + Math.sqrt(5)) / 2;
    const rawIco = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ].map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return { x: (x / len) * 102, y: (y / len) * 102, z: (z / len) * 102 };
    });

    const icoFaces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];

    const icoEdgesSet = new Set();
    const icoEdges = [];
    icoFaces.forEach(([a, b, c]) => {
      [[a, b], [b, c], [c, a]].forEach(([u, v]) => {
        const key = u < v ? `${u}-${v}` : `${v}-${u}`;
        if (!icoEdgesSet.has(key)) {
          icoEdgesSet.add(key);
          icoEdges.push([u, v]);
        }
      });
    });

    // Torus Knot points
    const torusPoints = [];
    const TORUS_STEPS = 120;
    for (let i = 0; i < TORUS_STEPS; i++) {
      const t = (i / TORUS_STEPS) * Math.PI * 2;
      const p = 2, q = 3;
      const r = Math.cos(q * t) + 2.25;
      torusPoints.push({
        x: r * Math.cos(p * t) * 36,
        y: r * Math.sin(p * t) * 36,
        z: -Math.sin(q * t) * 46
      });
    }

    // Spatial Full-Stack Architecture Layers
    const uiPlanes = [
      { z: -56, w: 138, h: 90, label: "SUPABASE SQL", tint: CRIMSON },
      { z: 0, w: 152, h: 98, label: "KOTLIN / NEXT", tint: FLAME },
      { z: 56, w: 130, h: 84, label: "UI / UX LAYER", tint: GOLD }
    ];

    // Floating Orbital Ember Spark Nodes
    const orbitNodes = [];
    for (let i = 0; i < 44; i++) {
      const angle = (i / 44) * Math.PI * 2;
      const ring = i % 3 === 0 ? 154 : i % 3 === 1 ? 182 : 206;
      orbitNodes.push({
        angle,
        radius: ring,
        tilt: i % 3 === 0 ? 0.56 : i % 3 === 1 ? -0.68 : 0.25,
        speed: i % 2 === 0 ? 0.00056 : -0.0004,
        size: i % 6 === 0 ? 3.5 : 1.7
      });
    }

    // Interactive Drag-to-Orbit state
    let dragActive = false;
    let lastX = 0, lastY = 0;
    let rotX = -0.24, rotY = 0.42;
    let velX = 0.0016, velY = 0.0048;
    let pulse = 0;

    canvas.addEventListener("pointerdown", (e) => {
      dragActive = true;
      lastX = e.clientX;
      lastY = e.clientY;
      if (e.pointerType === "mouse") {
        canvas.setPointerCapture(e.pointerId);
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (!dragActive) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      rotY += dx * 0.009;
      rotX += dy * 0.009;
      velY = dx * 0.0012;
      velX = dy * 0.0012;
    });

    const endDrag = () => {
      dragActive = false;
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    function drawOrbitalRings(ctx, cx, cy, t, fov, expanded) {
      const boost = expanded ? 1.16 : 1;
      const rings = [
        { r: 148 * boost, tiltX: 1.08, tiltZ: 0.35, color: "rgba(255, 110, 32, 0.36)" },
        { r: 174 * boost, tiltX: -0.94, tiltZ: -0.45, color: "rgba(225, 29, 72, 0.30)" },
        { r: 192 * boost, tiltX: 0.42, tiltZ: 0.82, color: "rgba(255, 184, 64, 0.22)" }
      ];
      rings.forEach((ring, idx) => {
        ctx.beginPath();
        const segs = 76;
        for (let i = 0; i <= segs; i++) {
          const a = (i / segs) * Math.PI * 2;
          let p = { x: Math.cos(a) * ring.r, y: Math.sin(a) * ring.r, z: 0 };
          p = rotateX(p, ring.tiltX + rotX * 0.38);
          p = rotateZ(p, ring.tiltZ + t * (idx % 2 === 0 ? 0.00025 : -0.0002));
          p = rotateY(p, rotY * 0.48);
          const pr = project(p, fov, 450, cx, cy);
          if (!pr) continue;
          if (i === 0) ctx.moveTo(pr.x, pr.y);
          else ctx.lineTo(pr.x, pr.y);
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = idx === 0 ? 1.35 : 1;
        ctx.stroke();
      });

      // Orbiting white-hot ember sparks
      orbitNodes.forEach((n) => {
        const a = n.angle + t * n.speed;
        let p = { x: Math.cos(a) * n.radius * boost, y: Math.sin(a) * n.radius * boost, z: 0 };
        p = rotateX(p, n.tilt + rotX * 0.38);
        p = rotateY(p, rotY * 0.48);
        const pr = project(p, fov, 450, cx, cy);
        if (!pr) return;
        const alpha = Math.max(0.22, Math.min(0.98, (220 - p.z) / 360));
        if (n.size > 2.4) {
          const g = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, 11);
          g.addColorStop(0, `rgba(255, 224, 150, ${(alpha * 0.92).toFixed(3)})`);
          g.addColorStop(0.45, `rgba(255, 94, 26, ${(alpha * 0.65).toFixed(3)})`);
          g.addColorStop(1, "rgba(255, 94, 26, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, 11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = n.size > 2 ? `rgba(255, 240, 200, ${alpha})` : `rgba(255, 165, 60, ${alpha * 0.82})`;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, n.size * pr.scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawPortraitAura(ctx, cx, cy, t, fov) {
      const outerR = Math.min(cx, cy) * 0.92;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.00018 + state.mouseX * 0.14);
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const major = i % 6 === 0;
        const r1 = outerR - (major ? 10 : 5);
        const r2 = outerR;
        ctx.strokeStyle = major ? "rgba(255, 138, 43, 0.55)" : "rgba(255, 148, 92, 0.16)";
        ctx.lineWidth = major ? 1.5 : 0.9;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.restore();

      drawOrbitalRings(ctx, cx, cy, t, fov, true);
    }

    function drawDesignCore(ctx, cx, cy, t, fov) {
      const breathe = 1 + Math.sin(t * 0.0024) * 0.04;
      const verts = rawIco.map((v) => {
        let p = { x: v.x * breathe, y: v.y * breathe, z: v.z * breathe };
        p = rotateX(p, rotX);
        p = rotateY(p, rotY);
        const pr = project(p, fov, 420, cx, cy);
        return { p, pr };
      });

      const sortedFaces = icoFaces
        .map((f) => {
          const avgZ = (verts[f[0]].p.z + verts[f[1]].p.z + verts[f[2]].p.z) / 3;
          return { f, avgZ };
        })
        .sort((a, b) => b.avgZ - a.avgZ);

      sortedFaces.forEach(({ f, avgZ }) => {
        const a = verts[f[0]].pr, b = verts[f[1]].pr, c = verts[f[2]].pr;
        if (!a || !b || !c) return;
        const light = Math.max(0.05, Math.min(0.26, (120 - avgZ) / 720));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.closePath();
        ctx.fillStyle = avgZ < 0
          ? `rgba(255, 108, 34, ${(light * 0.95).toFixed(3)})`
          : `rgba(225, 29, 72, ${(light * 0.65).toFixed(3)})`;
        ctx.fill();
      });

      icoEdges.forEach(([u, v]) => {
        const a = verts[u], b = verts[v];
        if (!a.pr || !b.pr) return;
        const avgZ = (a.p.z + b.p.z) * 0.5;
        const alpha = Math.max(0.2, Math.min(0.96, (140 - avgZ) / 260));
        ctx.strokeStyle = `rgba(255, 148, 48, ${alpha.toFixed(3)})`;
        ctx.lineWidth = avgZ < 0 ? 1.55 : 0.9;
        ctx.beginPath();
        ctx.moveTo(a.pr.x, a.pr.y);
        ctx.lineTo(b.pr.x, b.pr.y);
        ctx.stroke();
      });

      const innerScale = 0.48;
      const innerVerts = rawIco.map((v) => {
        let p = { x: v.x * innerScale, y: v.y * innerScale, z: v.z * innerScale };
        p = rotateX(p, -rotX * 1.4);
        p = rotateY(p, -rotY * 1.6);
        return project(p, fov, 420, cx, cy);
      });
      ctx.strokeStyle = "rgba(255, 214, 102, 0.65)";
      ctx.lineWidth = 1;
      icoEdges.forEach(([u, v]) => {
        const a = innerVerts[u], b = innerVerts[v];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });

      verts.forEach(({ p, pr }) => {
        if (!pr) return;
        const alpha = Math.max(0.28, Math.min(1, (140 - p.z) / 240));
        const r = (p.z < 0 ? 3.5 : 2.2) * pr.scale;
        ctx.fillStyle = `rgba(255, 244, 214, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawTorusFlow(ctx, cx, cy, t, fov) {
      const projected = torusPoints.map((pt, i) => {
        let p = rotateX(pt, rotX + Math.sin(t * 0.001) * 0.15);
        p = rotateY(p, rotY);
        const pr = project(p, fov, 420, cx, cy);
        return { p, pr, i };
      });

      for (let i = 0; i < projected.length; i++) {
        const curr = projected[i];
        const next = projected[(i + 1) % projected.length];
        if (!curr.pr || !next.pr) continue;
        const depth = Math.max(0.16, Math.min(1, (130 - curr.p.z) / 250));
        const pulseWave = 0.5 + 0.5 * Math.sin(i * 0.25 - t * 0.0055);
        ctx.strokeStyle = pulseWave > 0.62
          ? `rgba(255, 184, 64, ${(depth * 0.96).toFixed(3)})`
          : `rgba(255, 78, 28, ${(depth * 0.82).toFixed(3)})`;
        ctx.lineWidth = (2.2 + pulseWave * 2.5) * curr.pr.scale;
        ctx.beginPath();
        ctx.moveTo(curr.pr.x, curr.pr.y);
        ctx.lineTo(next.pr.x, next.pr.y);
        ctx.stroke();

        if (i % 4 === 0) {
          const twin = projected[(i + 40) % projected.length];
          if (twin.pr) {
            ctx.strokeStyle = `rgba(225, 29, 72, ${(depth * 0.24).toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(curr.pr.x, curr.pr.y);
            ctx.lineTo(twin.pr.x, twin.pr.y);
            ctx.stroke();
          }
        }
      }

      for (let k = 0; k < 6; k++) {
        const idx = Math.floor(((t * 0.032) + k * 20) % projected.length);
        const node = projected[idx];
        if (!node || !node.pr) continue;
        const g = ctx.createRadialGradient(node.pr.x, node.pr.y, 0, node.pr.x, node.pr.y, 15);
        g.addColorStop(0, "rgba(255, 250, 230, 0.98)");
        g.addColorStop(0.35, "rgba(255, 130, 32, 0.82)");
        g.addColorStop(1, "rgba(255, 94, 26, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(node.pr.x, node.pr.y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawSpatialLayers(ctx, cx, cy, t, fov) {
      const floatWave = Math.sin(t * 0.002) * 8;
      const mapped = uiPlanes.map((plane, idx) => {
        const z = plane.z + (idx - 1) * (floatWave * 0.65);
        const corners = [
          { x: -plane.w / 2, y: -plane.h / 2, z },
          { x: plane.w / 2, y: -plane.h / 2, z },
          { x: plane.w / 2, y: plane.h / 2, z },
          { x: -plane.w / 2, y: plane.h / 2, z }
        ].map((c) => {
          const rp = rotateY(rotateX(c, rotX), rotY);
          return { rp, pr: project(rp, fov * 1.04, 420, cx, cy) };
        });
        const avgZ = corners.reduce((sum, c) => sum + c.rp.z, 0) / 4;
        return { plane, corners, avgZ, z };
      }).sort((a, b) => b.avgZ - a.avgZ);

      for (let cornerIdx = 0; cornerIdx < 4; cornerIdx++) {
        const top = mapped[0].corners[cornerIdx].pr;
        const bot = mapped[mapped.length - 1].corners[cornerIdx].pr;
        if (!top || !bot) continue;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(255, 138, 43, 0.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bot.x, bot.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      mapped.forEach(({ plane, corners, z }) => {
        if (corners.some((c) => !c.pr)) return;
        const c = corners.map((item) => item.pr);

        ctx.beginPath();
        ctx.moveTo(c[0].x, c[0].y);
        ctx.lineTo(c[1].x, c[1].y);
        ctx.lineTo(c[2].x, c[2].y);
        ctx.lineTo(c[3].x, c[3].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(${plane.tint.r}, ${plane.tint.g}, ${plane.tint.b}, 0.15)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${plane.tint.r}, ${plane.tint.g}, ${plane.tint.b}, 0.78)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const innerLines = [
          [[-0.38, -0.22], [0.15, -0.22]],
          [[-0.38, 0.02], [0.36, 0.02]],
          [[-0.38, 0.22], [0.22, 0.22]]
        ];
        innerLines.forEach(([start, end]) => {
          const p1 = project(rotateY(rotateX({ x: start[0] * plane.w, y: start[1] * plane.h, z }, rotX), rotY), fov * 1.04, 420, cx, cy);
          const p2 = project(rotateY(rotateX({ x: end[0] * plane.w, y: end[1] * plane.h, z }, rotX), rotY), fov * 1.04, 420, cx, cy);
          if (!p1 || !p2) return;
          ctx.strokeStyle = "rgba(255, 236, 209, 0.58)";
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });

        const labelPt = project(rotateY(rotateX({ x: plane.w * 0.54, y: -plane.h * 0.35, z }, rotX), rotY), fov * 1.04, 420, cx, cy);
        if (labelPt) {
          ctx.font = "600 10px 'JetBrains Mono', monospace";
          ctx.fillStyle = `rgba(${plane.tint.r}, ${plane.tint.g}, ${plane.tint.b}, 0.95)`;
          ctx.fillText(plane.label, labelPt.x + 6, labelPt.y + 3);
        }
      });
    }

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const fitScale = Math.max(0.62, Math.min(1.08, Math.min(w, h) / 365));
      const fov = 500 * fitScale;
      ctx.clearRect(0, 0, w, h);

      if (!state.paused && !state.reducedMotion) {
        pulse += dt;
        if (!dragActive) {
          rotY += velY * (dt * 0.06);
          rotX += velX * (dt * 0.06);
          velY += (0.0052 - velY) * 0.03;
          velX += (0.0014 - velX) * 0.03;
          rotY += state.mouseX * 0.004;
        }
      }

      // Central volcanic molten core glow
      const glow = ctx.createRadialGradient(cx, cy, 12, cx, cy, Math.min(w, h) * 0.5);
      glow.addColorStop(0, "rgba(255, 110, 32, 0.28)");
      glow.addColorStop(0.52, "rgba(225, 29, 72, 0.11)");
      glow.addColorStop(1, "rgba(11, 6, 5, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.5, 0, Math.PI * 2);
      ctx.fill();

      if (state.heroShape === "portrait") {
        drawPortraitAura(ctx, cx, cy, pulse, fov);
      } else {
        drawOrbitalRings(ctx, cx, cy, pulse, fov, false);
        if (state.heroShape === "torus") {
          drawTorusFlow(ctx, cx, cy, pulse, fov);
        } else if (state.heroShape === "grid") {
          drawSpatialLayers(ctx, cx, cy, pulse, fov);
        } else {
          drawDesignCore(ctx, cx, cy, pulse, fov);
        }
      }
    }

    return { render };
  }

  /* -------------------------------------------------------------------------- */
  /* 3. Interactive 3D Fibonacci Flame Skill Constellation Sphere               */
  /* -------------------------------------------------------------------------- */
  function createSkillSphereScene(canvas) {
    if (!canvas) return null;

    let skills = [];
    let points = [];
    let rotX = 0.22, rotY = 0.35;
    let velX = 0.0015, velY = 0.0042;
    let drag = false, lx = 0, ly = 0;
    let hoverIdx = -1;
    let pointerX = -999, pointerY = -999;

    function setSkills(list) {
      skills = Array.isArray(list) && list.length ? list : ["Next.js", "Kotlin", "Supabase"];
      const n = skills.length;
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      points = skills.map((label, i) => {
        const y = 1 - (i / Math.max(1, n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = goldenAngle * i;
        return {
          label,
          x: Math.cos(theta) * r * 124,
          y: y * 124,
          z: Math.sin(theta) * r * 124
        };
      });
    }

    canvas.addEventListener("pointerdown", (e) => {
      drag = true;
      lx = e.clientX;
      ly = e.clientY;
      if (e.pointerType === "mouse") {
        canvas.setPointerCapture(e.pointerId);
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = e.clientX - rect.left;
      pointerY = e.clientY - rect.top;
      if (!drag) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      rotY += dx * 0.0085;
      rotX += dy * 0.0085;
      velY = dx * 0.0011;
      velX = dy * 0.0011;
    });

    canvas.addEventListener("pointerleave", () => {
      pointerX = -999;
      pointerY = -999;
      hoverIdx = -1;
    });

    const stopDrag = () => {
      drag = false;
    };
    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);

    function render(dt) {
      const { ctx, w, h } = setupHiDPI(canvas);
      const cx = w * 0.5;
      const cy = h * 0.5;
      ctx.clearRect(0, 0, w, h);

      if (!state.paused && !state.reducedMotion && !drag) {
        rotY += velY * (dt * 0.06);
        rotX += velX * (dt * 0.06);
        velY += (0.0038 - velY) * 0.03;
        velX += (0.0011 - velX) * 0.03;
      }

      const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, 170);
      aura.addColorStop(0, "rgba(255, 98, 28, 0.18)");
      aura.addColorStop(0.68, "rgba(225, 29, 72, 0.06)");
      aura.addColorStop(1, "rgba(11, 6, 5, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, cy, 170, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 138, 43, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) * 0.37, 0, Math.PI * 2);
      ctx.stroke();

      const sphereFit = Math.max(0.62, Math.min(1.06, Math.min(w, h) / 365));
      const sphereFov = 460 * sphereFit;

      const projected = points.map((pt, idx) => {
        const rp = rotateY(rotateX(pt, rotX), rotY);
        const pr = project(rp, sphereFov, 390, cx, cy);
        return { label: pt.label, rp, pr, idx };
      });

      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i], b = projected[j];
          const dist3D = Math.hypot(a.rp.x - b.rp.x, a.rp.y - b.rp.y, a.rp.z - b.rp.z);
          if (dist3D < 112 && a.pr && b.pr) {
            const avgZ = (a.rp.z + b.rp.z) * 0.5;
            const alpha = Math.max(0.03, Math.min(0.24, (130 - avgZ) / 880));
            ctx.strokeStyle = `rgba(255, 118, 36, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.pr.x, a.pr.y);
            ctx.lineTo(b.pr.x, b.pr.y);
            ctx.stroke();
          }
        }
      }

      projected.sort((a, b) => b.rp.z - a.rp.z);

      hoverIdx = -1;
      projected.forEach((item) => {
        if (!item.pr) return;
        const d = Math.hypot(item.pr.x - pointerX, item.pr.y - pointerY);
        if (d < 34 && item.rp.z < 50) {
          hoverIdx = item.idx;
        }
      });

      projected.forEach((item) => {
        if (!item.pr) return;
        const isHover = item.idx === hoverIdx;
        const depthNorm = Math.max(0, Math.min(1, (140 - item.rp.z) / 280));
        const alpha = isHover ? 1 : 0.3 + depthNorm * 0.7;
        const fontSize = Math.round((10.5 + depthNorm * 4.5) * (isHover ? 1.12 : 1));

        ctx.fillStyle = isHover
          ? "#FFF7E6"
          : `rgba(255, 136, 40, ${(alpha * 0.94).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(item.pr.x, item.pr.y - 12, isHover ? 4.3 : 2.2 + depthNorm * 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `${isHover ? 700 : 500} ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (isHover) {
          ctx.shadowColor = "rgba(255, 110, 26, 0.95)";
          ctx.shadowBlur = 15;
          ctx.fillStyle = "#FFF7E6";
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = depthNorm > 0.62
            ? `rgba(255, 244, 236, ${alpha.toFixed(3)})`
            : `rgba(206, 176, 160, ${alpha.toFixed(3)})`;
        }
        ctx.fillText(item.label, item.pr.x, item.pr.y + 4);
        ctx.shadowBlur = 0;
      });

      const badge = document.getElementById("skill-sphere-active");
      if (badge) {
        if (hoverIdx >= 0 && skills[hoverIdx]) {
          badge.textContent = `Focused: ${skills[hoverIdx]}`;
        } else {
          badge.textContent = "Drag to orbit 3D skill sphere";
        }
      }
    }

    return { render, setSkills };
  }

  /* -------------------------------------------------------------------------- */
  /* Master Animation Controller                                                */
  /* -------------------------------------------------------------------------- */
  let nebulaScene = null;
  let heroScene = null;
  let skillScene = null;
  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min(50, Math.max(8, now - lastTime));
    lastTime = now;

    state.mouseX += (state.targetMouseX - state.mouseX) * 0.06;
    state.mouseY += (state.targetMouseY - state.mouseY) * 0.06;

    const isCvMode = document.body.classList.contains("cv-mode");
    if (nebulaScene && !isCvMode) nebulaScene.render(dt);
    if (heroScene && !isCvMode) heroScene.render(dt);
    if (skillScene && !isCvMode) skillScene.render(dt);

    requestAnimationFrame(tick);
  }

  function init3D(orbitSkills) {
    nebulaScene = createNebulaScene(document.getElementById("bg-3d-canvas"));
    heroScene = createHeroScene(document.getElementById("hero-3d-canvas"));
    skillScene = createSkillSphereScene(document.getElementById("skills-3d-canvas"));
    if (skillScene && orbitSkills) {
      skillScene.setSkills(orbitSkills);
    }

    window.addEventListener("pointermove", (e) => {
      state.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      state.targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener("scroll", () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      state.scrollRatio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    }, { passive: true });

    requestAnimationFrame(tick);
  }

  window.Portfolio3D = {
    init: init3D,
    setHeroShape(shape) {
      state.heroShape = shape;
    },
    setSkills(list) {
      if (skillScene) skillScene.setSkills(list);
    },
    togglePause() {
      state.paused = !state.paused;
      return state.paused;
    },
    isPaused() {
      return state.paused;
    }
  };
})();
