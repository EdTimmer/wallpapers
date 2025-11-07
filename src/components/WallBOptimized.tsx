import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2 } from 'three'
import vertexShader from '@shaders/noiseB/vertex_b.glsl'
import fragmentShader from '@shaders/noiseB/fragment_b.glsl'

interface WallBOptimizedProps {
  scale?: number
  rotationSpeed?: number
  fbmAmplitude?: number
  fbmPersistence?: number
  gapMix?: number
  contrastPower?: number
  finalPower?: number
  opacity?: number
  baseColor?: string
  noiseScale?: number
}

export default function WallBOptimized({
  scale = 2.0,
  rotationSpeed = 0.005,
  fbmAmplitude = 0.5,
  fbmPersistence = 0.5,
  gapMix = 0.5,
  contrastPower = 0.4,
  finalPower = 4.0,
  opacity = 0.6,
  baseColor = '#69e9ff',
  noiseScale = 10.0
}: WallBOptimizedProps) {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0.412, 0.914, 1.0]
  }

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseScale: { value: noiseScale },
      uRotationSpeed: { value: rotationSpeed },
      uFBMAmplitude: { value: fbmAmplitude },
      uFBMPersistence: { value: fbmPersistence },
      uGapMix: { value: gapMix },
      uContrastPower: { value: contrastPower },
      uFinalPower: { value: finalPower },
      uOpacity: { value: opacity },
      uClickPoints: { value: Array(10).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(10).fill(0) },
      uClickCount: { value: 0 }, // No click interactions
      uDistortionRadius: { value: 0.15 },
      uDistortionStrength: { value: 0.02 },
      uBaseColor: { value: hexToRgb(baseColor) }
    }),
    [noiseScale, rotationSpeed, fbmAmplitude, fbmPersistence, gapMix, contrastPower, finalPower, opacity, baseColor]
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