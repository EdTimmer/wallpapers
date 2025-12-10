import { useMemo } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva'
import './App.css'
import WallC from './components/WallC';
import WallB from './components/WallB';
import WallA from './components/WallA';
import Navigation from './components/Navigation';
import Aurora from './components/Aurora';
import PrismaticBurst from './components/PrismaticBurst';
import Galaxy from './components/Galaxy';
import PrismaticGalaxy from './components/PrismaticGalaxy';
import Squares from './components/Squares';
import DotGrid from './components/DotGrid';
import AuroraSquares from './components/AuroraSquares';
import AuroraDotGrid from './components/AuroraDotGrid';

function App() {
  const useWideControls = true
  const wideTheme = useMemo(() => ({
    sizes: {
      rootWidth: '350px'
    }
  }), [])

  return (
    <>
      <div className="app-container">
        <Navigation />
        <Leva theme={useWideControls ? wideTheme : undefined} />
        
        <div className="instructions">
          Use mouse interactions for effects
        </div>

          <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 50 }}>
            <Routes>
              <Route path="/wall-a" element={<WallA />} />
              <Route path="/wall-b" element={<WallB />} />
              <Route path="/wall-c" element={<WallC />} />
              <Route path="/aurora" element={<Aurora speed={0.47} intensity={0.8} blend={1.0} saturation={1.0} scale={1.4} verticalOffset={0.05} firstColor='#ddff00' secondColor='#00b30c' thirdColor='#00bfff' opacity={1.0} grainAmount={0.0} vignette={0.0} fadeSpeed={0.1} distortionRadius={0.01} distortionStrength={0.0} />} />
              <Route path="/prismatic-burst" element={<PrismaticBurst colors={['#000000', '#000000', '#000000']} speed={0.5} intensity={2.0} animType={1} distort={0} noiseAmount={0.05} rayCount={0} opacity={1.0} pixelRatio={0.5} />} />
              <Route path="/galaxy" element={<Galaxy focal={[0.5, 0.5]} rotation={[1.0, 0.0]} starSpeed={0.5} density={1} hueShift={140} />} />
              <Route path="/squares" element={<Squares speed={0.31} squareSize={71} direction='up' borderColor='#1a1a1a' />} />
              <Route path="/dot-grid" element={<DotGrid dotSize={4} gap={19} baseColor='#1a1a1a' activeColor='#ffffff' proximity={70} speedTrigger={100} shockRadius={100} shockStrength={9} maxSpeed={5000} resistance={650} returnDuration={1.6} mouseInteraction={true} opacity={1.0} />} />
              <Route path="/prismatic-galaxy" element={<PrismaticGalaxy />} />
              <Route path="/aurora-squares" element={<AuroraSquares />} />
              <Route path="/aurora-dot-grid" element={<AuroraDotGrid />} />
              <Route path="/" element={<Navigate to="/aurora" replace />} />
            </Routes>
            <ambientLight intensity={0.5} />
            {/* <OrbitControls enableZoom={true} /> */}
          </Canvas>
      </div>
    </>
  )
}

export default App
