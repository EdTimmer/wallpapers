import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh, ShaderMaterial, PerspectiveCamera, OrthographicCamera, Vector2, DataTexture, RGBAFormat, LinearFilter, ClampToEdgeWrapping } from 'three'
import { useControls, button } from 'leva'
import vertexShader from '@shaders/prismaticBurst/vertex.glsl'
import fragmentShader from '@shaders/prismaticBurst/fragment.glsl'

// Helper function to convert hex color to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  return [r, g, b]
}

export default function PrismaticBurst() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)
  const mouseRef = useRef<Vector2>(new Vector2(0.5, 0.5))
  const { camera, size, gl } = useThree()
  const resolutionRef = useRef<Vector2>(
    new Vector2(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  )

  // Calculate plane dimensions to cover viewport
  const planeDimensions = useMemo(() => {
    if (camera instanceof OrthographicCamera) {
      const width = (camera.right - camera.left) / (camera.zoom || 1)
      const height = (camera.top - camera.bottom) / (camera.zoom || 1)
      return [width, height]
    } else if (camera instanceof PerspectiveCamera) {
      const distance = Math.abs(camera.position.z)
      const vFov = camera.fov * (Math.PI / 180)
      const height = 2 * Math.tan(vFov / 2) * distance
      const width = height * (size.width / size.height)
      return [width, height]
    }
    return [60, 40]
  }, [camera, size])

  const DEFAULTS = {
    uSpeed: 0.5,
    uIntensity: 2.0,
    uAnimType: 1, // rotate3d
    uDistort: 0,
    uOffset: [0, 0],
    uNoiseAmount: 0.8,
    uRayCount: 0,
    colors: ['#ff0080', '#ff8800', '#ffff00', '#00ff88', '#0088ff', '#8800ff']
  }

  const [{ uSpeed, uIntensity, uAnimType, uDistort, uNoiseAmount, uRayCount }, setMain] = useControls('Prismatic Burst', () => ({
    uSpeed: { value: DEFAULTS.uSpeed, min: 0, max: 3, step: 0.01, label: 'Speed' },
    uIntensity: { value: DEFAULTS.uIntensity, min: 0, max: 5, step: 0.1, label: 'Intensity' },
    uAnimType: { 
      value: DEFAULTS.uAnimType, 
      options: { 'Rotate': 0, 'Rotate 3D': 1, 'Hover': 2 },
      label: 'Animation Type' 
    },
    uDistort: { value: DEFAULTS.uDistort, min: 0, max: 10, step: 0.1, label: 'Distortion' },
    uNoiseAmount: { value: DEFAULTS.uNoiseAmount, min: 0, max: 1, step: 0.01, label: 'Noise' },
    uRayCount: { value: DEFAULTS.uRayCount, min: 0, max: 24, step: 1, label: 'Ray Count' },
    'Reset All': button(() => {
      setMain({
        uSpeed: DEFAULTS.uSpeed,
        uIntensity: DEFAULTS.uIntensity,
        uAnimType: DEFAULTS.uAnimType,
        uDistort: DEFAULTS.uDistort,
        uNoiseAmount: DEFAULTS.uNoiseAmount,
        uRayCount: DEFAULTS.uRayCount
      })
    })
  }))

  // Create gradient texture from colors
  const gradientTexture = useMemo(() => {
    const colors = DEFAULTS.colors
    const width = colors.length
    const data = new Uint8Array(width * 4)
    
    colors.forEach((color, i) => {
      const rgb = hexToRgb(color)
      data[i * 4 + 0] = Math.round(rgb[0] * 255)
      data[i * 4 + 1] = Math.round(rgb[1] * 255)
      data[i * 4 + 2] = Math.round(rgb[2] * 255)
      data[i * 4 + 3] = 255
    })

    const texture = new DataTexture(data, width, 1, RGBAFormat)
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.wrapS = ClampToEdgeWrapping
    texture.wrapT = ClampToEdgeWrapping
    texture.needsUpdate = true
    return texture
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionRef.current },
      uSpeed: { value: DEFAULTS.uSpeed },
      uIntensity: { value: DEFAULTS.uIntensity },
      uAnimType: { value: DEFAULTS.uAnimType },
      uMouse: { value: mouseRef.current },
      uDistort: { value: DEFAULTS.uDistort },
      uOffset: { value: new Vector2(0, 0) },
      uNoiseAmount: { value: DEFAULTS.uNoiseAmount },
      uRayCount: { value: DEFAULTS.uRayCount },
      uColorCount: { value: DEFAULTS.colors.length },
      uGradient: { value: gradientTexture }
    }),
    [gradientTexture]
  )

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSpeed.value = uSpeed
      materialRef.current.uniforms.uIntensity.value = uIntensity
      materialRef.current.uniforms.uAnimType.value = uAnimType
      materialRef.current.uniforms.uDistort.value = uDistort
      materialRef.current.uniforms.uNoiseAmount.value = uNoiseAmount
      materialRef.current.uniforms.uRayCount.value = uRayCount
    }
  }, [uSpeed, uIntensity, uAnimType, uDistort, uNoiseAmount, uRayCount])

  useEffect(() => {
    const dpr = gl.getPixelRatio()
    resolutionRef.current.set(size.width * dpr, size.height * dpr)
  }, [gl, size.height, size.width])

  useFrame(({ clock, mouse }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      
      // Smooth mouse interpolation
      const targetX = (mouse.x + 1) / 2
      const targetY = (mouse.y + 1) / 2
      mouseRef.current.x += (targetX - mouseRef.current.x) * 0.1
      mouseRef.current.y += (targetY - mouseRef.current.y) * 0.1
      
      materialRef.current.uniforms.uMouse.value.copy(mouseRef.current)
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
