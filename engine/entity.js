// engine/entity.js

// Definición de la clase base Entity
class Entity {
    constructor(x, y, width, height) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.dead = false;
    }

    // Método que actualiza la lógica del objeto (posición, estado)
    update(dt) {
        // Lógica de movimiento, gravedad, o IA para el objeto
    }

    // Método que dibuja el objeto en el canvas
    render(ctx) {
        // Por defecto, dibuja un rectángulo simple para depuración
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}