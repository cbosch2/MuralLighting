import * as THREE from 'three';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import Stats from './jsm/libs/stats.module.js';
import { GUI } from './jsm/libs/lil-gui.module.min.js'; // Import lil-gui for the exposure slider
import { EXRLoader } from './jsm/loaders/EXRLoader.js'; // Ensure you have this loader
import analyzeTexture from './analyzeTexture.js'; // Import the analyzeTexture function

// Parameters for GUI and exposure
const params = {
    exposure: 1.0, 
    colorMultiplier: 1.0,
    toneMapping: 'Reinhard'
};

const toneMappingOptions = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Custom: THREE.CustomToneMapping
};
// Set up the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.toneMapping = toneMappingOptions[ params.toneMapping ];
renderer.toneMappingExposure = params.exposure;

// Custom Reinhard tone mapping (C / (1 + C))--> C= color/intensidad del pixel
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    'vec3 CustomToneMapping( vec3 color ) { return color; }',
    `
    vec3 ReinhardToneMapping( vec3 color ) {
        return color / (1.0 + color); // Reinhard tone mapping formula
    }

    vec3 CustomToneMapping( vec3 color ) {
        color *= toneMappingExposure;
        color *= ${params.colorMultiplier}; // Apply colorMultiplier to adjust color intensity
        return ReinhardToneMapping(color);
    }
    `
);

// Create the scene
const scene = new THREE.Scene();

// Set up the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 2;

// Set up Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Initialize stats for performance monitoring
const stats = Stats();
document.body.appendChild(stats.dom);

// Load an EXR image
const exrLoader = new EXRLoader();

exrLoader.load('./textures/XII/Artificial+Natural/pv2_c1.exr', function (texture) {
    const width = texture.image.width;    // 1920
    const height = texture.image.height;  // 1080
    const aspectRatio = width / height;   // 1.777

    // Set the EXR texture to use equirectangular mapping
    texture.mapping = THREE.EquirectangularReflectionMapping;
    console.log('Format de la textura:', texture.format);
    console.log('Tipus de dades de la textura:', texture.type);
    console.log('Mida de la textura:', texture.image.width, 'x', texture.image.height);
    console.log('Generació de mipmaps:', texture.generateMipmaps);
    console.log('MinFilter:', texture.minFilter);
    console.log('MagFilter:', texture.magFilter);
    const {r, g, b} = analyzeTexture(texture); // max and min RGB values of the texture
    // Output the results to the console
    console.log('Texture RGB Analysis:');
    console.log(`Red - Min: ${r.min}, Max: ${r.max}`);
    console.log(`Green - Min: ${g.min}, Max: ${g.max}`);
    console.log(`Blue - Min: ${b.min}, Max: ${b.max}`);


    // Create a basic material using the EXR texture
    const material = new THREE.MeshBasicMaterial({ map: texture });

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

// Create a GUI for the exposure control
const gui = new GUI();
const toneMappingFolder = gui.addFolder( 'Tone Mapping' );


toneMappingFolder.add(params, 'exposure', 0, 2, 0.01).name('Exposure').onChange(() => {
    renderer.toneMappingExposure = params.exposure;  // Update the renderer's tone mapping exposure
    render(); // Re-render the scene whenever exposure is changed
});

// Color multiplier slider (to adjust the intensity C)
toneMappingFolder.add(params, 'colorMultiplier', 0.1, 5, 0.1).name('Color Multiplier').onChange(() => {
    // Recompile the shader with the updated colorMultiplier
    THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
        /color \*= \d+(\.\d+)?;/, // RegEx to replace the previous multiplier value
        `color *= ${params.colorMultiplier};`
    );
    render();
});


// Add tone mapping selection to GUI
toneMappingFolder.add(params, 'toneMapping', Object.keys(toneMappingOptions)).name('Tone Mapping').onChange((value) => {
    renderer.toneMapping = toneMappingOptions[value];
    render(); // Re-render the scene whenever tone mapping is changed
});

toneMappingFolder.open();



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
}

// Render function
function render() {
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
