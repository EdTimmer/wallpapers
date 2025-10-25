import { useState } from 'react'
import { Canvas } from '@react-three/fiber';
import './App.css'
import NoiseA from './components/NoiseA';
import NoiseB from './components/NoiseB';
import CellsA from './components/CellsA';

function App() {
  const [activeNoise, setActiveNoise] = useState('A')

  const renderNoise = () => {
    switch (activeNoise) {
      case 'A':
        return <NoiseA />
      case 'B':
        return <NoiseB />
      // Add more cases here as you create more Noise components
      // case 'C':
      //   return <NoiseC />
      default:
        return <CellsA />
    }
  }

  return (
    <>
      <div className="app-container">
        <div className="wallpaper-a" onClick={() => setActiveNoise('A')} style={{ cursor: 'pointer' }}>A</div>
        <div className="wallpaper-b" onClick={() => setActiveNoise('B')} style={{ cursor: 'pointer' }}>B</div>
        <div className="wallpaper-c" onClick={() => setActiveNoise('C')} style={{ cursor: 'pointer' }}>C</div>
        <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 20, far: 6 }}>
            {/* Camera will automatically look at the center [0,0,0] when using Canvas camera prop */}
            {/* <Snowflake scale={0.25} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} /> */}
            {renderNoise()}
            <ambientLight intensity={0.5} />
            {/* <OrbitControls enableZoom={true} /> */}
          </Canvas>
      </div>
    </>
  )
}

export default App
