"use strict";
class GUI {
    static init(canvas) {
        GUI.canvas = canvas;
        GUI.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true);
    }
    static addControl(control) {
        GUI.advancedTexture.addControl(control);
        GUI.controls.push(control);
    }
    static setAlignment(control, alignment) {
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
    static isPointOnPanels(x, y) {
        for (const control of GUI.controls) {
            if (GUI.isContains(control, x, y))
                return true;
        }
        return false;
    }
    static isContains(control, x, y) {
        if (!control.isEnabled)
            return false;
        const width = control.widthInPixels;
        const height = control.heightInPixels;
        return GUI.canvas.isContains(x, y, control.centerX - width / 2, control.centerY - height / 2, width, height);
    }
    static update() {
        for (const control of GUI.controls) {
            if (control instanceof Panel && control.isEnabled) {
                control.update();
            }
        }
    }
}
GUI.H_LEFT = 1;
GUI.H_RIGHT = 2;
GUI.H_CENTER = 3;
GUI.V_TOP = 4;
GUI.V_BOTTOM = 8;
GUI.V_CENTER = 12;
GUI.controls = [];
class Panel extends BABYLON.GUI.Rectangle {
    constructor(x, y, width, height, alignment) {
        super();
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
    }
    ;
    setVisible(b) {
        this.isVisible = b;
    }
    closeTo(x, y, onEnd, scale = 0.1, elapse = 300) {
        this.start = GUI.canvas.clientToScene(this.centerX, this.centerY);
        this.target = GUI.canvas.clientToScene(x, y);
        this.targetScale = scale;
        this.elapse = elapse;
        this.isClosing = true;
        this.onEnd = onEnd;
        this.startTime = Date.now();
    }
    openFrom() {
        this.isClosing = false;
        this.onEnd = undefined;
        this.startTime = Date.now();
    }
    update() {
        if (!this.startTime)
            return;
        let t = (Date.now() - this.startTime) / this.elapse;
        if (t > 1.0) {
            this.startTime = 0;
            if (this.onEnd) {
                this.onEnd();
            }
            return;
        }
        t = Easing.circularOut(t);
        let x;
        let y;
        if (this.isClosing) {
            this.scaleX = this.scaleY = (this.targetScale - 1.0) * t + 1.0;
            x = this.start.x + (this.target.x - this.start.x) * t;
            y = this.start.y + (this.target.y - this.start.y) * t;
        }
        else {
            this.scaleX = this.scaleY = (1.0 - this.targetScale) * t + this.targetScale;
            x = this.target.x - (this.target.x - this.start.x) * t;
            y = this.target.y - (this.target.y - this.start.y) * t;
        }
        this.moveToVector3(new BABYLON.Vector3(x, y, 0), GameApp.currentScene);
    }
}
class Button {
    constructor(panel, name, x, y, alignment = (GUI.H_LEFT | GUI.V_TOP), size = Button.IMAGE_SIZE) {
        this.selected = false;
        this.disabled = false;
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
    getImagePath(name) {
        return "./images/button_" + name + ".png";
    }
    setSelectedImage(imageName) {
        this.selectedImageName = imageName;
    }
    setSelected(b) {
        this.selected = b;
        if (this.selectedImageName) {
            this._button.image.source = this.getImagePath(b ? this.selectedImageName : this.name);
        }
        else {
            this._button.color = b ? "white" : "transparent";
        }
    }
    setDisabled(b) {
        this.disabled = b;
        this._button.image.alpha = b ? 0.5 : 1.0;
    }
    setVisible(b) {
        this._button.isVisible = b;
    }
}
Button.IMAGE_SIZE = 24;
class Slider {
    constructor(panel, name, min, max, value, step, x, y, width = Slider.SLIDER_WIDTH, alignment = (GUI.H_LEFT | GUI.V_TOP)) {
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
    setValue(value) {
        this._slider.value = value;
    }
}
Slider.IMAGE_SIZE = 24;
Slider.SLIDER_WIDTH = 160;
Slider.PADDING_X = 8;
//# sourceMappingURL=GUI.js.map