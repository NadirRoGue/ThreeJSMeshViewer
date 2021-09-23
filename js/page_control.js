/* 
Copyright (c) 2021
All rights reserved. Do not distribute without permission.
Author: Nadir Roman Guerrero <https://github.com/NadirRoGue>

This library is free software; you can redistribute it and/or modify it under
the terms of the GNU Lesser General Public License version 3.0 as published
by the Free Software Foundation.

This library is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
details.

You should have received a copy of the GNU Lesser General Public License
along with this library; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

let material = null;
let meshList = []
let scene = null;
let renderer = null;
let lightList = [];

function initializeMaterial()
{
    if(material == null)
    {
        material = new THREE.MeshPhysicalMaterial(
        {
            depthTest: true,
            depthWrite: true,
            alphaTest: 0.0,
            side: THREE.FrontSide,
            color: 0xff0000,
            emissive: 0x000000,
            flatShading: false,
            wireframe: false,
            metalness: 0.0,
            roughness: 0.0,
            clearcoat: 0.0,
            clearcoatRoughness: 0.0,
            opacity: 1.0,    
            transmission: 0.0,
            reflectivity: 0.5,
            envMap: null,
            envMapIntensity: 0.7
        });
    }
    
    updateAlbedo();
    updateRoughness();
    updateMetalness();
    updateSheenTint();
    updateClearcoat();
    updateClearcoatRoughness();
    updateIOR();
    updateTransmission();
    updateEmission();
    updateReflectivity();
}

function loadMesh(fileInput)
{   
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer();
    
    renderer.antialias = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    
    const canvasContainer = document.getElementById('canvas_div');
    canvasContainer.replaceChildren();
    const rect = canvasContainer.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    canvasContainer.appendChild(renderer.domElement);
    
    const reader = new FileReader();
    reader.onload = function()
    {
        const objLoader = new THREE.OBJLoader();
        objLoader.load(reader.result,
        function (loadedObject)
        {
            initializeMaterial();
            
            const sceneBounds = new THREE.Box3();
            for(let i = 0; i < loadedObject.children.length; i++)
            {
                if(loadedObject.children[i] instanceof THREE.Mesh)
                {
                    loadedObject.children[i].geometry.computeBoundingBox();
                    sceneBounds.expandByPoint(loadedObject.children[i].geometry.boundingBox.min);
                    sceneBounds.expandByPoint(loadedObject.children[i].geometry.boundingBox.max);
                    loadedObject.children[i].material = material;
                    meshList.push(loadedObject.children[i]);
                    scene.add(loadedObject.children[i]);
                }
            }        
            
            let sceneCenter = new THREE.Vector3();
            sceneBounds.getCenter(sceneCenter);
            const sceneRadius = sceneCenter.distanceTo(sceneBounds.min);
            
            const camera = createCamera(sceneCenter, sceneRadius, rect.width / rect.height);
            createPointLights(scene, sceneCenter, sceneRadius);
            updateEnvMap();
            
            const animate = function () {
		        requestAnimationFrame( animate );
                for(let i = 0; i < meshList.length; i++)
		            meshList[i].rotation.y += 0.01;

		        renderer.render( scene, camera );
	        };
            animate();
        }, 
        undefined,
        function (error)
        {
            alert("An error occoured while loading the selected file");
            console.log(error);
        });
    };
    reader.readAsDataURL(fileInput.files[0]);
}

function createCamera(sceneCenter, sceneRadius, aspectRatio)
{
    const camZMod = sceneRadius * 1.5;
    const camera = new THREE.PerspectiveCamera( 75, aspectRatio, 0.1, camZMod * 2.0 );
    camera.position.set(sceneCenter.x, sceneCenter.y, sceneCenter.z + camZMod);
    return camera;
}

function createPointLights(scene, sceneCenter, sceneRadius)
{
     // Main light
    const intensity = 1.0;
    const light1 = new THREE.PointLight( 0xffffff, intensity, 0);
    let lp = sceneCenter.clone();
    lp.x -= sceneRadius;
    lp.z += sceneRadius;
    lp.y += sceneRadius * 1.5;
    light1.position.set(lp.x, lp.y, lp.z);
    lightList.push(light1);
    scene.add( light1 );
    
    const secondIntensity = 1.0;
    const light2 = new THREE.PointLight( 0xffffff, secondIntensity, 0);
    let secondlp = sceneCenter.clone();
    secondlp.x += sceneRadius * 1.5;
    light2.position.set(secondlp.x, secondlp.y, secondlp.z);
    lightList.push(light2);
    scene.add( light2 );
} 

function updateAlbedo()
{
    var input = document.getElementById("albedo");
    material.color.setHex(input.value.replace("#", "0x"));
}

function updateRoughness()
{
    var input = document.getElementById("roughness");
    material.roughness = (parseFloat(input.value) / 100.0);
}

function updateMetalness()
{
    var input = document.getElementById("metallic");
    material.metalness = (parseFloat(input.value) / 100.0);
}

function updateSheenTint()
{
    var input = document.getElementById("sheentint");
    material.sheenTint.setHex(input.value.replace("#", "0x"));
}

function updateClearcoat()
{
    var input = document.getElementById("clearcoat");
    material.clearcoat = (parseFloat(input.value) / 100.0);
}

function updateClearcoatRoughness()
{
    var input = document.getElementById("clearcoat_roughness");
    material.clearcoatRoughness = (parseFloat(input.value) / 100.0);
}

function updateIOR()
{
    var input = document.getElementById("ior");
    material.ior = (parseFloat(input.value) / 100.0);
}

function updateTransmission()
{
    var input = document.getElementById("transmission");
    material.transmission = (parseFloat(input.value) / 100.0);
}

function updateEmission()
{
    var input = document.getElementById("emission");
    material.emissive.setHex(input.value.replace("#", "0x"));
}

function updateReflectivity()
{
    var input = document.getElementById("reflectivity");
    material.reflectivity = (parseFloat(input.value) / 100.0);
}

function updateEnvMap()
{
    if(scene == null)
    {
        alert("Load a mesh first");
        return;
        
    }
    const envMapFileInput = document.getElementById("env_path");
    if(envMapFileInput.value)
    {
        const textureFileReader = new FileReader();
        textureFileReader.onload = function()
        {
            let textureLoader = null;
            if(envMapFileInput.value.toLowerCase().endsWith(".hdr"))
                textureLoader = new THREE.RGBELoader();
            else
                textureLoader = new THREE.TextureLoader();
                
            textureLoader.load(
                textureFileReader.result,
                function (texture)
                {
                    for(let i = 0; i < lightList.lenght; i++)
                        lightList[i].visible = false;
                        
                    const pmremgenerator = new THREE.PMREMGenerator(renderer);
                    const processedTexture = pmremgenerator.fromEquirectangular(texture).texture;
                    
                    console.log(texture.image.width + ", " + texture.image.height);
                    
                    //processedTexture.mapping = THREE.CubeUVReflectionMapping;
                    scene.background = processedTexture;
                    scene.environment = processedTexture;
                    
                    texture.dispose();
                    pmremgenerator.dispose();
                },
                undefined,
                function (error)
                {
                    alert("There was an error while loading the enviromental map");
                    console.log(error);
                }
            );
        };
        textureFileReader.readAsDataURL(envMapFileInput.files[0]);
    }
}

function readMeshFile()
{
    const pathElement = document.getElementById("mesh_path");
    if(!pathElement.value)
    {
        alert("Please, choose a .OBJ mesh to display");
        return;
    }
    if(!pathElement.files[0].name.toLowerCase().endsWith(".obj"))
    {
        alert("Only valid paths to .OBJ files are accepted");
        return;
    }
    
    loadMesh(pathElement);
}

function initialize()
{
    const pathElement = document.getElementById("mesh_path");
    if(pathElement.value)
        readMeshFile();
}

function clearResources()
{
    if(material != null)
    {
        material.dispose();
        material = null;
    }
    for(let i = 0; i < meshList.length; i++)
        meshList[i].geometry.dispose();
    meshList = [];
}

function restartRender()
{
    stopRender();
    
    const pathElement = document.getElementById("mesh_path");
    if(pathElement.value)
        pathElement.dispatchEvent(new Event('change'));
    else
        alert("An input mesh file is necessary to render");
}

function stopRender()
{
    const canvasContainer = document.getElementById('canvas_div');
    canvasContainer.replaceChildren();
    
    clearResources();
    
}
