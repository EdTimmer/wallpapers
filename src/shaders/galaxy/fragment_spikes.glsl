// This shader is a translation of Galaxy.jsx from https://github.com/DavidHDev/react-bits,
// Copyright (c) 2025 David Haz — licensed under the MIT + Commons Clause License Condition v1.0.

precision highp float;
precision highp int;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
uniform float uOpacity;

in vec2 vUv;
out vec4 fragColor;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float tri(float x) {
    return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
    float t = fract(x);
    return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
    float t = fract(x);
    return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Star with optional twinkle cross shape
float Star(vec2 uv, float flare, float rotation, float twinkleType, float seed, float time) {
    float radius = 0.02 * uGlowIntensity;
    
    // Apply rotation to UV coordinates
    float c = cos(rotation);
    float s = sin(rotation);
    mat2 rot = mat2(c, -s, s, c);
    uv = rot * uv;
    
    float star;
    
    if (twinkleType > 0.7) {
        // Thin cross / twinkle shape with animated arm lengths
        float thickness = radius * 0.3;
        float baseLength = radius * 4.0;
        
        // Animate only the right arm, others stay static
        float rightAnim = tris(time * 0.3 + seed * 1.0) * 0.5 + 0.75;
        float leftAnim = 1.0;
        float upAnim = 1.0;
        float downAnim = 1.0;
        
        // Create four separate arms with animated lengths
        float right = smoothstep(thickness, 0.0, abs(uv.y)) * smoothstep(baseLength * rightAnim, 0.0, uv.x) * step(0.0, uv.x);
        float left = smoothstep(thickness, 0.0, abs(uv.y)) * smoothstep(baseLength * leftAnim, 0.0, -uv.x) * step(0.0, -uv.x);
        float up = smoothstep(thickness, 0.0, abs(uv.x)) * smoothstep(baseLength * upAnim, 0.0, uv.y) * step(0.0, uv.y);
        float down = smoothstep(thickness, 0.0, abs(uv.x)) * smoothstep(baseLength * downAnim, 0.0, -uv.y) * step(0.0, -uv.y);
        
        star = max(max(right, left), max(up, down));
    } else {
        // Five-circle cross pattern
        float offset = radius * 0.7;
        
        // SDF for each circle (distance to surface)
        float d0 = length(uv) - radius;
        float d1 = length(uv - vec2(offset, 0.0)) - radius;
        float d2 = length(uv - vec2(-offset, 0.0)) - radius;
        float d3 = length(uv - vec2(0.0, offset)) - radius;
        float d4 = length(uv - vec2(0.0, -offset)) - radius;
        
        // Smooth minimum (union) of all five circles - creates unified shape
        float d = d0;
        d = min(d, d1);
        d = min(d, d2);
        d = min(d, d3);
        d = min(d, d4);
        
        // Core star brightness with smooth falloff
        star = smoothstep(radius * 0.5, -radius * 0.5, d);
    }
    
    return star * 5.0;
}

vec3 StarLayer(vec2 uv) {
    vec3 col = vec3(0.0);

    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 si = id + vec2(float(x), float(y));
            float seed = Hash21(si);
            float size = mix(0.4, 1.0, fract(seed * 345.32)); // Minimum brightness floor
            float glossLocal = tri(uStarSpeed / (PERIOD * seed + 1.0));
            float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

            vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;

            // Generate random rotation for each star based on its seed
            float rotation = Hash21(si + 5.0) * 6.28318; // 0 to 2*PI
            
            // Decide if this star should be a twinkle cross (30% chance)
            float twinkleType = Hash21(si + 10.0);
            
            float star = Star(gv - offset - pad, flareSize, rotation, twinkleType, seed, uTime * uSpeed);
            vec3 color = vec3(1.0); // White stars

            float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
            twinkle = mix(1.0, twinkle, uTwinkleIntensity);
            star *= twinkle;

            col += star * size * color;
        }
    }

    return col;
}

void main() {
    vec2 focalPx = uFocal * uResolution.xy;
    vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;

    vec2 mouseNorm = uMouse - vec2(0.5);

    if (uAutoCenterRepulsion > 0.0) {
        vec2 centerUV = vec2(0.0);
        float centerDist = length(uv - centerUV);
        vec2 repulsion = normalize(uv - centerUV) * (uAutoCenterRepulsion / (centerDist + 0.1));
        uv += repulsion * 0.05;
    } else if (uMouseRepulsion) {
        vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
        float mouseDist = length(uv - mousePosUV);
        vec2 repulsion = normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1));
        uv += repulsion * 0.05 * uMouseActiveFactor;
    } else {
        vec2 mouseOffset = mouseNorm * 0.1 * uMouseActiveFactor;
        uv += mouseOffset;
    }

    float autoRotAngle = uTime * uRotationSpeed;
    mat2 autoRot = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle));
    uv = autoRot * uv;

    uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;

    vec3 col = vec3(0.0);

    for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) {
        float depth = fract(i + uStarSpeed * uSpeed);
        float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
        float fade = depth * smoothstep(1.0, 0.9, depth);
        col += StarLayer(uv * scale + i * 453.32) * fade;
    }

    if (uTransparent) {
        float alpha = length(col);
        alpha = smoothstep(0.0, 0.3, alpha);
        alpha = min(alpha, 1.0);
        fragColor = vec4(col, alpha * uOpacity);
    } else {
        fragColor = vec4(col, uOpacity);
    }
}
