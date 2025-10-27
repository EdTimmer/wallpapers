import { useState } from 'react'
import { Canvas } from '@react-three/fiber';
import './App.css'
import WallC from './components/WallC';
import WallB from './components/WallB';
import WallA from './components/WallA';
import HexTile from './components/TilesGroup/HexTile';
import HexTileWallpaper from './components/HexTileWallpaper';
// import { BackdropImage } from './components/BackdropImage';

function App() {
  const [activeWall, setActiveWall] = useState('A')
  const [hexTileKey, setHexTileKey] = useState(0)

  const handleWallChange = (wall: string) => {
    if (wall === 'HexTile') {
      // Increment key to force remount
      setHexTileKey(prev => prev + 1);
    }
    setActiveWall(wall);
  }

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
          <button className="button"  onClick={() => handleWallChange('A')} style={{ cursor: 'pointer', border: activeWall === 'A' ? '1px solid white' : '1px solid transparent' }}>
            Wallpaper A
          </button>
          <button className="button"  onClick={() => handleWallChange('B')} style={{ cursor: 'pointer', border: activeWall === 'B' ? '1px solid white' : '1px solid transparent' }}>
            Wallpaper B
          </button>
          <button className="button"  onClick={() => handleWallChange('C')} style={{ cursor: 'pointer', border: activeWall === 'C' ? '1px solid white' : '1px solid transparent' }}>
            Wallpaper C
          </button>
          <button className="button"  onClick={() => handleWallChange('HexTile')} style={{ cursor: 'pointer', border: activeWall === 'HexTile' ? '1px solid white' : '1px solid transparent' }}>
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
          {activeWall === 'HexTile' && <HexTileWallpaper key={hexTileKey} />}          
      </div>
    </>
  )
}

export default App
