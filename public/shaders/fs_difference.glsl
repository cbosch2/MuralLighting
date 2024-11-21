uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
    gl_FragColor = vec4(CustomToneMapping(textureColor.rgb),1.0); // Set the color of the fragment to the sampled texture color
    gl_FragColor = vec4(1,0,0,1);
}