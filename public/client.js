import * as THREE from 'three';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js'; // Import lil-gui for the exposure slider
import { EXRLoader } from './jsm/loaders/EXRLoader.js'; // Ensure you have this loader
import analyzeTexture from './analyzeTexture.js'; // Import the analyzeTexture function
import toneMappingReinhardBasic from './toneMappingReinhardBasic.js'; // Import the toneMappingReinhardBasic shader
import toneMappingLinear from './toneMappingLinear.js';
//import toneMappingLinearGamma from './toneMappingLinearGamma.js';
import toneMappingReinhardExtended from './toneMappingReinhardExtended.js'
import toneMappingLuminance from './toneMappingLuminance.js'

const toneMappingMethods = [toneMappingLinear, toneMappingReinhardBasic, toneMappingReinhardExtended, toneMappingLuminance]; // Add more tone mapping methods here

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
exrLoader.setDataType(THREE.FloatType); 
const VS = `
      varying vec2 vUv;
  
      void main() {
        vUv = uv; // Pass UV coordinates to the fragment shader
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
const FS = `
      uniform sampler2D uTexture;
      varying vec2 vUv;
  
      void main() {
        vec4 textureColor = texture2D(uTexture, vUv);
        gl_FragColor = vec4(CustomToneMapping(textureColor.rgb),1.0); // Set the color of the fragment to the sampled texture color
      }
    `

exrLoader.load('./textures/XII/Natural/pv2_c1.exr', function (texture) {
    const width = texture.image.width;    // 1920
    const height = texture.image.height;  // 1080
    const aspectRatio = width / height;   // 1.777

    // Analyze the texture
    const {r, g, b, L} = analyzeTexture(texture); // max and min RGB values of the texture
    
    maxInputLuminance = Math.max(r.max, g.max, b.max);
    maxInputLuminance = 0.2126 * r.max + 0.7152 * g.max + 0.0722 * b.max;
    avgInputLuminance = (r.average/3 + g.average/3 + b.average/3);
    avgInputLuminance = 0.2126 * r.average + 0.7152 * g.average + 0.0722 * b.average;
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
    //toneMappingReinhardExtended.updateParameterValue("L_white", L.max);
    //toneMappingReinhardExtended.updateParameterConfig("L_white", 0, L.max*2, L.max);
    //console.log(toneMappingFolder.folders);
    // Find the Reinhard Folder
    var folder = toneMappingFolder.folders.find(f => f._title === "Reinhard Extended");
    if (folder) {
        // Find the controller for the parameter based on its name
        const controller = folder.controllers.find(ctrl => ctrl._name === "L White");
        if (controller) {
            // Update the GUI display
            //controller.max(L.max*2);
            //controller.updateDisplay();
        } else console.log("NOT FOUND");
    }
    // Find the Luminance Folder
    toneMappingLuminance.updateParameterValue("Max_L", L.max);
    folder = toneMappingFolder.folders.find(f => f._title === "Luminance");
    if (folder) {
        // Find the controller for the parameter based on its name
        const controller = folder.controllers.find(ctrl => ctrl._name === "Max Luminance");
        if (controller) {
            // Update the GUI display
            controller.max(L.max);
            controller.updateDisplay();
        } else console.log("NOT FOUND");
    }
   
    // Create a material using the EXR texture
    material = new  THREE.ShaderMaterial({
        uniforms: {
            uTexture: { type: 't', value: texture }, // Add the texture as a uniform
            maxInputLuminance: { value: () => maxInputLuminance },
            avgInputLuminance: { value: () => avgInputLuminance },
            avg_L_w:           { value: () => logAvgInputLuminance },
        },
        toneMapped: false,
        vertexShader: VS,
        fragmentShader: FS
    });
    material.originalFragmentShader = material.fragmentShader;
    material.fragmentShader = "vec3 CustomToneMapping( vec3 color ) {return color;}" + material.originalFragmentShader;
    
    // Create a plane geometry for displaying the image
    const geometry = new THREE.PlaneGeometry(1.5 * aspectRatio, 1.5); // Adjust the size as needed for the image

    // Create a mesh using the geometry and material
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = -1.35;
    // Add the mesh to the scene
    scene.add(mesh);

    render(); // Initial render after the EXR texture has loaded

}, undefined, function (error) {
    console.error('An error occurred while loading the EXR texture:', error);
});

exrLoader.load('./textures/XII/Natural/pv2_c2.exr', function (texture) {
    const width = texture.image.width;
    const height = texture.image.height;
    const aspectRatio = width / height;

    // Create a material using the EXR texture
    const material2 = new  THREE.ShaderMaterial({
        uniforms: {
            uTexture: { type: 't', value: texture }, // Add the texture as a uniform
            maxInputLuminance: { value: () => maxInputLuminance },
            avgInputLuminance: { value: () => avgInputLuminance },
            avg_L_w:           { value: () => logAvgInputLuminance },
        },
        toneMapped: false,
        vertexShader: VS,
        fragmentShader: FS
    });
    material2.originalFragmentShader = material2.fragmentShader;
    material2.fragmentShader = "vec3 CustomToneMapping( vec3 color ) {return color;}" + material.originalFragmentShader;

    // Create a plane geometry for the second EXR image
    const geometry2 = new THREE.PlaneGeometry(1.5 * aspectRatio, 1.5);

    // Create a mesh for the second image
    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.position.x = 1.35; // Position it to the right side

    // Add the second mesh to the scene
    scene.add(mesh2);

    render(); // Render after the second EXR texture has loaded

}, undefined, function (error) {
    console.error('An error occurred while loading the second EXR texture:', error);
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
        //console.log(method.name, " ", param.name, " ", param.value);     
    }
}

toneMappingFolder.open();
updateFolders(params.toneMappingMethodName)

// Function to collapse other folders and expand the selected one
function updateFolders(selectedOption) {
    //console.log(selectedOption);
    toneMappingFolder.folders.forEach(folder => {
        //console.log(folder._title);
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
    scene.traverse((object) => {
        if (object.isMesh && object.material) {
            object.material.fragmentShader = method.sourceCode + object.material.originalFragmentShader;
            object.material.needsUpdate = true;
        }
    });
}

// Render function
function render() {
    const method = toneMappingMethods.find(method => method.name === params.toneMappingMethodName);
    setToneMappingMethod(method);

    scene.traverse((object) => {
        if (object.isMesh && object.material) {
            object.material.uniforms.maxInputLuminance.value = maxInputLuminance;
            object.material.uniforms.avgInputLuminance.value = avgInputLuminance;
            object.material.uniforms.avg_L_w.value = logAvgInputLuminance;

            for (const [key, param] of Object.entries(method.parameters)) {
                if (object.material.uniforms[key]) {
                    object.material.uniforms[key].value = param.value;
                } else {
                    object.material.uniforms[key] = { value: param.value };
                }
            }
            object.material.needsUpdate = true;
        }
    });

    renderer.render(scene, camera);
    //pedo
}

// Start the animation loop
animate();
