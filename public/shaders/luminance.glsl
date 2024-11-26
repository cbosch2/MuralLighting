#include <ColorOps>

uniform float Max_L; //maximum luminance of the scene or which luminance will map to white

vec3 CustomToneMapping( vec3 color ) {
    //obtain luminace
    vec3 XYZ = convert_RGB2XYZ(color); 
    float luminance = XYZ.y;

    //normalize luminance
    float norm_lum = clamp(luminance/Max_L, 0.f, 1.f);

    return vec3(norm_lum);
}