import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, PerspectiveCamera, OrthographicCamera, Vector2, Raycaster } from 'three'
import { useControls, button } from 'leva'
import vertexShader from '@shaders/wallShadersD/vertex_a.glsl'
import fragmentShader from '@shaders/wallShadersD/fragment_a.glsl'

interface ClickPoint {
  position: Vector2
  strength: number
  age: number
}

// Helper function to convert hex color to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  return [r, g, b]
}

export default function WallD() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)
  const [clickPoints, setClickPoints] = useState<ClickPoint[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [currentDragPoint, setCurrentDragPoint] = useState<ClickPoint | null>(null)
  const { camera, size, gl } = useThree()

  // Calculate plane dimensions to cover viewport
  const planeDimensions = useMemo(() => {
    if (camera instanceof OrthographicCamera) {
      // For orthographic camera, use the frustum bounds
      const width = (camera.right - camera.left) / (camera.zoom || 1)
      const height = (camera.top - camera.bottom) / (camera.zoom || 1)
      return [width, height]
    } else if (camera instanceof PerspectiveCamera) {
      // For perspective camera
      const distance = Math.abs(camera.position.z)
      const vFov = camera.fov * (Math.PI / 180)
      const height = 2 * Math.tan(vFov / 2) * distance
      const width = height * (size.width / size.height)
      return [width, height]
    }
    
    return [60, 40] // Fallback
  }, [camera, size])

  const DEFAULTS = {
    uSpeed: 0.3,
    uIntensity: 0.6,
    uBlend: 0.5,
    uSaturation: 2.0,
    uScale: 2.5,
    uVerticalOffset: -0.2,
    uFirstColor: '#7cff67',
    uSecondColor: '#b19eef',
    uThirdColor: '#5227ff',
    fadeSpeed: 0.5,
    distortionRadius: 0.25,
    distortionStrength: 0.3
  }

  const [{ uSpeed, uIntensity, uBlend, uSaturation, uScale, uVerticalOffset, uFirstColor, uSecondColor, uThirdColor }, setMain] = useControls('Wall D', () => ({
    uSpeed: { value: DEFAULTS.uSpeed, min: 0, max: 3, step: 0.01, label: 'Speed' },
    uIntensity: { value: DEFAULTS.uIntensity, min: 0, max: 3, step: 0.1, label: 'Amplitude' },
    uBlend: { value: DEFAULTS.uBlend, min: 0, max: 1, step: 0.01, label: 'Blend' },
    uSaturation: { value: DEFAULTS.uSaturation, min: 0, max: 4, step: 0.1, label: 'Saturation' },
    uScale: { value: DEFAULTS.uScale, min: 0.5, max: 10, step: 0.1, label: 'Scale' },
    uVerticalOffset: { value: DEFAULTS.uVerticalOffset, min: -1, max: 1, step: 0.01, label: 'Vertical Offset' },
    uFirstColor: { value: DEFAULTS.uFirstColor, label: 'Color 1 (Base)' },
    uSecondColor: { value: DEFAULTS.uSecondColor, label: 'Color 2 (Mid)' },
    uThirdColor: { value: DEFAULTS.uThirdColor, label: 'Color 3 (Top)' },
    'Reset All': button(() => {
      setMain({
        uSpeed: DEFAULTS.uSpeed,
        uIntensity: DEFAULTS.uIntensity,
        uBlend: DEFAULTS.uBlend,
        uSaturation: DEFAULTS.uSaturation,
        uScale: DEFAULTS.uScale,
        uVerticalOffset: DEFAULTS.uVerticalOffset,
        uFirstColor: DEFAULTS.uFirstColor,
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

  const [{ fadeSpeed, distortionRadius, distortionStrength }, setDistortion] = useControls('Distortion D', () => ({
    fadeSpeed: { value: DEFAULTS.fadeSpeed, min: 0.1, max: 3, step: 0.1 },
    distortionRadius: { value: DEFAULTS.distortionRadius, min: 0.01, max: 0.5, step: 0.01, label: 'Radius' },
    distortionStrength: { value: DEFAULTS.distortionStrength, min: 0, max: 0.5, step: 0.001, label: 'Strength' }
  }))

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: uSpeed },
      uIntensity: { value: uIntensity },
      uBlend: { value: DEFAULTS.uBlend },
      uSaturation: { value: DEFAULTS.uSaturation },
      uScale: { value: DEFAULTS.uScale },
      uVerticalOffset: { value: DEFAULTS.uVerticalOffset },
      uFirstColor: { value: hexToRgb(DEFAULTS.uFirstColor) },
      uSecondColor: { value: hexToRgb(DEFAULTS.uSecondColor) },
      uThirdColor: { value: hexToRgb(DEFAULTS.uThirdColor) },
      uResolution: { value: [window.innerWidth, window.innerHeight] },
      uClickPoints: { value: Array(10).fill(new Vector2(0, 0)) },
      uClickStrengths: { value: Array(10).fill(0) },
      uClickCount: { value: 0 },
      uBlobSize: { value: 0.15 },
      uBlobIntensity: { value: 0.02 }
    }),
    []
  )

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSpeed.value = uSpeed
      materialRef.current.uniforms.uIntensity.value = uIntensity
      materialRef.current.uniforms.uBlend.value = uBlend
      materialRef.current.uniforms.uSaturation.value = uSaturation
      materialRef.current.uniforms.uScale.value = uScale
      materialRef.current.uniforms.uVerticalOffset.value = uVerticalOffset
      materialRef.current.uniforms.uFirstColor.value = hexToRgb(uFirstColor)
      materialRef.current.uniforms.uSecondColor.value = hexToRgb(uSecondColor)
      materialRef.current.uniforms.uThirdColor.value = hexToRgb(uThirdColor)
      materialRef.current.uniforms.uBlobSize.value = distortionRadius
      materialRef.current.uniforms.uBlobIntensity.value = distortionStrength
    }
  }, [uSpeed, uIntensity, uBlend, uSaturation, uScale, uVerticalOffset, uFirstColor, uSecondColor, uThirdColor, distortionRadius, distortionStrength])

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
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value = [window.innerWidth, window.innerHeight]
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    <mesh ref={meshRef}>
      <planeGeometry args={planeDimensions as [number, number]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
