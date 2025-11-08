// This shader is a translation of Aurora.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.


precision highp float;

uniform float uTime;
uniform float uSpeed;
uniform float uIntensity; // Amplitude control
uniform float uBlend; // Alpha blend/smoothness
uniform float uSaturation; // Color saturation multiplier
uniform float uScale; // Noise scale/frequency
uniform float uVerticalOffset; // Vertical position offset
uniform vec3 uFirstColor; // Base color
uniform vec3 uSecondColor; // Mid color
uniform vec3 uThirdColor; // Top color
uniform vec2 uResolution;

varying vec2 vUv;

// Simplex noise permutation
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

// Simplex noise implementation
float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

// Color gradient function
vec3 colorRamp(ColorStop colors[3], float factor) {
  int index = 0;
  for (int i = 0; i < 2; i++) {
     ColorStop currentColor = colors[i];
     bool isInBetween = currentColor.position <= factor;
     index = int(mix(float(index), float(i), float(isInBetween)));
  }
  ColorStop currentColor = colors[index];
  ColorStop nextColor = colors[index + 1];
  float range = nextColor.position - currentColor.position;
  float lerpFactor = (factor - currentColor.position) / range;
  return mix(currentColor.color, nextColor.color, lerpFactor);
}

void main() {
  vec2 uv = vUv;
  
  // Create three-color gradient (first -> second -> third)
  ColorStop colors[3];
  colors[0] = ColorStop(uFirstColor, 0.0);
  colors[1] = ColorStop(uSecondColor, 0.5);
  colors[2] = ColorStop(uThirdColor, 1.0);
  
  vec3 rampColor = colorRamp(colors, uv.x);
  
  // Apply saturation to gradient
  float gray = dot(rampColor, vec3(0.299, 0.587, 0.114));
  rampColor = mix(vec3(gray), rampColor, uSaturation);
  
  // Aurora wave calculation with animated noise
  float timeSpeed = uTime * uSpeed;
  float height = snoise(vec2(uv.x * uScale + timeSpeed * 0.1, timeSpeed * 0.25 * uScale)) * 0.5 * uIntensity;
  height = exp(height);
  height = (uv.y * 2.0 - height + uVerticalOffset);
  float intensity = height;
  
  // Smooth alpha transition
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  // Apply intensity to color
  vec3 auroraColor = intensity * rampColor;
  
  // Mix aurora with black background instead of using alpha transparency
  vec3 finalColor = mix(vec3(0.0), auroraColor, auroraAlpha);
  
  gl_FragColor = vec4(finalColor, 1.0);

  #include <colorspace_fragment>    
}