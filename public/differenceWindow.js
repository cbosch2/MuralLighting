/* This module provides a class to encapsulate the widget where we show luminance differences between two images */

/**** TODO's
 * [] Change the shader to show the difference as a diverging color map (such as seismic or bwr)
 * [] The Control pannels should be collapsed when the dialog opened, and extended when the dialog closed. Changes TBD in client.js.
 * [] Aspect ratio of the dialog does not change dynamically (either initially) to take into account texture's aspect ratio
 * [] Make it responsive -> if window changes size's of dialog and canvas are incorrect.
 * ------------------------------------------- 
 */

import * as THREE from 'three';

class DifferenceWindow {

    constructor(VS, FS) {
        this.renderer = new THREE.WebGLRenderer();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        this.camera.position.z = 2;
        this.leftTexture = null;
        this.rightTexture = null;
        this.uMaxDelta = 0;
        this.colorMap = null;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uLeftTexture: { type: 't', value: this.leftTexture }, // Add the texture as a uniform
                uRightTexture: { type: 't', value: this.rightTexture }, // Add the texture as a uniform
                uMaxDelta: { value: () => this.uMaxDelta },
                uColorMap: { type: 't', value: this.colorMap }, // Add the texture as a uniform
            },
            toneMapped: false,
            vertexShader: VS,
            fragmentShader: FS
        });
        
        // Create a plane geometry for displaying the image
        const aspectRatio = 2;//TODO compute it depending on the texture...
        this.geometry = new THREE.PlaneGeometry(3, 3); // Adjust the size as needed for the image
    
        // Create a mesh using the geometry and material
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        //mesh.position.x = -1.35;
        this.mesh.position.set(0, 0, 0);
        // Add the mesh to the scene
        this.scene.add(this.mesh);
    }

    /**
     * Show the dialog and update the scene and camera
     */
    show(width, height) {
        //update textures, they are changed in client.js when loading them
        this.material.uniforms.uLeftTexture.value = this.leftTexture;
        
        this.material.uniforms.uRightTexture.value = this.rightTexture;
        this.uMaxDelta = this.computeMaxDelta();
        this.material.uniforms.uMaxDelta.value = this.uMaxDelta;
        this.material.uniforms.uColorMap.value = this.colorMap;
        this.material.needsUpdate = true;

        //update renderer size
        this.renderer.setSize(width, height);

        //update camera aspect ratio and PM
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        //reset the scene to allow changes in size
        this.mesh.scale.set(width/height, 1, 1);

        this.startRendering();
    }

    /**
     * Hide the dialog and stop rendering
     */
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
          }
    }

    /**
     * Start rendering the scene
     */
    startRendering() {
        const renderLoop = () => {
            this.renderer.render(this.scene, this.camera);
            this.animationFrameId = requestAnimationFrame(renderLoop);
        };
        this.animationFrameId = requestAnimationFrame(renderLoop);
    }

    /**
     * Estimate the max luminance delta between both images
     */
    computeMaxDelta() {
        // Calculate luminance using the CIE XYZ 1931 sRGB D65
        const computeLuminance = (r, g, b) => 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;

        const lArr = this.leftTexture.source.data.data; // Assuming this is a flat array
        const rArr = this.rightTexture.source.data.data;

        // Iterate over the RGBA arrays in chunks of 4 (r, g, b, a)
        const stats = lArr.reduce((result, _, i) => {
            if (i % 4 !== 0) return result; // Skip indices that aren't the start of an RGBA set

            const r1 = lArr[i], g1 = lArr[i + 1], b1 = lArr[i + 2]; // Left texture RGB
            const r2 = rArr[i], g2 = rArr[i + 1], b2 = rArr[i + 2]; // Right texture RGB

            const luminance1 = computeLuminance(r1, g1, b1);
            const luminance2 = computeLuminance(r2, g2, b2);
            const difference = Math.abs(luminance1 - luminance2);

            result.sum += difference;
            result.count += 1;
            result.max = Math.max(result.max, difference); // Update maxDiff

            return result;
        }, {
            sum: 0,
            count: 0,
            max: 0
        });


        return stats.sum / stats.count;
    }
}

export default DifferenceWindow