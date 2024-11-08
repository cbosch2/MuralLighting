uniform float maxInputLuminance; // provided by the application
uniform float avgInputLuminance; // provided by the application        
uniform float exposure; 

vec3 CustomToneMapping( vec3 color ) 
{
    color *= (1. / avgInputLuminance);
    color *= exposure; 
    return color;
}