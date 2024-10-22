import * as THREE from 'three';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js'; // Import lil-gui for the exposure slider
import { EXRLoader } from './jsm/loaders/EXRLoader.js'; // Ensure you have this loader
import analyzeTexture from './analyzeTexture.js'; // Import the analyzeTexture function
import toneMappingReinhardBasic from './toneMappingReinhardBasic.js'; // Import the toneMappingReinhardBasic shader
import toneMappingLinear from './toneMappingLinear.js';
import toneMappingLinearGamma from './toneMappingLinearGamma.js';
import toneMappingReinhardExtended from './toneMappingReinhardExtended.js'

const toneMappingMethods = [toneMappingLinear, toneMappingLinearGamma, toneMappingReinhardBasic, toneMappingReinhardExtended]; // Add more tone mapping methods here

// Parameters for GUI
const params = {
    toneMappingMethodName: toneMappingMethods[0].name // Default tone mapping method
};



// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create the scene
const scene = new THREE.Scene();
window.three = THREE; // For debugging

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 2;

// Set up Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;
controls.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.PAN
}

// Initialize stats for performance monitoring
const stats = Stats();
document.body.appendChild(stats.dom);

// Tone mapping

var toneMappingDefaultShaderCode = THREE.ShaderChunk.tonemapping_pars_fragment;
renderer.toneMapping = THREE.CustomToneMapping; 
renderer.toneMappingExposure = 1.0; // Default exposure value


// Load an EXR image
var maxInputLuminance = null;
var avgInputLuminance = null;
var logAvgInputLuminance = null;
var material = null;
const exrLoader = new EXRLoader();

exrLoader.load('./textures/XII/Natural/pv2_c1.exr', function (texture) {
    const width = texture.image.width;    // 1920
    const height = texture.image.height;  // 1080
    const aspectRatio = width / height;   // 1.777

    // Analyze the texture
    const {r, g, b, L} = analyzeTexture(texture); // max and min RGB values of the texture
    maxInputLuminance = Math.max(r.max, g.max, b.max);
    avgInputLuminance = (r.average/3 + g.average/3 + b.average/3);
    logAvgInputLuminance = L.average;
    
    // Log the properties of the texture
    console.log('Format de la textura:', texture.format);
    console.log('Tipus de dades de la textura:', texture.type);
    console.log('Mida de la textura:', texture.image.width, 'x', texture.image.height);
    console.log('Generació de mipmaps:', texture.generateMipmaps);
    console.log('MinFilter:', texture.minFilter);
    console.log('MagFilter:', texture.magFilter);

    console.log('Texture RGB Analysis:');
    console.log(`Red - Min: ${r.min}, Max: ${r.max}, Sum: ${r.sum}, Count:${r.count}, Avg: ${r.average}`);
    console.log(`Green - Min: ${g.min}, Max: ${g.max}, Sum: ${g.sum}, Count:${g.count}, Avg: ${g.average}`);
    console.log(`Blue - Min: ${b.min}, Max: ${b.max}, Sum: ${b.sum}, Count:${b.count}, Avg: ${b.average}`);
    console.log('Max input luminance:', maxInputLuminance);
    console.log('Avg input luminance:', avgInputLuminance);
    console.log('Log Avg input L:', logAvgInputLuminance);
    console.log('Max input L:', L.max);

    //update the L_white of extended reinhard
    toneMappingReinhardExtended.updateParameterValue("L_white", L.max);
    console.log(toneMappingFolder.folders);
    // Find the corresponding folder in the GUI
    const folder = toneMappingFolder.folders.find(f => f._title === "Reinhard Extended");
    if (folder) {
        // Find the controller for the parameter based on its name
        const controller = folder.controllers.find(ctrl => ctrl._name === "L White");
        if (controller) {
            // Update the GUI display
            controller.updateDisplay();
        } else console.log("NOT FOUND");
    }
   
    // Create a material using the EXR texture
    material = new  THREE.ShaderMaterial({
        uniforms: {
            uTexture: { type: 't', value: texture }, // Add the texture as a uniform
            maxInputLuminance: { value: () => maxInputLuminance*1.0 },
            avgInputLuminance: { value: () => avgInputLuminance*1.0 },
            avg_L_w:           { value: () => logAvgInputLuminance*1.0 },
        },
        toneMapped: false,
        vertexShader: `
      varying vec2 vUv;
  
      void main() {
        vUv = uv; // Pass UV coordinates to the fragment shader
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying vec2 vUv;
  
      void main() {
        vec4 textureColor = texture2D(uTexture, vUv);
        gl_FragColor = vec4(CustomToneMapping(textureColor.rgb),1.0); // Set the color of the fragment to the sampled texture color
      }
    `
    });
    material.originalFragmentShader = material.fragmentShader;
    material.fragmentShader = "vec3 CustomToneMapping( vec3 color ) {return color;}" + material.originalFragmentShader;
    
    // Create a plane geometry for displaying the image
    const geometry = new THREE.PlaneGeometry(3 * aspectRatio, 3); // Adjust the size as needed for the image

    // Create a mesh using the geometry and material
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add the mesh to the scene
    scene.add(mesh);

    render(); // Initial render after the EXR texture has loaded

}, undefined, function (error) {
    console.error('An error occurred while loading the EXR texture:', error);
});


// Create a GUI for tone mapping
const gui = new GUI();
const toneMappingFolder = gui.addFolder( 'Tone Mapping' );

// Add tone mapping selection dropdown
var options = toneMappingMethods.map(method => method.name);
toneMappingFolder.add(params, 'toneMappingMethodName', options).name('Tone mapping').onChange((value) => {
    updateFolders(value);
    render();
    });

// Add the parameters of each method
for (var method of toneMappingMethods) {
    var folder = toneMappingFolder.addFolder(method.name);
    for (const [_, param] of Object.entries(method.parameters)) {
        folder.add(param, "value", param.min, param.max).name(param.name).onChange((value) => {
            render();
        });   
        console.log(method.name, " ", param.name, " ", param.value);     
    }
}


toneMappingFolder.open();
updateFolders(params.toneMappingMethodName)

// Function to collapse other folders and expand the selected one
function updateFolders(selectedOption) {
    console.log(selectedOption);
    toneMappingFolder.folders.forEach(folder => {
        console.log(folder._title);
        if (folder._title === `${selectedOption}`) {
            folder.open(); // Expand the selected folder
        } else {
            folder.close(); // Collapse all other folders
        }
    });
}

// Handle window resizing
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render(); // Re-render the scene after resizing
}, false);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}

function setToneMappingMethod(method) {
    if (material)    
        material.fragmentShader = method.sourceCode + material.originalFragmentShader;
}

// Render function
function render() {
    var method = toneMappingMethods.find(method => method.name === params.toneMappingMethodName);
    setToneMappingMethod(method);
    if (material) {
        // update uniforms
        material.uniforms.maxInputLuminance.value = maxInputLuminance;
        material.uniforms.avgInputLuminance.value = avgInputLuminance;
        material.uniforms.avg_L_w.value           = logAvgInputLuminance;

        for (const [key, param] of Object.entries(method.parameters)) {
            if (material.uniforms[key])
                material.uniforms[key].value = param.value;
            else
                material.uniforms[key] = {value: param.value};
        } 
        material.needsUpdate = true;
    }
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
