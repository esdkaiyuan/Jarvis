import { describe, expect, test } from 'vitest';
import {
  createParticles,
  createShapeTargets,
  ParticleDirector,
  SPECIAL_SHAPES,
  stepParticles
} from '../src/renderer/particle-system.js';

describe('particle system', () => {
  test('creates exactly the requested particle count without trail state', () => {
    const particles = createParticles({
      count: 1000,
      width: 420,
      height: 420,
      seed: 7
    });

    expect(particles).toHaveLength(1000);
    expect(particles[0]).toMatchObject({
      x: expect.any(Number),
      y: expect.any(Number),
      z: expect.any(Number),
      colorPhase: expect.any(Number)
    });
    expect(particles[0]).not.toHaveProperty('previousX');
    expect(particles[0]).not.toHaveProperty('previousY');
  });

  test('creates advanced shape targets for every particle', () => {
    const targets = createShapeTargets({
      count: 1000,
      width: 420,
      height: 420,
      shape: 'helix',
      seed: 3
    });

    expect(targets).toHaveLength(1000);
    expect(new Set(targets.map((target) => target.mode))).toEqual(new Set(['helix']));
    expect(targets.every((target) => Number.isFinite(target.x) && Number.isFinite(target.y))).toBe(true);
  });

  test('offers a broad catalog of advanced particle models', () => {
    expect(SPECIAL_SHAPES.length).toBeGreaterThanOrEqual(24);
    expect(SPECIAL_SHAPES).toEqual(
      expect.arrayContaining([
        'galaxy',
        'lotus',
        'neural',
        'atom',
        'butterfly',
        'waveform',
        'polyhedron',
        'vortex',
        'hologramCube',
        'dataTunnel',
        'circuitSphere',
        'gyroscope',
        'quantumGate',
        'radarDish',
        'prismSpiral',
        'matrixGrid',
        'dysonSphere',
        'exoticGalaxy',
        'planetarySystem'
      ])
    );
  });

  test('tech models have real 3D depth instead of flat 2D outlines', () => {
    for (const shape of [
      'hologramCube',
      'dataTunnel',
      'circuitSphere',
      'gyroscope',
      'quantumGate',
      'radarDish',
      'dysonSphere',
      'exoticGalaxy',
      'planetarySystem'
    ]) {
      const targets = createShapeTargets({
        count: 180,
        width: 420,
        height: 420,
        shape,
        seed: 43
      });
      const zValues = targets.map((target) => target.z);
      const zDepth = Math.max(...zValues) - Math.min(...zValues);

      expect(zDepth, `${shape} z depth`).toBeGreaterThan(70);
    }
  });

  test('cosmic models expose distinct 3D structures', () => {
    const dyson = createShapeTargets({
      count: 420,
      width: 420,
      height: 420,
      shape: 'dysonSphere',
      seed: 54
    });
    const dysonRadiusSpread = radialSpread(dyson, 210, 210);
    expect(dysonRadiusSpread.max - dysonRadiusSpread.min).toBeLessThan(170);
    expect(dysonRadiusSpread.max).toBeGreaterThan(105);

    const exoticGalaxy = createShapeTargets({
      count: 420,
      width: 420,
      height: 420,
      shape: 'exoticGalaxy',
      seed: 55
    });
    expect(countDenseCores(exoticGalaxy, 210, 210)).toBeGreaterThanOrEqual(2);

    const planetary = createShapeTargets({
      count: 420,
      width: 420,
      height: 420,
      shape: 'planetarySystem',
      seed: 56
    });
    const planetaryRadiusSpread = radialSpread(planetary, 210, 210);
    expect(planetaryRadiusSpread.min).toBeLessThan(45);
    expect(planetaryRadiusSpread.max).toBeGreaterThan(130);
  });

  test('same tech model gets different 3D variants from different seeds', () => {
    const first = createShapeTargets({
      count: 120,
      width: 420,
      height: 420,
      shape: 'hologramCube',
      seed: 101
    });
    const second = createShapeTargets({
      count: 120,
      width: 420,
      height: 420,
      shape: 'hologramCube',
      seed: 102
    });

    expect(shapeSignature(first)).not.toBe(shapeSignature(second));
  });

  test('adds model style metadata to advanced shape targets', () => {
    for (const shape of SPECIAL_SHAPES) {
      const targets = createShapeTargets({
        count: 80,
        width: 420,
        height: 420,
        shape,
        seed: 31
      });

      expect(targets).toHaveLength(80);
      expect(targets.every((target) => target.mode === shape)).toBe(true);
      expect(targets.every((target) => Number.isFinite(target.x) && Number.isFinite(target.y))).toBe(true);
      expect(targets[0]).toMatchObject({
        style: expect.any(String),
        hueShift: expect.any(Number),
        sizeBias: expect.any(Number),
        motionBias: expect.any(Number)
      });
    }
  });

  test('director alternates between scatter and special shapes over time', () => {
    const director = new ParticleDirector({
      count: 1000,
      width: 420,
      height: 420,
      seed: 11,
      minShapeIntervalMs: 1000,
      maxShapeIntervalMs: 1000,
      shapeHoldMs: 700
    });

    expect(director.mode).toBe('scatter');
    director.update(1000);
    expect(director.mode).not.toBe('scatter');
    director.update(1800);
    expect(director.mode).toBe('scatter');
  });

  test('chooses special models in a seeded random non-repeating order', () => {
    const director = new ParticleDirector({
      count: 1000,
      width: 420,
      height: 420,
      seed: 29,
      minShapeIntervalMs: 100,
      maxShapeIntervalMs: 100,
      shapeHoldMs: 50
    });
    const chosen = [];

    for (let now = 100; chosen.length < 7; now += 60) {
      director.update(now);
      if (director.mode !== 'scatter') {
        chosen.push(director.mode);
      }
      director.update(now + 55);
    }

    expect(new Set(chosen).size).toBeGreaterThan(4);
    expect(chosen).not.toEqual(SPECIAL_SHAPES.slice(0, chosen.length));
    for (let i = 1; i < chosen.length; i += 1) {
      expect(chosen[i]).not.toBe(chosen[i - 1]);
    }
  });

  test('keeps particles moving even after they have reached their target', () => {
    const particle = {
      x: 210,
      y: 210,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      size: 1.5,
      colorPhase: 0.3,
      energy: 1
    };
    const target = {
      mode: 'scatter',
      x: 210,
      y: 210,
      z: 0
    };

    stepParticles([particle], [target], 16.67, 1234, 1);

    expect(Math.hypot(particle.x - 210, particle.y - 210, particle.z)).toBeGreaterThan(0);
  });
});

function shapeSignature(targets) {
  return targets
    .slice(0, 12)
    .map((target) => `${Math.round(target.x)}:${Math.round(target.y)}:${Math.round(target.z)}`)
    .join('|');
}

function radialSpread(targets, centerX, centerY) {
  const radii = targets.map((target) => Math.hypot(target.x - centerX, target.y - centerY, target.z));
  return {
    min: Math.min(...radii),
    max: Math.max(...radii)
  };
}

function countDenseCores(targets, centerX, centerY) {
  const leftCore = targets.filter((target) => Math.hypot(target.x - centerX + 54, target.y - centerY) < 42).length;
  const rightCore = targets.filter((target) => Math.hypot(target.x - centerX - 54, target.y - centerY) < 42).length;
  return [leftCore, rightCore].filter((count) => count >= 10).length;
}
