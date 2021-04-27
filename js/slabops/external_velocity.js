import * as THREE from "https://cdn.skypack.dev/three@0.128.0";

class ExternalVelocity {

    constructor(renderer, width, height, dt) {
        
        this.renderer = renderer;

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.uniforms = {
            width: { value: width },
            height: { value: height },
            dt: { value: dt },
            velocity: { type: "t" },
            pos: { value: new THREE.Vector2() },
            vel: { value: new THREE.Vector2() },
            radius: { value: 0.01 },
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
        });

        this.plane = new THREE.PlaneGeometry(2, 2);
        this.quad = new THREE.Mesh(this.plane, this.material);

        this.scene = new THREE.Scene();
        
        this.scene.add(this.quad);
    
    }

    compute(velocity, output, pos, vel, radius) {

        this.uniforms.velocity.value = velocity.read.texture;
        this.uniforms.pos.value = pos;
        this.uniforms.vel.value = vel;
        this.uniforms.radius.value = radius;

        console.log(vel);

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap();

    }

    vertexShader = `
        varying vec2 v_uv;
        void main() {
            v_uv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    fragmentShader = `
        varying vec2 v_uv;

        uniform float width;
        uniform float height;
        
        uniform float dt;

        uniform sampler2D velocity;
        
        uniform vec2 pos;
        uniform vec2 vel;
        uniform float radius;

        float gauss(vec2 p, float r) {
            return exp(-dot(p, p) / r);
        }

        void main() {
            vec2 original = texture2D(velocity, v_uv).xy;
            
            float r = radius * width;
            vec2 p = (v_uv - pos) * vec2(width, height);
            
            float factor = gauss(p, r);

            vec2 added = vel * vec2(width, height) * factor * dt * 10.0;

            gl_FragColor = vec4(original + added, 0.0, 1.0);
        }
    `;

}

export { ExternalVelocity };