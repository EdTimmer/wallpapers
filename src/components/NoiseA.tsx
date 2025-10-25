import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2, Raycaster } from 'three'
import { useControls } from 'leva'
import vertexShader from '@shaders/noiseA/vertex_a.glsl'
import fragmentShader from '@shaders/noiseA/fragment_a.glsl'

interface ClickPoint {
  position: Vector2
  strength: number
  age: number
}

export default function NoiseA() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([])
  const { camera, gl } = useThree()

  const { uNoise, uSpeed, uOscillationFrequency, fadeSpeed, blobSize, blobColor, blobIntensity } = useControls({
    uNoise: { value: 1.2, min: 0, max: 50, step: 0.1 },
    uSpeed: { value: 0.016, min: 0, max: 2, step: 0.01 },
    uOscillationFrequency: { value: 14.0, min: 0, max: 100, step: 1 },
    fadeSpeed: { value: 0.5, min: 0.1, max: 3, step: 0.1 },
    blobSize: { value: 0.15, min: 0.01, max: 0.5, step: 0.01 },
    blobColor: { value: '#86fedd' }, // Light cyan/turquoise
    blobIntensity: { value: 0.02, min: 0, max: 0.5, step: 0.001 }
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoise: { value: uNoise },
      uSpeed: { value: uSpeed },
      uOscillationFrequency: { value: uOscillationFrequency },
      uClickPoints: { value: Array(10).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(10).fill(0) },
      uClickCount: { value: 0 },
      uBlobSize: { value: 0.15 },
      uBlobColor: { value: [0.525, 0.992, 0.866] }, // RGB values
      uBlobIntensity: { value: 0.02 }
    }),
    []
  )

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Convert mouse coordinates to normalized device coordinates (-1 to +1)
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast to find intersection with the plane
      const raycaster = new Raycaster()
      raycaster.setFromCamera(new Vector2(x, y), camera)
      
      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current)
        
        if (intersects.length > 0 && intersects[0].uv) {
          const uv = intersects[0].uv
          
          // Add new click point
          setClickPoints(prev => {
            const newPoint: ClickPoint = {
              position: new Vector2(uv.x, uv.y),
              strength: 1.0,
              age: 0
            }
            
            // Keep only the last 10 clicks
            const updated = [...prev, newPoint].slice(-10)
            return updated
          })
        }
      }
    }

    gl.domElement.addEventListener('click', handleClick)
    return () => {
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [camera, gl])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uNoise.value = uNoise
      materialRef.current.uniforms.uSpeed.value = uSpeed
      materialRef.current.uniforms.uOscillationFrequency.value = uOscillationFrequency
      materialRef.current.uniforms.uBlobSize.value = blobSize
      materialRef.current.uniforms.uBlobIntensity.value = blobIntensity
      
      // Convert hex color to RGB array (0-1 range)
      const hex = blobColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16) / 255
      const g = parseInt(hex.substring(2, 4), 16) / 255
      const b = parseInt(hex.substring(4, 6), 16) / 255
      materialRef.current.uniforms.uBlobColor.value = [r, g, b]
    }
  }, [uNoise, uSpeed, uOscillationFrequency, blobSize, blobColor, blobIntensity])

  useFrame(({ clock }, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      
      // Update click points - fade them out over time
      setClickPoints(prev => {
        return prev
          .map(point => ({
            ...point,
            age: point.age + delta,
            strength: Math.max(0, point.strength - delta * fadeSpeed)
          }))
          .filter(point => point.strength > 0.01) // Remove fully faded points
      })
      
      // Update shader uniforms
      const positions = Array(10).fill(new Vector2(0, 0))
      const strengths = Array(10).fill(0)
      
      clickPoints.forEach((point, index) => {
        if (index < 10) {
          positions[index] = point.position
          strengths[index] = point.strength
        }
      })
      
      materialRef.current.uniforms.uClickPoints.value = positions
      materialRef.current.uniforms.uClickStrengths.value = strengths
      materialRef.current.uniforms.uClickCount.value = Math.min(clickPoints.length, 10)
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
