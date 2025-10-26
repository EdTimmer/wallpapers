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

vec3 red = vec3(1.0, 0.0, 0.0);
vec3 blue = vec3(0.0, 0.0, 1.0);
vec3 white = vec3(1.0, 1.0, 1.0);
vec3 black = vec3(0.0, 0.0, 0.0);
vec3 yellow = vec3(1.0, 1.0, 0.0);

// Simple hash function to generate pseudo-random values from cell coordinates
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // grid

  vec2 center = vUvs - 0.5;
  vec2 scaledUV = center * resolution / 100.0;
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
    
    // Check if current cell matches a clicked cell
    if(cellID.x == uClickedCells[i].x && cellID.y == uClickedCells[i].y) {
      clickInfluence = max(clickInfluence, uClickStrengths[i]);
    }
  }
  
  // Mix in click color if this cell was clicked
  if(clickInfluence > 0.0) {
    colour = mix(colour, uClickColor * uClickColorIntensity, clickInfluence);
  }

  // float cellLine = smoothstep(0.0, 0.5, distToCell);
  float cellLine = step(0.5, distToCell);

  float xAxis = smoothstep(0.0, 0.002, abs(vUvs.y - 0.5));
  float yAxis = smoothstep(0.0, 0.002, abs(vUvs.x - 0.5));

  colour = mix(black, colour, cellLine);

  gl_FragColor = vec4(colour, 1.0);
}
