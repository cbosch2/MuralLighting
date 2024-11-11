uniform float Max_L; //maximum luminance of the scene or which luminance will map to white

// Convert RGB to XYZ color space
vec3 convert_RGB2XYZ(vec3 rgb) {
    vec3 linearRGB = rgb;//linearizeRGB(rgb);

    // Transformation matrix from linear sRGB to XYZ (D65 reference white)
    const mat3 RGB2XYZ = mat3(
        0.4124564, 0.3575761, 0.1804375,
        0.2126729, 0.7151522, 0.0721750,
        0.0193339, 0.1191920, 0.9503041
    );

    vec3 xyz = RGB2XYZ * linearRGB;
    return xyz;
}

vec3 CustomToneMapping( vec3 color ) {
    //obtain luminace
    vec3 XYZ = convert_RGB2XYZ(color); 
    float luminance = XYZ.y;

    //normalize luminance
    float norm_lum = clamp(luminance/Max_L, 0.f, 1.f);

    return vec3(norm_lum);
}