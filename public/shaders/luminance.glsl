#include <ColorOps>

uniform sampler2D colorMap;    // Magma colormap (treated as 2D texture)
uniform float Max_L;           // Maximum luminance of the scene or which luminance maps to white

vec3 CustomToneMapping( vec3 color ) {
    // Obtain luminance from input color
    vec3 XYZ = convert_RGB2XYZ(color);
    float luminance = XYZ.y;

    // Normalize luminance
    float norm_lum = clamp(luminance / Max_L, 0.0, 1.0);

    // Map normalized luminance to the colormap (using a fixed vertical coordinate of 0.5)
    vec3 mappedColor = texture2D(colorMap, vec2(norm_lum, 0.5)).rgb;

    return mappedColor;
}






