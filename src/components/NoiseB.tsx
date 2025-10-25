import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, ShaderMaterial } from 'three'
import { useControls } from 'leva'
import vertexShader from '@shaders/noiseB/vertex_b.glsl'
import fragmentShader from '@shaders/noiseB/fragment_b.glsl'

export default function NoiseB() {
  const meshRef = useRef<Mesh>(null!)
  const materialRef = useRef<ShaderMaterial>(null!)

  const { 
    Steps: uNoiseSwirlSteps,
    Swirl: uNoiseSwirlValue,
    Scale: uNoiseScale,
    Time: uNoiseTimeScale,
    Opacity: uOpacity
  } = useControls('NoiseB', {
    Steps: { value: 3, min: 0, max: 10, step: 1 },
    Swirl: { value: 0.5, min: 0, max: 5, step: 0.1 },
    Scale: { value: 2.0, min: 0.1, max: 10, step: 0.1 },
    Time: { value: 0.04, min: 0, max: 2, step: 0.01 },
    Opacity: { value: 0.4, min: 0, max: 1, step: 0.01 }
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uNoiseSwirlSteps: { value: uNoiseSwirlSteps },
      uNoiseSwirlValue: { value: uNoiseSwirlValue },
      uNoiseScale: { value: uNoiseScale },
      uNoiseTimeScale: { value: uNoiseTimeScale },
      uOpacity: { value: uOpacity }
    }),
    []
  )

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uNoiseSwirlSteps.value = uNoiseSwirlSteps
      materialRef.current.uniforms.uNoiseSwirlValue.value = uNoiseSwirlValue
      materialRef.current.uniforms.uNoiseScale.value = uNoiseScale
      materialRef.current.uniforms.uNoiseTimeScale.value = uNoiseTimeScale
      materialRef.current.uniforms.uOpacity.value = uOpacity
    }
  }, [uNoiseSwirlSteps, uNoiseSwirlValue, uNoiseScale, uNoiseTimeScale, uOpacity])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[120, 80]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  )
}
