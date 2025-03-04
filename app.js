const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()

app.use(express.static(__dirname + '/public'))
app.use('/build/', express.static(path.join(__dirname, 'node_modules/three/build')))
app.use('/jsm/', express.static(path.join(__dirname, 'node_modules/three/examples/jsm')))


function getEXRFiles(basePath, dir = '', arrayOfFiles = []) {
    const dirPath = basePath + dir;
    const files = fs.readdirSync(dirPath);   // read directory contents

    files.forEach(function(file) {
        const fullPath = path.join(dirPath, file);  // full path
        const relPath = dir + file;                 // relative path 
        if (fs.statSync(fullPath).isDirectory())    // recurse if directory
            arrayOfFiles = getAllFiles(basePath, relPath + '/', arrayOfFiles);
        else if (path.extname(file) === '.exr')     // add file to array if EXR
            arrayOfFiles.push(relPath);
    });

    return arrayOfFiles;
}

// Send images' filenames to the client
app.get('/images', (req, res) => {
    const files = getEXRFiles(__dirname + '/public/textures/');
    // console.log(files)
    res.json(files)
});


app.listen(3006, () => console.log('Visit http://127.0.0.1:3006'))
