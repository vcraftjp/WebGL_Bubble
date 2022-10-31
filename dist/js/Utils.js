"use strict";
class Utils {
    static startFPS() {
        Utils.tick = Date.now();
        Utils.frame = 0;
    }
    static getFPS() {
        const tick1 = Date.now();
        Utils.frame++;
        if (tick1 - this.tick < 1000) {
            return undefined;
        }
        Utils.tick = Date.now();
        const fps = Utils.frame;
        Utils.frame = 0;
        return fps;
    }
    static round(n) {
        return Math.round(n * 10) / 10;
    }
    static distance(pt1, pt2) {
        return Math.sqrt((pt2.x - pt1.x) * (pt2.x - pt1.x) + (pt2.y - pt1.y) * (pt2.y - pt1.y));
    }
    static dateString(date) {
        return String(date.getFullYear() - 2000) + Utils.toDigit2(date.getMonth() + 1) + Utils.toDigit2(date.getDate());
    }
    static toDigit2(n) {
        return ("0" + String(n)).slice(-2);
    }
}
class Easing {
    static circularOut(t) {
        return Math.sqrt(1 - Math.pow(t - 1, 2));
    }
}
//# sourceMappingURL=Utils.js.map