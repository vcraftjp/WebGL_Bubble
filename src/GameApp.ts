
class Canvas {
	width: number;
	height: number;
	maxX: number;
	maxY: number;

	static readonly MIN_SIZE = 640;
	scale = 1.0;

	_canvas: HTMLCanvasElement;

	constructor() {
		this._canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
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

	clientToScene(x: number, y: number): { x: number, y: number} {
		return {x: x * this.scale - this.maxX, y: this.maxY - y * this.scale };
	}

	sceneToClient(x: number, y: number): { x: number, y: number} {
		return {x: (x + this.maxX) / this.scale, y: (this.maxY - y) / this.scale };
	}

	isContains(x: number, y: number, rectX: number, rectY: number, rectWidth: number, rectHeight : number): boolean {
		const pt = this.sceneToClient(x, y);
		return pt.x >= rectX && pt.x < rectX + rectWidth && pt.y >= rectY && pt.y < rectY + rectHeight;
	}

	resize(): void {
		this.width = this._canvas.clientWidth * this.scale;
		this.height = this._canvas.clientHeight * this.scale;
		this.maxX = this.width / 2;
		this.maxY = this.height / 2;
	}

}

class Camera2D extends BABYLON.FreeCamera {
	canvas: Canvas;

	constructor(canvas: Canvas) {
		super("camera", new BABYLON.Vector3(0, 0, -1));
		this.canvas = canvas;
		this.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		this.resize();
	}

	resize(): void {
		// The center coordinates of the canvas are (0,0)
		this.orthoLeft = -this.canvas.maxX;
		this.orthoRight = this.canvas.maxX;
		this.orthoTop = this.canvas.maxY;
		this.orthoBottom = -this.canvas.maxY;
	}
}

class GameApp {
	static currentScene: BABYLON.Scene;

	canvas = new Canvas();
	engine = new BABYLON.Engine(this.canvas._canvas, true);
	scene = new BABYLON.Scene(this.engine);
	camera: BABYLON.Camera;
	light: BABYLON.Light;

	glowLayer: BABYLON.GlowLayer;

	onPointerDown: (x: number, y: number, event: PointerEvent) => void;
	onPointerUp: (x: number, y: number, event: PointerEvent) => void;
	onPointerDragged: (x: number, y: number, event: PointerEvent) => void;
	pointerPressed = false;
	prevPoint: { x: number, y: number };
	pointerDragMargin = 2;

	onKeyDown: (event: KeyboardEvent) => void;
	onKeyUp: (event: KeyboardEvent) => void;

	onUpdate: () => void; // for GUI

	static readonly DEBUG_FPS = false;
	static readonly DEBUG_PAUSE = true;

	paused = false;

	constructor() {
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

	init(): void {}
	update(): void {}

	private _update(): void {
		if (this.paused) return;
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

	registerEvents(): void {
		if (this.onPointerDown) {
			this.canvas._canvas.addEventListener("pointerdown", (event) => {
				this.pointerPressed = true;
				const pt = this.canvas.clientToScene(event.clientX, event.clientY);
				this.prevPoint = pt;
				console.log("pointer down: " + Utils.round(pt.x) + "," +  Utils.round(pt.y));
				this.onPointerDown(pt.x, pt.y, event);
			});
		}
		if (this.onPointerUp) {
			this.canvas._canvas.addEventListener("pointerup", (event) => {
				this.pointerPressed = false;
				const pt = this.canvas.clientToScene(event.clientX, event.clientY);
				console.log("pointer up");
				this.onPointerUp(pt.x, pt.y, event);
			});
		}
		if (this.onPointerDragged) {
			this.canvas._canvas.addEventListener("pointermove", (event) => {
				if (this.pointerPressed) {
					const pt = this.canvas.clientToScene(event.clientX, event.clientY);
					if (Utils.distance(pt, this.prevPoint) >= this.pointerDragMargin) {
						this.prevPoint = pt;
						this.onPointerDragged(pt.x, pt.y, event);
					}
				}
			});
		}
	}

	initGlowLayer(intensity: number): void {
		this.glowLayer = new BABYLON.GlowLayer("glowLayer");
		this.glowLayer.intensity = intensity;
	}

}
