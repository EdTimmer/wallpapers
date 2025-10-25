varying vec2 vUvs;

uniform vec2 resolution;
uniform float time;

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
  float cellIntensity = 0.5 + 0.5 * sin(time + cellOffset * 6.28318); // Cycle from 0 to 1
  
  // Base color with varying intensity
  vec3 colour = vec3(0.2, 0.8, 0.5) * cellIntensity * 0.1;

  float cellLine = smoothstep(0.0, 0.5, distToCell);

  float xAxis = smoothstep(0.0, 0.002, abs(vUvs.y - 0.5));
  float yAxis = smoothstep(0.0, 0.002, abs(vUvs.x - 0.5));

  colour = mix(black, colour, cellLine);

  gl_FragColor = vec4(colour, 1.0);
}
