// This shader is a translation of Squares.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

precision highp float;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uSquareSize;
uniform vec3 uBorderColor;
uniform vec3 uHoverFillColor;
uniform vec2 uGridOffset;

in vec2 vUv;
out vec4 fragColor;

void main() {
    // gl_FragCoord is in device pixels, but we need CSS pixels to match Canvas
    // Scale by the ratio of CSS resolution to device pixels
    vec2 devicePixelPos = gl_FragCoord.xy;
    vec2 pixelPos = vUv * uResolution;
    
    // Flip Y coordinate because WebGL Y goes up, Canvas Y goes down
    pixelPos.y = uResolution.y - pixelPos.y;
    
    vec2 gridOffset = uGridOffset;
    
    // Original logic: squares drawn at x - gridOffset
    // So pixel P is at position (P + gridOffset) in the grid coordinate system
    vec2 gridPos = pixelPos + gridOffset;
    
    // Position within current square [0, squareSize)
    vec2 localPos = mod(gridPos, uSquareSize);
    
    // Draw only LEFT and TOP borders to avoid double-drawing
    bool isBorder = localPos.x < 1.0 || localPos.y < 1.0;
    
    // Mouse hover - flip Y to match our coordinate system
    vec2 mousePixel = uMouse * uResolution;
    mousePixel.y = uResolution.y - mousePixel.y;
    vec2 mouseGridPos = mousePixel + gridOffset;
    vec2 mouseSquare = floor(mouseGridPos / uSquareSize);
    vec2 pixelSquare = floor(gridPos / uSquareSize);
    bool isHovered = distance(pixelSquare, mouseSquare) < 0.5;
    
    if (isBorder) {
        fragColor = vec4(uBorderColor, 1.0);
    } else if (isHovered) {
        fragColor = vec4(uHoverFillColor, 1.0);
    } else {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
