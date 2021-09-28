smooth out vec3 vert_ViewNormal;
smooth out vec3 vert_WorldNormal;
smooth out vec3 vert_Color;
smooth out vec3 vert_NDC;
smooth out vec3 vert_WorldPosition;

void main() {

    vert_WorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vert_NDC = gl_Position.xyz;

    vert_WorldNormal = (modelMatrix * vec4(normal, 1.0)).xyz;
    vert_ViewNormal = normalize(
        (projectionMatrix * modelViewMatrix * vec4(normal, 1.0)).xyz
    );
    /*
    vert_ReflectionIntensity = max(abs(vert_SunDot + vert_ViewDot) - 1.0, 0.0);

    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    */
    //vert_Color = vert_ViewNormal * 0.5 + 0.5;
    vert_Color = vec3(0.0, 0.0, 1.0);
}