import ToneMappingFunction from './toneMappingFunction.js';   

var shaderCode = `
    uniform float maxInputLuminance; // provided by the application
    uniform float avgInputLuminance; // provided by the application        
    uniform float exposure; 
    
    vec3 CustomToneMapping( vec3 color ) 
    {
        color *= (65535. / avgInputLuminance);
        color *= exposure; 
        return color;
    }
    `

var shaderParameters = {
    "exposure": { min: 0.0, max: 1000.0, value: 30, name: "Exposure" },
};

const toneMappingLinear = new ToneMappingFunction("Linear", shaderCode, shaderParameters);

export default toneMappingLinear;