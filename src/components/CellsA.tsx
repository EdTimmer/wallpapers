import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2 } from 'three'
import { useControls } from 'leva'
import vertexShader from '@shaders/cellsA/vertex_cells_a.glsl'
import fragmentShader from '@shaders/cellsA/fragment_cells_a.glsl'

export default function CellsA() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)

  const { resolutionX, resolutionY, animationSpeed } = useControls('CellsA', {
    resolutionX: { value: 1920, min: 100, max: 4000, step: 10 },
    resolutionY: { value: 1080, min: 100, max: 4000, step: 10 },
    animationSpeed: { value: 0.5, min: 0, max: 5, step: 0.1 }
  })

  const uniforms = useMemo(
    () => ({
      resolution: { value: new Vector2(1920, 1080) },
      time: { value: 0 }
    }),
    []
  )

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value = new Vector2(resolutionX, resolutionY)
    }
  }, [resolutionX, resolutionY])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * animationSpeed
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[120, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
