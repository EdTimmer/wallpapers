precision mediump float;

uniform float uTime;
uniform float uNoise;
uniform float uSpeed;
uniform float uOscillationFrequency;
uniform vec2 uClickPoints[10]; // Array of click positions
uniform float uClickStrengths[10]; // Strength/fade for each click
uniform int uClickCount; // Number of active clicks
uniform float uBlobSize; // Size of click blobs
uniform vec3 uBlobColor; // Color of click blobs
uniform float uBlobIntensity; // Intensity/brightness of blob color

varying vec2 vUv;

vec4 permute(vec4 x){
  return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); 
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; 
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {
  // PERLIN NOISE - OIL FILM EFFECT

  // sharp
  // float strength = step(0.5, sin((cnoise(vUv * 10.0) + uTime * 0.1 )* 20.0));

  // smooth
  float strength = sin((cnoise(vUv * uNoise) + uTime * uSpeed * -1.0 ) * uOscillationFrequency);

  // clamp the strength
  strength = clamp(strength, 0.0, 1.0); // 0.06

  // Black
  vec3 firstColor = vec3(0.0);
  // Dark purple
  // vec3 secondColor = vec3(0.133, 0, 0.239) * 0.2; // Scale down intensity

  // Light purple
  vec3 secondColor = vec3(0.525, 0.992, 0.866) * 0.01; // Scale down intensity
  // Gray
  // vec3 secondColor = vec3(0.054, 0.058, 0.062); // 0.086, 0.537, 0
  vec3 mixedColor = mix(firstColor, secondColor, strength);
  
  // Add click point blobs
  float clickInfluence = 0.0;
  
  for(int i = 0; i < 10; i++) {
    if(i >= uClickCount) break;
    
    // Calculate distance from current pixel to click point
    float dist = distance(vUv, uClickPoints[i]);
    
    // Create a smooth falloff using uniform blob size
    float blob = smoothstep(uBlobSize, 0.0, dist);
    
    // Apply the strength (for fade-out animation)
    blob *= uClickStrengths[i];
    
    // Accumulate influence from all clicks
    clickInfluence = max(clickInfluence, blob);
  }
  
  // Mix in the click color using uniform color and intensity
  vec3 scaledBlobColor = uBlobColor * uBlobIntensity;
  mixedColor = mix(mixedColor, scaledBlobColor, clickInfluence);
  
  gl_FragColor = vec4(mixedColor, 1.0);

  #include <colorspace_fragment>    
}