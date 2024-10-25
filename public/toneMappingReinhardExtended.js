//REFERENCES:
//https://www-old.cs.utah.edu/docs/techreports/2002/pdf/UUCS-02-001.pdf
//https://www.ryanjuckett.com/rgb-color-space-conversion/
//https://bruop.github.io/exposure/
//https://bruop.github.io/tonemapping
//PRE-CONDITION: RGB Values are linearized!!!

import ToneMappingFunction from './toneMappingFunction.js';   

var shaderCode = `
    //uniform float maxInputLuminance; // provided by the application    
    //uniform float avgInputLuminance; // provided by the application    
    //uniform float exposure; 
    
    uniform float avg_L_w; //logarithmic average Luminance;
    uniform float a;// = 0.18; //key parameter describes the key of the image.
    uniform float L_white; //maximum luminance of the scene or which luminance will map to white
    
    // Convert RGB to XYZ color space
    vec3 convert_RGB2XYZ(vec3 rgb) {
        vec3 linearRGB = rgb;//linearizeRGB(rgb);

        // Transformation matrix from linear sRGB to XYZ (D65 reference white)
        const mat3 RGB2XYZ = mat3(
            0.4124564, 0.3575761, 0.1804375,
            0.2126729, 0.7151522, 0.0721750,
            0.0193339, 0.1191920, 0.9503041
        );

        vec3 xyz = RGB2XYZ * linearRGB;
        return xyz;
    }

    // Convert XYZ to RGB color space
    vec3 convert_XYZ2RGB(vec3 xyz) {
        // Transformation matrix from XYZ to linear sRGB (D65 reference white)
        const mat3 XYZ2RGB = mat3(
            3.2404542, -1.5371385, -0.4985314,
            -0.9692660,  1.8760108,  0.0415560,
            0.0556434, -0.2040259,  1.0572252
        );

        vec3 linearRGB = XYZ2RGB * xyz;
        vec3 rgb = linearRGB;//delinearizeRGB(linearRGB);
        return rgb;
    }

    vec3 convert_RGB2Yxy(vec3 rgb) {
    
        vec3 xyz = convert_RGB2XYZ(rgb);
        float X = xyz.x;
        float Y = xyz.y;
        float Z = xyz.z;
        float sum = X + Y + Z;

        // Calculate chromaticity coordinates x and y
        float x = (sum == 0.0) ? 0.0 : X / sum;
        float y = (sum == 0.0) ? 0.0 : Y / sum;

        return vec3(Y, x, y);
    }

    vec3 convert_Yxy2RGB(vec3 Yxy) {
        float Y = Yxy.x;
        float x = Yxy.y;
        float y = Yxy.z;

        // Convert Yxy to XYZ
        float X = (y == 0.0) ? 0.0 : (x * Y) / y;
        float Z = (y == 0.0) ? 0.0 : ((1.0 - x - y) * Y) / y;

        vec3 xyz = vec3(X, Y, Z);
        return convert_XYZ2RGB(xyz);
    }
    
    float compute_L(float L_w) {
        return ((a)/avg_L_w)*L_w;//trick because a needs in [0,1], but we are with not normalized data.
    }

    vec3 ReinhardExtendedToneMapping( vec3 color) {
        
        vec3 Yxy = convert_RGB2Yxy(color);

        float L = compute_L(Yxy.x);

        float numerator = L * (1.f + (L / (L_white * L_white)));
        float denominator = 1.f + L;
        
        float L_d = numerator/denominator;

        Yxy.x = L_d;

        return convert_Yxy2RGB(Yxy);
    }
   
    vec3 CustomToneMapping( vec3 color ) {
        //check why i'm not using eq 1 and 2 from the reinhard paper.
        //luminance does it so, we have two parameters a = [0,1] maps the image to mid tones
        //then luminance is changed using L_white that is the another parameter that we can modify and represents the max value of luminance that will be white.

        color *= 65535./L_white;
        vec3 toned_color = ReinhardExtendedToneMapping(color);

        return toned_color/L_white;

    }
    `

var shaderParameters = {
    "a": { min: 0.0, max: 1.0, value: 0.18, name: "Key" },
    "L_white": { min: 0.0, max: 15000.0, value: 15000.0, name: "L White" },
};

const toneMappingReinhardExtended = new ToneMappingFunction("Reinhard Extended", shaderCode, shaderParameters);

export default toneMappingReinhardExtended;