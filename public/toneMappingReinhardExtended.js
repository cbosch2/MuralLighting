//need to check this webs before continuing:
//https://bruop.github.io/exposure/
//https://bruop.github.io/tonemapping
/
import ToneMappingFunction from './toneMappingFunction.js';   

var shaderCode = `
    uniform float maxInputLuminance; // provided by the application    
    uniform float avgInputLuminance; // provided by the application    
    uniform float exposure; 
    uniform float logavgInputLuminance;
        
    float luminance(vec3 color) {
        return dot(color, vec3(0.2126f, 0.7152f, 0.0722f));
    }

    vec3 change_lumincance(vec4 color, float target_luminance) {
        float l = luminance(color);
        return color * (target_luminance / l);
    }

    vec3 ReinhardExtendedToneMapping( vec3 color, float max_white_luminance) {
        float l = luminance(color);

        float numerator = l * (1.f + (l / (max_white_luminance * max_white_luminance)));
        float denominator = 1.f + l;
        
        return change_luminance(color, numerator/denominator)
    }
   
    vec3 CustomToneMapping( vec3 color ) {
        //check why i'm not using eq 1 and 2 from the reinhard paper.
        //luminance does it so, we have two parameters a = [0,1] maps the image to mid tones
        //then luminance is changed using L_white that is the another parameter that we can modify and represents the max value of luminance that will be white.

        return ReinhardExtendedToneMapping(color, 
        )

    }
    `

var shaderParameters = {
    "exposure": { min: 0.0, max: 1000.0, value: 150, name: "Exposure" },
};

const toneMappingReinhardBasic = new ToneMappingFunction("Reinhard Basic", shaderCode, shaderParameters);

export default toneMappingReinhardBasic;