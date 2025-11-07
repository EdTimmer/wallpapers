import { Routes, Route, Navigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber';
import './App.css'
import WallC from './components/WallC';
import WallB from './components/WallB';
import WallA from './components/WallA';
import WallAOptimized from './components/WallAOptimized';
import WallBOptimized from './components/WallBOptimized';
import WallCOptimized from './components/WallCOptimized';
import Navigation from './components/Navigation';

function App() {
  return (
    <>
      <div className="app-container">
        <Navigation />
        
        <div className="instructions">
          Use mouse interactions for effects
        </div>

          <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 20, far: 6 }}>
            <Routes>
              <Route path="/wall-a" element={<WallA />} />
              <Route path="/wall-b" element={<WallB />} />
              <Route path="/wall-c" element={<WallC />} />
              <Route path="/wall-a-optimized" element={<WallAOptimized />} />
              <Route path="/wall-b-optimized" element={<WallBOptimized />} />
              <Route path="/wall-c-optimized" element={<WallCOptimized />} />
              <Route path="/" element={<Navigate to="/wall-a" replace />} />
            </Routes>
            <ambientLight intensity={0.5} />
            {/* <OrbitControls enableZoom={true} /> */}
          </Canvas>
      </div>
    </>
  )
}

export default App
