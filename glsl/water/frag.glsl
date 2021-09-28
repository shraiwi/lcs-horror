
smooth in vec3 vert_ViewNormal;
smooth in vec3 vert_WorldNormal;
smooth in vec3 vert_Color;
smooth in vec3 vert_NDC;

void main() {
    gl_FragColor.rgb = vert_Color;
} 