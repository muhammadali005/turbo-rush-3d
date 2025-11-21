
export const LANE_WIDTH = 2.5;
export const PLAYER_Y = 0.35; // Lower center of mass for sports car feel
export const PLAYER_WIDTH = 1.1; // Slightly narrower for better lane fit
export const PLAYER_LENGTH = 2.4; // Longer body for realistic proportions
export const PLAYER_SPEED_LATERAL = 15; 

export const INITIAL_GAME_SPEED = 15;
export const MAX_GAME_SPEED = 60; // Slightly faster top speed
export const SPEED_INCREMENT = 0.5;
export const SPAWN_DISTANCE = 90;
export const DESPAWN_DISTANCE = 15;

export const TREE_OFFSET_X = 5.0;
export const TREE_VARIANCE = 2.0;

// Collision box sizes
export const OBSTACLE_WIDTH = 1.8;
export const OBSTACLE_HEIGHT = 1.2;
export const OBSTACLE_DEPTH = 0.8; // Thinner, like a barrier

export const BALL_RADIUS = 0.4;
export const BALL_SCORE_VALUE = 10;

export const COLORS = {
  road: '#222222', // Dark asphalt
  grass: '#1a2f1a', // Dark, realistic vegetation
  sky: '#87CEEB',
  player: '#b91c1c', // Metallic crimson
  obstacle: '#787878', // Concrete grey
  treeTrunk: '#3e2723', // Dark wood
  treeLeaves: '#143d24', // Deep evergreen
  laneMarker: '#e5e5e5', // Faded white
  ball: '#ea580c', // Basketball orange
  ballLines: '#1a1a1a' // Black lines
};
