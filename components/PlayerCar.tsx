
import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { GameState, Lane } from '../types';
import { 
  LANE_WIDTH, 
  PLAYER_SPEED_LATERAL, 
  COLORS,
  PLAYER_WIDTH,
  PLAYER_LENGTH,
  PLAYER_Y
} from '../constants';

interface PlayerCarProps {
  gameState: GameState;
  targetLane: Lane;
  setLane: (lane: Lane) => void;
}

export const PlayerCar: React.FC<PlayerCarProps> = ({ gameState, targetLane, setLane }) => {
  const groupRef = useRef<Group>(null);
  const currentX = useRef(0);
  const targetX = useRef(0);
  
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    targetX.current = targetLane * LANE_WIDTH;
  }, [targetLane]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setLane(Math.max(targetLane - 1, Lane.LEFT));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setLane(Math.min(targetLane + 1, Lane.RIGHT));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, targetLane, setLane]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || gameState !== GameState.PLAYING) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) setLane(Math.max(targetLane - 1, Lane.LEFT));
        else setLane(Math.min(targetLane + 1, Lane.RIGHT));
      }
      touchStartX.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, targetLane, setLane]);

  useFrame((state, delta) => {
    // Always interpolate position for smooth transitions, but stop lane changes if paused
    // Actually for pause to be true pause, we should stop updates
    if (gameState === GameState.PAUSED) return;

    if (!groupRef.current) return;

    const xDiff = targetX.current - currentX.current;
    const moveAmount = PLAYER_SPEED_LATERAL * delta;

    if (Math.abs(xDiff) < moveAmount) {
      currentX.current = targetX.current;
    } else {
      currentX.current += Math.sign(xDiff) * moveAmount;
    }

    // Physics simulation for realism
    groupRef.current.position.x = currentX.current;
    
    if (gameState === GameState.PLAYING) {
        // Suspension vibration
        const engineVibration = Math.sin(state.clock.elapsedTime * 40) * 0.002;
        const roadBump = Math.sin(state.clock.elapsedTime * 15) * 0.005;
        groupRef.current.position.y = PLAYER_Y + engineVibration + roadBump;
        
        // Realistic chassis roll when turning
        const rollAmount = -xDiff * 0.08; 
        groupRef.current.rotation.z = rollAmount;
        
        // Pitch when accelerating (simulated)
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 5) * 0.002;
    }
  });

  const chassisColor = COLORS.player;
  const glassColor = "#111827";

  return (
    <group ref={groupRef} position={[0, PLAYER_Y, 0]}>
      {/* Main Chassis Body */}
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[PLAYER_WIDTH, 0.4, PLAYER_LENGTH]} />
        <meshStandardMaterial 
          color={chassisColor} 
          metalness={0.7} 
          roughness={0.2}
          envMapIntensity={1.5} 
        />
      </mesh>

      {/* Side Skirts / Wide Body Kit */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[PLAYER_WIDTH + 0.1, 0.15, PLAYER_LENGTH - 0.4]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Cabin / Cockpit */}
      <mesh castShadow position={[0, 0.55, -0.3]}>
        {/* Tapered top approximation */}
        <boxGeometry args={[PLAYER_WIDTH * 0.75, 0.35, PLAYER_LENGTH * 0.45]} />
        <meshStandardMaterial 
          color={glassColor} 
          metalness={0.9} 
          roughness={0.1} 
          envMapIntensity={2}
        />
      </mesh>

      {/* Hood Scoop */}
      <mesh castShadow position={[0, 0.46, 0.6]}>
        <boxGeometry args={[PLAYER_WIDTH * 0.5, 0.05, 0.8]} />
        <meshStandardMaterial color={chassisColor} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Rear Spoiler */}
      <group position={[0, 0.6, 0.95]}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <boxGeometry args={[PLAYER_WIDTH + 0.2, 0.05, 0.3]} />
          <meshStandardMaterial color={chassisColor} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.4, -0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.1]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.4, -0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.1]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>

      {/* Wheels */}
      <Wheel position={[-0.55, 0, 0.7]} gameState={gameState} />
      <Wheel position={[0.55, 0, 0.7]} gameState={gameState} />
      <Wheel position={[-0.6, 0, -0.7]} gameState={gameState} />
      <Wheel position={[0.6, 0, -0.7]} gameState={gameState} />

      {/* Headlights */}
      <mesh position={[-0.35, 0.35, -1.21]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#e0f2fe" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0.35, 0.35, -1.21]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#e0f2fe" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      
      {/* Taillights */}
      <mesh position={[-0.35, 0.35, 1.21]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#991b1b" emissive="#ff0000" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh position={[0.35, 0.35, 1.21]}>
        <boxGeometry args={[0.25, 0.1, 0.05]} />
        <meshStandardMaterial color="#991b1b" emissive="#ff0000" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      {/* Headlight Beams */}
       {gameState === GameState.PLAYING && (
         <group>
          <spotLight 
            position={[-0.35, 0.35, -1]} 
            target-position={[-0.35, 0, -15]} 
            angle={0.6} 
            penumbra={0.4} 
            intensity={5} 
            distance={30} 
            color="#fff" 
          />
          <spotLight 
            position={[0.35, 0.35, -1]} 
            target-position={[0.35, 0, -15]} 
            angle={0.6} 
            penumbra={0.4} 
            intensity={5} 
            distance={30} 
            color="#fff" 
          />
         </group>
       )}
    </group>
  );
};

const Wheel: React.FC<{ position: [number, number, number], gameState: GameState }> = ({ position, gameState }) => {
    const wheelRef = useRef<Group>(null);
    
    useFrame((state, delta) => {
       if (gameState === GameState.PAUSED) return;
       if (wheelRef.current) {
         // Rotate based on speed approximation
         wheelRef.current.rotation.x += delta * 15; 
       }
    });

    return (
      <group ref={wheelRef} position={position}>
        {/* Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.25, 24]} />
          <meshStandardMaterial color="#1c1c1c" roughness={0.9} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
             <cylinderGeometry args={[0.2, 0.2, 0.26, 12]} />
             <meshStandardMaterial color="#d1d5db" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Hub cap detail */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
             <cylinderGeometry args={[0.08, 0.08, 0.28, 6]} />
             <meshStandardMaterial color="#4b5563" metalness={0.5} />
        </mesh>
      </group>
    )
}
