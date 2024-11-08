uniform float maxInputLuminance; // provided by the application    
uniform float avgInputLuminance; // provided by the application    
uniform float exposure; 

vec3 ReinhardBasicToneMapping( vec3 color ) {
    return color / (1.0 + color); 
}

vec3 CustomToneMapping( vec3 color ) {
    color *= 1. / avgInputLuminance;
    color *= exposure; 
    vec3 toned_color = ReinhardBasicToneMapping(color);

    return pow(toned_color, vec3(1.0 / 2.2));;
    return toned_color;

}