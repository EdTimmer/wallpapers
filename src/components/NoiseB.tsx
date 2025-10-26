import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2, Raycaster } from 'three'
import { useControls, button } from 'leva'
import vertexShader from '@shaders/noiseB/vertex_b.glsl'
import fragmentShader from '@shaders/noiseB/fragment_b.glsl'

interface ClickPoint {
  position: Vector2
  strength: number
  age: number
}

export default function NoiseB() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [currentDragPoint, setCurrentDragPoint] = useState<ClickPoint | null>(null)
  const { camera, gl } = useThree()

  const DEFAULTS = {
    Scale: 10.0,
    RotationSpeed: 0.05,
    FBMAmplitude: 0.5,
    FBMPersistence: 0.5,
    GapMix: 0.5,
    ContrastPower: 0.4,
    FinalPower: 4.0,
    Opacity: 0.6,
    fadeSpeed: 3.0,
    distortionRadius: 0.06,
    distortionStrength: 0.25
  }

  const [{ 
    Scale: uNoiseScale,
    RotationSpeed: uRotationSpeed,
    FBMAmplitude: uFBMAmplitude,
    FBMPersistence: uFBMPersistence,
    GapMix: uGapMix,
    ContrastPower: uContrastPower,
    FinalPower: uFinalPower,
    Opacity: uOpacity,
    fadeSpeed,
    distortionRadius,
    distortionStrength
  }, set] = useControls('NoiseB', () => ({
    Scale: { value: DEFAULTS.Scale, min: 0.1, max: 20, step: 0.1 },
    RotationSpeed: { value: DEFAULTS.RotationSpeed, min: -0.2, max: 0.2, step: 0.01 },
    FBMAmplitude: { value: DEFAULTS.FBMAmplitude, min: 0.0, max: 5.0, step: 0.05 },
    FBMPersistence: { value: DEFAULTS.FBMPersistence, min: 0.0, max: 4.0, step: 0.05 },
    GapMix: { value: DEFAULTS.GapMix, min: 0.0, max: 1.0, step: 0.05 },
    ContrastPower: { value: DEFAULTS.ContrastPower, min: 0.1, max: 5.0, step: 0.1 },
    FinalPower: { value: DEFAULTS.FinalPower, min: 0.5, max: 10.0, step: 0.5 },
    Opacity: { value: DEFAULTS.Opacity, min: 0, max: 1, step: 0.01 },
    fadeSpeed: { value: DEFAULTS.fadeSpeed, min: 0.1, max: 3, step: 0.1 },
    distortionRadius: { value: DEFAULTS.distortionRadius, min: 0.01, max: 0.5, step: 0.01 },
    distortionStrength: { value: DEFAULTS.distortionStrength, min: 0, max: 0.5, step: 0.001 },
    'Reset All': button(() => set(DEFAULTS))
  }))

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseScale: { value: uNoiseScale },
      uRotationSpeed: { value: uRotationSpeed },
      uFBMAmplitude: { value: uFBMAmplitude },
      uFBMPersistence: { value: uFBMPersistence },
      uGapMix: { value: uGapMix },
      uContrastPower: { value: uContrastPower },
      uFinalPower: { value: uFinalPower },
      uOpacity: { value: uOpacity },
      uClickPoints: { value: Array(10).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(10).fill(0) },
      uClickCount: { value: 0 },
      uDistortionRadius: { value: 0.15 },
      uDistortionStrength: { value: 0.02 }
    }),
    []
  )

  useEffect(() => {
    const getUVFromEvent = (event: MouseEvent): Vector2 | null => {
      const rect = gl.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new Raycaster()
      raycaster.setFromCamera(new Vector2(x, y), camera)
      
      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current)
        if (intersects.length > 0 && intersects[0].uv) {
          return intersects[0].uv
        }
      }
      return null
    }

    const handleMouseDown = (event: MouseEvent) => {
      const uv = getUVFromEvent(event)
      if (uv) {
        setIsDragging(true)
        const newPoint: ClickPoint = {
          position: new Vector2(uv.x, uv.y),
          strength: 1.0,
          age: 0
        }
        setCurrentDragPoint(newPoint)
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        const uv = getUVFromEvent(event)
        if (uv && currentDragPoint) {
          setCurrentDragPoint({
            ...currentDragPoint,
            position: new Vector2(uv.x, uv.y)
          })
        }
      }
    }

    const handleMouseUp = () => {
      if (isDragging && currentDragPoint) {
        setClickPoints(prev => [...prev, currentDragPoint].slice(-10))
        setCurrentDragPoint(null)
      }
      setIsDragging(false)
    }

    gl.domElement.addEventListener('mousedown', handleMouseDown)
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mouseup', handleMouseUp)
    gl.domElement.addEventListener('mouseleave', handleMouseUp) // Handle mouse leaving canvas
    
    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
      gl.domElement.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [camera, gl, isDragging, currentDragPoint])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uNoiseScale.value = uNoiseScale
      materialRef.current.uniforms.uRotationSpeed.value = uRotationSpeed
      materialRef.current.uniforms.uFBMAmplitude.value = uFBMAmplitude
      materialRef.current.uniforms.uFBMPersistence.value = uFBMPersistence
      materialRef.current.uniforms.uGapMix.value = uGapMix
      materialRef.current.uniforms.uContrastPower.value = uContrastPower
      materialRef.current.uniforms.uFinalPower.value = uFinalPower
      materialRef.current.uniforms.uOpacity.value = uOpacity
      materialRef.current.uniforms.uDistortionRadius.value = distortionRadius
      materialRef.current.uniforms.uDistortionStrength.value = distortionStrength
    }
  }, [uNoiseScale, uRotationSpeed, uFBMAmplitude, uFBMPersistence, uGapMix, uContrastPower, uFinalPower, uOpacity, distortionRadius, distortionStrength])

  useFrame(({ clock }, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      
      setClickPoints(prev => {
        return prev
          .map(point => ({
            ...point,
            age: point.age + delta,
            strength: Math.max(0, point.strength - delta * fadeSpeed)
          }))
          .filter(point => point.strength > 0.1)
      })
      
      const positions = Array(10).fill(new Vector2(0, 0))
      const strengths = Array(10).fill(0)
      
      // Add current drag point if dragging
      let allPoints = [...clickPoints]
      if (currentDragPoint) {
        allPoints = [currentDragPoint, ...allPoints]
      }
      
      allPoints.forEach((point, index) => {
        if (index < 10) {
          positions[index] = point.position
          strengths[index] = point.strength
        }
      })
      
      materialRef.current.uniforms.uClickPoints.value = positions
      materialRef.current.uniforms.uClickStrengths.value = strengths
      materialRef.current.uniforms.uClickCount.value = Math.min(allPoints.length, 10)
    }
  })

  return (
    <mesh ref={meshRef} scale={2.0}>
      <planeGeometry args={[120, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  )
}
