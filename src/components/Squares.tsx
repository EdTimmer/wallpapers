// This component is an adaptation of Squares.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ScreenQuad } from '@react-three/drei';
import { RawShaderMaterial, Vector2, Color, GLSL3 } from 'three';
import { button, useControls } from 'leva';
import fragmentShader from '@shaders/squares/fragment_physical_pixels.glsl';
import vertexShader from '@shaders/squares/vertex.glsl';

interface SquaresProps {
  direction?: 'right' | 'left' | 'up' | 'down' | 'diagonal';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
}

export default function Squares({
  direction = 'right',
  speed = 1,
  borderColor = '#999999',
  squareSize = 40
}: SquaresProps) {
  const materialRef = useRef<RawShaderMaterial | null>(null);
  const { size, gl } = useThree();
  // Store the device's native pixel ratio (not the current Three.js value)
  const devicePixelRatio = window.devicePixelRatio || 1;

  const resolutionRef = useRef(new Vector2(size.width, size.height));
  const offsetRef = useRef(new Vector2(0, 0));

  const [
    {
      direction: directionCtrl,
      squareSpeed: speedCtrl,
      borderColor: borderColorCtrl,
      squareSize: squareSizeCtrl
    },
    setControls
  ] = useControls(
    'Squares Controls',
    () => ({
      direction: {
        value: direction,
        options: ['diagonal', 'up', 'right', 'down', 'left'],
        label: 'Direction'
      },
      squareSpeed: {
        value: speed,
        min: 0.1,
        max: 5,
        step: 0.1,
        label: 'Speed'
      },
      borderColor: {
        value: borderColor,
        label: 'Border Color'
      },
      squareSize: {
        value: squareSize,
        min: 10,
        max: 200,
        step: 5,
        label: 'Square Size'
      },
      'Reset Squares': button(() => {
        setControls({
          direction,
          squareSpeed: speed,
          borderColor,
          squareSize
        });
      })
    }),
    [direction, speed, borderColor, squareSize]
  );

  // Convert hex color to RGB
  const borderColorRGB = useMemo(() => {
    const hex = borderColorCtrl.replace('#', '');
    return new Color(
      parseInt(hex.substr(0, 2), 16) / 255,
      parseInt(hex.substr(2, 2), 16) / 255,
      parseInt(hex.substr(4, 2), 16) / 255
    );
  }, [borderColorCtrl]);

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new Vector2(size.width, size.height) },
      uSquareSize: { value: 40 },
      uBorderColor: { value: new Color(0.6, 0.6, 0.6) },
      uGridOffset: { value: new Vector2(0, 0) },
      uPixelRatio: { value: window.devicePixelRatio || 1.0 }
    }),
    []
  );

  // Reset pixel ratio to device native on mount and cleanup
  useEffect(() => {
    gl.setPixelRatio(devicePixelRatio);
    return () => {
      gl.setPixelRatio(devicePixelRatio);
    };
  }, [gl, devicePixelRatio]);
  
  // Reset offset when direction changes
  useEffect(() => {
    offsetRef.current.set(0, 0);
  }, [directionCtrl]);

  // Update uniforms when controls change
  useEffect(() => {
    if (!materialRef.current) return;
    const { uniforms: u } = materialRef.current;
    u.uSquareSize.value = squareSizeCtrl;
    u.uBorderColor.value.copy(borderColorRGB);
  }, [squareSizeCtrl, borderColorRGB]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const material = materialRef.current;
    const effectiveSpeed = Math.max(speedCtrl, 0.1);
    const size = squareSizeCtrl;
    
    // Clamp delta to prevent huge jumps (max 100ms = 0.1s)
    const clampedDelta = Math.min(delta, 0.1);
    
    // Calculate movement for this frame (pixels per second * delta)
    const movement = clampedDelta * effectiveSpeed * 60.0;
    
    // Update offset based on direction
    switch (directionCtrl) {
      case 'right':
        offsetRef.current.x = (offsetRef.current.x - movement) % size;
        if (offsetRef.current.x < 0) offsetRef.current.x += size;
        offsetRef.current.y = 0;
        break;
      case 'left':
        offsetRef.current.x = (offsetRef.current.x + movement) % size;
        offsetRef.current.y = 0;
        break;
      case 'up':
        offsetRef.current.x = 0;
        offsetRef.current.y = (offsetRef.current.y - movement) % size;
        if (offsetRef.current.y < 0) offsetRef.current.y += size;
        break;
      case 'down':
        offsetRef.current.x = 0;
        offsetRef.current.y = (offsetRef.current.y + movement) % size;
        break;
      case 'diagonal':
        offsetRef.current.x = (offsetRef.current.x - movement) % size;
        offsetRef.current.y = (offsetRef.current.y - movement) % size;
        if (offsetRef.current.x < 0) offsetRef.current.x += size;
        if (offsetRef.current.y < 0) offsetRef.current.y += size;
        break;
    }
    
    // Update the uniform value
    material.uniforms.uGridOffset.value.copy(offsetRef.current);

    // Update resolution if it changed
    const width = state.size.width;
    const height = state.size.height;
    
    if (resolutionRef.current.x !== width || resolutionRef.current.y !== height) {
      resolutionRef.current.set(width, height);
      material.uniforms.uResolution.value.set(width, height);
    }
  });

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
        premultipliedAlpha={false}
      />
    </ScreenQuad>
  );
}
