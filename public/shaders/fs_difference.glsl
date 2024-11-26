#include <ColorOps>

uniform sampler2D uLeftTexture;
uniform sampler2D uRightTexture;
uniform float uMaxDelta;
varying vec2 vUv;

void main() {
    
    vec4 lTexColor = texture2D(uLeftTexture, vUv);
    vec4 rTexColor = texture2D(uRightTexture, vUv);

    //obtain luminace
    vec3 lXYZ = convert_RGB2XYZ(lTexColor.xyz); 
    float lLum = lXYZ.y;
    vec3 rXYZ = convert_RGB2XYZ(rTexColor.xyz); 
    float rLum = rXYZ.y;

    //compute difference
    float delta = abs(lLum-rLum)/(uMaxDelta);//
    gl_FragColor = vec4(vec3(clamp(delta, 0., 1.)), 1.0); // Set the color of the fragment to the sampled texture color
    
    //if(delta>0.9)
    //    gl_FragColor = vec4(1,0,0,1);
}