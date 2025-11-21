
import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { Text } from '@react-three/drei';
import { GameState } from '../types';
import { COLORS } from '../constants';

// --- Speed Lines Effect ---
interface SpeedLinesProps {
  speed: number;
  gameState: GameState;
}

const LINE_COUNT = 50;

export const SpeedLines: React.FC<SpeedLinesProps> = ({ speed, gameState }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Store random initial positions
  const lines = useMemo(() => {
    return new Array(LINE_COUNT).fill(0).map(() => ({
      x: (Math.random() - 0.5) * 30,
      y: Math.random() * 10 + 2,
      z: (Math.random() - 0.5) * 40,
      len: Math.random() * 5 + 2,
      speedOffset: Math.random() * 0.5 + 0.5
    }));
  }, []);

  useLayoutEffect(() => {
    if (meshRef.current) {
      lines.forEach((line, i) => {
        dummy.position.set(line.x, line.y, line.z);
        dummy.scale.set(1, 1, line.len);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy, lines]);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING || !meshRef.current) return;

    // Opacity based on speed (only show when going fast)
    const opacity = Math.max(0, (speed - 20) / 40);
    if (opacity <= 0) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    (meshRef.current.material as any).opacity = opacity * 0.3;

    lines.forEach((line, i) => {
      // Move lines towards camera (positive Z) to simulate moving forward
      line.z += (speed * line.speedOffset + 10) * delta;

      if (line.z > 10) {
        line.z = -50; // Reset far back
        line.x = (Math.random() - 0.5) * 30; // New random X
      }

      dummy.position.set(line.x, line.y, line.z);
      dummy.scale.set(0.05, 0.05, line.len);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, LINE_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="white" transparent opacity={0.0} depthWrite={false} />
    </instancedMesh>
  );
};

// --- Floating Score Text ---
interface FloatingScoreProps {
  position: [number, number, number];
  onComplete: () => void;
  gameState: GameState;
}

export const FloatingScore: React.FC<FloatingScoreProps> = ({ position, onComplete, gameState }) => {
  const groupRef = useRef<any>(null);
  const lifeTime = useRef(0);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) return;
    if (gameState === GameState.PAUSED) return;

    if (groupRef.current) {
      lifeTime.current += delta;
      
      // Float up
      groupRef.current.position.y += delta * 2;
      // Scale up then disappear
      const scale = 1 + Math.sin(lifeTime.current * 10) * 0.2;
      groupRef.current.scale.setScalar(scale);
      // Fade logic would require material access, handled by unmounting logic mostly
      
      if (lifeTime.current > 1.0) {
        onComplete();
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Text
        color={COLORS.ball}
        fontSize={1.5}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        +10
      </Text>
    </group>
  );
};
