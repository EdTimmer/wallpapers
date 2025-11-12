import { Routes, Route, Navigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber';
import './App.css'
import WallC from './components/WallC';
import WallB from './components/WallB';
import WallA from './components/WallA';
import Navigation from './components/Navigation';
import WallD from './components/WallD';

function App() {
  return (
    <>
      <div className="app-container">
        <Navigation />
        
        <div className="instructions">
          Use mouse interactions for effects
        </div>

          <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 50 }}>
            <Routes>
              <Route path="/wall-a" element={<WallA />} />
              <Route path="/wall-b" element={<WallB />} />
              <Route path="/wall-c" element={<WallC />} />
              <Route path="/aurora" element={<WallD />} />
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
