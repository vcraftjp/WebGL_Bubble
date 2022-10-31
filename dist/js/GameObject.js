"use strict";
class GameObject {
    constructor(mesh) {
        this.mesh = mesh;
    }
    get enabled() {
        return this.mesh.isEnabled();
    }
    set enabled(b) {
        this.mesh.setEnabled(b);
    }
    get position() {
        return this.mesh.position;
    }
    set position(position) {
        this.mesh.position = position;
    }
    setPosition(x, y, z) {
        this.mesh.position.x = x;
        this.mesh.position.y = y;
        if (z !== undefined) {
            this.mesh.position.z = z;
        }
    }
    setScale(scale) {
        this.mesh.scaling.x = scale;
        this.mesh.scaling.y = scale;
        this.mesh.scaling.z = scale;
    }
    setScale2D(scale) {
        this.mesh.scaling.x = scale;
        this.mesh.scaling.y = scale;
    }
    distance(target) {
        const dx = target.position.x - this.position.x;
        const dy = target.position.y - this.position.y;
        const dz = target.position.z - this.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    distance2D(target) {
        const dx = target.position.x - this.position.x;
        const dy = target.position.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
//# sourceMappingURL=GameObject.js.map