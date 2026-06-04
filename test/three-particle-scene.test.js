import { describe, expect, test } from 'vitest';
import { createParticles } from '../src/renderer/particle-system.js';
import {
  calculateParticleGroupRotation,
  createParticleGeometry,
  particleToWorld,
  syncParticleGeometry
} from '../src/renderer/three-particle-scene.js';

describe('Three.js particle scene adapter', () => {
  test('converts screen-space particles to centered 3D world positions', () => {
    expect(
      particleToWorld(
        {
          x: 260,
          y: 180,
          z: 24
        },
        420,
        420
      )
    ).toEqual({
      x: 50,
      y: 30,
      z: 24
    });
  });

  test('creates GPU attributes for every particle without trail geometry', () => {
    const particles = createParticles({
      count: 1000,
      width: 420,
      height: 420,
      seed: 19
    });
    const geometry = createParticleGeometry(particles, 420, 420);

    expect(geometry.getAttribute('position').count).toBe(1000);
    expect(geometry.getAttribute('color').count).toBe(1000);
    expect(geometry.getAttribute('size').count).toBe(1000);
    expect(geometry.index).toBeNull();
  });

  test('updates geometry buffers as particles move and colors refresh', () => {
    const particles = createParticles({
      count: 2,
      width: 420,
      height: 420,
      seed: 23
    });
    const geometry = createParticleGeometry(particles, 420, 420);
    const before = geometry.getAttribute('position').array[0];
    const positionVersion = geometry.getAttribute('position').version;
    const colorVersion = geometry.getAttribute('color').version;
    const sizeVersion = geometry.getAttribute('size').version;

    particles[0].x += 18;
    syncParticleGeometry(geometry, particles, 420, 420, 1600, 'speaking');

    expect(geometry.getAttribute('position').array[0]).toBeCloseTo(before + 18, 4);
    expect(geometry.getAttribute('position').version).toBeGreaterThan(positionVersion);
    expect(geometry.getAttribute('color').version).toBeGreaterThan(colorVersion);
    expect(geometry.getAttribute('size').version).toBeGreaterThan(sizeVersion);
  });

  test('advances the whole particle group rotation continuously over time', () => {
    const early = calculateParticleGroupRotation(1000, 'idle');
    const later = calculateParticleGroupRotation(4000, 'idle');
    const thinking = calculateParticleGroupRotation(4000, 'thinking');

    expect(later.y).toBeGreaterThan(early.y);
    expect(later.z).toBeGreaterThan(early.z);
    expect(thinking.y).toBeGreaterThan(later.y);
  });
});
