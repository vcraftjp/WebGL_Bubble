
class GUI {
	static H_LEFT 	= 1;
	static H_RIGHT	= 2;
	static H_CENTER	= 3;
	static V_TOP	= 4;
	static V_BOTTOM	= 8;
	static V_CENTER	= 12;

	static canvas: Canvas;
	static advancedTexture: BABYLON.GUI.AdvancedDynamicTexture;

	private static controls: BABYLON.GUI.Control[] = [];

	static init(canvas: Canvas): void {
		GUI.canvas = canvas;
		GUI.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);
	}

	static addControl(control: BABYLON.GUI.Control): void {
		GUI.advancedTexture.addControl(control);
		GUI.controls.push(control);
	}

	static setAlignment(control: BABYLON.GUI.Control, alignment: number): void {
		const align_h = (alignment & 0x03);
		const align_v = (alignment & 0x0C);
		if (align_h) {
			control.horizontalAlignment =
				(align_h == GUI.H_LEFT) ? BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
				: (align_h == GUI.H_RIGHT) ? BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT
				: BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
		}
		if (align_v) {
			control.verticalAlignment =
				(align_v == GUI.V_TOP) ? BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP
				: (align_v == GUI.V_BOTTOM) ? BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM
				: BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
		}
	}

	static isPointOnPanels(x: number, y: number): boolean {
		for (const control of GUI.controls) {
			if (GUI.isContains(control, x, y)) return true;
		}
		return false;
	}

	static isContains(control: BABYLON.GUI.Control, x: number, y: number): boolean {
		if (!control.isEnabled) return false;
		const width = control.widthInPixels;
		const height = control.heightInPixels;
		return GUI.canvas.isContains(x, y, control.centerX - width / 2, control.centerY - height / 2, width, height);
	}

	static update(): void {
		for (const control of GUI.controls) {
			if (control instanceof Panel && control.isEnabled) {
				control.update();
			}
		}
	}
}

class Panel extends BABYLON.GUI.Rectangle {
	constructor(x: number, y: number, width: number, height: number, alignment: number) {
		super()

		this.leftInPixels = x;
		this.topInPixels = y;
		this.widthInPixels = width;
		this.heightInPixels = height;
		GUI.setAlignment(this, alignment);
		this.clipChildren = false;

//		this.cornerRadius = 10;
		this.color = "#808080";
		this.thickness = 2;
		this.background = "transparent";

		//https://forum.babylonjs.com/t/babylon-gui-alpha-of-container-overriding-alpha-of-children-controls/438
		const rectBG = new BABYLON.GUI.Rectangle();
		rectBG.widthInPixels = width;
		rectBG.heightInPixels = height;
		rectBG.background = "white";
		rectBG.alpha = 0.1;
		this.addControl(rectBG);
	};

	setVisible(b: boolean): void {
		this.isVisible = b;
	}

	startTime: number;
	elapse: number;
	start: { x: number, y: number };
	target: { x: number, y: number };
	targetScale: number;
	isClosing: boolean;
	onEnd: () => void;

	closeTo(x: number, y: number, onEnd?: () => void, scale = 0.1, elapse: number = 300): void {
		this.start = GUI.canvas.clientToScene(this.centerX, this.centerY);
		this.target = GUI.canvas.clientToScene(x, y);
		this.targetScale = scale;
		this.elapse = elapse;
		this.isClosing = true;
		this.onEnd = onEnd;
		this.startTime = Date.now();
	}

	openFrom(): void {
		this.isClosing = false;
		this.onEnd = undefined;
		this.startTime = Date.now();
	}

	update():void {
		if (!this.startTime) return;
		let t = (Date.now() - this.startTime) / this.elapse;
		if (t > 1.0) {
			this.startTime = 0;
			if (this.onEnd) {
				this.onEnd();
			}
			return;
		}
		t = Easing.circularOut(t);
		let x: number;
		let y: number;
		if (this.isClosing) {
			this.scaleX = this.scaleY = (this.targetScale - 1.0) * t + 1.0;
			x = this.start.x + (this.target.x - this.start.x) * t;
			y = this.start.y + (this.target.y - this.start.y) * t;
		} else {
			this.scaleX = this.scaleY = (1.0 - this.targetScale) * t + this.targetScale;
			x = this.target.x - (this.target.x - this.start.x) * t;
			y = this.target.y - (this.target.y - this.start.y) * t;
		}
		this.moveToVector3(new BABYLON.Vector3(x, y, 0), GameApp.currentScene);
	}
}

class Button {
	static readonly IMAGE_SIZE = 24;

	_button: BABYLON.GUI.Button;
	name: string;
	selected = false;
	disabled = false;
	selectedImageName: string;

	onClicked: (button: Button) => void;

	constructor(panel: Panel, name: string, x: number, y: number, alignment = (GUI.H_LEFT | GUI.V_TOP), size: number = Button.IMAGE_SIZE) {
		this.name = name;
		this._button = BABYLON.GUI.Button.CreateImageOnlyButton(name, this.getImagePath(name));
		this._button.leftInPixels = x;
		this._button.topInPixels = y;
		this._button.widthInPixels = this._button.heightInPixels = size;
		this._button.color = "transparent";
		this._button.cornerRadius = 4;
		GUI.setAlignment(this._button, alignment);

		this._button.onPointerClickObservable.add((value) => {
			if (this.onClicked) {
				console.log("button[" + this.name + "] clicked");
				this.onClicked(this);
			}
		});

		if (panel) {
			panel.addControl(this._button);
		}
	}

	getImagePath(name: string) {
		return "./images/button_" + name + ".png"
	}

	setSelectedImage(imageName: string) {
		this.selectedImageName = imageName;
	}

	setSelected(b: boolean): void {
		this.selected = b;
		if (this.selectedImageName) {
			this._button.image.source = this.getImagePath(b ? this.selectedImageName : this.name);
		} else {
			this._button.color = b ? "white" : "transparent";
		}
	}

	setDisabled(b: boolean): void {
		this.disabled = b;
		this._button.image.alpha = b ? 0.5 : 1.0;
	}

	setVisible(b: boolean): void {
		this._button.isVisible = b;
	}
}

class Slider {
	static readonly IMAGE_SIZE = 24;
	static readonly SLIDER_WIDTH = 160;
	static readonly PADDING_X = 8;

	_slider: BABYLON.GUI.Slider;
	name: string;

	onValueChanged: (value: number) => void;

	constructor(panel: Panel, name: string, min: number, max: number, value: number, step: number,
			x: number, y: number, width = Slider.SLIDER_WIDTH, alignment = (GUI.H_LEFT | GUI.V_TOP)) {
		this._slider = new BABYLON.GUI.Slider();
		this.name = name;

		this._slider.minimum = min;
		this._slider.maximum = max;
		this._slider.value = value;
		this._slider.step = step;

		this._slider.leftInPixels = x + Slider.IMAGE_SIZE + Slider.PADDING_X;
		this._slider.topInPixels = y;
		this._slider.widthInPixels = width;
		this._slider.heightInPixels = 20;
		this._slider.barOffset = "8px";
		this._slider.isThumbCircle = true;
		this._slider.thumbWidth = "20px";
		this._slider.color = "#C0C0C0";
		this._slider.alpha = 0.8;
		this._slider.background = "grey";
		GUI.setAlignment(this._slider, alignment);

		this._slider.onValueChangedObservable.add((value) => {
			if (this.onValueChanged) {
				this.onValueChanged(value);
			}
		});

		const image = new BABYLON.GUI.Image(name, "./images/icon_" + name + ".png");
		image.leftInPixels = x + Slider.PADDING_X;
		image.topInPixels = y;
		image.widthInPixels = image.heightInPixels = Slider.IMAGE_SIZE;
		image.stretch = BABYLON.GUI.Image.STRETCH_NONE;
		GUI.setAlignment(image, GUI.H_LEFT | GUI.V_TOP);

		panel.addControl(image);
		panel.addControl(this._slider);
	}

	setValue(value: number):void {
		this._slider.value = value;
	}
}