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
  shockRadius?: number
  shockStrength?: number
  shockSpeed?: number
  shockDuration?: number
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
  mouseInteraction = true,
  shockRadius = 400,
  shockStrength = 0.5,
  shockSpeed = 1.2,
  shockDuration = 2.0,
}: DotGridProps) {
  const materialRef = useRef<RawShaderMaterial | null>(null)
  const { gl, size } = useThree()
  // Initialize with a safe default, will be updated in useEffect
  const resolutionRef = useRef(
    new Vector3(
      size.width,
      size.height,
      size.width / Math.max(size.height, 1)
    )
  )

  const targetMousePos = useRef(new Vector2(0.5, 0.5))
  const smoothMousePos = useRef(new Vector2(0.5, 0.5))
  const targetMouseActive = useRef(0)
  const smoothMouseActive = useRef(0)
  const originalDprRef = useRef(0) // Will be set on mount
  const lastTapTime = useRef(0)
  const shockDurationRef = useRef(shockDuration)

  // Track active tap distortions
  interface TapDistortion {
    position: Vector2;
    startTime: number;
    strength: number;
  }
  const activeDistortionsRef = useRef<TapDistortion[]>([]);

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
      shockRadius: shockRadiusCtrl,
      shockStrength: shockStrengthCtrl,
      shockSpeed: shockSpeedCtrl,
      shockDuration: shockDurationCtrl,
      pixelRatio: pixelRatioCtrl,
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
      shockRadius: { value: shockRadius, min: 100, max: 1000, step: 10, label: 'Shock Radius' },
      shockStrength: { value: shockStrength, min: 0, max: 5, step: 0.05, label: 'Shock Strength' },
      shockSpeed: { value: shockSpeed, min: 0.1, max: 3, step: 0.1, label: 'Shock Speed' },
      shockDuration: { value: shockDuration, min: 0.5, max: 5, step: 0.1, label: 'Shock Duration' },
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
          shockRadius,
          shockStrength,
          shockSpeed,
          shockDuration,
          pixelRatio: DEFAULT_PIXEL_RATIO
        })
      })
    }),
    [dotSize, gap, baseColor, baseOpacity, activeColor, activeOpacity, proximity, activeDuration, mouseInteraction, shockRadius, shockStrength, shockSpeed, shockDuration]
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
      uShockRadius: { value: shockRadius },
      uShockStrength: { value: shockStrength },
      uShockSpeed: { value: shockSpeed },
      uMouseActiveFactor: { value: 0 },
      // Tap distortion uniforms (support up to 10 simultaneous taps)
      uTapPositions: {
        value: new Array(10).fill(null).map(() => new Vector2(0, 0)),
      },
      uTapStrengths: { value: new Array(10).fill(0) },
      uTapTimes: { value: new Array(10).fill(0) },
      uNumTaps: { value: 0 },
    }),
    []
  )

  // Initialize DPR and resolution on mount
  useEffect(() => {
    originalDprRef.current = gl.getPixelRatio()
  }, [gl])

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
    u.uShockRadius.value = shockRadiusCtrl
    u.uShockStrength.value = shockStrengthCtrl
    u.uShockSpeed.value = shockSpeedCtrl
    shockDurationRef.current = shockDurationCtrl
    materialRef.current.transparent = true
  }, [
    dotSizeCtrl,
    gapCtrl,
    baseColorCtrl,
    baseOpacityCtrl,
    activeColorCtrl,
    activeOpacityCtrl,
    proximityCtrl,
    shockRadiusCtrl,
    shockStrengthCtrl,
    shockSpeedCtrl,
    shockDurationCtrl,
    activeDurationCtrl,
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

      // Create a new tap distortion
      const newDistortion: TapDistortion = {
        position: new Vector2(x, y),
        startTime: performance.now() / 1000, // Convert to seconds
        strength: shockStrengthCtrl,
      };
      activeDistortionsRef.current.push(newDistortion);

      // Limit to 10 active distortions
      if (activeDistortionsRef.current.length > 10) {
        activeDistortionsRef.current.shift();
      }
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
  }, [gl, mouseInteractionCtrl, shockStrengthCtrl])

  useFrame((state) => {
    const material = materialRef.current
    if (!material) return

    material.uniforms.uTime.value = state.clock.elapsedTime

    // Direct assignment for immediate effect at tap position
    smoothMousePos.current.copy(targetMousePos.current)

    // Calculate decay based on time since last tap
    const now = performance.now();
    const timeSinceTap = (now - lastTapTime.current) / 1000; // Convert to seconds

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

    // Update tap distortion uniforms
    const currentTime = state.clock.elapsedTime;

    // Remove expired distortions
    activeDistortionsRef.current = activeDistortionsRef.current.filter(
      tap => currentTime - tap.startTime < shockDurationRef.current
    );

    // Update uniforms with active distortions
    const activeTaps = activeDistortionsRef.current;
    material.uniforms.uNumTaps.value = Math.min(activeTaps.length, 10);

    for (let i = 0; i < 10; i++) {
      if (i < activeTaps.length) {
        const tap = activeTaps[i];
        const elapsed = currentTime - tap.startTime;
        const progress = Math.min(elapsed / shockDurationRef.current, 1.0);

        // Smooth onset and elastic ease-out
        const onsetDuration = 0.15; // 150ms for smooth onset
        const smoothEase = (t: number) => {
          if (t < onsetDuration / shockDurationRef.current) {
            // Smooth onset phase - ease in cubic
            const onsetProgress = t / (onsetDuration / shockDurationRef.current);
            return onsetProgress * onsetProgress * (3 - 2 * onsetProgress);
          } else {
            // Elastic ease-out for return
            const returnProgress =
              (t - onsetDuration / shockDurationRef.current) /
              (1 - onsetDuration / shockDurationRef.current);
            const c4 = (2 * Math.PI) / 3;
            const elasticOut =
              returnProgress === 0
                ? 0
                : returnProgress === 1
                  ? 1
                  : Math.pow(2, -10 * returnProgress) *
                      Math.sin((returnProgress * 10 - 0.75) * c4) +
                    1;
            return 1 - elasticOut;
          }
        };

        const strength = tap.strength * smoothEase(progress);

        material.uniforms.uTapPositions.value[i].copy(tap.position);
        material.uniforms.uTapStrengths.value[i] = strength;
        material.uniforms.uTapTimes.value[i] = elapsed;
      } else {
        material.uniforms.uTapStrengths.value[i] = 0;
      }
    }

    const ratio = state.gl.getPixelRatio()
    const width = state.size.width * ratio
    const height = state.size.height * ratio
    if (resolutionRef.current.x !== width || resolutionRef.current.y !== height) {
      resolutionRef.current.set(width, height, width / Math.max(height, 1))
      material.uniforms.uResolution.value = resolutionRef.current
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