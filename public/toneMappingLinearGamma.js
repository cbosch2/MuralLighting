import ToneMappingFunction from './toneMappingFunction.js';   

var shaderCode = `
    uniform float maxInputLuminance; // provided by the application
    uniform float avgInputLuminance; // provided by the application        
    uniform float exposure; 
    uniform float gamma; 
    
    vec3 CustomToneMapping( vec3 color ) 
    {
        color *= (65535. / avgInputLuminance);
        color *= exposure; 
        color = pow(color, vec3(1.0 / gamma));
        return color;
    }
    `

var shaderParameters = {
    "exposure": { min: 0.0, max: 1000.0, value: 30, name: "Exposure" },
    "gamma": { min: 1.0, max: 4.0, value: 2.2, name: "Gamma" },

};

const toneMappingLinearGamma = new ToneMappingFunction("Linear Gamma", shaderCode, shaderParameters);

export default toneMappingLinearGamma;