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
uniform float uIntensity; // Color intensity multiplier
uniform vec3 uSecondColor; // Second color for the gradient

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
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y); // Animate noise over time
  return 2.3 * n_xy;
}

// Fractional Brownian Motion - layers multiple octaves of noise
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  // Add 4 octaves of noise
  for(int i = 0; i < 4; i++) {
    value += amplitude * cnoise(p * frequency);
    frequency *= 2.0;  // Each octave has double the frequency
    amplitude *= 0.5;  // Each octave has half the amplitude
  }
  
  return value;
}

// Domain warping - feed noise into itself for organic patterns
vec2 domainWarp(vec2 p, float time) {
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0)),
                fbm(p + vec2(5.2, 1.3)));
  
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7 - time * 0.15, 9.2)),
                fbm(p + 4.0 * q + vec2(8.3 - time * 0.1, 2.8)));
  
  return p + r;
}

void main() {
  // PERLIN NOISE - OIL FILM EFFECT
  
  // Apply spherical lens distortion from click points (same as NoiseB)
  vec2 distortedUv = vUv;
  
  for(int i = 0; i < 10; i++) {
    if(i >= uClickCount) break;
    
    float strength = uClickStrengths[i];
    if(strength < 0.1) continue;
    
    vec2 toClick = distortedUv - uClickPoints[i];
    float dist = length(toClick);
    
    // Only apply within radius
    if (dist < uBlobSize && dist > 0.0001) {
      // Smooth falloff
      float falloff = smoothstep(0.0, 1.0, 1.0 - dist / uBlobSize);
      
      // Strength fade-out
      float strengthFalloff = smoothstep(0.0, 0.2, strength);
      
      // Spherical lens distortion (magnify/pinch based on sign)
      float lensStrength = falloff * strengthFalloff * strength * uBlobIntensity * 3.0;
      
      // Radial displacement (negative = magnify, positive = pinch)
      vec2 direction = normalize(toClick);
      distortedUv = uClickPoints[i] + direction * dist * (1.0 - lensStrength);
    }
  }

  // Pre-calculate time-based animation
  float timeSpeed = uTime * uSpeed;
  
  // Apply domain warping for more interesting patterns
  vec2 warpedUv = domainWarp(distortedUv * uNoise, timeSpeed);
  
  // Use fBm instead of simple noise for more detail
  float strength = fbm(warpedUv);
  
  // Add some oscillation based on time
  strength = sin(strength * uOscillationFrequency + timeSpeed * -0.5);

  // clamp the strength
  strength = clamp(strength, 0.0, 1.0);

  // Black
  vec3 firstColor = vec3(0.0);
  // Dark purple
  // vec3 secondColor = vec3(0.133, 0, 0.239) * 0.2; // Scale down intensity

  // Light purple
  vec3 secondColor = uSecondColor * uIntensity; // Scale down intensity
  // Gray
  // vec3 secondColor = vec3(0.054, 0.058, 0.062); // 0.086, 0.537, 0
  vec3 mixedColor = mix(firstColor, secondColor, strength);
  
  gl_FragColor = vec4(mixedColor, 1.0);

  #include <colorspace_fragment>    
}