import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, Vector2, Raycaster } from 'three'
import { useControls, button } from 'leva'
import vertexShader from '@shaders/wallShadersC/vertex_a.glsl'
import fragmentShader from '@shaders/wallShadersC/fragment_a.glsl'

interface ClickPoint {
  position: Vector2
  strength: number
  age: number
}

export default function WallC() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [currentDragPoint, setCurrentDragPoint] = useState<ClickPoint | null>(null)
  const { camera, gl } = useThree()

  const DEFAULTS = {
    uNoise: 0.3,
    uSpeed: 0.05,
    uOscillationFrequency: 21.0,
    uIntensity: 0.1,
    uSecondColor: '#5a67db',
    uThirdColor: '#090210',
    fadeSpeed: 0.5,
    distortionRadius: 0.03,
    distortionStrength: 0.3
  }

  const [{ uNoise, uSpeed, uOscillationFrequency, uIntensity, uSecondColor, uThirdColor }, setMain] = useControls('Wall C', () => ({
    uNoise: { value: DEFAULTS.uNoise, min: 0, max: 5, step: 0.1 },
    uSpeed: { value: DEFAULTS.uSpeed, min: 0, max: 1, step: 0.01 },
    uOscillationFrequency: { value: DEFAULTS.uOscillationFrequency, min: 0, max: 100, step: 1 },
    uIntensity: { value: DEFAULTS.uIntensity, min: 0, max: 1, step: 0.01 },
    uSecondColor: { value: DEFAULTS.uSecondColor },
    uThirdColor: { value: DEFAULTS.uThirdColor },
    'Reset All': button(() => {
      setMain({
        uNoise: DEFAULTS.uNoise,
        uSpeed: DEFAULTS.uSpeed,
        uOscillationFrequency: DEFAULTS.uOscillationFrequency,
        uIntensity: DEFAULTS.uIntensity,
        uSecondColor: DEFAULTS.uSecondColor,
        uThirdColor: DEFAULTS.uThirdColor
      })
      setDistortion({
        fadeSpeed: DEFAULTS.fadeSpeed,
        distortionRadius: DEFAULTS.distortionRadius,
        distortionStrength: DEFAULTS.distortionStrength
      })
    })
  }))

  const [{ fadeSpeed, distortionRadius, distortionStrength }, setDistortion] = useControls('Distortion C', () => ({
    fadeSpeed: { value: DEFAULTS.fadeSpeed, min: 0.1, max: 3, step: 0.1 },
    distortionRadius: { value: DEFAULTS.distortionRadius, min: 0.01, max: 0.1, step: 0.01, label: 'Radius' },
    distortionStrength: { value: DEFAULTS.distortionStrength, min: 0, max: 0.5, step: 0.001, label: 'Strength' }
  }))

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoise: { value: uNoise },
      uSpeed: { value: uSpeed },
      uOscillationFrequency: { value: uOscillationFrequency },
      uIntensity: { value: uIntensity },
      uSecondColor: { value: [0.525, 0.992, 0.866] },
      uThirdColor: { value: [1.0, 0.4, 0.7] },
      uClickPoints: { value: Array(10).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(10).fill(0) },
      uClickCount: { value: 0 },
      uBlobSize: { value: 0.15 },
      uBlobIntensity: { value: 0.02 }
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
    gl.domElement.addEventListener('mouseleave', handleMouseUp)
    
    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mouseup', handleMouseUp)
      gl.domElement.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [camera, gl, isDragging, currentDragPoint])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uNoise.value = uNoise
      materialRef.current.uniforms.uSpeed.value = uSpeed
      materialRef.current.uniforms.uOscillationFrequency.value = uOscillationFrequency
      materialRef.current.uniforms.uIntensity.value = uIntensity
      
      // Convert hex to RGB array (0-1 range) for second color
      const hex2 = uSecondColor.replace('#', '')
      const r2 = parseInt(hex2.substring(0, 2), 16) / 255
      const g2 = parseInt(hex2.substring(2, 4), 16) / 255
      const b2 = parseInt(hex2.substring(4, 6), 16) / 255
      materialRef.current.uniforms.uSecondColor.value = [r2, g2, b2]
      
      // Convert hex to RGB array (0-1 range) for third color
      const hex3 = uThirdColor.replace('#', '')
      const r3 = parseInt(hex3.substring(0, 2), 16) / 255
      const g3 = parseInt(hex3.substring(2, 4), 16) / 255
      const b3 = parseInt(hex3.substring(4, 6), 16) / 255
      materialRef.current.uniforms.uThirdColor.value = [r3, g3, b3]
      
      materialRef.current.uniforms.uBlobSize.value = distortionRadius
      materialRef.current.uniforms.uBlobIntensity.value = distortionStrength
    }
  }, [uNoise, uSpeed, uOscillationFrequency, uIntensity, uSecondColor, uThirdColor, distortionRadius, distortionStrength])

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
      />
    </mesh>
  )
}
