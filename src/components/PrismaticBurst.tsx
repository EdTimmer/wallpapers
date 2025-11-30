// This component is an adaptation of PrismaticBurst.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RawShaderMaterial, Vector2, DataTexture, RGBAFormat, LinearFilter, ClampToEdgeWrapping, GLSL3 } from 'three'
import { ScreenQuad } from '@react-three/drei'
import { useControls, button, monitor } from 'leva'
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
  const materialRef = useRef<RawShaderMaterial>(null!)
  const mouseRef = useRef<Vector2>(new Vector2(0.5, 0.5))
  const elapsedRef = useRef(0)
  const fpsRef = useRef(0)
  const frameMsRef = useRef(0)
  const { size, gl } = useThree()
  const resolutionRef = useRef<Vector2>(
    new Vector2(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  )

  const DEFAULTS = {
    uSpeed: 0.5,
    uIntensity: 2.0,
    uAnimType: 1, // rotate3d
    uDistort: 0,
    uOffset: [0, 0],
    uNoiseAmount: 0.8,
    uRayCount: 0,
    pixelRatio: 0.7,
    colors: ['#ff0080', '#ff8800', '#ffff00', '#00ff88', '#0088ff', '#8800ff']
  }

  const [{ uSpeed, uIntensity, uAnimType, uDistort, uNoiseAmount, uRayCount, pixelRatio }, setMain] = useControls('Prismatic Burst', () => ({
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
    pixelRatio: { value: DEFAULTS.pixelRatio, min: 0.5, max: 2, step: 0.05, label: 'Render DPR' },
    'Reset All': button(() => {
      setMain({
        uSpeed: DEFAULTS.uSpeed,
        uIntensity: DEFAULTS.uIntensity,
        uAnimType: DEFAULTS.uAnimType,
        uDistort: DEFAULTS.uDistort,
        uNoiseAmount: DEFAULTS.uNoiseAmount,
        uRayCount: DEFAULTS.uRayCount,
        pixelRatio: DEFAULTS.pixelRatio
      })
    })
  }))

  useControls('Diagnostics', () => ({
    FPS: monitor(() => fpsRef.current, { graph: true, interval: 250 }),
    FrameMs: monitor(() => frameMsRef.current, { graph: true, interval: 250 })
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
    const cappedDpr = Math.min(gl.getPixelRatio(), 2)
    resolutionRef.current.set(size.width * cappedDpr, size.height * cappedDpr)
  }, [gl, size.height, size.width])

  useEffect(() => {
    const originalDpr = gl.getPixelRatio()
    const targetDpr = Math.min(originalDpr, pixelRatio)
    if (targetDpr !== originalDpr) {
      gl.setPixelRatio(targetDpr)
    }
    return () => {
      gl.setPixelRatio(originalDpr)
    }
  }, [gl, pixelRatio])

  useFrame(({ mouse, size, gl }, delta) => {
    if (!materialRef.current) return
    const uniforms = materialRef.current.uniforms

    elapsedRef.current += delta
    uniforms.uTime.value = elapsedRef.current
    fpsRef.current = 1 / Math.max(delta, 1e-6)
    frameMsRef.current = delta * 1000

    const cappedDpr = Math.min(gl.getPixelRatio(), 2)
    const width = size.width * cappedDpr
    const height = size.height * cappedDpr
    if (resolutionRef.current.x !== width || resolutionRef.current.y !== height) {
      resolutionRef.current.set(width, height)
    }

    const targetX = (mouse.x + 1) / 2
    const targetY = (mouse.y + 1) / 2
    const lerpFactor = 0.1
    mouseRef.current.x += (targetX - mouseRef.current.x) * lerpFactor
    mouseRef.current.y += (targetY - mouseRef.current.y) * lerpFactor

    uniforms.uMouse.value.copy(mouseRef.current)
    uniforms.uResolution.value.copy(resolutionRef.current)
  })

  return (
    <ScreenQuad>
      <rawShaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        glslVersion={GLSL3}
        depthWrite={false}
        depthTest={false}
      />
    </ScreenQuad>
  )
}
