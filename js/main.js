import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { Solver } from "./solver.js"

let renderer;
let camera, scene;
let mesh, material;

let solver;

let mouse0Down;
let mouse1Down;
let mouseX, mouseY;
let smokeColor;
let smokeRadius;

function init() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    const solverWidth = Math.floor(width / 4);
    const solverHeight = Math.floor(height / 4);

    solver = new Solver(renderer, solverWidth, solverHeight);

    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);

    // camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    // camera.position.z = 30;
    // const geometry = new THREE.TorusGeometry(10, 3, 16, 100);

    material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
    mesh = new THREE.Mesh(geometry, material);
    scene = new THREE.Scene();
    scene.add(mesh);

    mouse0Down = false;
    mouse1Down = false;
    mouseX = 0.0;
    mouseY = 0.0;

    smokeColor = new THREE.Vector3(1.0, 1.0, 1.0);
    smokeRadius = 0.02;

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

}

function onWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
	camera.updateProjectionMatrix();

    renderer.setSize(width, height);

}

function onMouseDown(e) {

    if (e.button == 0) {
        mouse0Down = true;
        mouseX = e.offsetX / window.innerWidth;
        mouseY = 1.0 - e.offsetY / window.innerHeight;
        solver.addExternalDensity(mouseX, mouseY, smokeColor, smokeRadius);
    } 
    if (e.button == 1) {
        mouse1Down = true
        mouseX = e.offsetX / window.innerWidth;
        mouseY = 1.0 - e.offsetY / window.innerHeight;
        solver.addExternalVelocity(mouseX, mouseY, smokeColor, smokeRadius);
    }


}

function onMouseMove(e) {

    mouseX = e.offsetX / window.innerWidth;
    mouseY = 1.0 - e.offsetY / window.innerHeight;
    
    if (mouse0Down) {
        solver.addExternalDensity(mouseX, mouseY, smokeColor, smokeRadius);
    }
    if (mouse1Down) {
        solver.addExternalVelocity(mouseX, mouseY, smokeRadius, smokeRadius);
    }

}

function onMouseUp(e) {

    if (e.button == 0) {
        mouse0Down = false;
        solver.removeExternalDensity();
    } 
    if (e.button == 1) {
        mouse1Down = false;
        solver.removeExternalVelocity();
    }


}

function animate(time) {
    
    solver.step(time);
    
    // mesh.rotation.y = time / 2000.0;
    
    material.setValues({map: solver.getTexture()});
    
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    
    requestAnimationFrame(animate);

}

export { init, animate };