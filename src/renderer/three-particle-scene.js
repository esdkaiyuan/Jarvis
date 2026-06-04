import * as THREE from 'three';

export function particleToWorld(particle, width, height) {
  return {
    x: particle.x - width / 2,
    y: height / 2 - particle.y,
    z: particle.z
  };
}

export function createParticleGeometry(particles, width, height) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(particles.length * 3), 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(particles.length * 3), 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(particles.length), 1));
  syncParticleGeometry(geometry, particles, width, height, 0, 'idle');
  return geometry;
}

export function syncParticleGeometry(geometry, particles, width, height, nowMs, state = 'idle') {
  const positions = geometry.getAttribute('position');
  const colors = geometry.getAttribute('color');
  const sizes = geometry.getAttribute('size');

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    const world = particleToWorld(particle, width, height);
    const depth = clamp((particle.z + width * 0.4) / (width * 0.8), 0, 1);
    const color = colorForParticle(state, particle.colorPhase, nowMs, depth, particle.hueShift || 0);
    const base = i * 3;

    positions.array[base] = world.x;
    positions.array[base + 1] = world.y;
    positions.array[base + 2] = world.z;
    colors.array[base] = color.r;
    colors.array[base + 1] = color.g;
    colors.array[base + 2] = color.b;
    sizes.array[i] = (particle.size || 1.5) * (particle.sizeBias || 1) * (5.2 + depth * 4.4);
  }

  positions.needsUpdate = true;
  colors.needsUpdate = true;
  sizes.needsUpdate = true;
  geometry.computeBoundingSphere();
}

export function createParticleMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float size;
      varying vec3 vColor;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (280.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;

      void main() {
        vec2 point = gl_PointCoord - vec2(0.5);
        float distanceFromCenter = length(point);
        float core = smoothstep(0.42, 0.0, distanceFromCenter);
        float halo = smoothstep(0.5, 0.12, distanceFromCenter) * 0.35;
        float alpha = max(core, halo);

        if (alpha < 0.02) {
          discard;
        }

        gl_FragColor = vec4(vColor, alpha);
      }
    `
  });
}

export function createThreeParticleScene({ canvas, particles, width, height, pixelRatio = window.devicePixelRatio || 1 }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = createCamera(width, height);
  const geometry = createParticleGeometry(particles, width, height);
  const material = createParticleMaterial();
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    renderer,
    scene,
    camera,
    geometry,
    points,

    resize(nextWidth, nextHeight, nextPixelRatio = window.devicePixelRatio || 1) {
      renderer.setPixelRatio(nextPixelRatio);
      renderer.setSize(nextWidth, nextHeight, false);
      camera.aspect = nextWidth / nextHeight;
      camera.position.z = cameraDistanceFor(nextWidth, nextHeight);
      camera.updateProjectionMatrix();
    },

    render(particlesToRender, nextWidth, nextHeight, nowMs, state = 'idle') {
      syncParticleGeometry(geometry, particlesToRender, nextWidth, nextHeight, nowMs, state);
      const rotation = calculateParticleGroupRotation(nowMs, state);
      points.rotation.x = rotation.x;
      points.rotation.y = rotation.y;
      points.rotation.z = rotation.z;
      renderer.render(scene, camera);
    },

    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    }
  };
}

export function calculateParticleGroupRotation(nowMs, state = 'idle') {
  const t = nowMs * 0.001 * rotationSpeedForState(state);
  return {
    x: t * 0.035 + Math.sin(t * 0.37) * 0.12,
    y: t * 0.33,
    z: t * 0.075 + Math.cos(t * 0.29) * 0.025
  };
}

export function colorForParticle(state, phase, nowMs, depth, hueShift = 0) {
  const hue = ((colorHueForState(state, phase, nowMs, depth) + hueShift + 360) % 360) / 360;
  const saturation = 0.72 + depth * 0.24;
  const lightness = 0.48 + depth * 0.24;
  return new THREE.Color().setHSL(hue, saturation, lightness);
}

function rotationSpeedForState(state) {
  if (state === 'thinking') return 1.8;
  if (state === 'speaking') return 1.45;
  if (state === 'listening') return 1.18;
  if (state === 'error') return 0.85;
  return 1;
}

function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(46, width / height, 1, 2400);
  camera.position.z = cameraDistanceFor(width, height);
  return camera;
}

function cameraDistanceFor(width, height) {
  return Math.max(width, height) * 1.32;
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
