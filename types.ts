import React from 'react';

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export enum Lane {
  LEFT = -1,
  CENTER = 0,
  RIGHT = 1
}

export interface GameObject {
  id: string;
  type: 'obstacle' | 'tree' | 'ball';
  lane: number; // -1, 0, 1 for obstacles/balls; +/- 2 for trees roughly
  z: number;
  width: number;
  height: number;
  color: string;
}

export interface HighScore {
  score: number;
  date: string;
}

// Define a loose type for R3F elements to satisfy TypeScript without full R3F types
type ThreeElement = any;

// Augment global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: ThreeElement;
      directionalLight: ThreeElement;
      fog: ThreeElement;
      group: ThreeElement;
      mesh: ThreeElement;
      boxGeometry: ThreeElement;
      planeGeometry: ThreeElement;
      cylinderGeometry: ThreeElement;
      coneGeometry: ThreeElement;
      sphereGeometry: ThreeElement;
      torusGeometry: ThreeElement;
      meshStandardMaterial: ThreeElement;
      meshBasicMaterial: ThreeElement;
      spotLight: ThreeElement;
      instancedMesh: ThreeElement;
      primitive: ThreeElement;
      object3D: ThreeElement;
      [elemName: string]: any;
    }
  }
}

// Augment React's internal JSX namespace (for newer React types support)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: ThreeElement;
      directionalLight: ThreeElement;
      fog: ThreeElement;
      group: ThreeElement;
      mesh: ThreeElement;
      boxGeometry: ThreeElement;
      planeGeometry: ThreeElement;
      cylinderGeometry: ThreeElement;
      coneGeometry: ThreeElement;
      sphereGeometry: ThreeElement;
      torusGeometry: ThreeElement;
      meshStandardMaterial: ThreeElement;
      meshBasicMaterial: ThreeElement;
      spotLight: ThreeElement;
      instancedMesh: ThreeElement;
      primitive: ThreeElement;
      object3D: ThreeElement;
      [elemName: string]: any;
    }
  }
}
