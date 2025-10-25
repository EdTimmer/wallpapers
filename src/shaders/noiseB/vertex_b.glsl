precision mediump float;

varying vec2 vUv;
varying vec2 vUv0;

void main() {    
    vUv = uv;
    vUv0 = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);    
}