/// <reference path="three.js"/>

class VRApp {
    constructor() {
        this.webgl = null;
        this.sess = null;
        //this.webgl.xr.enabled = true;
    }

    async init(sess) {
        if (!sess) {
            console.error("Invalid WebXR session!");
            return;
        }

        this.sess = sess;

        this.sess.addEventListener("end", this.xrEnd);

        this.webgl = new THREE.WebGLRenderer();
        this.webgl.setSize(window.innerWidth, window.innerHeight);

        this.webgl.domElement.id = "canvas-vr-view";
        document.body.appendChild(this.webgl.domElement);

        this.webgl.xr.enabled = true;

        //await this.webgl.xr.setSession(this.sess);

        //this.webgl.setAnimationLoop(this.animate);

        //console.info("XR Initialized!");
    }

    xrEnd() {

    }

    animate() {

        
    }
}