
import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import { GameState, GameObject, Lane } from '../types';
import { 
  LANE_WIDTH, 
  SPAWN_DISTANCE, 
  DESPAWN_DISTANCE,
  COLORS,
  OBSTACLE_WIDTH,
  TREE_OFFSET_X,
  TREE_VARIANCE,
  BALL_RADIUS
} from '../constants';

interface ObstaclesProps {
  speed: number;
  gameState: GameState;
  playerLane: Lane;
  onCollision: () => void;
  onCollect: (id: string, position: [number, number, number]) => void;
}

export const Obstacles: React.FC<ObstaclesProps> = ({ speed, gameState, playerLane, onCollision, onCollect }) => {
  const [objects, setObjects] = useState<GameObject[]>([]);
  const timeSinceLastSpawn = useRef(0);

  useEffect(() => {
    if (gameState === GameState.START) {
      setObjects([]);
      timeSinceLastSpawn.current = 0;
    }
  }, [gameState]);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Update Positions
    setObjects(prev => {
      const next = prev
        .map(obj => ({ ...obj, z: obj.z + speed * delta })) 
        .filter(obj => obj.z < DESPAWN_DISTANCE); 
      return next;
    });

    // Collision Detection
    objects.forEach(obj => {
      // Check Z overlap (Collision box depth approx)
      const zCollision = obj.z > -1.0 && obj.z < 1.0;
      
      if (zCollision && obj.lane === playerLane) {
        if (obj.type === 'obstacle') {
           onCollision();
        } else if (obj.type === 'ball') {
           // Collect ball - pass position for VFX
           onCollect(obj.id, [obj.lane * LANE_WIDTH, 1, obj.z]);
           // Remove immediately from scene to prevent double collection
           setObjects(prev => prev.filter(o => o.id !== obj.id));
        }
      }
    });

    // Spawning Logic
    timeSinceLastSpawn.current += delta;
    
    // Spawn frequeny based on distance. 
    // We want a row roughly every 12 units of distance.
    // Time = Distance / Speed.
    const spawnInterval = 12 / Math.max(speed, 10);

    if (timeSinceLastSpawn.current > spawnInterval) {
      spawnBatch();
      timeSinceLastSpawn.current = 0;
    }
  });

  const spawnBatch = () => {
    const newObjects: GameObject[] = [];
    const zPos = -SPAWN_DISTANCE;

    // Available lanes
    const lanes = [Lane.LEFT, Lane.CENTER, Lane.RIGHT];
    
    // Shuffle lanes to randomize which ones get filled
    const shuffledLanes = lanes.sort(() => 0.5 - Math.random());

    // Determine how many items to spawn (1 or 2)
    // 70% chance for 1 item, 30% chance for 2 items.
    // Never spawn 3 items (impossible to pass).
    const spawnCount = Math.random() < 0.3 ? 2 : 1;

    // 10% chance to spawn NOTHING on the road (just trees) for a breather
    const isBreather = Math.random() < 0.1;

    if (!isBreather) {
      for (let i = 0; i < spawnCount; i++) {
        const lane = shuffledLanes[i];
        
        // Decide Type: 50% Obstacle, 50% Ball
        const isBall = Math.random() < 0.5;

        if (isBall) {
          newObjects.push({
            id: uuidv4(),
            type: 'ball',
            lane: lane,
            z: zPos,
            width: BALL_RADIUS * 2,
            height: BALL_RADIUS * 2,
            color: COLORS.ball
          });
        } else {
          newObjects.push({
            id: uuidv4(),
            type: 'obstacle',
            lane: lane,
            z: zPos,
            width: OBSTACLE_WIDTH,
            height: 1.0,
            color: COLORS.obstacle
          });
        }
      }
    }

    // Always Spawn Trees on the sides for visuals
    const spawnTree = (laneMultiplier: number) => {
      const isLeft = laneMultiplier < 0;
      const xBase = isLeft ? -TREE_OFFSET_X : TREE_OFFSET_X;
      
      return {
        id: uuidv4(),
        type: 'tree' as const,
        lane: isLeft ? -2 : 2,
        z: zPos + (Math.random() * 5), // Randomize Z slightly so they aren't perfect rows
        width: 1,
        height: 4 + Math.random() * 3, // Taller trees
        color: COLORS.treeLeaves
      };
    };

    newObjects.push(spawnTree(-1));
    newObjects.push(spawnTree(1));

    setObjects(prev => [...prev, ...newObjects]);
  };

  return (
    <group>
      {objects.map(obj => {
        if (obj.type === 'obstacle') {
          return (
            <ObstacleMesh 
              key={obj.id} 
              x={obj.lane * LANE_WIDTH} 
              z={obj.z} 
              color={obj.color} 
            />
          );
        } else if (obj.type === 'ball') {
           return (
             <BallMesh
                key={obj.id}
                x={obj.lane * LANE_WIDTH}
                z={obj.z}
                gameState={gameState}
             />
           );
        } else {
          const isLeft = obj.lane < 0;
          const xBase = isLeft ? -TREE_OFFSET_X : TREE_OFFSET_X;
          // Deterministic pseudo-random X for stability
          const xVar = (obj.id.charCodeAt(0) % 10) / 10 * TREE_VARIANCE; 
          const finalX = xBase + (isLeft ? -xVar : xVar);

          return (
            <TreeMesh 
              key={obj.id}
              x={finalX}
              z={obj.z}
              height={obj.height}
            />
          );
        }
      })}
    </group>
  );
};

// Realistic Concrete Jersey Barrier
const ObstacleMesh: React.FC<{ x: number, z: number, color: string }> = ({ x, z, color }) => {
  return (
    <group position={[x, 0, z]}>
      {/* Base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[OBSTACLE_WIDTH, 0.6, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Top narrow part */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[OBSTACLE_WIDTH * 0.4, 0.6, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Stripes for visibility */}
      <mesh position={[0, 0.5, 0.41]} rotation={[0, 0, -Math.PI/4]}>
         <planeGeometry args={[0.2, 0.8]} />
         <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0.4, 0.5, 0.41]} rotation={[0, 0, -Math.PI/4]}>
         <planeGeometry args={[0.2, 0.8]} />
         <meshStandardMaterial color="#fbbf24" />
      </mesh>
       <mesh position={[-0.4, 0.5, 0.41]} rotation={[0, 0, -Math.PI/4]}>
         <planeGeometry args={[0.2, 0.8]} />
         <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
};

// Basketball Mesh
const BallMesh: React.FC<{ x: number, z: number, gameState: GameState }> = ({ x, z, gameState }) => {
  const ballRef = useRef<any>(null);
  
  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;
    if (ballRef.current) {
      // Spin the ball
      ballRef.current.rotation.x += delta * 5;
      ballRef.current.rotation.y += delta * 2;
      // Bobbing animation
      ballRef.current.position.y = BALL_RADIUS + 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group ref={ballRef} position={[x, BALL_RADIUS, z]}>
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial color={COLORS.ball} roughness={0.4} />
      </mesh>
      {/* Decorative Lines (Torus) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BALL_RADIUS, 0.02, 16, 32]} />
        <meshBasicMaterial color={COLORS.ballLines} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[BALL_RADIUS, 0.02, 16, 32]} />
        <meshBasicMaterial color={COLORS.ballLines} />
      </mesh>
    </group>
  );
};

// Realistic Pine Tree
const TreeMesh: React.FC<{ x: number, z: number, height: number }> = ({ x, z, height }) => {
  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 8]} />
        <meshStandardMaterial color={COLORS.treeTrunk} roughness={1} />
      </mesh>
      {/* Tiered Leaves */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[1.8, 1.5, 8]} />
        <meshStandardMaterial color={COLORS.treeLeaves} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow>
        <coneGeometry args={[1.4, 1.5, 8]} />
        <meshStandardMaterial color={COLORS.treeLeaves} roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[1.0, 1.5, 8]} />
        <meshStandardMaterial color={COLORS.treeLeaves} roughness={0.8} />
      </mesh>
    </group>
  );
};
