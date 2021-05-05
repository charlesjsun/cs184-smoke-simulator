import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { Solver } from "./solver.js"
import { SolverSphere } from "./solver_sphere.js"
import {ParametricGeometries} from "https://unpkg.com/three@0.119.0/examples/jsm/geometries/ParametricGeometries.js";

let renderer;
let camera, scene;
let mesh, material, line_seg;

let solver;

let width;
let height;

let mouse0Down;
let mouseX, mouseY;

let solverPos;

let currTime;

let smokeColor;

let raycaster;

let settings;
let gui;

function mobius3d ( u, t, target ) {

    // volumetric mobius strip

    u *= Math.PI;
    t *= 2 * Math.PI;

    u = u * 2;
    var phi = u / 2;
    var major = 2.25, a = 0.125, b = 0.65;
    var scale = 5;

    var x, y, z;

    x = a * Math.cos( t ) * Math.cos( phi ) - b * Math.sin( t ) * Math.sin( phi );
    z = a * Math.cos( t ) * Math.sin( phi ) + b * Math.sin( t ) * Math.cos( phi );
    y = ( major + x ) * Math.sin( u );
    x = ( major + x ) * Math.cos( u );

    target.set( scale * x, scale * y, scale * z );

}

function Settings() {
    // Radius of mouse click smoke
    this.smokeRadius = 0.1;

    // Dissipation of smoke
    this.dissipation = 0.99;

    // Wrap around up/down and left/right
    this.wrap = true;

    // Buoyancy
    this.buoyancy = false;
    
    // Object rendered
    this.objects = ["Torus", "Plane", "Sphere", "Mobius Strip", "Klein Bottle", "Cube", "Parametric Sphere"];
    this.object = this.objects[0];

    // rotation speed of object  around x-axis
    this.rotationSpeedX = 1;
}

function recreateSolver() {

    if (settings.object === "Sphere") {

        const solverSize = 250;
        solver = new SolverSphere(renderer, solverSize);

    } else if (settings.object === "Torus") {

        const solverHeight = 250;
        const solverWidth = Math.floor(solverHeight * width / height);
        solver = new Solver(renderer, solverWidth, solverHeight, settings.wrap, settings.buoyancy, 0.0);
    
    } else {

        const solverHeight = 250;
        const solverWidth = Math.floor(solverHeight * width / height);
        solver = new Solver(renderer, solverWidth, solverHeight, settings.wrap, settings.buoyancy, Math.PI / 2.0);

    }

}

function recreateScene() {

    if (settings.object === "Sphere") {

        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 200);
        camera.position.z = 30;
        let geometry = new THREE.SphereGeometry(10, 32, 32);
        const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
        line_seg = new THREE.LineSegments( geometry, lineMaterial );

        material = new THREE.ShaderMaterial({
            uniforms: { map: { } },
            vertexShader: `
            varying vec3 v_position;
            void main() {
                v_position = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
            fragmentShader: `
            varying vec3 v_position;
            uniform samplerCube map;
            void main() {
                vec3 normal = normalize(v_position);
                vec3 color = textureCube(map, normal).xyz * 1.0;
                gl_FragColor = vec4(color, 1.0);
            }
            `
        })
        mesh = new THREE.Mesh(geometry, material);
        
        scene = new THREE.Scene();
        scene.add(mesh);
        scene.add(line_seg);

        scene.background = new THREE.Color( 0xeeeeee );

        let grid = new THREE.GridHelper(40, 10);
        grid.position.y = -10.0;
        scene.add(grid);

    } else if (settings.object === "Torus") {

        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
        camera.position.z = 30;
        let geometry = new THREE.TorusGeometry(12, 5, 48, 100);
        const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
        line_seg = new THREE.LineSegments( geometry, lineMaterial );
        material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
        mesh = new THREE.Mesh(geometry, material);
        scene = new THREE.Scene();
        scene.add(mesh);
        scene.add(line_seg);
        scene.background = new THREE.Color(0xcce0ff);

    } else if (settings.object === "Plane") {

        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        let geometry = new THREE.PlaneGeometry(2, 2);
        material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
        mesh = new THREE.Mesh(geometry, material);
        scene = new THREE.Scene();
        scene.add(mesh);

    } else if (settings.object == "Mobius Strip") {
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
        camera.position.z = 30;
        let geometry = new THREE.ParametricGeometry( mobius3d, 25, 25 );
        material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
        const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
        // material = new THREE.MeshBasicMaterial({ color: 0x00ff00 } )
        mesh = new THREE.Mesh(geometry,material);
        line_seg = new THREE.LineSegments( geometry, lineMaterial );

        scene = new THREE.Scene();
        scene.add(mesh);
        scene.add(line_seg);
        scene.background = new THREE.Color(0xcce0ff);
    } else if (settings.object === "Klein Bottle") {

        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
        camera.position.z = 30;
        let geometry = new THREE.ParametricGeometry( ParametricGeometries.klein, 25, 25 );
        const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
        material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
        mesh = new THREE.Mesh(geometry, material);
        scene = new THREE.Scene();
        line_seg = new THREE.LineSegments( geometry, lineMaterial );
        scene.add(mesh);
        scene.add(line_seg);
        scene.background = new THREE.Color(0xcce0ff);
    } else if (settings.object === "Cube") {
        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
        camera.position.z = 30;
        let geometry = new THREE.BoxGeometry( 10, 10, 10 );
        material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
        mesh = new THREE.Mesh(geometry, material);
        scene = new THREE.Scene();
        scene.add(mesh);
        scene.background = new THREE.Color(0xcce0ff);
    }else if (settings.object === "Parametric Sphere") {

        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
        camera.position.z = 30;
        // let geometry = new ParametricGeometries.SphereGeometry(5, 32, 32)
        const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } );
        let geometry = new THREE.SphereGeometry( 10, 25, 25 );
        line_seg = new THREE.LineSegments( geometry, lineMaterial );
        material = new THREE.MeshBasicMaterial({map: solver.getTexture()})
        mesh = new THREE.Mesh(geometry, material);
        scene = new THREE.Scene();
        scene.add(mesh);
        scene.add(line_seg)
        scene.background = new THREE.Color(0xcce0ff);
        // scene.background = new THREE.Color(0xffff00);
        
    }
    
}

function init() {

    width = document.getElementById('topnav').offsetWidth; //window.innerWidth;
    height = window.innerHeight - document.getElementById('topnav').offsetHeight;;

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    document.getElementById("smoke").appendChild(renderer.domElement);

    // Create a GUI with object settings of defaults
    gui = new dat.GUI();
    settings = new Settings();
    
    gui.add(settings, "smokeRadius", 0.01, 0.50, 0.01);

    gui.add(settings, "rotationSpeedX", 0, 5, 1);
    
    gui.add(settings, "dissipation", 0.90, 1.00, 0.01).onChange(function(dissipation) {
        settings.dissipation = dissipation;
        solver.dissipation = dissipation;
    });
    
    gui.add(settings, "wrap").onChange(function(wrap) {
        settings.wrap = wrap;
        recreateSolver();
    });

    gui.add(settings, "buoyancy").onChange(function(buoyancy) {
        settings.buoyancy = buoyancy;
        solver.shouldAddBuoyancy = buoyancy;
    });
    
    gui.add(settings, "object", settings.objects).onChange(function(object) {
        settings.object = object;
        recreateSolver();
        recreateScene();
    });

    // create solver and scene
    recreateSolver();
    recreateScene();

    // set up mouse interactions
    raycaster = new THREE.Raycaster();

    mouse0Down = false;
    mouseX = 0.0;
    mouseY = 0.0;

    solverPos = getSolverPos(mouseX, mouseY);

    currTime = 1.0;

    smokeColor = new THREE.Vector3(1.0, 1.0, 1.0);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    // document.addEventListener("contextmenu", onContextMenu, false);

}

function onWindowResize() {

    width = document.getElementById('topnav').offsetWidth; //window.innerWidth;
    height = window.innerHeight - document.getElementById('topnav').offsetHeight;;

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

}

function onMouseMove(e) {

    mouseX = e.offsetX;
    mouseY = e.offsetY;

}

function onMouseUp(e) {

    if (e.button == 0) {
        mouse0Down = false;
    } 

}

// function onContextMenu(e) {
//     e.preventDefault();
// }

function getSolverPos(mouseX, mouseY) {

    let startX = (mouseX / width) * 2 - 1;
    let startY = -(mouseY / height) * 2 + 1;

    raycaster.setFromCamera(new THREE.Vector2(startX, startY), camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (settings.object == "Sphere") {
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].uv) {
                const point = intersects[i].point;
                const length = point.length();
                // console.log(intersects[i]);
                // account for rotation of sphere in below? 
                let x_axis = new THREE.Vector3(1, 0, 0);
                
                return (new THREE.Vector3(point.x / length, point.y / length, point.z / length)).applyAxisAngle(x_axis, -mesh.rotation.x);
            }
        }

    } else if (settings.object == "Mobius Strip" || settings.object == "Klein Bottle" || settings.object == "Parametric Sphere" || settings.object === "Torus") {
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].uv) {
                const uv = intersects[i].uv;
                return new THREE.Vector2(uv.x, uv.y);
            }
        }

    } else {
        if (intersects.length > 0 && intersects[0].uv) {
            console.log(intersects)
            const uv = intersects[0].uv;
            return new THREE.Vector2(uv.x, uv.y);
        }
    }
    return null;

}

function getSolverVelocity(pos, prevPos) {

    if (settings.object == "Sphere") {

        return new THREE.Vector3(pos.x - prevPos.x, pos.y - prevPos.y, pos.z - prevPos.z);

    } else {

        if (settings.wrap) {
            let dX = pos.x - prevPos.x;
            if (Math.abs(dX) > 0.5) {
                dX = -Math.sign(dX) * (1.0 - Math.abs(dX));
            }
            let dY = pos.y - prevPos.y;
            if (Math.abs(dY) > 0.5) {
                dY = -Math.sign(dY) * (1.0 - Math.abs(dY));
            }
            return new THREE.Vector2(dX, dY);
        }
    
        return new THREE.Vector2(pos.x - prevPos.x, pos.y - prevPos.y);

    }

}

function animate(time) {
    
    currTime = time;

    if (mouse0Down) {
        let newSolverPos = getSolverPos(mouseX, mouseY);
        if (newSolverPos != null) {
            solver.addExternalDensity(newSolverPos, smokeColor, settings.smokeRadius);
            solver.addExternalTemperature(newSolverPos, 0.05, settings.smokeRadius);

            if (solverPos != null) {
                const vel = getSolverVelocity(newSolverPos, solverPos);
                solver.addExternalVelocity(newSolverPos, vel, settings.smokeRadius);
            }

        } else {
            solver.removeExternalDensity();
            solver.removeExternalTemperature();
            solver.removeExternalVelocity();
        }
        solverPos = newSolverPos;
        
    } else {
        solver.removeExternalDensity();
        solver.removeExternalTemperature();
        solver.removeExternalVelocity();
    }

    smokeColor.x = Math.min(Math.max(smokeColor.x + (Math.random() - 0.5) * 0.1, 0.0), 1.0);
    smokeColor.y = Math.min(Math.max(smokeColor.y + (Math.random() - 0.5) * 0.1, 0.0), 1.0);
    smokeColor.z = Math.min(Math.max(smokeColor.z + (Math.random() - 0.5) * 0.1, 0.0), 1.0);

    solver.step(time);
    
    if (settings.object === "Torus") {
        line_seg.rotation.y = time / 5000.0;
        mesh.rotation.y = time / 5000.0;
    }
    
    if (settings.object === "Sphere") {
        material.uniforms.map.value = solver.getTexture();
        line_seg.rotation.x = time / 5000.0;
        mesh.rotation.x = time / 5000.0;
    } else {
        material.setValues({map: solver.getTexture()});
    }

    if (settings.object === "Klein Bottle") {
        line_seg.rotation.x = time / 5000.0;
        mesh.rotation.x = time / 5000.0;
    }

    if (settings.object === "Cube") {
        mesh.rotation.y = time / 5000.0;
    }

    // cache previous rotation value for smooth rotations? 
    if (settings.object === "Mobius Strip") {
        line_seg.rotation.x = time / 5000.0 * settings.rotationSpeedX;
        mesh.rotation.x = time / 5000.0 * settings.rotationSpeedX;
    }

    if (settings.object === "Parametric Sphere") {
        line_seg.rotation.x = time / 5000.0;
        mesh.rotation.x = time / 5000.0;
    }

    
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    
    requestAnimationFrame(animate);

}

export { init, animate };
