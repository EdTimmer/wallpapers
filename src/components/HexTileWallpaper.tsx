import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Html, useProgress } from '@react-three/drei';
import TilesGroup from './TilesGroup';

function Loader({ onLoaded }: { onLoaded: () => void }) {
  const { active, progress } = useProgress();
  const loadedCalledRef = useRef(false);
  
  useEffect(() => {
    // Call onLoaded when progress reaches 100 or when loading completes
    if (!loadedCalledRef.current && (progress === 100 || (!active && progress > 0))) {
      loadedCalledRef.current = true;
      onLoaded();
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
  
  useEffect(() => {
    if (!readyCalled.current) {
      readyCalled.current = true;
      // Small delay to ensure everything is rendered
      const timer = setTimeout(() => {
        onReady();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onReady]);
  
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

  const handleLoaded = () => {
    setIsLoaded(true);
  };

  return (
    <div 
      className={isLoaded ? "tiles-container" : ""}
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas camera={{ position: [0, 0, 10], zoom: 4.5 }}>
        <Suspense fallback={<Loader onLoaded={handleLoaded} />}>
          <SceneContent onReady={handleLoaded} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HexTileWallpaper;
