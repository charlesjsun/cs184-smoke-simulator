import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { Solver } from "./solver.js"

let renderer;
let camera, scene;
let mesh, material;

let solver;

let mouse0Down;
let mouse1Down;
let mouseX, mouseY;
let prevMouseX, prevMouseY;
let currTime;
let prevTime;
let mouseTime;

let smokeColor;
let smokeRadius;


function init() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer = new THREE.WebGLRenderer();

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    const solverHeight = 250;
    const solverWidth = Math.floor(solverHeight * width / height);

    solver = new Solver(renderer, solverWidth, solverHeight);

    // camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // const geometry = new THREE.PlaneGeometry(2, 2);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
    camera.position.z = 30;
    const geometry = new THREE.TorusGeometry(10, 3, 16, 100);

    material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
    mesh = new THREE.Mesh(geometry, material);
    scene = new THREE.Scene();
    scene.add(mesh);
    scene.background = new THREE.Color(0xcce0ff);

    mouse0Down = false;
    mouse1Down = false;
    mouseX = 0.0;
    mouseY = 0.0;
    prevMouseX = 0.0;
    prevMouseY = 0.0;
    currTime = 1.0;
    prevTime = 0.0;
    mouseTime = 0.0;

    smokeColor = new THREE.Vector3(1.0, 1.0, 1.0);
    smokeRadius = 0.25;

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
    
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.offsetX / window.innerWidth;
    mouseY = 1.0 - e.offsetY / window.innerHeight;
    mouseTime = currTime;

    if (e.button == 0) {
        mouse0Down = true;
        solver.addExternalDensity(mouseX, mouseY, smokeColor, smokeRadius);
    } 
    if (e.button == 1) {
        mouse1Down = true
    }


}

function onMouseMove(e) {

    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.offsetX / window.innerWidth;
    mouseY = 1.0 - e.offsetY / window.innerHeight;
    
    const dt = currTime - mouseTime;
    mouseTime = currTime

    if (mouse0Down) {
        solver.addExternalDensity(mouseX, mouseY, smokeColor, smokeRadius);
    }
    if (mouse1Down) {
        if (dt > 0.1) {
            const velocityX = (mouseX - prevMouseX) / dt;
            const velocityY = (mouseY - prevMouseY) / dt;
            solver.addExternalVelocity(mouseX, mouseY, velocityX, velocityY, smokeRadius);
        }
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
    
    prevTime = currTime;
    currTime = time;

    solver.step(time);
    
    mesh.rotation.y = time / 4000.0;
    
    material.setValues({map: solver.getTexture()});
    
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    
    requestAnimationFrame(animate);

}

export { init, animate };