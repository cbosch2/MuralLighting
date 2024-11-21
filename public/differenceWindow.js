/* This moduel provide a class to encapsulate the widget where we show luminance differences between two images */

import * as THREE from 'three';

class DifferenceWindow {

    constructor(width, height, VS, FS) {
        console.log("Width Diff ", width, " Heigh Diff ", height)
        this.renderer = new THREE.WebGLRenderer();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100);
        this.camera.position.z = 2;

        this.material = new  THREE.ShaderMaterial({
            uniforms: {
                //uTexture: { type: 't', value: texture }, // Add the texture as a uniform
            },
            toneMapped: false,
            vertexShader: VS,
            fragmentShader: FS
        });
        this.material.originalFragmentShader = this.material.fragmentShader;
        this.material.fragmentShader = "vec3 CustomToneMapping( vec3 color ) {return color;}" + this.material.originalFragmentShader;
        
        // Create a plane geometry for displaying the image
        const aspectRatio = 2;//TODO compute it depending on the texture...
        this.geometry = new THREE.PlaneGeometry(1.5 * aspectRatio, 1.5); // Adjust the size as needed for the image
    
        // Create a mesh using the geometry and material
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        //mesh.position.x = -1.35;
        this.mesh.position.set(0, 0, 0);
        // Add the mesh to the scene
        this.scene.add(this.mesh);
    }

    show(width, height) {
        console.log("Width Diff ", width, " Heigh Diff ", height)
        this.renderer.render(this.scene, this.camera);
    }

    stop() {

    }
}

export default DifferenceWindow