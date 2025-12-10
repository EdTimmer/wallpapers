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
  activeColor?: string
  proximity?: number
  speedTrigger?: number
  shockRadius?: number
  shockStrength?: number
  maxSpeed?: number
  resistance?: number
  returnDuration?: number
  mouseInteraction?: boolean
  opacity?: number
}

export default function DotGrid({
  dotSize = 4,
  gap = 19,
  baseColor = '#1a1a1a',
  activeColor = '#ffffff',
  proximity = 70,
  speedTrigger = 100,
  shockRadius = 100,
  shockStrength = 9,
  maxSpeed = 5000,
  resistance = 650,
  returnDuration = 1.6,
  mouseInteraction = true,
  opacity = 1.0
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

  const [
    {
      dotSize: dotSizeCtrl,
      gap: gapCtrl,
      baseColor: baseColorCtrl,
      activeColor: activeColorCtrl,
      proximity: proximityCtrl,
      speedTrigger: speedTriggerCtrl,
      shockRadius: shockRadiusCtrl,
      shockStrength: shockStrengthCtrl,
      maxSpeed: maxSpeedCtrl,
      resistance: resistanceCtrl,
      returnDuration: returnDurationCtrl,
      mouseInteraction: mouseInteractionCtrl,
      opacity: opacityCtrl,
      pixelRatio: pixelRatioCtrl
    },
    setControls
  ] = useControls(
    'DotGrid',
    () => ({
      dotSize: { value: dotSize, min: 4, max: 50, step: 1, label: 'Dot Size' },
      gap: { value: gap, min: 4, max: 100, step: 1, label: 'Gap' },
      baseColor: { value: baseColor, label: 'Base Color' },
      activeColor: { value: activeColor, label: 'Active Color' },
      proximity: { value: proximity, min: 50, max: 500, step: 10, label: 'Proximity' },
      speedTrigger: { value: speedTrigger, min: 10, max: 500, step: 10, label: 'Speed Trigger' },
      shockRadius: { value: shockRadius, min: 50, max: 500, step: 10, label: 'Shock Radius' },
      shockStrength: { value: shockStrength, min: 1, max: 20, step: 0.5, label: 'Shock Strength' },
      maxSpeed: { value: maxSpeed, min: 1000, max: 10000, step: 100, label: 'Max Speed' },
      resistance: { value: resistance, min: 100, max: 2000, step: 50, label: 'Resistance' },
      returnDuration: { value: returnDuration, min: 0.5, max: 5, step: 0.1, label: 'Return Duration' },
      mouseInteraction: { value: mouseInteraction, label: 'Mouse Interaction' },
      opacity: { value: opacity, min: 0, max: 1, step: 0.01, label: 'Opacity' },
      pixelRatio: { value: DEFAULT_PIXEL_RATIO, min: 0.3, max: 2, step: 0.05, label: 'Render DPR' },
      'Reset DotGrid': button(() => {
        setControls({
          dotSize,
          gap,
          baseColor,
          activeColor,
          proximity,
          speedTrigger,
          shockRadius,
          shockStrength,
          maxSpeed,
          resistance,
          returnDuration,
          mouseInteraction,
          opacity,
          pixelRatio: DEFAULT_PIXEL_RATIO
        })
      })
    }),
    [dotSize, gap, baseColor, activeColor, proximity, speedTrigger, shockRadius, shockStrength, maxSpeed, resistance, returnDuration, mouseInteraction, opacity]
  )

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionRef.current },
      uMouse: { value: smoothMousePos.current.clone() },
      uDotSize: { value: dotSize },
      uGap: { value: gap },
      uBaseColor: { value: new Vector3(...Object.values(hexToRgb(baseColor))) },
      uActiveColor: { value: new Vector3(...Object.values(hexToRgb(activeColor))) },
      uProximity: { value: proximity },
      uSpeedTrigger: { value: speedTrigger },
      uShockRadius: { value: shockRadius },
      uShockStrength: { value: shockStrength },
      uMaxSpeed: { value: maxSpeed },
      uResistance: { value: resistance },
      uReturnDuration: { value: returnDuration },
      uMouseActiveFactor: { value: 0 },
      uOpacity: { value: opacity }
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
    const activeRgb = hexToRgb(activeColorCtrl)
    u.uActiveColor.value.set(activeRgb.r, activeRgb.g, activeRgb.b)
    u.uProximity.value = proximityCtrl
    u.uSpeedTrigger.value = speedTriggerCtrl
    u.uShockRadius.value = shockRadiusCtrl
    u.uShockStrength.value = shockStrengthCtrl
    u.uMaxSpeed.value = maxSpeedCtrl
    u.uResistance.value = resistanceCtrl
    u.uReturnDuration.value = returnDurationCtrl
    u.uOpacity.value = opacityCtrl
    materialRef.current.transparent = true
  }, [
    dotSizeCtrl,
    gapCtrl,
    baseColorCtrl,
    activeColorCtrl,
    proximityCtrl,
    speedTriggerCtrl,
    shockRadiusCtrl,
    shockStrengthCtrl,
    maxSpeedCtrl,
    resistanceCtrl,
    returnDurationCtrl,
    opacityCtrl
  ])

  useEffect(() => {
    if (!mouseInteractionCtrl) {
      targetMouseActive.current = 0
      targetMousePos.current.set(0.5, 0.5)
      return
    }

    const canvas = gl.domElement

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = 1 - (event.clientY - rect.top) / rect.height
      targetMousePos.current.set(x, y)
      targetMouseActive.current = 1
    }

    const handlePointerLeave = () => {
      targetMouseActive.current = 0
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [gl, mouseInteractionCtrl])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return

    material.uniforms.uTime.value = state.clock.elapsedTime

    const lerpFactor = 0.1
    smoothMousePos.current.lerp(targetMousePos.current, lerpFactor)
    smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * lerpFactor

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