// This component is an adaptation of DotGrid.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ScreenQuad } from '@react-three/drei'
import { RawShaderMaterial, Vector2, Vector3, GLSL3 } from 'three'
import { button, useControls } from 'leva'
import vertexShader from '@shaders/dotgrid/vertex.glsl'
import fragmentShader from '@shaders/dotgrid/fragment.glsl'

const DEFAULT_PIXEL_RATIO = 1.0

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(m[1], 16) / 255,
    g: parseInt(m[2], 16) / 255,
    b: parseInt(m[3], 16) / 255
  }
}

type DotGridProps = {
  dotSize?: number
  gap?: number
  baseColor?: string
  baseOpacity?: number
  activeColor?: string
  activeOpacity?: number
  proximity?: number
  activeDuration?: number
  mouseInteraction?: boolean
}

export default function DotGrid({
  dotSize = 4,
  gap = 19,
  baseColor = '#1a1a1a',
  baseOpacity = 1.0,
  activeColor = '#ffffff',
  activeOpacity = 1.0,
  proximity = 70,
  activeDuration = 1.0,
  mouseInteraction = true
}: DotGridProps) {
  const materialRef = useRef<RawShaderMaterial | null>(null)
  const { gl, size } = useThree()
  const dpr = gl.getPixelRatio()
  const resolutionRef = useRef(
    new Vector3(
      size.width * dpr,
      size.height * dpr,
      size.width / Math.max(size.height, 1)
    )
  )

  const targetMousePos = useRef(new Vector2(0.5, 0.5))
  const smoothMousePos = useRef(new Vector2(0.5, 0.5))
  const targetMouseActive = useRef(0)
  const smoothMouseActive = useRef(0)
  const originalDprRef = useRef(gl.getPixelRatio())
  const lastTapTime = useRef(0)

  const [
    {
      dotSize: dotSizeCtrl,
      gap: gapCtrl,
      baseColor: baseColorCtrl,
      baseOpacity: baseOpacityCtrl,
      activeColor: activeColorCtrl,
      activeOpacity: activeOpacityCtrl,
      proximity: proximityCtrl,
      activeDuration: activeDurationCtrl,
      mouseInteraction: mouseInteractionCtrl,
      pixelRatio: pixelRatioCtrl
    },
    setControls
  ] = useControls(
    'DotGrid',
    () => ({
      dotSize: { value: dotSize, min: 4, max: 50, step: 1, label: 'Dot Size' },
      gap: { value: gap, min: 4, max: 100, step: 1, label: 'Gap' },
      baseColor: { value: baseColor, label: 'Base Color' },
      baseOpacity: { value: baseOpacity, min: 0, max: 1, step: 0.01, label: 'Base Opacity' },
      activeColor: { value: activeColor, label: 'Active Color' },
      activeOpacity: { value: activeOpacity, min: 0, max: 1, step: 0.01, label: 'Active Opacity' },
      proximity: { value: proximity, min: 50, max: 500, step: 10, label: 'Proximity' },
      activeDuration: { value: activeDuration, min: 0.5, max: 5, step: 0.1, label: 'Active Duration' },
      mouseInteraction: { value: mouseInteraction, label: 'Mouse Interaction' },
      pixelRatio: { value: DEFAULT_PIXEL_RATIO, min: 0.3, max: 2, step: 0.05, label: 'Render DPR' },
      'Reset DotGrid': button(() => {
        setControls({
          dotSize,
          gap,
          baseColor,
          baseOpacity,
          activeColor,
          activeOpacity,
          proximity,
          activeDuration,
          mouseInteraction,
          pixelRatio: DEFAULT_PIXEL_RATIO
        })
      })
    }),
    [dotSize, gap, baseColor, baseOpacity, activeColor, activeOpacity, proximity, activeDuration, mouseInteraction]
  )

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionRef.current },
      uMouse: { value: smoothMousePos.current.clone() },
      uDotSize: { value: dotSize },
      uGap: { value: gap },
      uBaseColor: { value: new Vector3(...Object.values(hexToRgb(baseColor))) },
      uBaseOpacity: { value: baseOpacity },
      uActiveColor: { value: new Vector3(...Object.values(hexToRgb(activeColor))) },
      uActiveOpacity: { value: activeOpacity },
      uProximity: { value: proximity },
      uMouseActiveFactor: { value: 0 }
    }),
    []
  )

  useEffect(() => {
    const ratio = gl.getPixelRatio()
    resolutionRef.current.set(
      size.width * ratio,
      size.height * ratio,
      size.width / Math.max(size.height, 1)
    )
    if (materialRef.current) {
      materialRef.current.uniforms.uResolution.value = resolutionRef.current
    }
  }, [gl, pixelRatioCtrl, size.height, size.width])

  useEffect(() => {
    const targetDpr = Math.min(originalDprRef.current, pixelRatioCtrl)
    if (gl.getPixelRatio() !== targetDpr) {
      gl.setPixelRatio(targetDpr)
    }
  }, [gl, pixelRatioCtrl])

  useEffect(() => {
    return () => {
      gl.setPixelRatio(originalDprRef.current)
    }
  }, [gl])

  useEffect(() => {
    if (!materialRef.current) return
    const { uniforms: u } = materialRef.current
    u.uDotSize.value = dotSizeCtrl
    u.uGap.value = gapCtrl
    const baseRgb = hexToRgb(baseColorCtrl)
    u.uBaseColor.value.set(baseRgb.r, baseRgb.g, baseRgb.b)
    u.uBaseOpacity.value = baseOpacityCtrl
    const activeRgb = hexToRgb(activeColorCtrl)
    u.uActiveColor.value.set(activeRgb.r, activeRgb.g, activeRgb.b)
    u.uActiveOpacity.value = activeOpacityCtrl
    u.uProximity.value = proximityCtrl
    materialRef.current.transparent = true
  }, [
    dotSizeCtrl,
    gapCtrl,
    baseColorCtrl,
    baseOpacityCtrl,
    activeColorCtrl,
    activeOpacityCtrl,
    proximityCtrl
  ])

  useEffect(() => {
    if (!mouseInteractionCtrl) {
      targetMouseActive.current = 0
      targetMousePos.current.set(0.5, 0.5)
      return
    }

    const canvas = gl.domElement

    const handlePointerDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = 1 - (event.clientY - rect.top) / rect.height
      targetMousePos.current.set(x, y)
      targetMouseActive.current = 1
      lastTapTime.current = performance.now()
    }

    const handlePointerUp = () => {
      targetMouseActive.current = 0
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
    }
  }, [gl, mouseInteractionCtrl])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return

    material.uniforms.uTime.value = state.clock.elapsedTime

    // Direct assignment for immediate effect at tap position
    smoothMousePos.current.copy(targetMousePos.current)

    // Calculate decay based on time since last tap
    const currentTime = performance.now()
    const timeSinceTap = (currentTime - lastTapTime.current) / 1000 // Convert to seconds

    if (targetMouseActive.current > 0) {
      // Tap is active, keep at full strength
      smoothMouseActive.current = 1
    } else if (timeSinceTap < activeDurationCtrl) {
      // Decay over activeDuration seconds
      const decay = 1 - timeSinceTap / activeDurationCtrl
      smoothMouseActive.current = Math.max(0, decay)
    } else {
      // Effect has fully faded
      smoothMouseActive.current = 0
    }

    material.uniforms.uMouse.value.copy(smoothMousePos.current)
    material.uniforms.uMouseActiveFactor.value = smoothMouseActive.current

    const ratio = state.gl.getPixelRatio()
    const width = state.size.width * ratio
    const height = state.size.height * ratio
    if (resolutionRef.current.x !== width || resolutionRef.current.y !== height) {
      resolutionRef.current.set(width, height, width / Math.max(height, 1))
    }
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