"use strict";
class Canvas {
    constructor() {
        this.scale = 1.0;
        this._canvas = document.getElementById("renderCanvas");
        this.setCanvasScale();
        this.resize();
    }
    // Make objects smaller for mini-size smartphones
    setCanvasScale() {
        const size = Math.min(this._canvas.clientWidth, this._canvas.clientHeight);
        if (size < Canvas.MIN_SIZE) {
            this.scale = Canvas.MIN_SIZE / size;
        }
        console.log("canvas scale=" + this.scale);
    }
    clientToScene(x, y) {
        return { x: x * this.scale - this.maxX, y: this.maxY - y * this.scale };
    }
    sceneToClient(x, y) {
        return { x: (x + this.maxX) / this.scale, y: (this.maxY - y) / this.scale };
    }
    isContains(x, y, rectX, rectY, rectWidth, rectHeight) {
        const pt = this.sceneToClient(x, y);
        return pt.x >= rectX && pt.x < rectX + rectWidth && pt.y >= rectY && pt.y < rectY + rectHeight;
    }
    resize() {
        this.width = this._canvas.clientWidth * this.scale;
        this.height = this._canvas.clientHeight * this.scale;
        this.maxX = this.width / 2;
        this.maxY = this.height / 2;
    }
}
Canvas.MIN_SIZE = 640;
class Camera2D extends BABYLON.FreeCamera {
    constructor(canvas) {
        super("camera", new BABYLON.Vector3(0, 0, -1));
        this.canvas = canvas;
        this.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        this.resize();
    }
    resize() {
        // The center coordinates of the canvas are (0,0)
        this.orthoLeft = -this.canvas.maxX;
        this.orthoRight = this.canvas.maxX;
        this.orthoTop = this.canvas.maxY;
        this.orthoBottom = -this.canvas.maxY;
    }
}
class GameApp {
    constructor() {
        this.canvas = new Canvas();
        this.engine = new BABYLON.Engine(this.canvas._canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.pointerDragMargin = 2;
        this.pointerMap = new Map;
        this.paused = false;
        GameApp.currentScene = this.scene;
        this.init();
        // Register a render loop to repeatedly render the scene
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        this.scene.registerBeforeRender(() => {
            this._update();
        });
        // Watch for browser/canvas resize events
        window.addEventListener("resize", () => {
            this.engine.resize();
            this.canvas.resize();
            if (this.camera instanceof Camera2D) {
                this.camera.resize();
            }
            console.log("resize: " + this.canvas.width + "x" + this.canvas.height);
        });
        this.canvas._canvas.addEventListener("keydown", (event) => {
            console.log("key down: " + event.code);
            if (this.onKeyDown) {
                this.onKeyDown(event);
            }
            if (GameApp.DEBUG_PAUSE) {
                if (event.code == "Space") {
                    this.paused = !this.paused;
                }
            }
        });
        this.canvas._canvas.addEventListener("keyup", (event) => {
            console.log("key up: " + event.code);
            if (this.onKeyUp) {
                this.onKeyUp(event);
            }
        });
        if (GameApp.DEBUG_FPS) {
            Utils.startFPS();
        }
    }
    init() { }
    update() { }
    _update() {
        if (this.paused)
            return;
        this.update();
        if (this.onUpdate) {
            this.onUpdate();
        }
        if (GameApp.DEBUG_FPS) {
            const fps = Utils.getFPS();
            if (fps) {
                console.log("FPS=" + fps);
            }
        }
    }
    registerEvents() {
        if (this.onPointerDown) {
            this.canvas._canvas.addEventListener("pointerdown", (event) => {
                const pt = this.canvas.clientToScene(event.clientX, event.clientY);
                this.pointerMap.set(event.pointerId, pt);
                console.log("pointer down: " + Utils.round(pt.x) + "," + Utils.round(pt.y));
                this.onPointerDown(pt.x, pt.y, event);
            });
        }
        if (this.onPointerUp) {
            this.canvas._canvas.addEventListener("pointerup", (event) => {
                this.pointerMap.delete(event.pointerId);
                const pt = this.canvas.clientToScene(event.clientX, event.clientY);
                console.log("pointer up");
                this.onPointerUp(pt.x, pt.y, event);
            });
        }
        if (this.onPointerDragged) {
            this.canvas._canvas.addEventListener("pointermove", (event) => {
                const prevPt = this.pointerMap.get(event.pointerId);
                if (prevPt) {
                    const pt = this.canvas.clientToScene(event.clientX, event.clientY);
                    if (Utils.distance(pt, prevPt) >= this.pointerDragMargin) {
                        this.pointerMap.set(event.pointerId, pt);
                        this.onPointerDragged(pt.x, pt.y, event);
                    }
                }
            });
        }
    }
    initGlowLayer(intensity) {
        this.glowLayer = new BABYLON.GlowLayer("glowLayer");
        this.glowLayer.intensity = intensity;
    }
}
GameApp.DEBUG_FPS = false;
GameApp.DEBUG_PAUSE = true;
//# sourceMappingURL=GameApp.js.map