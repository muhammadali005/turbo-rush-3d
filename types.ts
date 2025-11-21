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

// Augment global JSX namespace to include Three.js elements used in React Three Fiber components
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      fog: any;
      group: any;
      mesh: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      coneGeometry: any;
      sphereGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      spotLight: any;
      instancedMesh: any;
      primitive: any;
      // Catch-all to support all R3F elements
      [elemName: string]: any;
    }
  }
}