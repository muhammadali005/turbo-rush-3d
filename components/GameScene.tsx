
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerCar } from './PlayerCar';
import { Road } from './Road';
import { Obstacles } from './Obstacles';
import { SpeedLines, FloatingScore } from './VFX';
import { GameState, Lane } from '../types';
import { 
  MAX_GAME_SPEED, 
  SPEED_INCREMENT,
  BALL_SCORE_VALUE,
  INITIAL_GAME_SPEED
} from '../constants';

interface GameSceneProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setBalls: React.Dispatch<React.SetStateAction<number>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  playSound: (type: 'collect' | 'crash') => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  gameState, 
  onGameOver, 
  setScore,
  setBalls,
  speed,
  setSpeed,
  playSound
}) => {
  const [playerLane, setPlayerLane] = useState<Lane>(Lane.CENTER);
  const scoreRef = useRef(0);
  
  // Store active floating texts { id, position }
  const [floatingTexts, setFloatingTexts] = useState<{id: string, pos: [number, number, number]}[]>([]);

  // Reset logic
  useEffect(() => {
    if (gameState === GameState.PLAYING && speed === INITIAL_GAME_SPEED) {
      setPlayerLane(Lane.CENTER);
      scoreRef.current = 0;
      setFloatingTexts([]);
    }
  }, [gameState, speed]);

  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Dynamic Camera Field of View based on speed
    // Base FOV is 50, max adds 20
    const targetFov = 50 + (speed / MAX_GAME_SPEED) * 20;
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, delta * 2);
    state.camera.updateProjectionMatrix();

    // Camera shake adds subtle vibration at high speeds
    if (speed > 30) {
        const shake = (speed - 30) * 0.0005;
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (Math.random() - 0.5) * shake, 0.5);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 3 + (Math.random() - 0.5) * shake, 0.5);
    } else {
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.1);
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 3, 0.1);
    }

    // Speed increases gradually over time regardless of score
    if (speed < MAX_GAME_SPEED) {
      setSpeed((prev) => Math.min(prev + (SPEED_INCREMENT * delta), MAX_GAME_SPEED));
    }
  });

  const handleCollision = () => {
    if (gameState === GameState.PLAYING) {
      playSound('crash');
      onGameOver(scoreRef.current);
    }
  };

  const handleCollect = (id: string, position: [number, number, number]) => {
    if (gameState === GameState.PLAYING) {
      playSound('collect');
      const points = BALL_SCORE_VALUE;
      scoreRef.current += points;
      setScore((prev) => prev + points);
      setBalls((prev) => prev + 1);

      // Add floating text effect
      setFloatingTexts(prev => [...prev, { id, pos: position }]);
    }
  };

  const removeFloatingText = (id: string) => {
    setFloatingTexts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      {/* Lighting & Environment */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 20, 5]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      <Environment preset="city" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <fog attach="fog" args={['#1a202c', 10, 60]} />

      {/* Visual Effects */}
      <SpeedLines speed={speed} gameState={gameState} />
      
      {floatingTexts.map(ft => (
        <FloatingScore 
            key={ft.id} 
            position={ft.pos} 
            gameState={gameState}
            onComplete={() => removeFloatingText(ft.id)} 
        />
      ))}

      {/* Game Objects */}
      <PlayerCar 
        gameState={gameState} 
        targetLane={playerLane} 
        setLane={setPlayerLane} 
      />
      
      <Road speed={speed} gameState={gameState} />
      
      <Obstacles 
        speed={speed} 
        gameState={gameState} 
        playerLane={playerLane}
        onCollision={handleCollision}
        onCollect={handleCollect}
      />
    </>
  );
};
