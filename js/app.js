/// <reference path="three.js"/>
/// <reference path="VRButton.js"/>

class VRApp {
    constructor() {
        this.webgl = new THREE.WebGLRenderer();
        this.webgl.setSize(window.innerWidth, window.innerHeight);

        this.webgl.domElement.id = "canvas-vr-view";
        document.body.appendChild(this.webgl.domElement);

        this.webgl.xr.enabled = true;
    }

    xrEnd() {

    }

    animate() {

        
    }
}