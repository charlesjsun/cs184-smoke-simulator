import * as THREE from "https://cdn.skypack.dev/three@0.128.0";
import { Slab } from "./slab.js";
import { Advection } from "./slabops/advection.js"
import { Divergence } from "./slabops/divergence.js";
import { ExternalDensity } from "./slabops/external_density.js";
import { ExternalVelocity } from "./slabops/external_velocity.js";
import { GradientSubtraction } from "./slabops/gradient_subtraction.js";
import { Jacobi } from "./slabops/jacobi.js";

class Solver {
    
    constructor(renderer, width, height) {
        
        this.renderer = renderer;

        this.width = width;
        this.height = height;

        this.dt = 1.0;
        this.dx = 1.0;
        this.dissipation = 0.99;
        // this.dissipation = 1.0;
        
        this.pressure = new Slab(renderer, width, height);
        this.velocity = new Slab(renderer, width, height);
        this.velocityDivergence = new Slab(renderer, width, height);
        this.density = new Slab(renderer, width, height);

        this.advection = new Advection(renderer, width, height, this.dt, this.dx);
        this.jacobi = new Jacobi(renderer, width, height, 50);
        this.divergence = new Divergence(renderer, width, height, this.dx);
        this.gradientSubtraction = new GradientSubtraction(renderer, width, height, this.dx);

        this.externalDensity = new ExternalDensity(renderer, width, height, this.dt);
        this.externalVelocity = new ExternalVelocity(renderer, width, height, this.dt);

        this.shouldAddExternalDensity = false;
        this.externalDensityPos = null;
        this.externalDensityRadius = 0.01;
        this.externalDensityColor = null;

        this.shouldAddExternalVelocity = false;
        this.externalVelocityPos = null;
        this.externalVelocityRadius = 0.01;
        this.externalVelocityVelocity = null;

    }

    step(time) {

        // advection of velocity field
        this.advection.compute(this.velocity, this.velocity, this.velocity, 1.0);

        // advection of carried smoke
        this.advection.compute(this.density, this.velocity, this.density, this.dissipation);
        
        // external forces
        if (this.shouldAddExternalDensity) {
            this.externalDensity.compute(
                this.density, this.density, 
                this.externalDensityPos, this.externalDensityColor, this.externalDensityRadius);
        }
        if (this.shouldAddExternalVelocity) {
            this.externalVelocity.compute(
                this.velocity, this.velocity, 
                this.externalVelocityPos, this.externalVelocityVelocity, this.externalVelocityRadius);
        }

        // projection
        this.divergence.compute(this.velocity, this.velocityDivergence);
        this.pressure.clear();
        this.jacobi.compute(this.pressure, this.velocityDivergence, this.pressure, -this.dx * this.dx, 4.0);
        this.gradientSubtraction.compute(this.velocity, this.pressure, this.velocity);


    }

    addExternalDensity(x, y, color, radius) {

        this.externalDensityPos = new THREE.Vector2(x, y);
        this.externalDensityColor = color;
        this.externalDensityRadius = radius;

        this.shouldAddExternalDensity = true;

    }

    removeExternalDensity() {

        this.shouldAddExternalDensity = false;
    
    }

    addExternalVelocity(x, y, vx, vy, radius) {

        this.externalVelocityPos = new THREE.Vector2(x, y);
        this.externalVelocityRadius = radius;
        this.externalVelocityVelocity = new THREE.Vector2(vx, vy);
        
        this.shouldAddExternalVelocity = true;

    }

    removeExternalVelocity() {

        this.shouldAddExternalVelocity = false;
    
    }

    getTexture() {

        return this.density.read.texture;
        // return this.velocityDivergence.read.texture;
        // return this.velocity.read.texture;

    }

}

export { Solver };
