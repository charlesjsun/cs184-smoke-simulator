import * as THREE from "https://cdn.skypack.dev/three@0.128.0";

class ExternalDensity {

    constructor(renderer, width, height, dt) {
        
        this.renderer = renderer;

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.uniforms = {
            width: { value: width },
            height: { value: height },
            dt: { value: dt },
            w: { type: "t" },
            pos: { value: new THREE.Vector2() },
            color: { value: new THREE.Vector3() },
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

    compute(input, output, pos, color, radius) {

        this.uniforms.w.value = input.read.texture;
        this.uniforms.pos.value = pos;
        this.uniforms.color.value = color;
        this.uniforms.radius.value = radius;

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

        uniform sampler2D w;
        
        uniform vec2 pos;
        uniform vec3 color;
        uniform float radius;

        void main() {
            vec3 original = texture2D(w, v_uv).xyz;
            
            float r = radius * width;
            vec2 p = (v_uv - pos) * vec2(width, height);
            
            float dist = length(p);
            float factor = max(r - dist, 0.0) / r;

            vec3 added = color * factor * dt;

            gl_FragColor = vec4(original + added, 1.0);
        }
    `;

}

export { ExternalDensity };