import ToneMappingFunction from './toneMappingFunction.js';   

var shaderCode = `
    uniform float maxInputLuminance; // provided by the application    
    uniform float avgInputLuminance; // provided by the application    
    uniform float exposure; 
    
    vec3 ReinhardBasicToneMapping( vec3 color ) {
        return color / (1.0 + color); 
    }

    vec3 CustomToneMapping( vec3 color ) {
        color *= 65535. / avgInputLuminance;
        color *= exposure; 
        return ReinhardBasicToneMapping(color);
    }
    `

var shaderParameters = {
    "exposure": { min: 0.0, max: 1000.0, value: 150, name: "Exposure" },
};

const toneMappingReinhardBasic = new ToneMappingFunction("Reinhard Basic", shaderCode, shaderParameters);

export default toneMappingReinhardBasic;