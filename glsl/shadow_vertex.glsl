
uniform vec3 vertexColor;
uniform float scale;

void main() {

    mat4 newModelMatrix = {
        
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vert_NDC = gl_Position.xyz;

    vert_WorldNormal = (modelMatrix * vec4(normal, 1.0)).xyz;
    vert_ViewNormal = normalize(
        (projectionMatrix * modelViewMatrix * vec4(normal, 1.0)).xyz
    );

    // basic light calculations
    float vert_SunDot = dot(vert_WorldNormal, sunDirection);

    vert_LightIntensity = max(vert_SunDot, 0.1);
    /*
    vert_ReflectionIntensity = max(abs(vert_SunDot + vert_ViewDot) - 1.0, 0.0);

    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    vert_ReflectionIntensity *= vert_ReflectionIntensity;
    */
    
    vert_Color = vertexColor * vert_LightIntensity;
    //vert_Color = vert_ViewNormal * 0.5 + 0.5;
    //vert_Color.rg = sin(uv * 20.0);
}