import ToneMappingFunction from './toneMappingFunction.js';   

var shaderCode = `
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
    `

var shaderParameters = {
    "exposure": { min: 0.0, max: 10.0, value: 1, name: "Exposure" },
};

const toneMappingReinhardBasic = new ToneMappingFunction("Reinhard Basic", shaderCode, shaderParameters);

export default toneMappingReinhardBasic;