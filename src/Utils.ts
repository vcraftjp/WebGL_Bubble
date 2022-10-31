
class Utils {
	private static tick: number;
	private static frame: number;

	static startFPS(): void {
		Utils.tick = Date.now();
		Utils.frame = 0;
	}

	static getFPS(): number {
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

	static round(n: number): number {
		return Math.round(n * 10) / 10;
	}

	static distance(pt1: {x:number, y:number}, pt2: {x:number, y:number}): number {
		return Math.sqrt((pt2.x - pt1.x) * (pt2.x - pt1.x) + (pt2.y - pt1.y) * (pt2.y - pt1.y));
	}

	static dateString(date: Date): string { // yymmdd
		return String(date.getFullYear() - 2000) + Utils.toDigit2(date.getMonth() + 1) + Utils.toDigit2(date.getDate());
	}

	static toDigit2(n: number): string {
		return ("0" + String(n)).slice(-2);
	}
}

class Easing {
	static circularOut(t: number): number {
		return Math.sqrt(1 - Math.pow(t - 1, 2));
	}
}