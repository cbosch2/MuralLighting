import ToneMappingFunction from './toneMappingFunction.js';
import readTextFile from './shaderReader.js'; 

var shaderCode = await readTextFile("shaders/linear.glsl");

var shaderParameters = {
    "exposure": { min: 0.0, max: 20.0, value: 1, name: "Exposure" },
};

const toneMappingLinear = new ToneMappingFunction("Linear", shaderCode, shaderParameters);

export default toneMappingLinear;