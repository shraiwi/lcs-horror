varying vec2 screenUv;

void main() {
    screenUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}