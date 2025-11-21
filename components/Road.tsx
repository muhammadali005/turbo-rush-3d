
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { GameState } from '../types';
import { LANE_WIDTH, COLORS } from '../constants';

interface RoadProps {
  speed: number;
  gameState: GameState;
}

const ROAD_LENGTH = 20;
const NUM_SEGMENTS = 8;

export const Road: React.FC<RoadProps> = ({ speed, gameState }) => {
  const groupRef = useRef<Group>(null);
  
  const segments = useMemo(() => {
    return Array.from({ length: NUM_SEGMENTS }).map((_, i) => ({
      id: i,
      initialZ: -i * ROAD_LENGTH,
    }));
  }, []);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;
    
    if (groupRef.current) {
      groupRef.current.position.z += speed * delta;
      if (groupRef.current.position.z >= ROAD_LENGTH) {
        groupRef.current.position.z -= ROAD_LENGTH;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {segments.map((segment) => (
        <RoadSegment key={segment.id} z={segment.initialZ} />
      ))}
    </group>
  );
};

const RoadSegment: React.FC<{ z: number }> = ({ z }) => {
  return (
    <group position={[0, 0, z]}>
      {/* Main Asphalt Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LANE_WIDTH * 3 + 1, ROAD_LENGTH]} />
        <meshStandardMaterial color={COLORS.road} roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Left Terrain */}
      <mesh position={[-10, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, ROAD_LENGTH]} />
        <meshStandardMaterial color={COLORS.grass} roughness={1} />
      </mesh>

      {/* Right Terrain */}
      <mesh position={[10, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15, ROAD_LENGTH]} />
        <meshStandardMaterial color={COLORS.grass} roughness={1} />
      </mesh>

      {/* Shoulders (Gravel/Dirt) */}
      <mesh position={[-((LANE_WIDTH * 1.5) + 0.5), 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, ROAD_LENGTH]} />
        <meshStandardMaterial color="#44403c" roughness={1} />
      </mesh>
      <mesh position={[(LANE_WIDTH * 1.5) + 0.5, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, ROAD_LENGTH]} />
        <meshStandardMaterial color="#44403c" roughness={1} />
      </mesh>

      {/* Lane Markers */}
      {/* Left Solid Line (White) */}
      <mesh position={[-LANE_WIDTH / 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, ROAD_LENGTH]} />
        <meshStandardMaterial color={COLORS.laneMarker} roughness={0.5} />
      </mesh>

      {/* Right Solid Line (White) */}
      <mesh position={[LANE_WIDTH / 2, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.1, ROAD_LENGTH]} />
        <meshStandardMaterial color={COLORS.laneMarker} roughness={0.5} />
      </mesh>
    </group>
  );
};
