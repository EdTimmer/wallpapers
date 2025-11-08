import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, PerspectiveCamera, OrthographicCamera } from 'three'
import { useControls, button } from 'leva'
import vertexShader from '@shaders/wallShadersD/vertex_a.glsl'
import fragmentShader from '@shaders/wallShadersD/fragment_a.glsl'

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
  const { camera, size } = useThree()

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
    uThirdColor: '#5227ff'
  }

  const [{ uSpeed, uIntensity, uBlend, uSaturation, uScale, uVerticalOffset, uFirstColor, uSecondColor, uThirdColor }, set] = useControls('Wall D', () => ({
    uSpeed: { value: DEFAULTS.uSpeed, min: 0, max: 3, step: 0.01, label: 'Speed' },
    uIntensity: { value: DEFAULTS.uIntensity, min: 0, max: 3, step: 0.1, label: 'Amplitude' },
    uBlend: { value: DEFAULTS.uBlend, min: 0, max: 1, step: 0.01, label: 'Blend' },
    uSaturation: { value: DEFAULTS.uSaturation, min: 0, max: 4, step: 0.1, label: 'Saturation' },
    uScale: { value: DEFAULTS.uScale, min: 0.5, max: 10, step: 0.1, label: 'Scale' },
    uVerticalOffset: { value: DEFAULTS.uVerticalOffset, min: -1, max: 1, step: 0.01, label: 'Vertical Offset' },
    uFirstColor: { value: DEFAULTS.uFirstColor, label: 'Color 1 (Base)' },
    uSecondColor: { value: DEFAULTS.uSecondColor, label: 'Color 2 (Mid)' },
    uThirdColor: { value: DEFAULTS.uThirdColor, label: 'Color 3 (Top)' },
    'Reset All': button(() => set(DEFAULTS))
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
      uResolution: { value: [window.innerWidth, window.innerHeight] }
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
    }
  }, [uSpeed, uIntensity, uBlend, uSaturation, uScale, uVerticalOffset, uFirstColor, uSecondColor, uThirdColor])

  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value = [window.innerWidth, window.innerHeight]
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
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
