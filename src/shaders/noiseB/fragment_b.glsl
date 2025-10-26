precision mediump float;

uniform float uTime;
uniform float uOpacity;

uniform float uNoiseScale;         // e.g. 2.0–6.0
uniform float uRotationSpeed;      // rotation speed multiplier
uniform float uFBMAmplitude;       // initial FBM amplitude
uniform float uFBMPersistence;     // amplitude decay rate per octave
uniform float uGapMix;             // gap blending amount
uniform float uContrastPower;      // contrast power adjustment
uniform float uFinalPower;         // final contrast exponent
uniform float uDistortionRadius;   // click influence radius
uniform float uDistortionStrength; // click push strength

uniform vec2  uClickPoints[10];
uniform float uClickStrengths[10];
uniform int   uClickCount;

varying vec2 vUv;

/* --------- hash + value noise (2D) ---------- */
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  vec2 w = fp*fp*fp*(fp*(fp*6.0 - 15.0) + 10.0);

  float a = hash12(ip);
  float b = hash12(ip + vec2(1.0, 0.0));
  float c = hash12(ip + vec2(0.0, 1.0));
  float d = hash12(ip + vec2(1.0, 1.0));

  float x1 = mix(a, b, w.x);
  float x2 = mix(c, d, w.x);
  return mix(x1, x2, w.y);
}

float valueFBM(vec2 p) {
  float f = 0.0;
  float amp = uFBMAmplitude;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    f += amp * valueNoise(p);
    p = m * p;
    amp *= uFBMPersistence;
  }
  return f;
}

/* --------- Worley (cellular) F1/F2 ---------- */
vec2 worleyF12(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float F1 = 1e9;
  float F2 = 1e9;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = vec2(float(i), float(j));
      vec2 fpt = cell + vec2(hash12(ip + cell + 0.37), hash12(ip + cell + 7.73));
      vec2 d = (fpt - fp);
      float dist = dot(d, d);
      if (dist < F1) { F2 = F1; F1 = dist; }
      else if (dist < F2) { F2 = dist; }
    }
  }
  return vec2(sqrt(F1), sqrt(F2));
}

void main() {
  vec2 uv = vUv;

  // Click-based lensing effect (spherical distortion)
  for (int i = 0; i < 10; i++) {
    if (i >= uClickCount) break;
    
    // Skip points with negligible strength
    if (uClickStrengths[i] < 0.1) continue;
    
    vec2 toClick = uv - uClickPoints[i];
    float dist = length(toClick);
    
    // Only apply within radius
    if (dist < uDistortionRadius && dist > 0.0001) {
      // Smooth falloff
      float normalizedDist = dist / uDistortionRadius;
      float falloff = 1.0 - normalizedDist;
      falloff = smoothstep(0.0, 1.0, falloff);
      
      // Strength fade-out
      float strengthFalloff = smoothstep(0.0, 0.2, uClickStrengths[i]);
      
      // Spherical lens distortion (magnify/pinch based on sign)
      float lensStrength = falloff * strengthFalloff * uClickStrengths[i] * uDistortionStrength;
      
      // Radial displacement (negative = magnify, positive = pinch)
      vec2 direction = normalize(toClick);
      uv = uClickPoints[i] + direction * (dist - dist * lensStrength * 3.0);
    }
  }

  // Slow rotation/drift (intensity only)
  float t = uTime * 0.15;  // base animation time
  float rotationAngle = uTime * uRotationSpeed;  // separate rotation control
  float cs = cos(rotationAngle), sn = sin(rotationAngle);
  mat2 R = mat2(cs, -sn, sn, cs);
  vec2 p = (R * (uv - 0.5)) + 0.5;

  // Domain warp with value-FBM (no colors involved)
  float warpA = valueFBM(p * 1.5 + vec2(0.0,  t * 0.35));
  float warpB = valueFBM(p * 1.5 + vec2(4.2, -t * 0.25));
  vec2 warped = p * uNoiseScale + 1.1 * vec2(warpA, warpB);

  // Cellular measures
  vec2 F = worleyF12(warped);
  float edges = exp(-6.0 * F.x);                       // thin bright edges
  float gap   = clamp((F.y - F.x) * 2.0, 0.0, 1.0);    // interior interest
  float bands = 0.5 + 0.5 * sin(10.0 * F.x - uTime*0.9); // intensity-only animation

  // Combine to a single scalar "noise" in [0,1]
  float m = mix(bands, edges, 0.65);
  m = mix(m, gap, uGapMix);
  m = pow(max(m, 0.0), uContrastPower);
  float noise = clamp(pow(m, uFinalPower) * 1.2, 0.0, 1.0);    // reduced from 2.0 to 1.2 for less bright spots

  // Original green tint on black background
  vec3 green = vec3(0.525, 0.992, 0.866);
  gl_FragColor = vec4(noise * green, uOpacity);
}
