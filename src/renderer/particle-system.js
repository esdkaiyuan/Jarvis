export const ADVANCED_MODELS = [
  { name: 'helix', style: 'ion helix', hueShift: 0, sizeBias: 1.05, motionBias: 1.08 },
  { name: 'torus', style: 'plasma torus', hueShift: 28, sizeBias: 1, motionBias: 1 },
  { name: 'heart', style: 'warm pulse', hueShift: 138, sizeBias: 1.08, motionBias: 1.12 },
  { name: 'infinity', style: 'quantum loop', hueShift: 218, sizeBias: 0.96, motionBias: 1.18 },
  { name: 'crystal', style: 'cold crystal', hueShift: 312, sizeBias: 0.92, motionBias: 0.96 },
  { name: 'galaxy', style: 'spiral galaxy', hueShift: 68, sizeBias: 0.86, motionBias: 1.34 },
  { name: 'lotus', style: 'lotus field', hueShift: 112, sizeBias: 1.02, motionBias: 1.08 },
  { name: 'neural', style: 'neural lattice', hueShift: 185, sizeBias: 0.9, motionBias: 1.22 },
  { name: 'atom', style: 'atomic orbit', hueShift: 246, sizeBias: 0.94, motionBias: 1.32 },
  { name: 'crown', style: 'luminous crown', hueShift: 42, sizeBias: 1.1, motionBias: 1.02 },
  { name: 'butterfly', style: 'butterfly curve', hueShift: 286, sizeBias: 0.98, motionBias: 1.16 },
  { name: 'waveform', style: 'voice waveform', hueShift: 166, sizeBias: 0.88, motionBias: 1.42 },
  { name: 'polyhedron', style: 'polyhedron frame', hueShift: 334, sizeBias: 0.82, motionBias: 0.92 },
  { name: 'vortex', style: 'deep vortex', hueShift: 206, sizeBias: 0.9, motionBias: 1.46 },
  { name: 'hourglass', style: 'hourglass flow', hueShift: 88, sizeBias: 0.96, motionBias: 1.28 },
  { name: 'orbitalRings', style: 'orbital rings', hueShift: 258, sizeBias: 0.92, motionBias: 1.26 },
  { name: 'hologramCube', style: 'hologram cube', hueShift: 190, sizeBias: 0.82, motionBias: 1.1 },
  { name: 'dataTunnel', style: 'data tunnel', hueShift: 152, sizeBias: 0.86, motionBias: 1.52 },
  { name: 'circuitSphere', style: 'circuit sphere', hueShift: 118, sizeBias: 0.84, motionBias: 1.18 },
  { name: 'gyroscope', style: 'gyro rings', hueShift: 232, sizeBias: 0.9, motionBias: 1.36 },
  { name: 'quantumGate', style: 'quantum gate', hueShift: 276, sizeBias: 0.9, motionBias: 1.24 },
  { name: 'radarDish', style: 'radar dish', hueShift: 72, sizeBias: 0.88, motionBias: 1.2 },
  { name: 'prismSpiral', style: 'prism spiral', hueShift: 316, sizeBias: 0.92, motionBias: 1.38 },
  { name: 'matrixGrid', style: 'matrix grid', hueShift: 134, sizeBias: 0.78, motionBias: 1.16 },
  { name: 'dysonSphere', style: 'dyson shell', hueShift: 48, sizeBias: 0.78, motionBias: 1.28 },
  { name: 'exoticGalaxy', style: 'exotic galaxy', hueShift: 304, sizeBias: 0.84, motionBias: 1.48 },
  { name: 'planetarySystem', style: 'planetary system', hueShift: 24, sizeBias: 0.96, motionBias: 1.22 }
];

export const SPECIAL_SHAPES = ADVANCED_MODELS.map((model) => model.name);

export function createParticles({ count, width, height, seed = Date.now() }) {
  const random = mulberry32(seed);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.28;

  return Array.from({ length: count }, () => {
    const phi = random() * Math.PI * 2;
    const costheta = random() * 2 - 1;
    const theta = Math.acos(costheta);
    const distance = Math.cbrt(random()) * radius;

    return {
      x: centerX + distance * Math.sin(theta) * Math.cos(phi),
      y: centerY + distance * Math.sin(theta) * Math.sin(phi),
      z: distance * Math.cos(theta),
      vx: 0,
      vy: 0,
      vz: 0,
      size: 0.85 + random() * 1.75,
      colorPhase: random() * Math.PI * 2,
      motionPhase: random() * Math.PI * 2,
      motionSpeed: 0.72 + random() * 0.86,
      energy: 0.45 + random() * 0.75
    };
  });
}

export function createShapeTargets({ count, width, height, shape = 'scatter', seed = Date.now() }) {
  const random = mulberry32(seed);
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height);
  const profile = modelProfileFor(shape);
  const variant = createModelVariant(random, scale);
  const vertices = createPolyhedronVertices(scale);
  const cubeVertices = createCubeVertices(scale * 0.24);

  return Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : index / (count - 1);
    const angle = t * Math.PI * 2;
    let target;

    if (shape === 'helix') {
      const turns = 4.5;
      const a = t * Math.PI * 2 * turns;
      const strand = index % 2 === 0 ? 0 : Math.PI;
      const radius = scale * (0.16 + 0.035 * Math.sin(t * Math.PI * 6));
      target = {
        mode: 'helix',
        x: centerX + Math.cos(a + strand) * radius,
        y: centerY + (t - 0.5) * scale * 0.66,
        z: Math.sin(a + strand) * radius
      };
    } else if (shape === 'torus') {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const u = index * golden;
      const v = angle * 5;
      const major = scale * 0.18;
      const minor = scale * 0.075;
      target = {
        mode: 'torus',
        x: centerX + (major + minor * Math.cos(v)) * Math.cos(u),
        y: centerY + (major + minor * Math.cos(v)) * Math.sin(u),
        z: minor * Math.sin(v)
      };
    } else if (shape === 'heart') {
      const a = angle;
      const x = 16 * Math.pow(Math.sin(a), 3);
      const y =
        13 * Math.cos(a) -
        5 * Math.cos(2 * a) -
        2 * Math.cos(3 * a) -
        Math.cos(4 * a);
      const depth = (random() - 0.5) * scale * 0.13;
      target = {
        mode: 'heart',
        x: centerX + x * scale * 0.0125 + (random() - 0.5) * scale * 0.025,
        y: centerY - y * scale * 0.0125 + (random() - 0.5) * scale * 0.025,
        z: depth
      };
    } else if (shape === 'infinity') {
      const a = angle * 2;
      const denominator = 1 + Math.pow(Math.sin(a), 2);
      target = {
        mode: 'infinity',
        x: centerX + (Math.cos(a) / denominator) * scale * 0.32,
        y: centerY + (Math.sin(a) * Math.cos(a) / denominator) * scale * 0.22,
        z: Math.sin(a * 3) * scale * 0.08
      };
    } else if (shape === 'crystal') {
      const layer = index % 7;
      const layerRadius = scale * (0.045 + layer * 0.028);
      const yBand = (layer - 3) * scale * 0.045;
      target = {
        mode: 'crystal',
        x: centerX + Math.cos(angle * 7 + layer) * layerRadius,
        y: centerY + yBand + Math.sin(angle * 3) * scale * 0.025,
        z: Math.sin(angle * 7 + layer) * layerRadius
      };
    } else if (shape === 'galaxy') {
      const arm = (index % 5) * ((Math.PI * 2) / 5);
      const radius = scale * (0.025 + Math.sqrt(t) * 0.31);
      const twist = t * Math.PI * 8.5 + arm;
      target = {
        mode: 'galaxy',
        x: centerX + Math.cos(twist) * radius + (random() - 0.5) * scale * 0.035,
        y: centerY + Math.sin(twist) * radius * 0.72 + (random() - 0.5) * scale * 0.03,
        z: Math.sin(twist * 0.7) * scale * 0.075 + (random() - 0.5) * scale * 0.035
      };
    } else if (shape === 'lotus') {
      const petal = Math.abs(Math.sin(angle * 4));
      const radius = scale * (0.055 + petal * 0.27);
      const layer = (index % 4) / 4;
      target = {
        mode: 'lotus',
        x: centerX + Math.cos(angle) * radius * (0.86 + layer * 0.22),
        y: centerY + Math.sin(angle) * radius * 0.66 + Math.cos(angle * 8) * scale * 0.018,
        z: (layer - 0.5) * scale * 0.18 + Math.sin(angle * 4) * scale * 0.045
      };
    } else if (shape === 'neural') {
      const nodeCount = 9;
      const node = index % nodeCount;
      const nodeAngle = node * ((Math.PI * 2) / nodeCount);
      const nodeRadius = scale * (0.09 + (node % 3) * 0.055);
      const nextNode = (node + 3 + Math.floor(index / nodeCount)) % nodeCount;
      const nextAngle = nextNode * ((Math.PI * 2) / nodeCount);
      const blend = random();
      const ax = Math.cos(nodeAngle) * nodeRadius;
      const ay = Math.sin(nodeAngle) * nodeRadius;
      const bx = Math.cos(nextAngle) * scale * (0.1 + (nextNode % 3) * 0.055);
      const by = Math.sin(nextAngle) * scale * (0.1 + (nextNode % 3) * 0.055);
      target = {
        mode: 'neural',
        x: centerX + ax * (1 - blend) + bx * blend + (random() - 0.5) * scale * 0.025,
        y: centerY + ay * (1 - blend) + by * blend + (random() - 0.5) * scale * 0.025,
        z: Math.sin(nodeAngle * 2 + blend * Math.PI) * scale * 0.12
      };
    } else if (shape === 'atom') {
      const ring = index % 3;
      const a = angle * 6 + ring * 0.42;
      const radius = scale * (0.18 + ring * 0.018);
      const tilt = ring * ((Math.PI * 2) / 3);
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius * 0.36;
      target = {
        mode: 'atom',
        x: centerX + x * Math.cos(tilt) - y * Math.sin(tilt),
        y: centerY + x * Math.sin(tilt) + y * Math.cos(tilt),
        z: Math.sin(a) * radius * 0.52
      };
    } else if (shape === 'crown') {
      const spikes = 7;
      const spike = Math.pow(Math.max(0, Math.sin(angle * spikes)), 2.4);
      const radius = scale * (0.16 + spike * 0.1);
      target = {
        mode: 'crown',
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * scale * 0.13 - spike * scale * 0.18 + scale * 0.04,
        z: Math.sin(angle) * radius * 0.62
      };
    } else if (shape === 'butterfly') {
      const a = angle * 2;
      const wing =
        Math.exp(Math.cos(a)) -
        2 * Math.cos(4 * a) -
        Math.pow(Math.sin(a / 12), 5);
      target = {
        mode: 'butterfly',
        x: centerX + Math.sin(a) * wing * scale * 0.052,
        y: centerY - Math.cos(a) * wing * scale * 0.052,
        z: Math.sin(a * 2) * scale * 0.09 + (random() - 0.5) * scale * 0.025
      };
    } else if (shape === 'waveform') {
      const x = (t - 0.5) * scale * 0.66;
      const carrier = Math.sin(t * Math.PI * 12);
      const detail = Math.sin(t * Math.PI * 34) * 0.38;
      target = {
        mode: 'waveform',
        x: centerX + x,
        y: centerY + (carrier + detail) * scale * 0.09,
        z: Math.cos(t * Math.PI * 10) * scale * 0.12
      };
    } else if (shape === 'polyhedron') {
      const edge = polyhedronEdges[index % polyhedronEdges.length];
      const local = (index / polyhedronEdges.length) % 1;
      const from = vertices[edge[0]];
      const to = vertices[edge[1]];
      target = {
        mode: 'polyhedron',
        x: centerX + from.x * (1 - local) + to.x * local,
        y: centerY + from.y * (1 - local) + to.y * local,
        z: from.z * (1 - local) + to.z * local
      };
    } else if (shape === 'vortex') {
      const vertical = (t - 0.5) * scale * 0.62;
      const radius = scale * (0.035 + (1 - t) * 0.28);
      const a = t * Math.PI * 13;
      target = {
        mode: 'vortex',
        x: centerX + Math.cos(a) * radius,
        y: centerY + vertical,
        z: Math.sin(a) * radius
      };
    } else if (shape === 'hourglass') {
      const vertical = (t - 0.5) * 2;
      const radius = scale * (0.025 + Math.abs(vertical) * 0.22);
      const a = angle * 6;
      target = {
        mode: 'hourglass',
        x: centerX + Math.cos(a) * radius,
        y: centerY + vertical * scale * 0.31,
        z: Math.sin(a) * radius
      };
    } else if (shape === 'orbitalRings') {
      const ring = index % 5;
      const radius = scale * (0.07 + ring * 0.042);
      const a = angle * (ring + 2);
      const tilt = ring * 0.47;
      target = {
        mode: 'orbitalRings',
        x: centerX + Math.cos(a) * radius,
        y: centerY + Math.sin(a) * radius * Math.cos(tilt),
        z: Math.sin(a) * radius * Math.sin(tilt)
      };
    } else if (shape === 'hologramCube') {
      const edge = cubeEdges[index % cubeEdges.length];
      const local = (index / cubeEdges.length) % 1;
      const from = cubeVertices[edge[0]];
      const to = cubeVertices[edge[1]];
      const scan = Math.sin(t * Math.PI * 18) * scale * 0.012;
      target = {
        mode: 'hologramCube',
        x: centerX + from.x * (1 - local) + to.x * local + scan,
        y: centerY + from.y * (1 - local) + to.y * local,
        z: from.z * (1 - local) + to.z * local + Math.cos(t * Math.PI * 8) * scale * 0.02
      };
    } else if (shape === 'dataTunnel') {
      const ring = index % 9;
      const a = angle * 10 + ring * 0.42;
      const radius = scale * (0.07 + ring * 0.018);
      target = {
        mode: 'dataTunnel',
        x: centerX + Math.cos(a) * radius,
        y: centerY + (t - 0.5) * scale * 0.62,
        z: Math.sin(a) * radius + Math.cos(t * Math.PI * 4) * scale * 0.045
      };
    } else if (shape === 'circuitSphere') {
      const band = index % 13;
      const longitude = Math.floor(index / 13) * 0.61;
      const latitude = -Math.PI / 2 + (band / 12) * Math.PI;
      const radius = scale * (0.18 + ((index % 5) - 2) * 0.002);
      const circuitStep = index % 4 === 0 ? scale * 0.018 : 0;
      target = {
        mode: 'circuitSphere',
        x: centerX + Math.cos(latitude) * Math.cos(longitude) * radius + circuitStep,
        y: centerY + Math.sin(latitude) * radius,
        z: Math.cos(latitude) * Math.sin(longitude) * radius
      };
    } else if (shape === 'gyroscope') {
      const ring = index % 4;
      const a = angle * (ring + 3);
      const radius = scale * (0.12 + ring * 0.028);
      const tilt = ring * 0.72 + 0.24;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius * 0.26;
      target = {
        mode: 'gyroscope',
        x: centerX + x,
        y: centerY + y * Math.cos(tilt) - Math.sin(a) * radius * Math.sin(tilt) * 0.42,
        z: y * Math.sin(tilt) + Math.sin(a) * radius * Math.cos(tilt) * 0.72
      };
    } else if (shape === 'quantumGate') {
      const side = index % 4;
      const segmentCount = Math.max(1, Math.floor(count / 4));
      const local = (Math.floor(index / 4) % segmentCount) / segmentCount;
      const halfW = scale * 0.22;
      const halfH = scale * 0.25;
      const localX =
        side === 0 ? -halfW + local * halfW * 2 : side === 2 ? halfW - local * halfW * 2 : side === 1 ? halfW : -halfW;
      const localY =
        side === 1 ? -halfH + local * halfH * 2 : side === 3 ? halfH - local * halfH * 2 : side === 0 ? -halfH : halfH;
      target = {
        mode: 'quantumGate',
        x: centerX + localX,
        y: centerY + localY,
        z: Math.sin(local * Math.PI * 2 + side * Math.PI * 0.5) * scale * 0.12
      };
    } else if (shape === 'radarDish') {
      const a = index * Math.PI * (3 - Math.sqrt(5));
      const radius = Math.sqrt(t) * scale * 0.25;
      const bowl = Math.pow(radius / (scale * 0.25), 2);
      target = {
        mode: 'radarDish',
        x: centerX + Math.cos(a) * radius,
        y: centerY + Math.sin(a) * radius * 0.56 + scale * 0.045,
        z: (bowl - 0.5) * scale * 0.22
      };
    } else if (shape === 'prismSpiral') {
      const side = index % 3;
      const a = t * Math.PI * 10 + side * ((Math.PI * 2) / 3);
      const radius = scale * (0.055 + t * 0.22);
      const facet = Math.cos(side * ((Math.PI * 2) / 3)) * scale * 0.025;
      target = {
        mode: 'prismSpiral',
        x: centerX + Math.cos(a) * radius + facet,
        y: centerY + (t - 0.5) * scale * 0.55,
        z: Math.sin(a) * radius
      };
    } else if (shape === 'matrixGrid') {
      const columns = 15;
      const rows = 15;
      const column = index % columns;
      const row = Math.floor(index / columns) % rows;
      const layer = Math.floor(index / (columns * rows)) % 5;
      target = {
        mode: 'matrixGrid',
        x: centerX + (column / (columns - 1) - 0.5) * scale * 0.48,
        y: centerY + (row / (rows - 1) - 0.5) * scale * 0.48 + Math.sin(t * Math.PI * 16) * scale * 0.012,
        z: (layer - 2) * scale * 0.065
      };
    } else if (shape === 'dysonSphere') {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const shellPhase = index % 5;
      const useRing = shellPhase === 0 || shellPhase === 3;
      if (useRing) {
        const ring = index % 7;
        const a = angle * (ring + 2.5);
        const radius = scale * (0.205 + ring * 0.008);
        const tilt = -0.72 + ring * 0.24;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius * Math.cos(tilt);
        target = {
          mode: 'dysonSphere',
          x: centerX + x,
          y: centerY + y,
          z: Math.sin(a) * radius * Math.sin(tilt)
        };
      } else {
        const sphereIndex = index * golden;
        const yUnit = 1 - 2 * ((index % Math.max(1, count - 1)) / Math.max(1, count - 1));
        const latitudeRadius = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
        const panelOffset = (shellPhase - 2) * scale * 0.004;
        const radius = scale * (0.208 + panelOffset / scale);
        target = {
          mode: 'dysonSphere',
          x: centerX + Math.cos(sphereIndex) * latitudeRadius * radius,
          y: centerY + yUnit * radius,
          z: Math.sin(sphereIndex) * latitudeRadius * radius
        };
      }
    } else if (shape === 'exoticGalaxy') {
      const coreSide = index % 9 === 0 ? -1 : index % 9 === 1 ? 1 : 0;
      if (coreSide !== 0) {
        const coreAngle = random() * Math.PI * 2;
        const coreRadius = Math.sqrt(random()) * scale * 0.055;
        target = {
          mode: 'exoticGalaxy',
          x: centerX + coreSide * scale * 0.13 + Math.cos(coreAngle) * coreRadius,
          y: centerY + Math.sin(coreAngle) * coreRadius * 0.72,
          z: (random() - 0.5) * scale * 0.12
        };
      } else {
        const arm = index % 6;
        const bridge = index % 11 === 0;
        const radius = scale * (0.045 + Math.pow(t, 0.62) * 0.32);
        const twist = t * Math.PI * 9.6 + arm * ((Math.PI * 2) / 3) + Math.sin(t * Math.PI * 3) * 0.65;
        const pinch = Math.sin(t * Math.PI * 2 + arm) * scale * 0.038;
        target = {
          mode: 'exoticGalaxy',
          x:
            centerX +
            Math.cos(twist) * radius +
            (bridge ? Math.sin(t * Math.PI * 8) * scale * 0.16 : pinch),
          y:
            centerY +
            Math.sin(twist) * radius * 0.54 +
            Math.cos(t * Math.PI * 5 + arm) * scale * 0.026,
          z:
            Math.sin(twist * 0.8 + arm) * radius * 0.58 +
            Math.cos(t * Math.PI * 6) * scale * 0.04
        };
      }
    } else if (shape === 'planetarySystem') {
      const zone = index % 10;
      if (zone < 4) {
        const phi = index * Math.PI * (3 - Math.sqrt(5));
        const yUnit = 1 - 2 * ((Math.floor(index / 10) % 80) / 79);
        const latitudeRadius = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
        const radius = scale * (0.055 + (zone % 2) * 0.006);
        target = {
          mode: 'planetarySystem',
          x: centerX + Math.cos(phi) * latitudeRadius * radius,
          y: centerY + yUnit * radius,
          z: Math.sin(phi) * latitudeRadius * radius
        };
      } else if (zone < 8) {
        const ring = zone - 4;
        const a = angle * (ring + 2.2);
        const radius = scale * (0.115 + ring * 0.043);
        const tilt = 0.28 + ring * 0.19;
        target = {
          mode: 'planetarySystem',
          x: centerX + Math.cos(a) * radius,
          y: centerY + Math.sin(a) * radius * Math.cos(tilt),
          z: Math.sin(a) * radius * Math.sin(tilt)
        };
      } else {
        const moon = zone - 8;
        const a = angle * (moon + 5.4);
        const orbitRadius = scale * (0.24 + moon * 0.095);
        const moonRadius = scale * (0.017 + moon * 0.006);
        const local = random() * Math.PI * 2;
        target = {
          mode: 'planetarySystem',
          x: centerX + Math.cos(a) * orbitRadius + Math.cos(local) * moonRadius,
          y: centerY + Math.sin(a) * orbitRadius * 0.72 + Math.sin(local) * moonRadius,
          z: Math.sin(a) * orbitRadius * 0.38 + Math.cos(local) * moonRadius
        };
      }
    }

    if (!target) {
      const phi = random() * Math.PI * 2;
      const costheta = random() * 2 - 1;
      const theta = Math.acos(costheta);
      const distance = Math.cbrt(random()) * scale * 0.28;
      target = {
        mode: 'scatter',
        x: centerX + distance * Math.sin(theta) * Math.cos(phi),
        y: centerY + distance * Math.sin(theta) * Math.sin(phi),
        z: distance * Math.cos(theta)
      };
    }

    if (target.mode !== 'scatter') {
      target = applyModelVariant(target, variant, centerX, centerY);
    }

    return decorateTarget(target, profile, index, random);
  });
}

function modelProfileFor(shape) {
  return (
    ADVANCED_MODELS.find((model) => model.name === shape) || {
      name: 'scatter',
      style: 'scatter field',
      hueShift: 0,
      sizeBias: 1,
      motionBias: 1
    }
  );
}

function decorateTarget(target, profile, index, random) {
  const localVariation = (random() - 0.5) * 18 + ((index % 11) - 5) * 0.9;
  return {
    ...target,
    style: profile.style,
    hueShift: profile.hueShift + localVariation,
    sizeBias: profile.sizeBias * (0.9 + random() * 0.2),
    motionBias: profile.motionBias * (0.94 + random() * 0.12)
  };
}

function createModelVariant(random, scale) {
  return {
    yaw: random() * Math.PI * 2,
    pitch: (random() - 0.5) * 0.78,
    roll: (random() - 0.5) * 0.68,
    scaleX: 0.88 + random() * 0.22,
    scaleY: 0.88 + random() * 0.2,
    scaleZ: 0.9 + random() * 0.28,
    driftX: (random() - 0.5) * scale * 0.025,
    driftY: (random() - 0.5) * scale * 0.025
  };
}

function applyModelVariant(target, variant, centerX, centerY) {
  let x = (target.x - centerX) * variant.scaleX;
  let y = (target.y - centerY) * variant.scaleY;
  let z = target.z * variant.scaleZ;

  const cosYaw = Math.cos(variant.yaw);
  const sinYaw = Math.sin(variant.yaw);
  [x, z] = [x * cosYaw - z * sinYaw, x * sinYaw + z * cosYaw];

  const cosPitch = Math.cos(variant.pitch);
  const sinPitch = Math.sin(variant.pitch);
  [y, z] = [y * cosPitch - z * sinPitch, y * sinPitch + z * cosPitch];

  const cosRoll = Math.cos(variant.roll);
  const sinRoll = Math.sin(variant.roll);
  [x, y] = [x * cosRoll - y * sinRoll, x * sinRoll + y * cosRoll];

  return {
    ...target,
    x: centerX + x + variant.driftX,
    y: centerY + y + variant.driftY,
    z: z * 0.72 + target.z * 0.58
  };
}

const cubeEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
];

function createCubeVertices(radius) {
  return [
    { x: -radius, y: -radius, z: -radius },
    { x: radius, y: -radius, z: -radius },
    { x: radius, y: radius, z: -radius },
    { x: -radius, y: radius, z: -radius },
    { x: -radius, y: -radius, z: radius },
    { x: radius, y: -radius, z: radius },
    { x: radius, y: radius, z: radius },
    { x: -radius, y: radius, z: radius }
  ];
}

const polyhedronEdges = [
  [0, 1],
  [0, 5],
  [0, 7],
  [0, 10],
  [0, 11],
  [1, 5],
  [1, 7],
  [1, 8],
  [1, 9],
  [2, 3],
  [2, 4],
  [2, 6],
  [2, 10],
  [2, 11],
  [3, 4],
  [3, 6],
  [3, 8],
  [3, 9],
  [4, 5],
  [4, 9],
  [4, 11],
  [5, 9],
  [5, 11],
  [6, 7],
  [6, 8],
  [6, 10],
  [7, 8],
  [7, 10],
  [8, 9],
  [10, 11]
];

function createPolyhedronVertices(scale) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const radius = scale * 0.235;
  return [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1]
  ].map(([x, y, z]) => {
    const magnitude = Math.hypot(x, y, z);
    return {
      x: (x / magnitude) * radius,
      y: (y / magnitude) * radius,
      z: (z / magnitude) * radius
    };
  });
}

export class ParticleDirector {
  constructor({
    count,
    width,
    height,
    seed = Date.now(),
    minShapeIntervalMs = 8000,
    maxShapeIntervalMs = 13000,
    shapeHoldMs = 3200
  }) {
    this.count = count;
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.random = mulberry32(seed);
    this.minShapeIntervalMs = minShapeIntervalMs;
    this.maxShapeIntervalMs = maxShapeIntervalMs;
    this.shapeHoldMs = shapeHoldMs;
    this.mode = 'scatter';
    this.shapeIndex = 0;
    this.recentShapes = [];
    this.nextTransitionAt = minShapeIntervalMs;
    this.targets = createShapeTargets({ count, width, height, shape: 'scatter', seed });
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.targets = createShapeTargets({
      count: this.count,
      width,
      height,
      shape: this.mode,
      seed: this.seed + this.shapeIndex
    });
  }

  forceShape(shape, nowMs = 0) {
    this.mode = shape;
    this.shapeIndex += 1;
    this.targets = createShapeTargets({
      count: this.count,
      width: this.width,
      height: this.height,
      shape,
      seed: this.seed + this.shapeIndex
    });
    this.nextTransitionAt = nowMs + this.shapeHoldMs;
  }

  update(nowMs) {
    if (nowMs < this.nextTransitionAt) {
      return this.targets;
    }

    if (this.mode === 'scatter') {
      const shape = this.chooseNextSpecialShape();
      this.forceShape(shape, nowMs);
      return this.targets;
    }

    this.mode = 'scatter';
    this.shapeIndex += 1;
    this.targets = createShapeTargets({
      count: this.count,
      width: this.width,
      height: this.height,
      shape: 'scatter',
      seed: this.seed + this.shapeIndex
    });
    this.nextTransitionAt =
      nowMs +
      this.minShapeIntervalMs +
      this.random() * (this.maxShapeIntervalMs - this.minShapeIntervalMs);
    return this.targets;
  }

  chooseNextSpecialShape() {
    const avoid = new Set(this.recentShapes.slice(-3));
    let shape = SPECIAL_SHAPES[Math.floor(this.random() * SPECIAL_SHAPES.length)];

    for (let attempts = 0; attempts < SPECIAL_SHAPES.length && avoid.has(shape); attempts += 1) {
      shape = SPECIAL_SHAPES[Math.floor(this.random() * SPECIAL_SHAPES.length)];
    }

    if (avoid.has(shape)) {
      const fallbackIndex = (SPECIAL_SHAPES.indexOf(shape) + 1) % SPECIAL_SHAPES.length;
      shape = SPECIAL_SHAPES[fallbackIndex];
    }

    this.recentShapes.push(shape);
    if (this.recentShapes.length > 5) {
      this.recentShapes.shift();
    }
    return shape;
  }
}

export function stepParticles(particles, targets, deltaMs, nowMs, energy = 1) {
  const dt = Math.min(deltaMs, 48) / 16.67;
  const swirl = 0.012 * energy;

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    const target = targets[i] || targets[targets.length - 1];
    const dx = target.x - particle.x;
    const dy = target.y - particle.y;
    const dz = target.z - particle.z;
    const pulse = Math.sin(nowMs * 0.0018 + particle.colorPhase) * 0.35 + 0.65;
    particle.style = target.style || particle.style || 'scatter field';
    particle.hueShift = smoothNumber(particle.hueShift, target.hueShift || 0, 0.08);
    particle.sizeBias = smoothNumber(particle.sizeBias, target.sizeBias || 1, 0.08);
    particle.motionBias = smoothNumber(particle.motionBias, target.motionBias || 1, 0.1);
    const motionPhase =
      nowMs * 0.001 * (particle.motionSpeed || 1) +
      (particle.motionPhase ?? particle.colorPhase ?? 0) +
      i * 0.017;
    const individualMotion = (0.035 + (particle.energy || 0.8) * 0.035) * energy * particle.motionBias;

    particle.vx =
      (
        particle.vx +
        dx * 0.010 * energy +
        -dy * swirl * 0.001 +
        Math.cos(motionPhase * 1.7) * individualMotion
      ) *
      0.88;
    particle.vy =
      (
        particle.vy +
        dy * 0.010 * energy +
        dx * swirl * 0.001 +
        Math.sin(motionPhase * 1.3) * individualMotion
      ) *
      0.88;
    particle.vz =
      (
        particle.vz +
        dz * 0.010 * energy +
        Math.sin(motionPhase * 1.1 + i * 0.031) * individualMotion * 0.68
      ) *
      0.88;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.z += particle.vz * dt;
    particle.colorPhase += (0.015 + pulse * 0.02) * dt;
  }
}

export function drawParticles(ctx, particles, width, height, nowMs, state = 'idle') {
  ctx.clearRect(0, 0, width, height);

  const sorted = [...particles].sort((a, b) => a.z - b.z);
  for (const particle of sorted) {
    const depth = clamp((particle.z + width * 0.4) / (width * 0.8), 0, 1);
    const hue = (colorHueForState(state, particle.colorPhase, nowMs, depth) + (particle.hueShift || 0) + 360) % 360;
    const alpha = 0.38 + depth * 0.52;
    const radius = particle.size * (particle.sizeBias || 1) * (0.55 + depth * 1.35);

    ctx.beginPath();
    ctx.fillStyle = `hsla(${hue}, ${78 + depth * 16}%, ${52 + depth * 22}%, ${alpha})`;
    ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function colorHueForState(state, phase, nowMs, depth) {
  const drift = (nowMs * 0.035 + phase * 42 + depth * 60) % 360;
  if (state === 'listening') return (168 + drift * 0.23) % 360;
  if (state === 'thinking') return (205 + drift * 0.31) % 360;
  if (state === 'speaking') return (28 + drift * 0.18) % 360;
  if (state === 'error') return (348 + drift * 0.12) % 360;
  return (190 + drift * 0.28) % 360;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothNumber(current, target, amount) {
  if (!Number.isFinite(current)) {
    return target;
  }
  return current + (target - current) * amount;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function random() {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
