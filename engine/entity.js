// Basic entity system: Entity base, Player and Bullet for a shmup prototype
(function(){
    // Base Entity constructor
    function Entity(x,y,w,h){
        this.x = x||0;
        this.y = y||0;
        this.width = w||32;
        this.height = h||32;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
    }

    Entity.prototype.update = function(dt){};

    Entity.prototype.draw = function(ctx){
        // Default placeholder drawing (can be replaced by sprites)
        ctx.fillStyle = '#f0f';
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    };

    Entity.prototype.intersects = function(other){
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    };

    // Player entity for a basic horizontal shmup
    function Player(x,y){
        Entity.call(this,x,y,32,32);
        this.speed = 260; // px/sec
        this.shootCooldown = 0.18; // seconds
        this.shootTimer = 0;
        this.color = '#0ff';
    }
    Player.prototype = Object.create(Entity.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.update = function(dt){
        var k = (window.game && window.game.keys) ? window.game.keys : {};
        var dx = 0, dy = 0;
        if(k.left) dx -= 1;
        if(k.right) dx += 1;
        if(k.up) dy -= 1;
        if(k.down) dy += 1;
        // normalize
        if(dx !== 0 || dy !== 0){
            var len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
        }
        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;
        // clamp to canvas
        if(window.game && window.game.canvas){
            var cw = window.game.canvas.width;
            var ch = window.game.canvas.height;
            this.x = Math.max(0, Math.min(cw - this.width, this.x));
            this.y = Math.max(0, Math.min(ch - this.height, this.y));
        }

        this.shootTimer -= dt;
        if((k.fire || k.space) && this.shootTimer <= 0){
            this.shoot();
            this.shootTimer = this.shootCooldown;
        }
    };

    Player.prototype.draw = function(ctx){
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    };

    Player.prototype.shoot = function(){
        if(!window.game) return;
        var bx = this.x + this.width;
        var by = this.y + this.height/2 - 4;
        var b = new Bullet(bx, by, 8, 8, 420);
        b.owner = 'player';
        window.game.entities.push(b);
    };

    // Bullet entity (simple forward-moving projectile)
    function Bullet(x,y,w,h,speed){
        Entity.call(this,x,y,w,h);
        this.vx = speed||400;
        this.color = '#ff0';
    }
    Bullet.prototype = Object.create(Entity.prototype);
    Bullet.prototype.constructor = Bullet;

    Bullet.prototype.update = function(dt){
        this.x += this.vx * dt;
        // deactivate if off-screen
        if(window.game && this.x > window.game.canvas.width + 50){
            this.active = false;
        }
    };

    Bullet.prototype.draw = function(ctx){
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    };

    // Expose to global namespace
    window.Entity = Entity;
    window.Player = Player;
    window.Bullet = Bullet;
})();
