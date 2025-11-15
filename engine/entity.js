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
        this.lives = 3; // player starts with 3 lives
        this.invulTimer = 0; // seconds of invulnerability after hit
        this.invulDuration = 1.0; // 1 second
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

        // invulnerability timer
        if(this.invulTimer > 0){
            this.invulTimer = Math.max(0, this.invulTimer - dt);
        }
    };

    Player.prototype.draw = function(ctx){
        // flash while invulnerable
        if(this.invulTimer > 0){ ctx.fillStyle = '#fff'; }
        else { ctx.fillStyle = this.color; }
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    };

    Player.prototype.takeDamage = function(amount){
        if(this.invulTimer > 0) return; // already recently hit
        this.lives = Math.max(0, this.lives - (amount || 1));
        this.invulTimer = this.invulDuration;
        // death handling
        if(this.lives <= 0){
            this.active = false;
            try{
                if(window.game){
                    window.game.ended = true;
                    if(typeof window.game.showEndingScreen === 'function'){
                        window.game.showEndingScreen('level-failure');
                    }
                }
            } catch(e){}
        }
    };

    // En entity.js

    Player.prototype.shoot = function(){
        if(!window.game) return;
        var bx = this.x + this.width;
        var by = this.y + this.height/2 - 4;
        var b = new Bullet(bx, by, 8, 8, 420);
        b.owner = 'player';
        window.game.entities.push(b);

        // --- AÑADIR ESTA LÍNEA ---
        // (Asegúrate de que 'fire' esté en minúscula)
        if (typeof audioManager !== 'undefined') {
            audioManager.playSound("fire");
        }
    };

    // Bullet entity (supports vx, vy or legacy speed for horizontal bullets)
    function Bullet(x,y,w,h,speed,vx,vy){
        Entity.call(this,x,y,w,h);
        if(typeof vx === 'number' || typeof vy === 'number'){
            this.vx = vx||0;
            this.vy = vy||0;
        } else {
            this.vx = speed||400;
            this.vy = 0;
        }
        this.color = '#ff0';
    }
    Bullet.prototype = Object.create(Entity.prototype);
    Bullet.prototype.constructor = Bullet;

    Bullet.prototype.update = function(dt){
        this.x += this.vx * dt;
        this.y += (this.vy||0) * dt;
        // deactivate if off-screen (with margin)
        if(window.game && window.game.canvas){
            var M = 50;
            if(this.x < -M || this.x > window.game.canvas.width + M || this.y < -M || this.y > window.game.canvas.height + M){
                this.active = false;
            }
        }
    };

    Bullet.prototype.draw = function(ctx){
        ctx.fillStyle = this.color;
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    };

    // Boss entity (larger enemy, sized proportionally to the player)
    function Boss(x, y, player, scale){
        // If a player instance is provided, size relative to it
        var s = (typeof scale === 'number' && scale > 0) ? scale : 2;
        if(player && player.width && player.height){
            var w = Math.max(24, Math.round(player.width * s));
            var h = Math.max(24, Math.round(player.height * s));
            Entity.call(this, x, y, w, h);
        } else {
            Entity.call(this, x, y, 96, 96);
        }
        this.color = '#f33';
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.speed = 60; // basic movement speed
        this.direction = -1; // initial horizontal direction
        this.hitFlash = 0; // frames to flash when hit
    }
    Boss.prototype = Object.create(Entity.prototype);
    Boss.prototype.constructor = Boss;

    Boss.prototype.update = function(dt){
        // Keep boss anchored to the right and move vertically (Phalanx-like)
        if(window.game && window.game.canvas){
            // lock to the right side with a small margin
            var targetX = Math.max(0, window.game.canvas.width - this.width - 20);
            // snap to anchored X (instant)
            this.x = targetX;

            // initialize vertical movement state once
            if(typeof this.vy === 'undefined'){
                this.vy = this.speed * (Math.random() > 0.5 ? 1 : -1);
            }
            if(typeof this.anchorY === 'undefined'){
                this.anchorY = this.y; // central anchor that patrols
            }
            if(typeof this.bobPhase === 'undefined'){
                this.bobPhase = Math.random() * Math.PI * 2;
            }
            if(typeof this.bobAmplitude === 'undefined'){
                // small bob relative to height
                this.bobAmplitude = Math.max(6, Math.round(this.height * 0.08));
            }
            if(typeof this.bobFrequency === 'undefined'){
                this.bobFrequency = 1.0; // cycles per second
            }

            // vertical patrol moves the anchor up/down and bounces
            this.anchorY += this.vy * dt;
            if(this.anchorY <= 0){ this.anchorY = 0; this.vy = Math.abs(this.vy); }
            if(this.anchorY + this.height >= window.game.canvas.height){ this.anchorY = Math.max(0, window.game.canvas.height - this.height); this.vy = -Math.abs(this.vy); }

            // bobbing animation around the anchorY
            this.bobPhase += dt * this.bobFrequency * Math.PI * 2;
            var bobOffset = Math.sin(this.bobPhase) * this.bobAmplitude;
            this.y = this.anchorY + bobOffset;
            // clamp final y just in case
            this.y = Math.max(0, Math.min(window.game.canvas.height - this.height, this.y));
        }

        if(this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt*8);

        if(this.health <= 0){
            this.active = false; // boss defeated
        }
        // Shooting logic
        if(!this.shootCooldown) this.shootCooldown = 1.6; // seconds between volleys
        if(!this.shootTimer) this.shootTimer = Math.random() * this.shootCooldown;
        this.shootTimer -= dt;
        if(this.shootTimer <= 0){
            this.shootTimer = this.shootCooldown + Math.random()*0.8;
            this.shootPattern();
        }
    };

    Boss.prototype.shootPattern = function(){
        if(!window.game || !window.game.player) return;
        // center of boss
        var cx = this.x + this.width/2;
        var cy = this.y + this.height/2;
        var px = window.game.player.x + window.game.player.width/2;
        var py = window.game.player.y + window.game.player.height/2;
        var baseAngle = Math.atan2(py - cy, px - cx);

        // Fire a spread of bullets aimed at player
        var count = 5;
        var spread = Math.PI * 0.25; // 45 degrees total
        for(var i=0;i<count;i++){
            var t = (count === 1) ? 0.5 : i / (count - 1);
            var angle = baseAngle - spread/2 + t * spread;
            var speed = 220 + Math.random()*60;
            var vx = Math.cos(angle) * speed;
            var vy = Math.sin(angle) * speed;
            var b = new Bullet(cx - 4, cy - 4, 8, 8, null, vx, vy);
            b.owner = 'boss';
            b.color = '#f80';
            window.game.entities.push(b);
        }
    };

    Boss.prototype.draw = function(ctx){
        // flash when hit
        if(this.hitFlash > 0){ ctx.fillStyle = '#fff'; }
        else { ctx.fillStyle = this.color; }
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);

        // Draw health bar above boss
        var bw = this.width;
        var bx = Math.round(this.x);
        var by = Math.round(this.y) - 10;
        var pad = 2;
        ctx.fillStyle = '#222';
        ctx.fillRect(bx - pad, by - pad, bw + pad*2, 8 + pad*2);
        var hpRatio = Math.max(0, Math.min(1, this.health / this.maxHealth));
        ctx.fillStyle = '#f55';
        ctx.fillRect(bx, by, Math.round(bw * hpRatio), 8);
    };

    Boss.prototype.takeDamage = function(amount){
        this.health -= amount || 1;
        this.hitFlash = 0.8; // flash for a short time
        if(this.health <= 0){ this.active = false; }
    };

    // Expose to global namespace
    window.Entity = Entity;
    window.Player = Player;
    window.Bullet = Bullet;
    window.Boss = Boss;
})();
