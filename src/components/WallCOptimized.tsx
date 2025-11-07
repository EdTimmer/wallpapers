import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2 } from 'three'
import vertexShader from '@shaders/noiseA/vertex_a.glsl'
import fragmentShader from '@shaders/noiseA/fragment_a.glsl'

interface WallCOptimizedProps {
  noise?: number
  speed?: number
  oscillationFrequency?: number
  intensity?: number
  secondColor?: string
  scale?: number
}

export default function WallCOptimized({
  noise = 0.1,
  speed = 0.04,
  oscillationFrequency = 82.0,
  intensity = 0.1,
  secondColor = '#9a638e',
  scale = 2.0
}: WallCOptimizedProps) {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0.603, 0.388, 0.556]
  }

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoise: { value: noise },
      uSpeed: { value: speed },
      uOscillationFrequency: { value: oscillationFrequency },
      uIntensity: { value: intensity },
      uSecondColor: { value: hexToRgb(secondColor) },
      uClickPoints: { value: Array(10).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(10).fill(0) },
      uClickCount: { value: 0 }, // No click interactions
      uBlobSize: { value: 0.15 },
      uBlobIntensity: { value: 0.02 }
    }),
    [noise, speed, oscillationFrequency, intensity, secondColor]
  )

  // Simplified useFrame - only updates time, no interactions
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime
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