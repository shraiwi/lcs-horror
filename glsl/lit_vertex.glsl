
uniform vec3 vertexColor;
uniform vec3 sunDirection;

smooth out vec3 vert_ViewNormal;
smooth out vec3 vert_WorldNormal;
smooth out vec3 vert_Color;
smooth out vec3 vert_NDC;

smooth out float vert_LightIntensity;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vert_NDC = gl_Position.xyz;

    vert_WorldNormal = (modelMatrix * vec4(normal, 1.0)).xyz;
    vert_ViewNormal = normalize(
        (projectionMatrix * modelViewMatrix * vec4(normal, 1.0)).xyz
    );

    vert_Color = sin(vert_ViewNormal + vert_NDC);
    //vert_Color.rg = sin(uv * 20.0);
}