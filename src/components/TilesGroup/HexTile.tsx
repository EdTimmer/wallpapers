import { useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';

interface Props {
  children?: React.ReactNode;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

const HexTile = ({ scale = 4, position = [0, 0, 0], rotation = [0, 0, 0] }: Props) => {
  const groupRef = useRef<THREE.Group>(null);
  const { nodes, materials } = useGLTF('/assets/models/hex_tile_4.glb'); 
  const currentRotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const holdTimeRef = useRef(0);
  const isHoldingRef = useRef(false);

  const handlePointerEnter = () => {
    // Start flip animation
    targetRotationRef.current = Math.PI;
    holdTimeRef.current = 0;
    isHoldingRef.current = false;
  };

  

  // Continuous rotation using useFrame
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    const isAtFlipped = Math.abs(currentRotationRef.current - Math.PI) < 0.01;
    
    // If we've reached flipped position, start holding timer
    if (isAtFlipped && !isHoldingRef.current) {
      isHoldingRef.current = true;
      holdTimeRef.current = 0;
    }
    
    // If holding, increment timer
    if (isHoldingRef.current) {
      holdTimeRef.current += delta;

      // After 2 seconds, rotate back
      if (holdTimeRef.current >= 2) {
        targetRotationRef.current = 0;
        isHoldingRef.current = false;
      }
    }
    
    // Incorporate delta into the interpolation factor for frame rate independence
    const speed = 3; // Adjust this to control the smoothness/speed
    const lerpFactor = 1 - Math.exp(-speed * delta);
    
    // Interpolate the current rotation towards the target rotation
    currentRotationRef.current = MathUtils.lerp(
      currentRotationRef.current,
      targetRotationRef.current,
      lerpFactor
    );
    
    groupRef.current.rotation.y = currentRotationRef.current;
    
    // Snap to target if very close
    if (Math.abs(currentRotationRef.current - targetRotationRef.current) < 0.001) {
      currentRotationRef.current = targetRotationRef.current;
      groupRef.current.rotation.y = targetRotationRef.current;
    }
  });

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
    >
      {
        Object.values(nodes)
          .filter((n) => n instanceof THREE.Mesh)
          .map((mesh) => {
            const originalMaterial = materials[mesh.material.name];
            
            return (
              <mesh
                key={mesh.uuid}
                geometry={mesh.geometry}
                material={originalMaterial}
                onPointerEnter={handlePointerEnter}
              />
            );
          })
      }
    </group>
  )
}

export default HexTile;