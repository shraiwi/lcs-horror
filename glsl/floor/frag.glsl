
smooth in vec3 vert_ViewNormal;
smooth in vec3 vert_WorldNormal;
smooth in vec3 vert_Color;
smooth in vec3 vert_NDC;
smooth in vec3 vert_WorldPosition;

const float GRID_SPACING = 1.0;

void main() {
    //gl_FragColor.rgb = vertDot * vert_Color;
    gl_FragColor.rgb = vert_Color;
} 