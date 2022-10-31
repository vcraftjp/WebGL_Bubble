

class GameObject {
	mesh: BABYLON.Mesh;
	id: number;

	constructor(mesh: BABYLON.Mesh) {
		this.mesh = mesh;
	}

	get enabled(): boolean {
		return this.mesh.isEnabled();
	}

	set enabled(b: boolean) {
		this.mesh.setEnabled(b);
	}

	get position(): BABYLON.Vector3 {
		return this.mesh.position;
	}

	set position(position: BABYLON.Vector3) {
		this.mesh.position = position;
	}

	setPosition(x: number, y: number, z?: number): void {
		this.mesh.position.x = x;
		this.mesh.position.y = y;
		if (z !== undefined) {
			this.mesh.position.z = z;
		}
	}

	setScale(scale: number): void {
		this.mesh.scaling.x = scale;
		this.mesh.scaling.y = scale;
		this.mesh.scaling.z = scale;
	}

	setScale2D(scale: number): void {
		this.mesh.scaling.x = scale;
		this.mesh.scaling.y = scale;
	}

	distance(target: GameObject): number {
		const dx = target.position.x - this.position.x;
		const dy = target.position.y - this.position.y;
		const dz = target.position.z - this.position.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	distance2D(target: GameObject): number {
		const dx = target.position.x - this.position.x;
		const dy = target.position.y - this.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

}