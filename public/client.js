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
import DifferenceWindow from './differenceWindow.js';
import readTextFile from './shaderReader.js'; 

const toneMappingMethods = [toneMappingLinear, toneMappingReinhardBasic, toneMappingReinhardExtended, toneMappingLuminance]; // Add more tone mapping methods here

//Create the color ops chunk
var colorOpsGLSL = await readTextFile("shaders/colorOperations.glsl");
THREE.ShaderChunk.ColorOps = colorOpsGLSL;

// Parameters for GUI
const params = {
    toneMappingMethodName: toneMappingMethods[0].name, // Default tone mapping method
    syncViews : true,
    selectedTarget: 'both'

};
let syncing = false;

// Set up the renderer
const renderer = new THREE.WebGLRenderer();
const container1 = document.getElementById('window1');
renderer.setSize(container1.clientWidth, container1.clientHeight);
container1.appendChild(renderer.domElement);

// Create the scene
const scene = new THREE.Scene();
window.three = THREE; // For debugging

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, container1.clientWidth / container1.clientHeight, 0.1, 100);
camera.position.z = 2;

// SECOND
const renderer2 = new THREE.WebGLRenderer();
const container2 = document.getElementById('window2');
renderer2.setSize(container2.clientWidth, container2.clientHeight);
container2.appendChild(renderer2.domElement);

const scene2 = new THREE.Scene();
const camera2 = new THREE.PerspectiveCamera(75, container2.clientWidth / container2.clientHeight, 0.1, 100);
camera2.position.z = 2;


//THIRD
const container3 = document.getElementById('winDiff');
var vs = await readTextFile("shaders/vs_difference.glsl");
var fs = await readTextFile("shaders/fs_difference.glsl");
var difWin = new DifferenceWindow(vs, fs)
difWin.renderer.setSize(container3.clientWidth, container3.clientHeight);
container3.appendChild(difWin.renderer.domElement);


// Set up Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
const controls2 = new OrbitControls(camera2, renderer2.domElement);
const controls3 = new OrbitControls(difWin.camera, difWin.renderer.domElement);

controls.enableRotate = false;
controls2.enableRotate = false;
controls3.enableRotate = false;

controls.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.PAN
}
controls2.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.PAN
}

controls3.mouseButtons = {
	LEFT: THREE.MOUSE.PAN,
	MIDDLE: THREE.MOUSE.DOLLY,
	RIGHT: THREE.MOUSE.PAN
}

controls.addEventListener('change', () => {
    syncCameraViews(controls, camera2, controls2);
});

controls2.addEventListener('change', () => {
    syncCameraViews(controls2, camera, controls);
});

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
//DIFFERENCE

// Reference the existing dialog and close button
const dialog = document.getElementById('differenceDialog'); // Dialog container
const closeDialogButton = document.querySelector('.close-button'); // Close button inside dialog

// Function to open the dialog
function openDialog() {
    // Display the dialog and hide everything else in the background
    dialog.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Disable scrolling on the background

    //TODO: Create plane with material and the shaders
    //The shader mast huve two texture as input and a custom tone mapping operation that should be changed to compute both LDR colors per fragment
    //then be able to compute the difference.
    difWin.show(container3.clientWidth, container3.clientHeight);

}

// Function to close the dialog
function closeDialog() {
    dialog.style.display = 'none'; // Hide the dialog
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

// Add functionality to close the dialog
closeDialogButton.addEventListener('click', closeDialog);

// Optional: Close the dialog by clicking outside the content
dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
        closeDialog();
    }
});


exrLoader.load('./textures/XII/Natural/pv2_c1.exr', function (texture) {
    //update texture in dialog window
    difWin.leftTexture = texture;

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
    //toneMappingLuminance.updateParameterValue("Max_L", L.max);
    folder = toneMappingFolder.folders.find(f => f._title === "Luminance");
    if (folder) {
        // Find the controller for the parameter based on its name
        const controller = folder.controllers.find(ctrl => ctrl._name === "Max Luminance");
        if (controller) {
            // Update the GUI display
      //      controller.max(L.max);
      //      controller.updateDisplay();
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
    //mesh.position.x = -1.35;
    mesh.position.set(0, 0, 0);
    // Add the mesh to the scene
    scene.add(mesh);

    render(); // Initial render after the EXR texture has loaded

}, undefined, function (error) {
    console.error('An error occurred while loading the EXR texture:', error);
});

// exrLoader.load('./textures/XII/Natural/pv2_c2.exr', function (texture) {
//     const width = texture.image.width;
//     const height = texture.image.height;
//     const aspectRatio = width / height;

//     // Create a material using the EXR texture
//     const material2 = new  THREE.ShaderMaterial({
//         uniforms: {
//             uTexture: { type: 't', value: texture }, // Add the texture as a uniform
//             maxInputLuminance: { value: () => maxInputLuminance*1.0 },
//             avgInputLuminance: { value: () => avgInputLuminance*1.0 },
//             avg_L_w:           { value: () => logAvgInputLuminance*1.0 },
//         },
//         toneMapped: false,
//         vertexShader: VS,
//         fragmentShader: FS
//     });
//     material2.originalFragmentShader = material2.fragmentShader;
//     material2.fragmentShader = "vec3 CustomToneMapping( vec3 color ) {return color;}" + material.originalFragmentShader;

//     // Create a plane geometry for the second EXR image
//     const geometry2 = new THREE.PlaneGeometry(1.5 * aspectRatio, 1.5);

//     // Create a mesh for the second image
//     const mesh2 = new THREE.Mesh(geometry2, material2);
//     //mesh2.position.x = 1.35; // Position it to the right side
//     mesh2.position.set(0, 0, 0);
//     // Add the second mesh to the scene
//     scene2.add(mesh2);

//     render(); // Render after the second EXR texture has loaded

// }, undefined, function (error) {
//     console.error('An error occurred while loading the second EXR texture:', error);
// });
exrLoader.load('./textures/XII/Natural/pv2_c2.exr', function (texture) {
    //update texture in dialog window
    difWin.rightTexture = texture;

    const width = texture.image.width;    // 1920
    const height = texture.image.height;  // 1080
    const aspectRatio = width / height;   // 1.777

    // Analyze the texture
    const {r, g, b, L} = analyzeTexture(texture); // max and min RGB values of the texture
    maxInputLuminance = Math.max(r.max, g.max, b.max);
    avgInputLuminance = (r.average/3 + g.average/3 + b.average/3);
    logAvgInputLuminance = L.average;

    // Create a material using the EXR texture
    const material2 = new THREE.ShaderMaterial({
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
    material2.fragmentShader = "vec3 CustomToneMapping( vec3 color ) {return color;}" + material2.originalFragmentShader;

    // Create a plane geometry for displaying the image
    const geometry2 = new THREE.PlaneGeometry(1.5 * aspectRatio, 1.5); // Adjust the size as needed for the image

    // Create a mesh using the geometry and material
    const mesh2 = new THREE.Mesh(geometry2, material2);
    mesh2.position.set(0, 0, 0); // Center the mesh in the scene

    // Add the mesh to the second scene
    scene2.add(mesh2);

    render(); // Initial render after the EXR texture has loaded
}, undefined, function (error) {
    console.error('An error occurred while loading the second EXR texture:', error);
});


// Create a GUI for tone mapping
const gui = new GUI();
gui.add(params, 'syncViews').name('Sync Views');
gui.add(params, 'selectedTarget', { 'Both Windows': 'both', 'Window 1': 'window1', 'Window 2': 'window2' }).name('Apply To');
gui.add({ openDialog: () => openDialog() }, 'openDialog').name('Difference');

const toneMappingFolder = gui.addFolder( 'Tone Mapping' );

// Add tone mapping selection dropdown
var options = toneMappingMethods.map(method => method.name);
toneMappingFolder.add(params, 'toneMappingMethodName', options).name('Tone mapping').onChange((value) => {
    updateToneMapping();
});

for (let method of toneMappingMethods) {
    const folder = toneMappingFolder.addFolder(method.name);
    for (const [_, param] of Object.entries(method.parameters)) {
        folder.add(param, "value", param.min, param.max).name(param.name).onChange((value) => {
            updateToneMapping();
        });
        //     render();
        // });        
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

function updateToneMapping() {
    const method = toneMappingMethods.find(method => method.name === params.toneMappingMethodName);

    if (params.selectedTarget === 'both') {
        setToneMappingMethod(scene, method);
        setToneMappingMethod(scene2, method);
    } else if (params.selectedTarget === 'window1') {
        setToneMappingMethod(scene, method);
    } else if (params.selectedTarget === 'window2') {
        setToneMappingMethod(scene2, method);
    }

    render(); // Render the selected scenes
}


// Handle window resizing
window.addEventListener('resize', function () {
    camera.aspect = container1.clientWidth / container1.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container1.clientWidth, container1.clientHeight);

    camera2.aspect = container2.clientWidth / container2.clientHeight;
    camera2.updateProjectionMatrix();
    renderer2.setSize(container2.clientWidth, container2.clientHeight);
    
    render(); // Re-render the scene after resizing
}, false);
// Animation loop
function animate() {
    requestAnimationFrame(animate);

    controls.update();
    controls2.update();

    renderer.render(scene, camera);
    renderer2.render(scene2, camera2);
}
animate();

function setToneMappingMethod(currentScene, method) {
    currentScene.traverse((object) => {
        if (object.isMesh && object.material) {
            object.material.fragmentShader = method.sourceCode + object.material.originalFragmentShader;
            object.material.needsUpdate = true;
        }
    });
}

function render() {
    const method = toneMappingMethods.find(method => method.name === params.toneMappingMethodName);

    // Apply tone mapping to both scenes
    // [scene, scene2].forEach((currentScene) => {
    //     setToneMappingMethod(currentScene, method); // Apply tone mapping

    let scenesToUpdate = [];
    if (params.selectedTarget === 'both') {
        scenesToUpdate = [scene, scene2];
    } else if (params.selectedTarget === 'window1') {
        scenesToUpdate = [scene];
    } else if (params.selectedTarget === 'window2') {
        scenesToUpdate = [scene2];
    }


    scenesToUpdate.forEach((currentScene) => {
        setToneMappingMethod(currentScene, method);


        currentScene.traverse((object) => {
            if (object.isMesh && object.material) {
                object.material.uniforms.maxInputLuminance.value = maxInputLuminance;
                object.material.uniforms.avgInputLuminance.value = avgInputLuminance;
                object.material.uniforms.avg_L_w.value = logAvgInputLuminance;

                // Apply tone mapping parameters
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
    });

    // Render both scenes
    renderer.render(scene, camera);
    renderer2.render(scene2, camera2);
}
function syncCameraViews(sourceControls, targetCamera, targetControls) {
    if (!params.syncViews || syncing) return;

    syncing = true; // Prevent recursive calls

    // Copy position and orientation
    targetCamera.position.copy(sourceControls.object.position);
    targetCamera.quaternion.copy(sourceControls.object.quaternion);

    // Copy zoom and ensure projection matrix is updated
    targetCamera.zoom = sourceControls.object.zoom;
    targetCamera.updateProjectionMatrix();

    // Sync the target (focus point)
    targetControls.target.copy(sourceControls.target);
    targetControls.update();

    syncing = false; // Allow further sync
}

// Start the animation loop
animate();
