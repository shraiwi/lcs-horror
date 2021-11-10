/// <reference path="VRButton.js"/>
/// <reference path="three.js"/>

// some basic utilities
class Utils {

    // basic shader options
    static SHADER_FETCH_OPTS = {
        method: "GET",
        mode: "cors",
    }

    // fills a geometry with random values
    static createRandomGeometry(numPoints, bounds) {
        const geo = new THREE.BufferGeometry();

        const randRanges = new THREE.Vector3().subVectors(bounds.max, bounds.min).toArray();
        const randMin = bounds.min.toArray();

        const points = new Float32Array(numPoints * 3);

        for (let i = 0; i < points.length; i++) {
            points[i] = Math.random() * randRanges[i % 3] + randMin[i % 3];
        }

        geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));

        return geo;
    }

    // creates a quad geometry with four triangles, where each triangle's corners attach two adjascent corners of the quad with a central point at 0, 0, 0
    static createQuadQuadGeometry(size = 1.0, centerColor = [0.0, 0.0, 0.0], edgeColor = [1.0, 1.0, 1.0]) {
        const geo = new THREE.BufferGeometry();

        const hs = size * 0.5;

        geo.setAttribute("position", new THREE.Float32BufferAttribute([
             hs,   0.0,  0.0,
             0.0,  hs,   0.0,
             0.0,  0.0,  0.0, // q1

             0.0,  hs,   0.0,
            -hs,   0.0,  0.0,
             0.0,  0.0,  0.0, // q2

            -hs,   0.0,  0.0,
             0.0, -hs,   0.0,
             0.0,  0.0,  0.0, // q3

             0.0, -hs,   0.0,
             hs,   0.0,  0.0,
             0.0,  0.0,  0.0, // q4
        ], 3));

        geo.setAttribute("normal", new THREE.Float32BufferAttribute(
            new Array(4).fill([0.0, 0.0, 1.0]).flat(), 
            3
        ));

        geo.setAttribute("color", new THREE.Float32BufferAttribute(
            new Array(4).fill([
                ...edgeColor,
                ...edgeColor,
                ...centerColor
            ]).flat(), 
            3
        ));

        return geo;
    }

    static attachShadow(parent, size = 1, floorHeight = 0.001, parentHeight = 0.0) {
        const shadowMesh = new THREE.Mesh( // create a new shadow mesh
            Utils.createQuadQuadGeometry(1.0, [0.0, 0.0, 0.0], [0.1, 0.1, 0.1]),
            new THREE.MeshBasicMaterial({ 
				vertexColors: true,
                blending: THREE.MultiplyBlending,
            }),
        );
        
        shadowMesh.originalParentHeight = parentHeight || parent.position.y; // get the parent height, if it exists

        shadowMesh.matrixAutoUpdate = false; // disable auto-updating child position
        shadowMesh.updateMatrixWorld = (force) => {
            if (shadowMesh.matrixAutoUpdate) shadowMesh.updateMatrix();
            if (shadowMesh.matrixWorldNeedsUpdate || force) {
                const sideSize = size / Math.abs(shadowMesh.parent.position.y - floorHeight);
                shadowMesh.matrixWorld.set(
                    sideSize,   0.0,        0.0,        0.0,
                    0.0,        0.0,        sideSize,   floorHeight,
                    0.0,        sideSize,   0.0,        0.0,
                    0.0,        0.0,        0.0,        1.0,
                );
                shadowMesh.matrixWorldNeedsUpdate = false;
            }
        }

        parent.attach(shadowMesh);
    }

    // asynchronously loads shaders from a specific network location
    static async loadShaders(folderUrl, vertUrl = null, fragUrl = null, opts = {}) {
        // wait for all promises to resolve
        await Promise.all([
            fetch(vertUrl || folderUrl + "/vert.glsl", Utils.SHADER_FETCH_OPTS).then( // on load vertex shader
                async (res) => { 
                    if (res.status === 200) { // if the status is 200,
                        opts.vertexShader = await res.text(); // download the response body
                        console.info("Loaded vertex shader from %s", res.url); // log the shader as loaded
                    }
                    else console.warn("Could not find vertex shader at %s", res.url); // otherwise, log the shader as not loaded
                }
            ),
            fetch(fragUrl || folderUrl + "/frag.glsl", Utils.SHADER_FETCH_OPTS).then( // on load fragment shader
                async (res) => { 
                    if (res.status === 200) { // if the status is 200,
                        opts.fragmentShader = await res.text(); // download the response body
                        console.info("Loaded fragment shader from %s", res.url); // log the shader as loaded
                    }
                    else console.warn("Could not find fragment shader at %s", res.url); // otherwise, log the shader as not loaded
                 }
            ),
        ]);
        return opts; // return the modified options object
    }
}

class NoiseMachine {
    constructor(amplitude = 1.0, ftop = 1.0, octaves = 5, dvol = 1.3) {
        this.octaves = [];

        for (let i = 0; i < octaves; i++) {
            this.octaves.push([ftop * Math.pow(dvol, i), amplitude * (Math.random() * 2.0 - 1.0)]);
        }
    }

    value(t) {
        let retval = 0.0;
        for (const [f, a] of this.octaves) {
            retval += Math.sin(t * f) * a;
        }
        return retval
    }
}

class VRApp {
    constructor() {

        const levelBounds = new THREE.Box3(
            new THREE.Vector3(-2,  0, -2), 
            new THREE.Vector3( 2,  4,  2)
        );

        const levelSize = new THREE.Vector3();
        const levelCenter = new THREE.Vector3();

        levelBounds.getSize(levelSize);
        levelBounds.getCenter(levelCenter);

        const levelFloorHeight = levelBounds.min.y;

        // create camera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.camera.position.y = levelFloorHeight + 1;
        this.camera.position.z = levelBounds.max.z;

        // create audio listener

        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        // create renderer

        this.webgl = new THREE.WebGLRenderer({ antialias: true });

        this.webgl.lastFrameTime = 0.0;
        this.webgl.elapsedTime = 0.0;

        //this.effects = new THREE.EffectComposer(this.webgl);

        this.frameClock = new THREE.Clock();
        this.gameClock = new THREE.Clock();

        this.scene.background = new THREE.Color(0x8abdff);

        this.nodes = null;

        // load scene asynchronously
        (async () => {

            this.nodes = {};
            this.gameClock.start();

            // audio

            //const browserAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

            const noiseAudio = this.nodes.noiseAudio = new THREE.Audio(this.listener);

            const noiseAudioSource = new AudioBuffer({
                sampleRate: 16000,
                length: 16000,
                numberOfChannels: 1,
            });//browserAudioCtx.createBuffer(1, noiseAudioSourceSampleCount, browserAudioCtx.sampleRate);
            const noiseAudioSourceBuffer = noiseAudioSource.getChannelData(0);

            for (let i = 0; i < noiseAudioSource.length; i++) {
                noiseAudioSourceBuffer[i] = Math.random() * 2 - 1;
                if (i > 0) {
                    noiseAudioSourceBuffer[i] = noiseAudioSourceBuffer[i - 1] * 0.8 + noiseAudioSourceBuffer[i] * 0.2;
                }
            }

            noiseAudio.setBuffer(noiseAudioSource);
            noiseAudio.setLoop(true);

            const waterNoiseMachine = new NoiseMachine(0.2, 1.2, 2);

            setInterval(() => {
                const elapsedTime = this.gameClock.getElapsedTime();
                const waterLevel = noiseAudio.waterLevel = waterNoiseMachine.value(elapsedTime) + 0.5;
                noiseAudio.setVolume(Math.max(waterLevel * 0.5, 0.1));
            }, 16 / 1000);

            window.addEventListener("click", () => {
                noiseAudio.play();
            });

            // lights

            const sunLight = this.nodes.sunLight = new THREE.DirectionalLight(0xffffff);
            sunLight.position.z += 1;
            this.scene.add(sunLight);

            const ambientLight = this.nodes.ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
            this.scene.add(ambientLight);

            const floorLight = this.nodes.floorLight = new THREE.DirectionalLight(0xd000ff, 0.2);
            floorLight.position.y = -1.0;
            this.scene.add(floorLight);

            // particles

            const dustParticles = this.nodes.dustParticles = new THREE.Points(
                Utils.createRandomGeometry(1000, levelBounds),
                new THREE.PointsMaterial({ 
                    color: 0x202020,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    size: 0.02,
                }),
            );
            this.scene.add(dustParticles);

            // spinning icosahedron
            const actionMesh = this.nodes.actionMesh = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.2),
                new THREE.MeshPhongMaterial({ 
                    color: new THREE.Color(0x7fffff), 
                    shininess: 60,
                    flatShading: true,
                }),
            );

            Utils.attachShadow(actionMesh, 0.2, levelFloorHeight + 0.001, 0.5);

            actionMesh.onAfterRender = () => {
                actionMesh.position.y = Math.sin(this.webgl.elapsedTime) * 0.2 + levelFloorHeight + 1;
                actionMesh.rotation.x += Math.sin(this.webgl.elapsedTime * 0.7) * 0.01 + Math.sin(this.webgl.elapsedTime * 0.6) * 0.01;
                actionMesh.rotation.z += Math.sin(this.webgl.elapsedTime * 0.8) * 0.02 - Math.sin(this.webgl.elapsedTime * 0.7) * 0.01;

                actionMesh.scale.setScalar(Math.random() * 0.05 + noiseAudio.waterLevel * 1.5);
            };
            this.scene.add(actionMesh);

            // floor
            const floorMesh = this.nodes.floorMesh = new THREE.Mesh(
                new THREE.DodecahedronGeometry(2),
                new THREE.MeshPhongMaterial({ color: new THREE.Color(0xffd8a6) }),
            );
            floorMesh.position.y = levelFloorHeight - 0.1;
            floorMesh.geometry.scale(1.0, 1.0, 0.05);
            floorMesh.geometry.rotateX(-Math.PI * 0.5);

            this.scene.add(floorMesh);

            // water
            const waterLevelNoiseMachineX = new NoiseMachine(0.1, 1.4);
            const waterLevelNoiseMachineZ = new NoiseMachine(0.1, 1.4);

            const waterMesh = this.nodes.waterMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(100, 100, 64, 64),
                new THREE.MeshPhongMaterial({ 
                    color: new THREE.Color(0x495ab8), 
                    shininess: 150,
                    //flatShading: true,
                }),
            );
            waterMesh.position.y = -0.3;
            waterMesh.geometry.rotateX(-Math.PI * 0.5);

            waterMesh.onAfterRender = () => {
                //waterMesh.position.y = this.nodes.noiseAudio.waterLevel * 0.2 - levelFloorHeight - 0.3;

                const verts = waterMesh.geometry.getAttribute("position");

                const [IX, IY, IZ] = [0, 1, 2];

                const OCEANTIME = this.webgl.elapsedTime * 1.5;

                for (let i = 0; i < verts.count; i++) {
                    const VERTEX = verts.array.subarray(i * verts.itemSize, (i + 1) * verts.itemSize);
                    const D = Math.sqrt(VERTEX[IX] * VERTEX[IX] + VERTEX[IZ] * VERTEX[IZ]);
                    const N = 0.5;
                    const ATTEN = 1 - Math.pow(D / 50, N);
                    VERTEX[IY] = 
                        (waterLevelNoiseMachineX.value(VERTEX[IX]) * Math.sin(OCEANTIME)
                        + waterLevelNoiseMachineZ.value(VERTEX[IZ] + OCEANTIME));
                    VERTEX[IY] *= ATTEN;
                }

                waterMesh.geometry.computeVertexNormals();

                verts.needsUpdate = true;
                
            }
            
            this.scene.add(waterMesh);
            
            // sun
            const sunMesh = this.nodes.waterMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(10, 10),
                new THREE.MeshBasicMaterial({ 
                    color: new THREE.Color(0xebe534), 
                }),
            );
            sunMesh.position.y = 100;
            sunMesh.position.z = -100;
            sunMesh.geometry.rotateX(Math.PI * 0.25);

            this.scene.add(sunMesh);

            // clouds

            const cloudMeshes = this.nodes.cloudMeshes = [];

            for (let i = 0; i < 10; i++) {
                //const cloudMeshNoiseMachineZ = new NoiseMachine(0, 0.01);
                const cloudMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(Math.random() * 10 + 10, Math.random() * 10 + 10),
                    new THREE.MeshBasicMaterial({ 
                        color: new THREE.Color(0xffffff), 
                    }),
                );
                cloudMesh.position.y = Math.random() * 5 + 20;
                cloudMesh.position.x = Math.random() * 50 - 25;
                cloudMesh.position.z = Math.random() * 50 - 25;
                cloudMesh.geometry.rotateX(Math.PI * 0.5);
    
                this.scene.add(cloudMesh);
                cloudMeshes.push(cloudMesh);
            }
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
        const lastFrameTime = this.webgl.lastFrameTime = this.frameClock.getDelta();
        const elapsedTime = this.webgl.elapsedTime = this.frameClock.elapsedTime;

        this.webgl.render(this.scene, this.camera);
    }
}