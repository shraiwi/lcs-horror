uniform float opacity;
uniform sampler2D screenSampler;

varying vec2 screenUv;


void main() {
    vec4 texel = texture2D(screenSampler, screenUv);
    gl_FragColor = opacity * texel;
}