import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2 } from 'three'
import vertexShader from '@shaders/cellsA/vertex_cells_a.glsl'
import fragmentShader from '@shaders/cellsA/fragment_cells_a.glsl'

interface WallAOptimizedProps {
  resolutionX?: number
  resolutionY?: number
  animationSpeed?: number
  baseColor?: string
  baseIntensity?: number
  scale?: number
}

export default function WallAOptimized({
  resolutionX = 1920,
  resolutionY = 3000,
  animationSpeed = 0.3,
  baseColor = '#33cc80',
  baseIntensity = 0.3,
  scale = 2.0
}: WallAOptimizedProps) {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0.2, 0.8, 0.5]
  }

  const uniforms = useMemo(
    () => ({
      resolution: { value: new Vector2(resolutionX, resolutionY) },
      time: { value: 0 },
      uClickedCells: { value: Array(20).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(20).fill(0) },
      uClickCount: { value: 0 },
      uClickColor: { value: [1.0, 0.0, 0.992] },
      uColorIntensity: { value: baseIntensity },
      uClickColorIntensity: { value: 0.0 }, // No click interactions
      uBaseColor: { value: hexToRgb(baseColor) }
    }),
    [resolutionX, resolutionY, baseColor, baseIntensity]
  )

  // Simplified useFrame - only updates time, no interactions
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * animationSpeed
    }
  })

  return (
    <mesh ref={meshRef} scale={scale}>
      <planeGeometry args={[120, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}