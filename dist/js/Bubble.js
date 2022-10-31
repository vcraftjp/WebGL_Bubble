"use strict";
class GradientDisk extends GameObject {
    constructor(name, radius, isGradient = false) {
        const mesh = BABYLON.MeshBuilder.CreateDisc(name, { radius: radius });
        super(mesh);
        this.radius = radius;
        this.isGradient = isGradient;
        if (isGradient) {
            if (!GradientDisk.initializedShader) {
                GradientDisk.initializedShader = true;
                setupShader();
            }
            const mat = new BABYLON.ShaderMaterial("shader", GameApp.currentScene, { vertex: "custom", fragment: "custom" }, {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
            });
            mat.backFaceCulling = false;
            mat.alpha = 0;
            mat.alphaMode = BABYLON.Engine.ALPHA_ONEONE;
            mat.setVector4("color1", new BABYLON.Vector4(0.0, 0.0, 0.0, 0.0));
            mat.setVector4("color2", new BABYLON.Vector4(1.0, 1.0, 1.0, 1.0));
            mat.setFloat("step1", 0.0);
            mat.setFloat("step2", 0.6);
            mat.setFloat("alpha", 1.0);
            this.mesh.material = mat;
        }
        else {
            this.mesh.material = new BABYLON.StandardMaterial(this.mesh.name + "Mat");
        }
    }
    setColor(color) {
        this.color = color;
        if (this.isGradient) {
            const mat = this.mesh.material;
            mat.setVector4("color2", new BABYLON.Vector4(color.r, color.b, color.g, 1.0));
        }
        else {
            const mat = this.mesh.material;
            mat.emissiveColor = color;
        }
    }
    setHSVColor(h, s, v = 1.0) {
        this.hue = h;
        this.setColor(BABYLON.Color3.FromHSV(h, s, v));
    }
    setGradient(color1, color2, step1, step2) {
        if (this.isGradient) {
            const mat = this.mesh.material;
            mat.setVector4("color1", new BABYLON.Vector4(color1.r, color1.g, color1.b, color1.a));
            mat.setVector4("color2", new BABYLON.Vector4(color2.r, color2.g, color2.b, color2.a));
            mat.setFloat("step1", step1);
            mat.setFloat("step2", step2);
        }
    }
    setAlpha(alpha = 1) {
        if (this.isGradient) {
            const mat = this.mesh.material;
            mat.setFloat("alpha", alpha);
        }
        else {
            this.mesh.material.alpha = alpha;
        }
    }
}
GradientDisk.initializedShader = false;
class Bubble extends GradientDisk {
    constructor(name, radius, isGradient = false) {
        super(name, radius, isGradient);
        this.speed = 0;
        this.angle = 0; // degree
        this.vanishTime = 0;
        this.life = 0;
    }
    update() {
        if (this.velocity) {
            this.position = this.position.add(this.velocity);
        }
        this.life++;
    }
    setSpeed(speed) {
        this.speed = speed;
        this.setVelocity();
    }
    setDirection(angle) {
        this.angle = angle;
        this.setVelocity();
    }
    setVelocity() {
        if (!this.velocity) {
            this.velocity = new BABYLON.Vector3();
        }
        const rad = this.angle * Math.PI / 180;
        this.velocity.x = Math.cos(rad) * this.speed * Bubble.speedRatio;
        this.velocity.y = Math.sin(rad) * this.speed * Bubble.speedRatio;
    }
}
Bubble.speedRatio = 1;
class Ripple extends GradientDisk {
    constructor(name, radius = 5) {
        super(name, radius, true);
        this.startTime = 0;
        this.scale = 1;
        this.enabled = false;
    }
    start(grow, elapse = 1000) {
        this.grow = grow;
        this.elapse = elapse;
        this.startTime = Date.now();
        this.enabled = true;
    }
    update() {
        if (!this.startTime)
            return false;
        const tick = Date.now();
        if (tick < this.startTime + this.elapse) {
            let t = (tick - this.startTime) / this.elapse;
            t = Easing.circularOut(t);
            this.setAlpha(1 - t);
            this.scale = 1.0 + this.grow * t;
            this.setScale2D(this.scale);
            return false;
        }
        else {
            this.startTime = 0;
            this.enabled = false;
            return true;
        }
    }
}
function setupShader() {
    BABYLON.Effect.ShadersStore["customVertexShader"] = "\r\n" +
        "precision highp float;\r\n" +
        "attribute vec3 position;\r\n" +
        "attribute vec2 uv;\r\n" +
        "uniform mat4 worldViewProjection;\r\n" +
        "varying vec2 vUV;\r\n" +
        "void main(void) {\r\n" +
        "    gl_Position = worldViewProjection * vec4(position, 1.0);\r\n" +
        "    vUV = uv;\r\n" +
        "}\r\n";
    BABYLON.Effect.ShadersStore["customFragmentShader"] = "\r\n" +
        "precision highp float;\r\n" +
        "varying vec2 vUV;\r\n" +
        "uniform vec4 color1;\r\n" +
        "uniform vec4 color2;\r\n" +
        "uniform float step1;\r\n" +
        "uniform float step2;\r\n" +
        "uniform float alpha;\r\n" +
        "void main(void) {\r\n" +
        "    float d = distance(vUV, vec2(0.5, 0.5));\r\n" +
        "    gl_FragColor = mix(color1 * alpha, color2 * alpha, smoothstep(step1, step2, d));\r\n" +
        "}\r\n";
}
//# sourceMappingURL=Bubble.js.map