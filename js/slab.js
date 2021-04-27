import * as THREE from "https://cdn.skypack.dev/three@0.128.0";

class Slab {

    constructor(renderer, width, height) {

        this.renderer = renderer;

        this.read = new THREE.WebGLRenderTarget(width, height, {
            magFilter: THREE.NearestFilter,
            // minFilter: THREE.NearestFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
        });

        this.write = new THREE.WebGLRenderTarget(width, height, {
            magFilter: THREE.NearestFilter,
            // minFilter: THREE.NearestFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            type: THREE.FloatType,
            depthBuffer: false,
        });

    }

    clear() {

        this.renderer.setRenderTarget(this.write);
        this.renderer.clear();
        this.swap();

    }

    swap() {

        let tmp = this.read;
        this.read = this.write;
        this.write = tmp;

    }

}

export { Slab };