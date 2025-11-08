varying vec2 vUvs;

uniform vec2 resolution;
uniform float time;
uniform vec2 uClickedCells[20];
uniform float uClickStrengths[20];
uniform int uClickCount;
uniform vec3 uClickColor;
uniform float uColorIntensity;
uniform float uClickColorIntensity;
uniform vec3 uBaseColor;

vec3 black = vec3(0.0, 0.0, 0.0);

// Optimized hash function - faster than sin-based hash
float hash(vec2 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * (p.x + p.y));
}

void main() {
  // grid

  vec2 center = vUvs - 0.5;
  vec2 scaledUV = center * resolution * 0.01;
  vec2 cellID = floor(scaledUV); // Unique ID for each cell
  vec2 cell = fract(scaledUV);
  cell = abs(cell - 0.5);
  float distToCell = 1.0 - 2.0 * max(cell.x, cell.y);

  // Generate a random intensity for each cell based on its ID
  float cellOffset = hash(cellID); // Unique offset for each cell
  float phase = time * 1.5 + cellOffset * 6.28318; // Moderate speed
  float rawIntensity = 0.5 + 0.5 * sin(phase); // Cycle from 0 to 1
  // Apply quintic smoothing for ultra-smooth transitions
  float t = clamp(rawIntensity, 0.0, 1.0);
  float cellIntensity = t * t * t * (t * (t * 6.0 - 15.0) + 10.0); // Smootherstep quintic
  
  // Base color with varying intensity
  vec3 colour = uBaseColor * cellIntensity * uColorIntensity;
  
  // Check if this cell has been clicked
  float clickInfluence = 0.0;
  for(int i = 0; i < 20; i++) {
    if(i >= uClickCount) break;
    
    // Vectorized comparison for better performance
    vec2 diff = abs(cellID - uClickedCells[i]);
    if(diff.x < 0.5 && diff.y < 0.5) {
      clickInfluence = max(clickInfluence, uClickStrengths[i]);
    }
  }
  
  // Mix in click color - no conditional needed, mix handles 0.0 efficiently
  colour = mix(colour, uClickColor * uClickColorIntensity, clickInfluence);

  float cellLine = step(0.5, distToCell);

  colour = mix(black, colour, cellLine);

  gl_FragColor = vec4(colour, 1.0);
}
