// This shader is a translation of DotGrid.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

precision highp float;
precision highp int;

uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uTime;
uniform float uDotSize;
uniform float uGap;
uniform vec3 uBaseColor;
uniform vec3 uActiveColor;
uniform float uProximity;
uniform float uSpeedTrigger;
uniform float uShockRadius;
uniform float uShockStrength;
uniform float uMaxSpeed;
uniform float uResistance;
uniform float uReturnDuration;
uniform float uMouseActiveFactor;
uniform float uOpacity;

in vec2 vUv;
out vec4 fragColor;

// Hash function for dot displacement
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    // Screen coordinates
    vec2 screenPos = vUv * uResolution.xy;
    
    // Calculate grid cell size
    float cellSize = uDotSize + uGap;
    
    // Calculate number of columns and rows
    float cols = floor((uResolution.x + uGap) / cellSize);
    float rows = floor((uResolution.y + uGap) / cellSize);
    
    // Calculate actual grid dimensions
    float gridWidth = cellSize * cols - uGap;
    float gridHeight = cellSize * rows - uGap;
    
    // Calculate starting position to center the grid
    vec2 startPos = vec2(
        (uResolution.x - gridWidth) * 0.5 + uDotSize * 0.5,
        (uResolution.y - gridHeight) * 0.5 + uDotSize * 0.5
    );
    
    // Mouse position in screen coordinates
    vec2 mouseScreenPos = uMouse * uResolution.xy;
    
    vec3 color = vec3(0.0);
    float alpha = 0.0;
    
    // Iterate through nearby grid cells to find dots
    vec2 cellCoord = (screenPos - startPos) / cellSize;
    vec2 cellId = floor(cellCoord);
    
    // Check 3x3 grid of cells around current position
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighborId = cellId + vec2(float(x), float(y));
            
            // Skip if outside grid bounds
            if (neighborId.x < 0.0 || neighborId.x >= cols || 
                neighborId.y < 0.0 || neighborId.y >= rows) {
                continue;
            }
            
            // Calculate dot center position
            vec2 dotCenter = startPos + neighborId * cellSize;
            
            // Get pseudo-random offset based on cell ID (for potential animations)
            float seed = hash21(neighborId);
            
            // Distance from current pixel to dot center
            float dist = length(screenPos - dotCenter);
            
            // Check if we're inside the dot
            float dotRadius = uDotSize * 0.5;
            if (dist < dotRadius) {
                // Distance from dot center to mouse
                float distToMouse = length(dotCenter - mouseScreenPos);
                
                // Calculate color based on proximity to mouse
                vec3 dotColor = uBaseColor;
                if (distToMouse <= uProximity && uMouseActiveFactor > 0.01) {
                    float t = 1.0 - distToMouse / uProximity;
                    t *= uMouseActiveFactor; // Fade in/out when mouse enters/leaves
                    dotColor = mix(uBaseColor, uActiveColor, t);
                }
                
                // Anti-aliasing for smooth edges
                float edge = 1.0 - smoothstep(dotRadius - 1.0, dotRadius, dist);
                
                color = dotColor;
                alpha = edge;
            }
        }
    }
    
    fragColor = vec4(color, alpha * uOpacity);
}
