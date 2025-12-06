precision highp float;

uniform vec2 uResolution;
uniform float uSquareSize;
uniform vec3 uBorderColor;
uniform vec2 uGridOffset;
uniform float uPixelRatio;

in vec2 vUv;
out vec4 fragColor;

void main() {
    // Work in physical pixels for consistent rendering across displays
    vec2 physicalPos = vUv * uResolution * uPixelRatio;
    vec2 physicalOffset = uGridOffset * uPixelRatio;
    
    // Apply grid offset for animation
    physicalPos += physicalOffset;
    
    // Normalize to grid space (grid size also in physical pixels)
    float physicalSquareSize = uSquareSize * uPixelRatio;
    vec2 grid = physicalPos / physicalSquareSize;
    
    // Get fractional part - position within a single cell [0, 1]
    vec2 cell = fract(grid);
    
    // Distance from cell center (center is at 0.5, 0.5)
    vec2 fromCenter = abs(cell - 0.5);
    
    // Distance to nearest edge (0.5 at center, 0 at edges)
    float distToEdge = 0.5 - max(fromCenter.x, fromCenter.y);
    
    // Create line with smoothstep - lineWidth in normalized cell space
    // 1 physical pixel = 1.0 / physicalSquareSize in normalized space
    float lineWidth = 1.0 / physicalSquareSize;
    float line = smoothstep(0.0, lineWidth * 2.0, distToEdge);
    
    // Mix between border and transparent based on line value
    vec3 color = mix(uBorderColor, vec3(0.0), line);
    float alpha = mix(1.0, 0.0, line);
    
    fragColor = vec4(color, alpha);
}
