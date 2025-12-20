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
uniform float uBaseOpacity;
uniform vec3 uActiveColor;
uniform float uActiveOpacity;
uniform float uProximity;
uniform float uSpeedTrigger;
uniform float uShockRadius;
uniform float uShockStrength;
uniform float uShockSpeed;
uniform float uMaxSpeed;
uniform float uResistance;
uniform float uActiveDuration;
uniform float uMouseActiveFactor;

// Tap distortion uniforms
uniform vec2 uTapPositions[10];
uniform float uTapStrengths[10];
uniform float uTapTimes[10];
uniform int uNumTaps;

in vec2 vUv;
out vec4 fragColor;

// Hash function for dot displacement
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Calculate displacement from all active taps
vec2 calculateDisplacement(vec2 dotCenter) {
    vec2 totalDisplacement = vec2(0.0);
    
    for (int i = 0; i < 10; i++) {
        if (i >= uNumTaps) break;
        
        float strength = uTapStrengths[i];
        if (strength <= 0.01) continue;
        
        vec2 tapPos = uTapPositions[i] * uResolution.xy;
        vec2 toDot = dotCenter - tapPos;
        float dist = length(toDot);
        
        // Apply shock wave with falloff
        if (dist < uShockRadius && dist > 0.1) {
            vec2 direction = normalize(toDot);
            
            // Wave propagation - slower, smoother ripple
            float waveSpeed = uShockSpeed; // normalized units per second
            float elapsed = uTapTimes[i];
            float waveProgress = elapsed * waveSpeed;
            
            // Distance normalized to shock radius (0 to 1)
            float normalizedDist = dist / uShockRadius;
            
            // Calculate wave position - ripple propagates outward then bounces back
            float phase = waveProgress;
            
            // Current wave position in normalized space (0 to 1)
            float wavePos = mod(phase, 1.0);
            
            // How close this dot is to the current wave front
            float waveDiff = abs(normalizedDist - wavePos);
            
            // Wider, softer wave for smoother effect
            float waveWidth = 0.3; // Wider wave = less rigid
            if (waveDiff < waveWidth) {
                // Smoother falloff curve
                float waveIntensity = 1.0 - (waveDiff / waveWidth);
                waveIntensity = smoothstep(0.0, 1.0, waveIntensity);
                
                // Calculate displacement with elastic overshoot
                float phaseInt = floor(phase);
                float phaseProgress = fract(phase);
                
                // Base direction alternates per phase
                float directionMult = mod(phaseInt, 2.0) == 0.0 ? -1.0 : 1.0;
                
                // Decay intensity over time (each bounce is weaker)
                float decay = 1.0 / (1.0 + phaseInt * 0.5);
                
                // Add elastic overshoot: create a small reverse bounce
                // at the end of each inward phase
                float elasticMult = 1.0;
                if (mod(phaseInt, 2.0) == 1.0 && phaseProgress > 0.7) {
                    // Last 30% of return phase - add small reverse overshoot
                    float overshootProgress = (phaseProgress - 0.7) / 0.3;
                    // Sine creates smooth overshoot and settle
                    elasticMult = 1.0 - 0.4 * sin(overshootProgress * 3.14159);
                }
                
                // Calculate final displacement
                // Scale by resolution to maintain consistent visual effect across screen sizes
                float resolutionScale = min(uResolution.x, uResolution.y) / 1080.0;
                float displacement = strength * uShockStrength * waveIntensity * decay * elasticMult * 0.12 * resolutionScale;
                totalDisplacement += direction * directionMult * displacement;
            }
        }
    }
    
    return totalDisplacement;
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

            // Apply tap distortion displacement
            vec2 displacement = calculateDisplacement(dotCenter);
            vec2 displacedDotCenter = dotCenter + displacement;
            
            // Get pseudo-random offset based on cell ID (for potential animations)
            float seed = hash21(neighborId);
            
            // Distance from current pixel to dot center
            float dist = length(screenPos - displacedDotCenter);
            
            // Check if we're inside the dot
            float dotRadius = uDotSize * 0.5;
            if (dist < dotRadius) {
                // Distance from dot center to mouse
                float distToMouse = length(dotCenter - mouseScreenPos);
                
                // Calculate color and opacity based on proximity to mouse
                vec3 dotColor = uBaseColor;
                float dotOpacity = uBaseOpacity;
                if (distToMouse <= uProximity && uMouseActiveFactor > 0.01) {
                    float t = 1.0 - distToMouse / uProximity;
                    t *= uMouseActiveFactor; // Fade in/out when mouse enters/leaves
                    dotColor = mix(uBaseColor, uActiveColor, t);
                    dotOpacity = mix(uBaseOpacity, uActiveOpacity, t);
                }
                
                // Anti-aliasing for smooth edges
                float edge = 1.0 - smoothstep(dotRadius - 1.0, dotRadius, dist);

                // Accumulate color and alpha (max for overlapping dots)
                if (edge > alpha) {
                    color = dotColor;
                    alpha = edge;
                }
                
                color = dotColor;
                alpha = edge * dotOpacity;
            }
        }
    }
    
    fragColor = vec4(color, alpha);
}
