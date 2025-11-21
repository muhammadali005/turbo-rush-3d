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
    <div className="position-relative w-100 vh-100 bg-dark text-white overflow-hidden user-select-none">
      {/* 3D Canvas Layer */}
      <div className="position-absolute top-0 start-0 w-100 h-100 z-0">
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
        <div className="position-absolute top-0 start-0 p-3 z-10 d-flex flex-column align-items-start pe-none">
          <div className="card bg-dark bg-opacity-75 text-white border-0 border-start border-4 border-warning shadow hud-card backdrop-blur p-3" style={{minWidth: '180px'}}>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small fw-bold text-uppercase">Score</span>
              <span className="font-monospace fw-bold fs-4">{score}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small fw-bold text-uppercase">Balls</span>
              <span className="font-monospace fw-bold fs-4 text-warning">{balls}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-secondary small fw-bold text-uppercase">Speed</span>
              <span className="font-monospace fw-bold fs-5 text-info">{Math.floor(speed)}</span>
            </div>
          </div>

          <div className="d-flex gap-2 mt-2 pe-auto">
             <button 
              onClick={togglePause}
              className="btn btn-secondary btn-sm fw-bold d-flex align-items-center shadow-sm bg-opacity-75"
            >
              {gameState === GameState.PAUSED ? "▶ RESUME" : "⏸ PAUSE"}
            </button>
            <button 
              onClick={exitGame}
              className="btn btn-danger btn-sm fw-bold shadow-sm bg-opacity-75"
            >
              EXIT
            </button>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {gameState === GameState.START && (
        <div className="position-absolute top-0 start-0 w-100 h-100 z-20 d-flex align-items-center justify-content-center bg-dark bg-opacity-75 backdrop-blur pe-auto">
          <div className="card bg-dark text-white border-secondary shadow-lg p-4 text-center position-relative overflow-hidden" style={{maxWidth: '600px', width: '90%'}}>
            
             {/* Decorative line */}
             <div className="position-absolute top-0 start-0 w-100" style={{height: '4px', background: 'linear-gradient(90deg, transparent, #fd7e14, transparent)'}}></div>
            
            {highScore > 0 && (
              <div className="position-absolute top-0 start-50 translate-middle-x">
                <span className="badge bg-warning text-dark shadow-sm border-bottom border-light rounded-bottom-2 rounded-top-0">
                  High Score: {highScore}
                </span>
              </div>
            )}
            
            <h1 className="display-3 fw-bolder fst-italic text-gradient mt-3 mb-1">TURBO RUSH</h1>
            <p className="lead text-white-50 text-uppercase ls-1 mb-4" style={{letterSpacing: '4px'}}>Endless Horizon</p>
            
            <div className="row g-3 mb-4 text-start">
                 <div className="col-md-6">
                    <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary h-100">
                        <h6 className="text-warning fw-bold text-uppercase small mb-2">Controls</h6>
                        <div className="d-flex align-items-center gap-3 mb-2">
                            <div className="d-flex gap-1">
                                <span className="badge border border-secondary bg-secondary bg-opacity-25 rounded-1 p-2 font-monospace">A</span>
                                <span className="badge border border-secondary bg-secondary bg-opacity-25 rounded-1 p-2 font-monospace">D</span>
                            </div>
                            <small className="text-secondary">Move Left / Right</small>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span className="badge border border-secondary bg-secondary bg-opacity-25 rounded-1 px-3 py-2">Swipe</span>
                            <small className="text-secondary">Mobile</small>
                        </div>
                    </div>
                 </div>
                 <div className="col-md-6">
                    <div className="p-3 rounded bg-black bg-opacity-50 border border-secondary h-100">
                        <h6 className="text-info fw-bold text-uppercase small mb-2">Mission</h6>
                        <ul className="list-unstyled small text-light mb-0 d-flex flex-column gap-1">
                            <li><span className="text-warning me-2">●</span> Collect Balls (+10)</li>
                            <li><span className="text-danger me-2">●</span> Dodge Barriers</li>
                            <li><span className="text-primary me-2">●</span> Survive Speed</li>
                        </ul>
                    </div>
                 </div>
            </div>

            <button 
              onClick={startGame}
              className="btn btn-warning w-100 py-3 fw-bold fs-4 shadow text-uppercase btn-transform"
              style={{background: 'linear-gradient(to right, #fd7e14, #ffc107)', border: 'none'}}
            >
              Start Engine
            </button>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === GameState.PAUSED && (
        <div className="position-absolute top-0 start-0 w-100 h-100 z-20 d-flex align-items-center justify-content-center bg-black bg-opacity-50 backdrop-blur pe-auto">
           <div className="card bg-dark text-white border-secondary shadow-lg p-5 text-center" style={{minWidth: '300px'}}>
              <h2 className="display-5 fw-bold text-white mb-4" style={{letterSpacing: '4px'}}>PAUSED</h2>
              <div className="d-flex flex-col gap-3 w-100">
                <button 
                  onClick={togglePause}
                  className="btn btn-warning fw-bold py-2 w-100 mb-3"
                >
                  RESUME GAME
                </button>
                <button 
                  onClick={exitGame}
                  className="btn btn-secondary fw-bold py-2 w-100"
                >
                  EXIT TO MENU
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="position-absolute top-0 start-0 w-100 h-100 z-20 d-flex align-items-center justify-content-center bg-danger bg-opacity-75 backdrop-blur pe-auto">
          <div className="card bg-dark text-white border-danger shadow-lg p-4 text-center animate-bounce-slow" style={{maxWidth: '400px', width: '90%'}}>
            <h2 className="display-4 fw-bold text-danger mb-3">CRASHED!</h2>
            
            <div className="my-4 bg-black bg-opacity-50 p-3 rounded border border-dark">
              <div className="display-1 font-monospace fw-bold text-white mb-1">{score}</div>
              <p className="text-secondary small text-uppercase fw-bold mb-3" style={{letterSpacing: '2px'}}>Final Score</p>
              
              <div className="d-flex justify-content-center gap-2">
                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 p-2">
                   <span className="me-1 fs-6">🏀</span> {balls} Balls
                </span>
                {score >= highScore && score > 0 && (
                   <span className="badge bg-warning text-dark p-2">
                     <span className="me-1 fs-6">🏆</span> New Best!
                   </span>
                )}
              </div>
            </div>

            <div className="d-grid gap-2">
              <button 
                onClick={startGame}
                className="btn btn-light fw-bold py-3 fs-5"
              >
                PLAY AGAIN
              </button>
              <button 
                onClick={exitGame}
                className="btn btn-outline-danger fw-bold py-3"
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