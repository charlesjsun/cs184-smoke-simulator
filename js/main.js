import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { Solver } from "./solver.js"

let renderer;
let camera, scene;
let mesh, material;

let solver;

let mouse0Down;
let mouse1Down;
let mouseX, mouseY;

let solverPos;
let prevSolverPos;

let currTime;
let prevTime;

let smokeColor;
let smokeRadius;

let raycaster;

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

    solverPos = new THREE.Vector2();
    prevSolverPos = new THREE.Vector2();

    currTime = 1.0;
    prevTime = 0.0;

    raycaster = new THREE.Raycaster();

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

    mouseX = e.offsetX;
    mouseY = e.offsetY;
    
    if (e.button == 0) {
        mouse0Down = true;
    } 
    if (e.button == 1) {
        mouse1Down = true
    }

}

function onMouseMove(e) {

    mouseX = e.offsetX;
    mouseY = e.offsetY;

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

function getSolverPos(mouseX, mouseY) {

    let startX = (mouseX / window.innerWidth) * 2 - 1;
	let startY = -(mouseY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(startX, startY), camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0 && intersects[0].uv) {
        const uv = intersects[0].uv;
        return new THREE.Vector2(uv.x, uv.y);
    } else {
        return null;
    }

    if (false) {
        return new THREE.Vector2(mouseX / window.innerWidth, 1.0 - mouseY / window.innerHeight);
    }

}

function animate(time) {
    
    prevTime = currTime;
    currTime = time;

    prevSolverPos = solverPos;
    let newSolverPos = getSolverPos(mouseX, mouseY);
    if (newSolverPos != null) {
        solverPos = newSolverPos;
    }

    const dt = currTime - prevTime;
    if (mouse0Down) {
        solver.addExternalDensity(solverPos, smokeColor, smokeRadius);
    }
    if (mouse1Down) {
        if (dt > 0.1) {
            const vel = new THREE.Vector2((solverPos.x - prevSolverPos.x) / dt, (solverPos.y - prevSolverPos.y) / dt);
            solver.addExternalVelocity(solverPos, vel, smokeRadius);
        }
    }

    solver.step(time);
    
    mesh.rotation.y = time / 5000.0;
    
    material.setValues({map: solver.getTexture()});
    
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    
    requestAnimationFrame(animate);

}

export { init, animate };