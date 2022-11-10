"use strict";
class App extends GameApp {
    constructor() {
        super();
        this.bubbles = [];
        this.bubbleCount = App.BUBBLE_COUNT;
        this.bubbleSat = 0;
        this.ripples = [];
        //
        // Sound effect by Tone.js
        //
        this.synth = new Tone.PolySynth().toDestination();
        this.isMute = false;
        this.createScene();
        this.createGUI();
        this.initEvent();
    }
    init() {
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        this.camera = new Camera2D(this.canvas);
        this.updateBackgroudColor(App.BACKGROUND_HUE);
        this.initGlowLayer(App.GLOW_INTENSITY);
        this.pointerDragMargin = App.DRAG_MARGIN;
        this.setVersionInfo();
    }
    setVersionInfo() {
        this.setFooterText("Bubble Tone " + Utils.dateString(new Date(document.lastModified)) + "  Babylon.js " + BABYLON.Engine.Version + "  Tone.js " + Tone.version);
    }
    setFooterText(s) {
        const div = document.getElementById("version-info");
        div.textContent = s;
    }
    createScene() {
        for (let i = 0; i < App.BUBBLE_MAX; i++) {
            const bubble = new Bubble("bubble" + i, App.RADIUS_MIN + Math.random() * (App.RADIUS_MAX - App.RADIUS_MIN));
            bubble.id = i;
            this.initBubble(bubble, true);
            if (i >= this.bubbleCount) {
                bubble.enabled = false;
            }
            this.bubbles[i] = bubble;
        }
    }
    initBubble(bubble, isStartup) {
        bubble.life = 0;
        const angle = Math.random() * 360;
        bubble.setDirection(angle);
        if (isStartup) {
            bubble.setPosition((Math.random() - 0.5) * this.canvas.width, (Math.random() - 0.5) * this.canvas.height);
        }
        else {
            const maxX = this.canvas.maxX;
            const maxY = this.canvas.maxY;
            if (angle >= 0 && angle < 45 || angle >= 315) {
                bubble.setPosition(-maxX - bubble.radius - 1, Math.random() * ((angle >= 315) ? maxY : -maxY));
            }
            else if (angle >= 45 && angle < 135) {
                bubble.setPosition(Math.random() * ((angle < 90) ? -maxX : maxX), -maxY - bubble.radius - 1);
            }
            else if (angle >= 135 && angle < 225) {
                bubble.setPosition(maxX + bubble.radius + 1, Math.random() * ((angle >= 180) ? maxY : -maxY));
            }
            else {
                bubble.setPosition(Math.random() * ((angle >= 270) ? maxX : -maxX), maxY + bubble.radius + 1);
            }
        }
        bubble.setHSVColor(Math.random() * 360, this.bubbleSat, 1.0);
        bubble.setAlpha(Math.random() * 0.5);
        bubble.setSpeed(Math.random() * 5 + 0.1);
    }
    updateBubble(bubble) {
        bubble.update();
        if (Math.abs(bubble.position.x) >= (this.canvas.maxX + bubble.radius)) {
            if (!this.isBubbleStacked(bubble)) {
                bubble.position.x = -bubble.position.x;
                bubble.life = 0;
            }
        }
        else if (Math.abs(bubble.position.y) >= (this.canvas.maxY + bubble.radius)) {
            if (!this.isBubbleStacked(bubble)) {
                bubble.position.y = -bubble.position.y;
                bubble.life = 0;
            }
        }
    }
    isBubbleStacked(bubble) {
        if (bubble.life == 1) {
            console.log("jammed! bubble #" + bubble.id);
            this.initBubble(bubble, false);
            return true;
        }
        return false;
    }
    createGUI() {
        GUI.init(this.canvas);
        this.onUpdate = GUI.update;
        const panel = new Panel(-16, 16, 200, 216, (GUI.H_RIGHT | GUI.V_TOP));
        GUI.addControl(panel);
        this.panelButton = new Button(null, "menu", -16, 16, (GUI.H_RIGHT | GUI.V_TOP));
        this.panelButton.setVisible(false);
        this.panelButton.onClicked = (button) => {
            panel.isEnabled = true;
            panel.setVisible(true);
            button.setVisible(false);
            panel.openFrom();
        };
        GUI.addControl(this.panelButton._button);
        this.countSlider = new Slider(panel, "bubbles", 1, App.BUBBLE_MAX, this.bubbleCount, 1, 0, 8);
        this.countSlider.onValueChanged = (value) => {
            this.bubbleCount = value;
            console.log("bubble count=" + value);
            for (let i = 0; i < App.BUBBLE_MAX; i++) {
                this.bubbles[i].enabled = (i < value);
            }
        };
        this.speedSlider = new Slider(panel, "speed", App.SPEED_SLIDER_MIN, App.SPEED_SLIDER_MAX, 1, 0.1, 0, 44);
        this.speedSlider.onValueChanged = (value) => {
            Bubble.speedRatio = Math.pow(value, 2);
            console.log("speed ratio=" + Bubble.speedRatio);
            for (const bubble of this.bubbles) {
                bubble.setVelocity();
            }
        };
        this.saturationSlider = new Slider(panel, "saturation", 0, 1, 0, 0.05, 0, 80);
        this.saturationSlider.onValueChanged = (value) => {
            this.bubbleSat = value;
            for (const bubble of this.bubbles) {
                bubble.setHSVColor(bubble.hue, value, 1.0);
            }
        };
        this.glowSlider = new Slider(panel, "glow", App.GLOW_INTENSITY_MIN, App.GLOW_INTENSITY_MAX, App.GLOW_INTENSITY, 0.1, 0, 116);
        this.glowSlider.onValueChanged = (value) => {
            this.glowLayer.intensity = value;
            console.log("glow intensity=" + value);
        };
        this.bgColorSlider = new Slider(panel, "bghue", 0, 360, App.BACKGROUND_HUE, 15, 0, 152);
        this.bgColorSlider.onValueChanged = (value) => {
            this.updateBackgroudColor(value);
        };
        const speakerButton = new Button(panel, "speaker", 8, -4, GUI.H_LEFT | GUI.V_BOTTOM, 20);
        speakerButton.onClicked = (button) => {
            button.setSelected(!button.selected);
            this.setMute(button.selected);
        };
        speakerButton.setSelectedImage("mute");
        new Button(panel, "reset", -24, -4, GUI.H_CENTER | GUI.V_BOTTOM).onClicked = (button) => {
            this.resetValues();
            this.clearRipples();
        };
        this.clearButton = new Button(panel, "clear", 24, -4, GUI.H_CENTER | GUI.V_BOTTOM);
        this.clearButton.setDisabled(true);
        this.clearButton.onClicked = (button) => {
            this.clearRipples();
        };
        new Button(panel, "close", -8, -4, GUI.H_RIGHT | GUI.V_BOTTOM, 20).onClicked = (button) => {
            panel.closeTo(this.panelButton._button.centerX, this.panelButton._button.centerY, () => {
                panel.isEnabled = false;
                panel.setVisible(false);
                this.panelButton.setVisible(true);
            });
        };
    }
    ;
    updateBackgroudColor(hue) {
        console.log("background hue=" + hue);
        const color1 = BABYLON.Color3.FromHSV(hue, 1.0, 0.4);
        const color2 = BABYLON.Color3.FromHSV(hue, 1.0, 1.0);
        this.canvas._canvas.style.background = "linear-gradient(" + color1.toHexString() + "," + color2.toHexString() + ")";
    }
    resetValues() {
        this.countSlider.setValue(App.BUBBLE_COUNT);
        this.speedSlider.setValue(1);
        this.saturationSlider.setValue(0);
        this.glowSlider.setValue(App.GLOW_INTENSITY);
        this.bgColorSlider.setValue(App.BACKGROUND_HUE);
    }
    clearRipples() {
        for (const ripple of this.ripples) {
            ripple.enabled = false;
        }
    }
    update() {
        const tick = Date.now();
        for (const bubble of this.bubbles) {
            if (bubble.enabled) {
                this.updateBubble(bubble);
            }
            else if (bubble.vanishTime) {
                if (tick - bubble.vanishTime >= App.BUBBLE_REVIVE_WAIT) {
                    this.initBubble(bubble, false);
                    bubble.enabled = true;
                    bubble.vanishTime = 0;
                    console.log("revived bubble #" + bubble.id);
                }
            }
        }
        let rippleCount = 0;
        for (const ripple of this.ripples) {
            if (ripple.enabled) {
                ripple.update();
                if (ripple.enabled) {
                    rippleCount++;
                }
            }
        }
        this.clearButton.setDisabled(rippleCount == 0);
        this.collisionDetection();
    }
    initEvent() {
        this.onPointerDown = (x, y, event) => {
            if (!GUI.isPointOnPanels(x, y)) {
                this.createPointedRipple(x, y);
                const t = (y + this.canvas.maxY) / this.canvas.height;
                const chordIndex = Math.floor((x + this.canvas.maxX) / this.canvas.width * App.chordNames.length);
                console.log("chordIndex=" + chordIndex);
                const freq = this.calcFrequency(t, chordIndex);
                this.prevFreq = freq;
                this.playTone(freq);
            }
        };
        this.onPointerUp = (x, y, event) => { };
        this.onPointerDragged = (x, y, event) => {
            if (!GUI.isPointOnPanels(x, y)) {
                this.createPointedRipple(x, y);
                const t = (y + this.canvas.maxY) / this.canvas.height;
                const freq = this.calcFrequency(t);
                if (freq != this.prevFreq) {
                    this.prevFreq = freq;
                    this.playTone(freq);
                }
            }
        };
        super.registerEvents();
    }
    createPointedRipple(x, y) {
        const ripple = this.createRipple();
        ripple.setColor(BABYLON.Color3.White());
        ripple.setPosition(x, y);
        ripple.start(App.RIPPLE_GROW, App.RIPPLE_ELAPSE);
        return ripple;
    }
    createRipple() {
        let ripple;
        for (const ripple1 of this.ripples) {
            if (!ripple1.enabled) {
                ripple = ripple1;
                break;
            }
        }
        if (!ripple) {
            ripple = new Ripple("ripple");
            ripple.id = this.ripples.length;
            this.ripples.push(ripple);
            console.log("ripple count=" + this.ripples.length);
        }
        return ripple;
    }
    collisionDetection() {
        for (const bubble of this.bubbles) {
            if (!bubble.enabled)
                continue;
            for (const ripple of this.ripples) {
                if (!ripple.enabled)
                    continue;
                if (ripple.distance(bubble) < bubble.radius + ripple.radius * ripple.scale * 0.8) {
                    console.log("collision: bubble #" + bubble.id + " -> ripple #" + ripple.id);
                    this.burstBubble(bubble);
                    break;
                }
            }
            if (!bubble.enabled)
                continue;
        }
    }
    burstBubble(bubble) {
        bubble.enabled = false;
        bubble.vanishTime = Date.now();
        const ripple = this.createRipple();
        ripple.position = bubble.position;
        ripple.setColor(bubble.color);
        const grow = (bubble.radius * 1.5) / ripple.radius - 1;
        ripple.start(grow, App.RIPPLE_ELAPSE);
        console.log("*** burst! bubble #" + bubble.id + " to ripple #" + ripple.id);
        //		const t = 1.0 - (bubble.radius - App.RADIUS_MIN) / (App.RADIUS_MAX - App.RADIUS_MIN);
        const t = (bubble.position.y + this.canvas.maxY) / this.canvas.height;
        const freq = this.calcFrequency(t);
        this.playTone(freq);
    }
    calcFrequency(t, chordIndex = -1) {
        const FREQ_BASE = 110;
        const OCT_RANGE = 5;
        let note = Math.floor(t * (OCT_RANGE * 12));
        if (chordIndex >= 0) {
            this.rootNote = note;
            this.chordIndex = chordIndex;
            console.log("root node=" + note + ", chord=" + App.chordNames[chordIndex]);
        }
        else {
            const chord = App.chordTable[this.chordIndex];
            const diff = note - this.rootNote;
            if (diff >= 0) {
                const note_d = diff % 12;
                const index = Math.floor(note_d / chord.length);
                note = note - note_d + ((index == 0) ? 0 : chord[index - 1]);
            }
            else {
                const note_d = 11 - (-diff % 12);
                const index = Math.floor(note_d / chord.length);
                note = note - note_d - 1 + ((index == 0) ? 0 : chord[index - 1]);
            }
        }
        return FREQ_BASE * (2 ** (note / 12));
    }
    playTone(freq) {
        if (!this.isMute) {
            this.synth.triggerAttackRelease(freq, "8n");
        }
    }
    setMute(b) {
        this.isMute = b;
    }
}
App.BUBBLE_COUNT = 20;
App.BUBBLE_MAX = 100;
App.RADIUS_MIN = 2;
App.RADIUS_MAX = 50;
App.SPEED_SLIDER_MIN = 0;
App.SPEED_SLIDER_MAX = 5;
App.BUBBLE_REVIVE_WAIT = 1000;
App.DRAG_MARGIN = 16;
App.RIPPLE_ELAPSE = 1000;
App.RIPPLE_GROW = 20;
App.BACKGROUND_HUE = 240;
App.GLOW_INTENSITY = 0.8;
App.GLOW_INTENSITY_MIN = 0;
App.GLOW_INTENSITY_MAX = 2.0;
App.chordTable = [
    [3, 7, 10],
    [4, 7, 11],
    [4, 7, 9],
    [3, 7, 9], // Cm6
];
App.chordNames = ["Cm7", "CMaj7", "C6", "Cm6"];
new App();
//# sourceMappingURL=main.js.map