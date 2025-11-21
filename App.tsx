
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { GameState } from './types';
import { INITIAL_GAME_SPEED } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_GAME_SPEED);
  const [highScore, setHighScore] = useState(0);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('turboRushHighScore');
    if (stored) {
      setHighScore(parseInt(stored, 10));
    }
  }, []);

  // Initialize Audio Context on first user interaction
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (type: 'collect' | 'crash') => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'collect') {
      // High pitch pleasant beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'crash') {
      // Low pitch crash noise
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  };

  const startGame = () => {
    initAudio();
    setGameState(GameState.PLAYING);
    setScore(0);
    setBalls(0);
    setSpeed(INITIAL_GAME_SPEED);
  };

  const togglePause = () => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  };

  const exitGame = () => {
    setGameState(GameState.START);
    setScore(0);
    setBalls(0);
  };

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState(GameState.GAME_OVER);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('turboRushHighScore', finalScore.toString());
    }
  }, [highScore]);

  // Keyboard listeners for Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
          togglePause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="relative w-full h-screen bg-gray-900 text-white font-sans overflow-hidden select-none">
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 3, 6], fov: 50 }}>
          <GameScene 
            gameState={gameState} 
            onGameOver={handleGameOver} 
            setScore={setScore}
            setBalls={setBalls}
            speed={speed}
            setSpeed={setSpeed}
            playSound={playSound}
          />
        </Canvas>
      </div>

      {/* HUD Layer - Top Left during gameplay */}
      {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
        <div className="absolute top-0 left-0 p-4 z-10 flex flex-col items-start space-y-2 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-sm p-4 rounded-lg border-l-4 border-orange-500 shadow-lg min-w-[180px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300 text-sm uppercase font-bold">Score</span>
              <span className="text-2xl font-mono font-bold text-white">{score}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300 text-sm uppercase font-bold">Balls</span>
              <span className="text-2xl font-mono font-bold text-orange-400">{balls}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm uppercase font-bold">Speed</span>
              <span className="text-xl font-mono font-bold text-blue-400">{Math.floor(speed)}</span>
            </div>
          </div>

          <div className="flex space-x-2 pointer-events-auto">
             <button 
              onClick={togglePause}
              className="mt-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-white text-xs font-bold rounded border border-gray-500/30 transition flex items-center"
            >
              {gameState === GameState.PAUSED ? "▶ RESUME" : "⏸ PAUSE"}
            </button>
            <button 
              onClick={exitGame}
              className="mt-2 px-4 py-2 bg-red-900/80 hover:bg-red-800 text-white text-xs font-bold rounded border border-red-500/30 transition"
            >
              EXIT
            </button>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
          <div className="text-center max-w-lg p-8 border border-white/20 rounded-2xl bg-gray-800/50 shadow-2xl relative overflow-hidden">
            
             {/* Decorative background elements */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
            
            {highScore > 0 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-bold px-6 py-1 rounded-b-lg shadow-lg border-x border-b border-white/50 z-10">
                High Score: {highScore}
              </div>
            )}
            
            <h1 className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-1 mt-4 drop-shadow-sm transform -skew-x-12">
              TURBO RUSH
            </h1>
            <h2 className="text-2xl font-light tracking-widest text-white/80 mb-8 uppercase">Endless Horizon</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-left">
                    <h3 className="text-orange-400 font-bold mb-2 uppercase text-xs tracking-wider">Controls</h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex space-x-1">
                            <div className="w-8 h-8 border border-gray-500 rounded flex items-center justify-center bg-gray-700 text-xs">A</div>
                            <div className="w-8 h-8 border border-gray-500 rounded flex items-center justify-center bg-gray-700 text-xs">D</div>
                        </div>
                        <span className="text-gray-400 text-xs">Move Left / Right</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                        <div className="w-16 h-8 border border-gray-500 rounded flex items-center justify-center bg-gray-700 text-xs">Swipe</div>
                        <span className="text-gray-400 text-xs">Mobile</span>
                    </div>
                 </div>
                 <div className="bg-black/40 p-4 rounded-lg border border-white/10 text-left">
                    <h3 className="text-blue-400 font-bold mb-2 uppercase text-xs tracking-wider">Mission</h3>
                    <ul className="text-sm space-y-1 text-gray-300">
                        <li className="flex items-center"><span className="text-orange-500 mr-2">●</span> Collect Balls (+10)</li>
                        <li className="flex items-center"><span className="text-red-500 mr-2">●</span> Dodge Barriers</li>
                        <li className="flex items-center"><span className="text-blue-500 mr-2">●</span> Survive Speed</li>
                    </ul>
                 </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold rounded-lg text-2xl shadow-lg shadow-orange-900/50 transform transition hover:scale-[1.02] active:scale-[0.98]"
            >
              START ENGINE
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
           <div className="text-center p-8 bg-gray-900/90 border border-white/20 rounded-xl shadow-2xl">
              <h2 className="text-4xl font-bold text-white mb-8 tracking-widest">PAUSED</h2>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={togglePause}
                  className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow"
                >
                  RESUME GAME
                </button>
                <button 
                  onClick={exitGame}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded shadow"
                >
                  EXIT TO MENU
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-red-900/80 backdrop-blur-md pointer-events-auto">
          <div className="text-center p-8 rounded-2xl border border-red-500/30 bg-black/60 shadow-2xl animate-bounce-slow max-w-md w-full">
            <h2 className="text-5xl font-bold text-red-500 mb-2">CRASHED!</h2>
            
            <div className="my-6 bg-black/40 p-4 rounded-lg">
              <div className="text-6xl font-mono font-bold text-white mb-2">{score}</div>
              <p className="text-gray-400 uppercase tracking-widest text-xs mb-4">Final Score</p>
              
              <div className="flex justify-center space-x-4 text-sm">
                <div className="bg-orange-900/50 px-3 py-1 rounded text-orange-200 flex items-center">
                   <span className="mr-2 text-lg">🏀</span> {balls} Balls
                </div>
                {score >= highScore && score > 0 && (
                   <div className="bg-yellow-900/50 px-3 py-1 rounded text-yellow-200 flex items-center">
                     <span className="mr-2 text-lg">🏆</span> New Best!
                   </div>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button 
                onClick={startGame}
                className="w-full px-8 py-3 bg-white text-red-900 font-bold rounded-lg text-lg shadow-lg hover:bg-gray-200 transition transform hover:-translate-y-1"
              >
                PLAY AGAIN
              </button>
              <button 
                onClick={exitGame}
                className="w-full px-8 py-3 bg-red-950/50 border border-red-500/50 text-red-300 font-bold rounded-lg text-lg hover:bg-red-900/50 transition"
              >
                EXIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
