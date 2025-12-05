// This component is an adaptation of Galaxy.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ScreenQuad } from '@react-three/drei'
import { RawShaderMaterial, Vector2, Vector3, GLSL3 } from 'three'
import { button, useControls } from 'leva'
import vertexShader from '@shaders/galaxy/vertex.glsl'
// import fragmentShader from '@shaders/galaxy/fragment_simple.glsl'
import fragmentShader from '@shaders/galaxy/fragment_spikes.glsl'

const DEFAULT_PIXEL_RATIO = 0.7

type GalaxySimpleProps = {
  focal?: [number, number]
  rotation?: [number, number]
  starSpeed?: number
  density?: number
  hueShift?: number
  disableAnimation?: boolean
  speed?: number
  mouseInteraction?: boolean
  glowIntensity?: number
  saturation?: number
  mouseRepulsion?: boolean
  repulsionStrength?: number
  twinkleIntensity?: number
  rotationSpeed?: number
  autoCenterRepulsion?: number
  transparent?: boolean
  opacity?: number
}

export default function GalaxySimple({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.5,
  saturation = 0.0,
  mouseRepulsion = false,
  repulsionStrength = 2,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = true,
  opacity = 1.0
}: GalaxySimpleProps) {
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
      focalX,
      focalY,
      rotationX,
      rotationY,
      starSpeed: starSpeedCtrl,
      density: densityCtrl,
      hueShift: hueShiftCtrl,
      disableAnimation: disableAnimationCtrl,
      speed: speedCtrl,
      mouseInteraction: mouseInteractionCtrl,
      glowIntensity: glowIntensityCtrl,
      saturation: saturationCtrl,
      mouseRepulsion: mouseRepulsionCtrl,
      repulsionStrength: repulsionStrengthCtrl,
      twinkleIntensity: twinkleIntensityCtrl,
      rotationSpeed: rotationSpeedCtrl,
      autoCenterRepulsion: autoCenterRepulsionCtrl,
      transparent: transparentCtrl,
      opacity: opacityCtrl,
      pixelRatio: pixelRatioCtrl
    },
    setControls
  ] = useControls(
    'Galaxy',
    () => ({
      focalX: { value: focal[0], min: 0, max: 1, step: 0.001, label: 'Focal X' },
      focalY: { value: focal[1], min: 0, max: 1, step: 0.001, label: 'Focal Y' },
      rotationX: { value: rotation[0], min: -1, max: 1, step: 0.01, label: 'Rotation X' },
      rotationY: { value: rotation[1], min: -1, max: 1, step: 0.01, label: 'Rotation Y' },
      starSpeed: { value: starSpeed, min: 0, max: 3, step: 0.01, label: 'Star Speed' },
      density: { value: density, min: 0.1, max: 4, step: 0.05, label: 'Density' },
      hueShift: { value: hueShift, min: 0, max: 360, step: 1, label: 'Hue Shift' },
      disableAnimation: { value: disableAnimation, label: 'Disable Animation' },
      speed: { value: speed, min: 0.1, max: 5, step: 0.05, label: 'Speed' },
      mouseInteraction: { value: mouseInteraction, label: 'Mouse Interaction' },
      glowIntensity: { value: glowIntensity, min: 0, max: 2, step: 0.05, label: 'Glow' },
      saturation: { value: saturation, min: 0, max: 2, step: 0.05, label: 'Saturation' },
      mouseRepulsion: { value: mouseRepulsion, label: 'Mouse Repulsion' },
      repulsionStrength: { value: repulsionStrength, min: 0, max: 5, step: 0.1, label: 'Repulsion Strength' },
      twinkleIntensity: { value: twinkleIntensity, min: 0, max: 1, step: 0.05, label: 'Twinkle' },
      rotationSpeed: { value: rotationSpeed, min: 0, max: 1, step: 0.01, label: 'Auto Rotation Speed' },
      autoCenterRepulsion: { value: autoCenterRepulsion, min: 0, max: 5, step: 0.1, label: 'Auto Center Repulsion' },
      transparent: { value: transparent, label: 'Transparent Background' },
      opacity: { value: opacity, min: 0, max: 1, step: 0.01, label: 'Opacity' },
      pixelRatio: { value: DEFAULT_PIXEL_RATIO, min: 0.3, max: 2, step: 0.05, label: 'Render DPR' },
      'Reset Galaxy': button(() => {
        setControls({
          focalX: focal[0],
          focalY: focal[1],
          rotationX: rotation[0],
          rotationY: rotation[1],
          starSpeed,
          density,
          hueShift,
          disableAnimation,
          speed,
          mouseInteraction,
          glowIntensity,
          saturation,
          mouseRepulsion,
          repulsionStrength,
          twinkleIntensity,
          rotationSpeed,
          autoCenterRepulsion,
          transparent,
          opacity,
          pixelRatio: DEFAULT_PIXEL_RATIO
        })
      })
    }),
    [
      focal[0],
      focal[1],
      rotation[0],
      rotation[1],
      starSpeed,
      density,
      hueShift,
      disableAnimation,
      speed,
      mouseInteraction,
      glowIntensity,
      saturation,
      mouseRepulsion,
      repulsionStrength,
      twinkleIntensity,
      rotationSpeed,
      autoCenterRepulsion,
      transparent,
      opacity
    ]
  )

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionRef.current },
      uFocal: { value: new Vector2(0.5, 0.5) },
      uRotation: { value: new Vector2(1.0, 0.0) },
      uStarSpeed: { value: 0 },
      uDensity: { value: 1 },
      uHueShift: { value: 140 },
      uSpeed: { value: 1 },
      uMouse: { value: smoothMousePos.current.clone() },
      uGlowIntensity: { value: 0.3 },
      uSaturation: { value: 0 },
      uMouseRepulsion: { value: true },
      uTwinkleIntensity: { value: 0.3 },
      uRotationSpeed: { value: 0.1 },
      uRepulsionStrength: { value: 2 },
      uMouseActiveFactor: { value: 0 },
      uAutoCenterRepulsion: { value: 0 },
      uTransparent: { value: true },
      uOpacity: { value: 1.0 }
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
    u.uFocal.value.set(focalX, focalY)
    u.uRotation.value.set(rotationX, rotationY)
    u.uDensity.value = densityCtrl
    u.uHueShift.value = hueShiftCtrl
    u.uSpeed.value = speedCtrl
    u.uGlowIntensity.value = glowIntensityCtrl
    u.uSaturation.value = saturationCtrl
    u.uMouseRepulsion.value = mouseRepulsionCtrl
    u.uTwinkleIntensity.value = twinkleIntensityCtrl
    u.uRotationSpeed.value = rotationSpeedCtrl
    u.uRepulsionStrength.value = repulsionStrengthCtrl
    u.uAutoCenterRepulsion.value = autoCenterRepulsionCtrl
    u.uTransparent.value = transparentCtrl
    u.uOpacity.value = opacityCtrl
    materialRef.current.transparent = transparentCtrl
  }, [
    focalX,
    focalY,
    rotationX,
    rotationY,
    densityCtrl,
    hueShiftCtrl,
    speedCtrl,
    glowIntensityCtrl,
    saturationCtrl,
    mouseRepulsionCtrl,
    twinkleIntensityCtrl,
    rotationSpeedCtrl,
    repulsionStrengthCtrl,
    autoCenterRepulsionCtrl,
    transparentCtrl,
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

    if (!disableAnimationCtrl) {
      const elapsed = state.clock.elapsedTime
      material.uniforms.uTime.value = elapsed
      material.uniforms.uStarSpeed.value = (elapsed * starSpeedCtrl) / 10.0
    }

    const lerpFactor = 0.05
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
        transparent={transparentCtrl}
        depthWrite={false}
        depthTest={false}
      />
    </ScreenQuad>
  )
}
