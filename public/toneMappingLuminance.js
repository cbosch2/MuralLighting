import ToneMappingFunction from './toneMappingFunction.js';   
import readTextFile from './shaderReader.js'; 

var shaderCode = await readTextFile("shaders/luminance.glsl");

var shaderParameters = {
    "Max_L": { min: 0.0, max: 10, value: 1, name: "Max Luminance" },
};

const toneMappingLuminance = new ToneMappingFunction("Luminance", shaderCode, shaderParameters);

export default toneMappingLuminance;