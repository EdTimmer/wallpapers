// This component is an adaptation of PrismaticBurst.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RawShaderMaterial, Vector2, DataTexture, RGBAFormat, LinearFilter, ClampToEdgeWrapping, GLSL3 } from 'three'
import { ScreenQuad } from '@react-three/drei'
import { useControls, button, monitor, levaStore } from 'leva'
import vertexShader from '@shaders/prismaticBurst/vertex.glsl'
import fragmentShader from '@shaders/prismaticBurst/fragment.glsl'

type PrismaticBurstProps = {
  colors?: string[]
  speed?: number
  intensity?: number
  animType?: number
  distort?: number
  noiseAmount?: number
  rayCount?: number
  opacity?: number
  pixelRatio?: number
  vignette?: number
  vignetteOpacity?: number
}

type ColorObjectValue = {
  r: number
  g: number
  b: number
  a?: number
}

type ColorControlValue = string | ColorObjectValue

const OPTIONAL_COLOR_DISABLED = '#000000' as const

const toColorTuple = (source?: readonly string[]): [string, string, string] => [
  source?.[0] ?? OPTIONAL_COLOR_DISABLED,
  source?.[1] ?? OPTIONAL_COLOR_DISABLED,
  source?.[2] ?? OPTIONAL_COLOR_DISABLED
]

const DEFAULTS = {
  uSpeed: 0.5,
  uIntensity: 2.0,
  uAnimType: 1, // rotate3d
  uDistort: 0,
  uOffset: [0, 0],
  uNoiseAmount: 0.05,
  uRayCount: 0,
  uOpacity: 1.0,
  pixelRatio: 0.5,
  uVignette: 0.0,
  uVignetteOpacity: 1.0
} as const

// Helper function to convert hex color to RGB array
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const hexToRgb = (hex: string): [number, number, number] => {
  let cleanHex = hex.trim().replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((char) => char + char)
      .join('')
  }
  if (cleanHex.length !== 6) return [1, 1, 1]
  const intVal = parseInt(cleanHex, 16)
  if (Number.isNaN(intVal)) return [1, 1, 1]
  const r = ((intVal >> 16) & 255) / 255
  const g = ((intVal >> 8) & 255) / 255
  const b = (intVal & 255) / 255
  return [r, g, b]
}

const rgbStringToRgb = (rgbString: string): [number, number, number] => {
  const match = rgbString.match(/rgba?\(([^)]+)\)/i)
  if (!match) return [1, 1, 1]
  const [r = 255, g = 255, b = 255] = match[1]
    .split(',')
    .slice(0, 3)
    .map((value) => parseFloat(value.trim()))
  return [clamp01(r / 255), clamp01(g / 255), clamp01(b / 255)]
}

const normalizeColorComponent = (component: number | undefined) => {
  if (typeof component !== 'number' || Number.isNaN(component)) return 0
  return component > 1 ? clamp01(component / 255) : clamp01(component)
}

const colorValueToRgb = (value?: ColorControlValue): [number, number, number] => {
  if (!value) return [1, 1, 1]
  if (typeof value === 'string') {
    const color = value.trim()
    if (!color) return [1, 1, 1]
    if (color.startsWith('#')) return hexToRgb(color)
    if (color.startsWith('rgb')) return rgbStringToRgb(color)
    return hexToRgb(color)
  }

  return [
    normalizeColorComponent(value.r),
    normalizeColorComponent(value.g),
    normalizeColorComponent(value.b)
  ]
}

export default function PrismaticBurst({ 
  colors,
  speed = DEFAULTS.uSpeed,
  intensity = DEFAULTS.uIntensity,
  animType = DEFAULTS.uAnimType,
  distort = DEFAULTS.uDistort,
  noiseAmount = DEFAULTS.uNoiseAmount,
  rayCount = DEFAULTS.uRayCount,
  opacity = DEFAULTS.uOpacity,
  pixelRatio = DEFAULTS.pixelRatio,
  vignette = DEFAULTS.uVignette,
  vignetteOpacity = DEFAULTS.uVignetteOpacity
}: PrismaticBurstProps = {}) {
  const materialRef = useRef<RawShaderMaterial>(null!)
  const mouseRef = useRef<Vector2>(new Vector2(0.5, 0.5))
  const elapsedRef = useRef(0)
  const fpsRef = useRef(0)
  const frameMsRef = useRef(0)
  const { size, gl } = useThree()
  const resolutionRef = useRef<Vector2>(
    new Vector2(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
  )

  const gradientTextureRef = useRef<DataTexture | null>(null)

  // Store current color values in ref (not actively used but kept for potential future use)
  const colorValuesRef = useRef<[ColorControlValue, ColorControlValue, ColorControlValue]>([
    OPTIONAL_COLOR_DISABLED,
    OPTIONAL_COLOR_DISABLED,
    OPTIONAL_COLOR_DISABLED
  ])

  const colorControls = useControls(
    'Prismatic Burst Colors',
    {
      color1: { value: OPTIONAL_COLOR_DISABLED, label: 'Color 1' },
      color2: { value: OPTIONAL_COLOR_DISABLED, label: 'Color 2' },
      color3: { value: OPTIONAL_COLOR_DISABLED, label: 'Color 3' }
    }
  )

  // Store the current color count in a ref for useFrame
  const colorCountRef = useRef(0)

  // Update texture when colors change - recreate it like the original
  useEffect(() => {
    if (!gradientTextureRef.current || !materialRef.current) {
      return
    }
    
    const newColors: [ColorControlValue, ColorControlValue, ColorControlValue] = [
      colorControls.color1,
      colorControls.color2,
      colorControls.color3
    ]
    
    colorValuesRef.current = newColors
    
    // Filter to only active (non-black) colors
    const activeColors = newColors.filter(c => isColorActive(c))
    
    if (activeColors.length === 0) {
      // No custom colors - use spectral mode
      colorCountRef.current = 0
    } else {
      // Recreate texture with only active colors (matching original react-bits behavior)
      // Texture width = number of active colors for proper gradient sampling
      const count = activeColors.length
      const data = new Uint8Array(count * 4)
      
      for (let i = 0; i < count; i++) {
        const rgb = colorValueToRgb(activeColors[i])
        data[i * 4 + 0] = Math.round(rgb[0] * 255)
        data[i * 4 + 1] = Math.round(rgb[1] * 255)
        data[i * 4 + 2] = Math.round(rgb[2] * 255)
        data[i * 4 + 3] = 255
      }
      
      // Create new texture with width matching active color count
      const newTexture = new DataTexture(data, count, 1, RGBAFormat)
      newTexture.minFilter = LinearFilter
      newTexture.magFilter = LinearFilter
      newTexture.wrapS = ClampToEdgeWrapping
      newTexture.wrapT = ClampToEdgeWrapping
      newTexture.needsUpdate = true
      
      // Update the ref and material uniform
      gradientTextureRef.current = newTexture
      materialRef.current.uniforms.uGradient.value = newTexture
      
      // Store color count
      colorCountRef.current = count
    }
    
  }, [colorControls.color1, colorControls.color2, colorControls.color3])

  // Helper to check if a color is black (disabled)
  const isColorActive = (color: ColorControlValue): boolean => {
    if (typeof color === 'string') {
      const normalized = color.trim().toLowerCase()
      return normalized !== '#000000' && normalized !== '#000' && normalized !== 'black'
    }
    const r = normalizeColorComponent(color.r)
    const g = normalizeColorComponent(color.g)
    const b = normalizeColorComponent(color.b)
    return r > 0 || g > 0 || b > 0
  }

  // Initialize gradient colors from props only (used for initial texture creation)
  const gradientColors = useMemo<ColorControlValue[]>(() => {
    if (Array.isArray(colors) && colors.length > 0) {
      return colors
    }
    // Empty array = spectral mode by default (no custom colors from props)
    return []
  }, [colors])

  const [{ uSpeed, uIntensity, uAnimType, uDistort, uNoiseAmount, uRayCount, uOpacity, pixelRatio: pixelRatioCtrl, vignette: vignetteCtrl, vignetteOpacity: vignetteOpacityCtrl }, setMain] = useControls('Prismatic Burst', () => ({
    uSpeed: { value: speed, min: 0, max: 3, step: 0.01, label: 'Speed' },
    uIntensity: { value: intensity, min: 0, max: 5, step: 0.1, label: 'Intensity' },
    uAnimType: { 
      value: animType, 
      options: { 'Rotate': 0, 'Rotate 3D': 1, 'Hover': 2 },
      label: 'Animation Type' 
    },
    uDistort: { value: distort, min: 0, max: 10, step: 0.1, label: 'Distortion' },
    uNoiseAmount: { value: noiseAmount, min: 0, max: 1, step: 0.01, label: 'Noise' },
    uRayCount: { value: rayCount, min: 0, max: 24, step: 1, label: 'Ray Count' },
    uOpacity: { value: opacity, min: 0, max: 1, step: 0.01, label: 'Opacity' },
    vignette: { value: vignette, min: 0, max: 2, step: 0.05, label: 'Vignette' },
    vignetteOpacity: { value: vignetteOpacity, min: 0, max: 1, step: 0.01, label: 'Vignette Opacity' },
    pixelRatio: { value: pixelRatio, min: 0.5, max: 2, step: 0.05, label: 'Render DPR' },
    'Reset All': button(() => {
      setMain({
        uSpeed: speed,
        uIntensity: intensity,
        uAnimType: animType,
        uDistort: distort,
        uNoiseAmount: noiseAmount,
        uRayCount: rayCount,
        uOpacity: opacity,
        vignette: vignette,
        vignetteOpacity: vignetteOpacity,
        pixelRatio: pixelRatio
      })
      // Reset colors using Leva store - set each color individually
      const resetColors = toColorTuple(colors)
      levaStore.setValueAtPath('Prismatic Burst Colors.color1', resetColors[0], false)
      levaStore.setValueAtPath('Prismatic Burst Colors.color2', resetColors[1], false)
      levaStore.setValueAtPath('Prismatic Burst Colors.color3', resetColors[2], false)
    })
  }), [
    speed,
    intensity,
    animType,
    distort,
    noiseAmount,
    rayCount,
    opacity,
    pixelRatio,
    colors,
    vignette,
    vignetteOpacity
  ])

  useControls('Diagnostics', () => ({
    FPS: monitor(() => fpsRef.current, { graph: true, interval: 250 }),
    FrameMs: monitor(() => frameMsRef.current, { graph: true, interval: 250 })
  }),
  { collapsed: true })

  // Create initial gradient texture (will be recreated in useEffect when colors change)
  const gradientTexture = useMemo(() => {
    // Start with 3-slot texture initialized to black for Leva color controls
    const defaultColors = [OPTIONAL_COLOR_DISABLED, OPTIONAL_COLOR_DISABLED, OPTIONAL_COLOR_DISABLED]
    const colorsToUse = gradientColors.length > 0 ? gradientColors : defaultColors
    const width = 3
    const data = new Uint8Array(width * 4)
    
    // Fill with provided colors or defaults
    for (let i = 0; i < width; i++) {
      const color = colorsToUse[i] || OPTIONAL_COLOR_DISABLED
      const rgb = colorValueToRgb(color)
      data[i * 4 + 0] = Math.round(rgb[0] * 255)
      data[i * 4 + 1] = Math.round(rgb[1] * 255)
      data[i * 4 + 2] = Math.round(rgb[2] * 255)
      data[i * 4 + 3] = 255
    }

    const texture = new DataTexture(data, width, 1, RGBAFormat)
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.wrapS = ClampToEdgeWrapping
    texture.wrapT = ClampToEdgeWrapping
    texture.needsUpdate = true
    gradientTextureRef.current = texture
    return texture
  }, [gradientColors])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionRef.current },
      uSpeed: { value: speed },
      uIntensity: { value: intensity },
      uAnimType: { value: animType },
      uMouse: { value: mouseRef.current },
      uDistort: { value: distort },
      uOffset: { value: new Vector2(0, 0) },
      uNoiseAmount: { value: noiseAmount },
      uRayCount: { value: rayCount },
      uOpacity: { value: opacity },
      uColorCount: { value: 0 }, // Start with 0 (spectral mode), updated in useFrame
      uGradient: { value: gradientTexture },
      uVignette: { value: vignette },
      uVignetteOpacity: { value: vignetteOpacity }
    }),
    [gradientTexture, speed, intensity, animType, distort, noiseAmount, rayCount, opacity, vignette, vignetteOpacity]
  )

  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uGradient.value = gradientTexture
  }, [gradientTexture])

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uSpeed.value = uSpeed
      materialRef.current.uniforms.uIntensity.value = uIntensity
      materialRef.current.uniforms.uAnimType.value = uAnimType
      materialRef.current.uniforms.uDistort.value = uDistort
      materialRef.current.uniforms.uNoiseAmount.value = uNoiseAmount
      materialRef.current.uniforms.uRayCount.value = uRayCount
      materialRef.current.uniforms.uOpacity.value = uOpacity
      materialRef.current.uniforms.uVignette.value = vignetteCtrl
      materialRef.current.uniforms.uVignetteOpacity.value = vignetteOpacityCtrl
    }
  }, [uSpeed, uIntensity, uAnimType, uDistort, uNoiseAmount, uRayCount, uOpacity, vignetteCtrl, vignetteOpacityCtrl])

  useEffect(() => {
    const cappedDpr = Math.min(gl.getPixelRatio(), 2)
    resolutionRef.current.set(size.width * cappedDpr, size.height * cappedDpr)
  }, [gl, size.height, size.width])

  useEffect(() => {
    const originalDpr = gl.getPixelRatio()
    const targetDpr = Math.min(originalDpr, pixelRatioCtrl)
    if (targetDpr !== originalDpr) {
      gl.setPixelRatio(targetDpr)
    }
    return () => {
      gl.setPixelRatio(originalDpr)
    }
  }, [gl, pixelRatioCtrl])

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
    
    // Update color count from ref - this runs every frame without blocking
    uniforms.uColorCount.value = colorCountRef.current
  })

  return (
    <ScreenQuad>
      <rawShaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        glslVersion={GLSL3}
        transparent={true}
        depthWrite={false}
        depthTest={false}
      />
    </ScreenQuad>
  )
}
