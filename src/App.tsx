import { useState } from 'react'
import { Canvas } from '@react-three/fiber';
import './App.css'
import WallC from './components/WallC';
import WallB from './components/WallB';
import WallA from './components/WallA';
import HexTile from './components/TilesGroup/HexTile';
import { Environment, OrbitControls } from '@react-three/drei';
import TilesGroup from './components/TilesGroup';
// import { BackdropImage } from './components/BackdropImage';

function App() {
  const [activeWall, setActiveWall] = useState('A')

  const renderNoise = () => {
    switch (activeWall) {
      case 'A':
        return <WallA />
      case 'B':
        return <WallB />
      // Add more cases here as you create more Noise components
      case 'C':
        return <WallC />
      case 'HexTile':
        return <HexTile />
      default:
        return <WallC />
    }
  }

  return (
    <>
      <div className="app-container">
        <div className="buttons-container">
          <button className="button"  onClick={() => setActiveWall('A')} style={{ cursor: 'pointer', border: activeWall === 'A' ? '1px solid white' : '1px solid transparent' }}>
            Wallpaper A
          </button>
          <button className="button"  onClick={() => setActiveWall('B')} style={{ cursor: 'pointer', border: activeWall === 'B' ? '1px solid white' : '1px solid transparent' }}>
            Wallpaper B
          </button>
          <button className="button"  onClick={() => setActiveWall('C')} style={{ cursor: 'pointer', border: activeWall === 'C' ? '1px solid white' : '1px solid transparent' }}>
            Wallpaper C
          </button>
          <button className="button"  onClick={() => setActiveWall('HexTile')} style={{ cursor: 'pointer', border: activeWall === 'HexTile' ? '1px solid white' : '1px solid transparent' }}>
            Hex Tile
          </button>
        </div>
        
        <div className="instructions">
          Use mouse interactions for effects
        </div>
        {activeWall !== 'HexTile' && 
          <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 20, far: 6 }}>
            {/* Camera will automatically look at the center [0,0,0] when using Canvas camera prop */}
            {/* <Snowflake scale={0.25} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} /> */}
            {renderNoise()}
            <ambientLight intensity={0.5} />
            {/* <OrbitControls enableZoom={true} /> */}
          </Canvas>}
          {
            activeWall === 'HexTile' && 
            <div className="tiles-container">
              <Canvas 
                camera={{ position: [0, 0, 10],
                zoom: 4.5
              }}>
                {/* <color attach="background" args={['#1D1F21']} /> */}
                <ambientLight intensity={2.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <TilesGroup rows={9} tilesPerRow={15} verticalSpacing={0.565} horizontalOffset={0.325} />
                {/* <OrbitControls enableZoom={true} /> */}
                <Environment preset="city" />
              </Canvas>
            </div>
            }
          
      </div>
    </>
  )
}

export default App
