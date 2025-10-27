import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Html, useProgress } from '@react-three/drei';
import TilesGroup from './TilesGroup';

function Loader({ onLoaded }: { onLoaded: () => void }) {
  const { active, progress } = useProgress();
  
  useEffect(() => {
    if (progress === 100 || (!active && progress === 0)) {
      const timer = setTimeout(() => {
        onLoaded();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [active, progress, onLoaded]);
  
  return (
    <Html center>
      <div style={{ 
        color: 'white', 
        fontSize: '24px',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px 40px',
        borderRadius: '8px'
      }}>
        Loading {Math.round(progress)}%
      </div>
    </Html>
  );
}

function SceneContent({ onReady }: { onReady: () => void }) {
  const readyCalled = useRef(false);
  const { gl } = useThree();
  
  useEffect(() => {
    if (!readyCalled.current) {
      readyCalled.current = true;
      const timer = setTimeout(() => {
        onReady();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [onReady, gl]);
  
  return (
    <>
      <ambientLight intensity={2.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <TilesGroup rows={9} tilesPerRow={15} verticalSpacing={0.565} horizontalOffset={0.325} />
      <Environment preset="city" />
    </>
  );
}

function HexTileWallpaper() {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleReady = () => {
    setIsLoaded(true);
  };

  const containerStyle = isLoaded 
    ? { width: '100%', height: '100%' }
    : { width: '100%', height: '100%', background: 'transparent' };

  return (
    <div 
      className={isLoaded ? "tiles-container" : ""} 
      style={containerStyle}
    >
      <Canvas camera={{ position: [0, 0, 10], zoom: 4.5 }}>
        <Suspense fallback={<Loader onLoaded={handleReady} />}>
          <SceneContent onReady={handleReady} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HexTileWallpaper;
