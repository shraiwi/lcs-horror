/// <reference path="VRButton.js"/>
/// <reference path="three.js"/>

// some basic utilities
class Utils {

    // basic shader options
    static SHADER_FETCH_OPTS = {
        method: "GET",
        mode: "cors",
    }

    // asynchronously loads a ShaderMaterial from a specific network location
    static async loadShaderFolder(folderUrl, vertUrl = null, fragUrl = null, opts = {}) {
        await Promise.all([
            fetch(vertUrl || folderUrl + "/vert.glsl", Utils.SHADER_FETCH_OPTS).then(
                async (res) => { 
                    if (res.status === 200) {
                        opts.vertexShader = await res.text();
                        console.info("Loaded vertex shader from %s", res.url);
                    }
                    else console.warn("Could not find vertex shader at %s", res.url);
                }
            ),
            fetch(fragUrl || folderUrl + "/frag.glsl", Utils.SHADER_FETCH_OPTS).then(
                async (res) => { 
                    if (res.status === 200) {
                        opts.fragmentShader = await res.text();
                        console.info("Loaded fragment shader from %s", res.url);
                    }
                    else console.warn("Could not find fragment shader at %s", res.url);
                 }
            ),
        ]);
        return new THREE.ShaderMaterial(opts);
    }
}

class VRApp {
    constructor() {

        // create objects
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10);
        
        this.webgl = new THREE.WebGLRenderer();
        this.webgl.lastFrameTime = 0.0;

        this.frameClock = new THREE.Clock();

        // init scene

        this.camera.position.z = 2;

        this.scene.background = new THREE.Color(0x505050);

        // load scene asynchronously
        (async () => {

            // spinning cube
            const cubeMesh = new THREE.Mesh(
                new THREE.IcosahedronGeometry(),
                await Utils.loadShaderFolder("glsl/test", "glsl/lit_vertex.glsl"),
            );
            cubeMesh.onAfterRender = () => {
                cubeMesh.rotation.y += Math.PI * 0.5 * this.webgl.lastFrameTime;
            }
            this.scene.add(cubeMesh);

            // floor
            const floorMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(100, 100),
                new THREE.MeshBasicMaterial({ color: 0x707070, }),
            );
            floorMesh.position.y = -1.0;
            floorMesh.rotation.x = -Math.PI * 0.5;

            this.scene.add(floorMesh);

            //console.log(JSON.stringify(this.scene.toJSON()))
        })();

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
        //this.frameClock.autoStart = true;
        this.webgl.lastFrameTime = this.frameClock.getDelta();

        this.webgl.render(this.scene, this.camera);
    }
}