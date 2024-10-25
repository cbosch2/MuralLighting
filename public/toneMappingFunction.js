/**
 *  This module provides a class for creating custom tone mapping functions.
 */

class ToneMappingFunction {
    /**
     * 
     * @param {string} name  The name of the shader function. Must be a valid identifier.
     * @param {string} sourceCode GLSL shader code as a string. Must include the function name.
     * @param {object} parameters Object containing key-value pairs for the parameters of the function. 
     */
    constructor(name, sourceCode, parameters) {
        
        // check if name is a string
        if (typeof name !== "string") {
            throw new Error("name must be a string.");
        }
       
        // Attribute to hold the name of the shader (for the GUI)    
        this.name = name;

        // Attribute to hold the GLSL shader code as a string
        // check if sourceCode is a string
        if (typeof sourceCode !== "string") {
            throw new Error("sourceCode must be a string.");
        }
        // check if sourceCode includes the function name
        if (!sourceCode.includes("CustomToneMapping")) {
            throw new Error("sourceCode must include the function CustomToneMapping");
        }   
        this.sourceCode = sourceCode;

        // Attribute to hold key-value pairs for additional settings
        // check if parameters is an object
        if (typeof parameters !== "object") {
            throw new Error("parameters must be an object.");
        }
        // check if all parameters include min, max, value, and name fields
        for (const [key, param] of Object.entries(parameters)) {
            if (typeof param !== "object") {
                throw new Error("parameters must be an object.");
            }
            if (typeof param.min !== "number") {
                throw new Error("parameters must include a min field.");
            }
            if (typeof param.max !== "number") {
                throw new Error("parameters must include a max field.");
            }
            if (typeof param.value !== "number") {
                throw new Error("parameters must include a value field.");
            }
            if (typeof param.name !== "string") {
                throw new Error("parameters must include a name field.");
            }
        }
        this.parameters = parameters;
    }
}

export default ToneMappingFunction; 
