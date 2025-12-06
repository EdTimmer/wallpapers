// This component is an adaptation of Squares.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ScreenQuad } from '@react-three/drei';
import { RawShaderMaterial, Vector2, Color, GLSL3 } from 'three';
import { button, useControls } from 'leva';
import fragmentShader from '@shaders/squares/fragment.glsl';
import vertexShader from '@shaders/squares/vertex.glsl';

interface SquaresProps {
  direction?: 'right' | 'left' | 'up' | 'down' | 'diagonal';
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
}

export default function Squares({
  direction = 'right',
  speed = 1,
  borderColor = '#999999',
  squareSize = 40,
  hoverFillColor = '#222222'
}: SquaresProps) {
  const materialRef = useRef<RawShaderMaterial | null>(null);
  const { size } = useThree();

  const targetMousePos = useRef(new Vector2(0.5, 0.5));
  const smoothMousePos = useRef(new Vector2(0.5, 0.5));
  const resolutionRef = useRef(new Vector2(size.width, size.height));
  
  // Track gridOffset like the original does
  const gridOffset = useRef(new Vector2(0, 0));

  const [
    {
      direction: directionCtrl,
      speed: speedCtrl,
      borderColor: borderColorCtrl,
      squareSize: squareSizeCtrl,
      hoverFillColor: hoverFillColorCtrl
    },
    setControls
  ] = useControls(
    'Squares',
    () => ({
      direction: {
        value: direction,
        options: ['diagonal', 'up', 'right', 'down', 'left'],
        label: 'Direction'
      },
      speed: {
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
      hoverFillColor: {
        value: hoverFillColor,
        label: 'Hover Fill Color'
      },
      'Reset Squares': button(() => {
        setControls({
          direction,
          speed,
          borderColor,
          squareSize,
          hoverFillColor
        });
      })
    }),
    [direction, speed, borderColor, squareSize, hoverFillColor]
  );

  // Convert hex colors to RGB
  const borderColorRGB = useMemo(() => {
    const hex = borderColorCtrl.replace('#', '');
    return new Color(
      parseInt(hex.substr(0, 2), 16) / 255,
      parseInt(hex.substr(2, 2), 16) / 255,
      parseInt(hex.substr(4, 2), 16) / 255
    );
  }, [borderColorCtrl]);

  const hoverColorRGB = useMemo(() => {
    const hex = hoverFillColorCtrl.replace('#', '');
    return new Color(
      parseInt(hex.substr(0, 2), 16) / 255,
      parseInt(hex.substr(2, 2), 16) / 255,
      parseInt(hex.substr(4, 2), 16) / 255
    );
  }, [hoverFillColorCtrl]);

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new Vector2(size.width, size.height) },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uSquareSize: { value: 40 },
      uBorderColor: { value: new Color(0.6, 0.6, 0.6) },
      uHoverFillColor: { value: new Color(0.13, 0.13, 0.13) },
      uGridOffset: { value: new Vector2(0, 0) }
    }),
    []
  );

  // Update uniforms when controls change
  useEffect(() => {
    if (!materialRef.current) return;
    const { uniforms: u } = materialRef.current;
    u.uSquareSize.value = squareSizeCtrl;
    u.uBorderColor.value.copy(borderColorRGB);
    u.uHoverFillColor.value.copy(hoverColorRGB);
    // Reset gridOffset when direction changes
    gridOffset.current.set(0, 0);
  }, [squareSizeCtrl, borderColorRGB, hoverColorRGB, directionCtrl]);

  useFrame((state) => {
    if (!materialRef.current) return;

    const material = materialRef.current;

    // Update gridOffset exactly like the original
    const effectiveSpeed = Math.max(speedCtrl, 0.1);
    const size = squareSizeCtrl;
    
    switch (directionCtrl) {
      case 'right':
        gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + size) % size;
        break;
      case 'left':
        gridOffset.current.x = (gridOffset.current.x + effectiveSpeed + size) % size;
        break;
      case 'up':
        gridOffset.current.y = (gridOffset.current.y + effectiveSpeed + size) % size;
        break;
      case 'down':
        gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + size) % size;
        break;
      case 'diagonal':
        gridOffset.current.x = (gridOffset.current.x - effectiveSpeed + size) % size;
        gridOffset.current.y = (gridOffset.current.y - effectiveSpeed + size) % size;
        break;
    }
    
    // Update the uniform value
    material.uniforms.uGridOffset.value.copy(gridOffset.current);

    // Only update resolution if it changed
    const width = state.size.width;
    const height = state.size.height;
    if (resolutionRef.current.x !== width || resolutionRef.current.y !== height) {
      resolutionRef.current.set(width, height);
      material.uniforms.uResolution.value.set(width, height);
    }

    // Update target mouse position
    targetMousePos.current.set(
      (state.mouse.x + 1) / 2,
      (state.mouse.y + 1) / 2
    );

    // Smooth mouse movement
    smoothMousePos.current.lerp(targetMousePos.current, 0.1);
    material.uniforms.uMouse.value.copy(smoothMousePos.current);
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
