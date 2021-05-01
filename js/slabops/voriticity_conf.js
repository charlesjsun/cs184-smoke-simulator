import * as THREE from "https://cdn.skypack.dev/three@0.128.0";

class VorticityConf {

    constructor(renderer, width, height, dt, dx) {
        
        this.renderer = renderer

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.uniforms = {
            width: { value: width },
            height: { value: height },
            velocity: { type: "t" },
            curl: { type: "t"},
            dt: { value: dt },
            dx: { value: dx },
            eps: { value: 0.01 },
            weight: { value: 0.2 }, // todo: make this adjustable later
            boundary: { value: 0.0 }, // todo: make this adjustable (1) later
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

    compute(velocity, curl, output) {

        this.uniforms.velocity.value = velocity;
        this.uniforms.curl.value = curl;

        this.renderer.setRenderTarget(output.write);
        this.renderer.render(this.scene, this.camera);
        output.swap()

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

        uniform float eps;
        uniform float dt;
        uniform float dx;
        uniform float weight;
        uniform float boundary;

        uniform sampler2D velocity;
        uniform sampler2D curl; 

        void main() {
            vec2 u_offset = vec2(1.0 / width, 0.0);
            vec2 v_offset = vec2(0.0, 1.0 / height);

            float xL = abs(texture2D(curl, v_uv - u_offset).x);
            float xR = abs(texture2D(curl, v_uv + u_offset).x);
            float xB = abs(texture2D(curl, v_uv - v_offset).x);
            float xT = abs(texture2D(curl, v_uv + v_offset).x);

            float etaX = (xR - xL) / (2.0 * dx);
            float etaY = (xT - xB) / (2.0 * dx);
            vec2 force = vec2(0.0);

            if (abs(etaX) > eps && abs(etaY) > eps) {
                vec2 psi = vec2(etaX / abs(etaX), etaY / abs(etaY));
                vec2 vorticity = texture2D(curl, v_uv).xy;
                vec2 cross = vec2(psi.y * vorticity.x, psi.x * vorticity.y * -1.0);
                force = cross * dt;
            }

            vec2 vel = texture2D(velocity, v_uv).xy;
            gl_FragColor = vec4(vel + weight * force, 0.0, 1.0);

            if (boundary > 0.1) {
                if (gl_FragCoord.x <= 1.5 || gl_FragCoord.x >= (width - 1.5) || gl_FragCoord.y <= 1.5 || gl_FragCoord.y >= (height - 1.5)){
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
            }
        }
    `;

}

export { VorticityConf };