
smooth in vec3 vert_ViewNormal;
smooth in vec3 vert_WorldNormal;
smooth in vec3 vert_Color;
smooth in vec3 vert_NDC;

void main() {
    float vertDot = max(
        dot(
            vert_WorldNormal, 
            normalize(vec3(0.0, 1.0, 1.0))
        ), 
        0.1
    );
    //gl_FragColor.rgb = vertDot * vert_Color;
    gl_FragColor.rgb = vert_Color;
} 