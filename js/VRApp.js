/// <reference path="VRButton.js"/>
/// <reference path="three.js"/>

class VRApp {
    constructor() {

        // create objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10);
        
        this.webgl = new THREE.WebGLRenderer();
        this.webgl.lastFrameTime = 0.0;

        this.frameClock = new THREE.Clock(false);

        // init scene

        this.camera.position.z = 2;

        this.scene.background = new THREE.Color(0x505050);

        if (true) {
            const cubeMesh = new THREE.Mesh(
                new THREE.BoxGeometry(),
                new THREE.MeshBasicMaterial({ color: 0x00ff00, }),
            );
            cubeMesh.onAfterRender = () => {
                cubeMesh.rotation.y += Math.PI * 0.5 * this.webgl.lastFrameTime;
            }
            this.scene.add(cubeMesh);
        }

        // init WebGL
        this.webgl.setSize(window.innerWidth, window.innerHeight);

        this.webgl.domElement.id = "canvas-vr-view";
        document.body.appendChild(this.webgl.domElement);

        this.webgl.xr.enabled = true;
        this.webgl.setAnimationLoop(() => this.animate());

        // event listeners
        window.addEventListener("resize", () => this.handleResize());
    }

    handleResize() {
        const [w, h] = [window.innerWidth, window.innerHeight];

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();

        this.webgl.setSize(w, h);
    }

    animate() {
        this.frameClock.autoStart = true;
        this.webgl.lastFrameTime = this.frameClock.getDelta();

        this.webgl.render(this.scene, this.camera);
    }
}