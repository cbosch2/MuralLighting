/**
 * Function to analyze and output the max and min RGB values of a texture.
 * @param {THREE.Texture} texture - The loaded texture to analyze.
 * @returns {object} An object containing the max and min values for R, G and B.
 */
function analyzeTexture(texture) {
    // Ensure the texture has an image
    if (!texture.image) {
        console.error('Texture image not found.');
        return;
    }

    const arr = texture.source.data.data;
    var r = findMaxMinReduce(arr, 0);
    var g = findMaxMinReduce(arr, 1);
    var b = findMaxMinReduce(arr, 2);

    return {r, g, b};
}

/*
* Function to find the maximum and minimum for R, G or B values in an array.
* @param {number[]} arr - The array to analyze.
* @param {number} component - The component to analyze, 0 for R, 1 for G, 2 for B.
* @returns {object} An object containing the max and min values
*/
function findMaxMinReduce(arr, component) {
    return arr.reduce((acc, num) => {
        if (num % 3 === component) { 
            if (acc.max === null || num > acc.max) acc.max = num;
            if (acc.min === null || num < acc.min) acc.min = num;
        }
        return acc;
    }, { max: null, min: null });
  }


      
export default analyzeTexture;
