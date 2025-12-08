import { useMemo } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva'
import './App.css'
import WallC from './components/WallC';
import WallB from './components/WallB';
import WallA from './components/WallA';
import Navigation from './components/Navigation';
import WallD from './components/WallD';
import PrismaticBurst from './components/PrismaticBurst';
import Galaxy from './components/Galaxy';
import PrismaticGalaxy from './components/PrismaticGalaxy';
import Squares from './components/Squares';

function App() {
  const location = useLocation()
  const themedRoutes = ['/prismatic-burst', '/galaxy', '/prismatic-galaxy']
  const useWideControls = themedRoutes.some((route) => location.pathname.startsWith(route))
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
              <Route path="/aurora" element={<WallD />} />
              <Route path="/prismatic-burst" element={<PrismaticBurst colors={['#000000', '#000000', '#000000']} speed={0.5} intensity={2.0} animType={1} distort={0} noiseAmount={0.05} rayCount={0} opacity={1.0} pixelRatio={0.5} />} />
              <Route path="/galaxy" element={<Galaxy focal={[0.5, 0.5]} rotation={[1.0, 0.0]} starSpeed={0.5} density={1} hueShift={140} />} />
              <Route path="/squares" element={<Squares speed={0.31} squareSize={71} direction='up' borderColor='#535353' />} />
              <Route path="/prismatic-galaxy" element={<PrismaticGalaxy />} />
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
