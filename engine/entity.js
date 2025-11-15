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

        if (window.game) { window.game.triggerShake(0.4, 10); }


        if(this.lives <= 0){
            if (typeof audioManager !== 'undefined') {
                audioManager.playSound("explosion"); 
            }
            if(window.game) {
                var centerX = this.x + this.width / 2;
                var centerY = this.y + this.height / 2;
                // La hacemos un poco más grande que una bala (ej. radio 50)
                var playerExplosion = new Explosion(centerX, centerY, 50, 0.5);
                window.game.entities.push(playerExplosion);
            }

            this.active = false;
            
            setTimeout(function() {
                try{
                    if(window.game){
                        if (typeof audioManager !== 'undefined') {
                            audioManager.stopAllMusic(); // Detiene la música del nivel
                            audioManager.playSound("gameOver"); // Reproduce el sonido de "Game Over"
                        }
                        window.game.ended = true;
                        if(typeof window.game.showEndingScreen === 'function'){
                            window.game.showEndingScreen('level-failure');
                        }
                    }
                } catch(e){}
            }, 2000); // 2000 milisegundos = 2 segundos
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

        // Enemy entity for wave spawns
        function Enemy(x, y, w, h, config){
            Entity.call(this, x, y, w || 24, h || 24);
            config = config || {};
            this.speed = (typeof config.speed === 'number') ? config.speed : 120; // moves left
            this.health = (typeof config.health === 'number') ? config.health : 1;
            this.maxHealth = this.health;
            this.color = config.color || '#f0a';
            this.scoreValue = (typeof config.score === 'number') ? config.score : 10;
            this.type = config.type || 'grunt';
            this.bobAmplitude = (typeof config.bobAmplitude === 'number') ? config.bobAmplitude : 0;
            this.bobFrequency = (typeof config.bobFrequency === 'number') ? config.bobFrequency : 0;
            this.phase = Math.random() * Math.PI * 2;
            this.baseY = this.y; // anchor for sin/zig movement

            // choose movement type if not provided: 'straight', 'sin', 'zig'
            this.movementType = config.movementType || (['straight','sin','zig'][Math.floor(Math.random()*3)]);
            // zig parameters
            this.zigPeriod = (config.zigPeriod) ? config.zigPeriod : (0.6 + Math.random()*0.9);
            // shooting configuration: some enemies can shoot randomly based on shootChance
            // ensure at least 80% of enemies can shoot
            var confChance = (typeof config.shootChance === 'number') ? config.shootChance : 0;
            var finalChance = Math.max(confChance, 0.8);
            this.canShoot = (Math.random() < finalChance);
            this.shootCooldown = (typeof config.shootCooldown === 'number') ? config.shootCooldown : (1.8 + Math.random()*1.2);
            this.shootTimer = Math.random() * this.shootCooldown;
            this.shootSpeedBase = (typeof config.shootSpeedBase === 'number') ? config.shootSpeedBase : 160;
            this.shootSpeedVar = (typeof config.shootSpeedVar === 'number') ? config.shootSpeedVar : 40;
            this.bulletColor = config.bulletColor || '#f8f';
        }
        Enemy.prototype = Object.create(Entity.prototype);
        Enemy.prototype.constructor = Enemy;

        Enemy.prototype.update = function(dt){
            // simple leftward movement
                // movement patterns
                if(this.movementType === 'straight'){
                    this.x -= this.speed * dt;
                } else if(this.movementType === 'sin'){
                    this.x -= this.speed * dt;
                    this.phase += dt * this.bobFrequency * Math.PI * 2;
                    this.y = this.baseY + Math.sin(this.phase) * this.bobAmplitude;
                } else if(this.movementType === 'zig'){
                    // zigzag: horizontal + periodic vertical offset
                    this.phase += dt * (1/this.zigPeriod) * Math.PI * 2;
                    this.y = this.baseY + Math.sin(this.phase) * this.bobAmplitude;
                    this.x -= this.speed * dt;
                } else {
                    // fallback
                    this.x -= this.speed * dt;
                }
                // enemy shooting
                if(this.canShoot && this.shootTimer !== undefined){
                    this.shootTimer -= dt;
                    if(this.shootTimer <= 0){
                        this.shootTimer = this.shootCooldown + Math.random() * 0.6;
                        // fire towards player if present
                        try{
                            if(window.game && window.game.player){
                                var cx = this.x + this.width/2;
                                var cy = this.y + this.height/2;
                                var px = window.game.player.x + window.game.player.width/2;
                                var py = window.game.player.y + window.game.player.height/2;
                                var ang = Math.atan2(py - cy, px - cx);
                                var baseS = (typeof this.shootSpeedBase === 'number') ? this.shootSpeedBase : 160;
                                var varS = (typeof this.shootSpeedVar === 'number') ? this.shootSpeedVar : 40;
                                var speed = baseS + (Math.random() - 0.5) * varS * 2;
                                var vx = Math.cos(ang) * speed;
                                var vy = Math.sin(ang) * speed;
                                var b = new Bullet(cx - 4, cy - 4, 8, 8, null, vx, vy);
                                b.owner = 'enemy';
                                b.color = this.bulletColor;
                                window.game.entities.push(b);
                            }
                        } catch(e){}
                    }
                }
            // deactivate if off-screen left
            if(window.game && window.game.canvas){
                if(this.x + this.width < -50){ this.active = false; }
                // clamp vertically
                this.y = Math.max(0, Math.min(window.game.canvas.height - this.height, this.y));
            }
        };

        Enemy.prototype.draw = function(ctx){
            ctx.fillStyle = this.color;
            ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
        };

        Enemy.prototype.takeDamage = function(amount){
            amount = amount || 1;
            this.health -= amount;
            if(this.health <= 0){
                this.active = false;
                // spawn small explosion
                try{
                    if(window.game){
                        var ex = new Explosion(this.x + this.width/2, this.y + this.height/2, 30, 0.4);
                        window.game.entities.push(ex);
                        // increase score
                        window.game.score = (window.game.score || 0) + (this.scoreValue || 0);
                        $('#score').html('Score: '+window.game.score);
                        if (typeof audioManager !== 'undefined') audioManager.playSound('explosion');
                    }
                } catch(e){}
            }
        };

    // Boss entity (larger enemy, sized proportionally to the player)
    function Boss(x, y, player, scale, config){
        // config: optional object to customize boss behaviour (health, speed, shootCount, shootSpread, color)
        config = config || {};
        // If a player instance is provided, size relative to it
        var s = (typeof scale === 'number' && scale > 0) ? scale : (config.scale || 2);
        if(player && player.width && player.height){
            var w = Math.max(24, Math.round(player.width * s));
            var h = Math.max(24, Math.round(player.height * s));
            Entity.call(this, x, y, w, h);
        } else {
            Entity.call(this, x, y, config.width || 96, config.height || 96);
        }
        this.color = config.color || '#f33';
        this.maxHealth = (typeof config.health === 'number') ? config.health : 100;
        this.health = this.maxHealth;
        this.speed = (typeof config.speed === 'number') ? config.speed : 60; // basic movement speed
        this.direction = -1; // initial horizontal direction
        this.hitFlash = 0; // frames to flash when hit

        // Shooting parameters
        this.shootCooldown = (typeof config.shootCooldown === 'number') ? config.shootCooldown : 1.6;
        this.shootCount = (typeof config.shootCount === 'number') ? config.shootCount : 5;
        this.shootSpread = (typeof config.shootSpread === 'number') ? config.shootSpread : Math.PI * 0.25;
        this.bulletColor = config.bulletColor || '#f80';
        // Bullet speed configuration: base speed and variance (used in shootPattern)
        this.bulletSpeedBase = (typeof config.bulletSpeedBase === 'number') ? config.bulletSpeedBase : 180;
        this.bulletSpeedVar = (typeof config.bulletSpeedVar === 'number') ? config.bulletSpeedVar : 60;
        // Bobbing (vertical/horizontal) configuration to make bosses move in larger ranges
        this.bobAmplitude = (typeof config.bobAmplitude === 'number') ? config.bobAmplitude : Math.max(6, Math.round(this.height * 0.08));
        this.bobFrequency = (typeof config.bobFrequency === 'number') ? config.bobFrequency : 1.0;
        this.bobHorizontalAmplitude = (typeof config.bobHorizontalAmplitude === 'number') ? config.bobHorizontalAmplitude : 0;
        this.bobHorizontalFrequency = (typeof config.bobHorizontalFrequency === 'number') ? config.bobHorizontalFrequency : 0;
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

            // vertical patrol moves the anchor up/down and bounces
            this.anchorY += this.vy * dt;
            if(this.anchorY <= 0){ this.anchorY = 0; this.vy = Math.abs(this.vy); }
            if(this.anchorY + this.height >= window.game.canvas.height){ this.anchorY = Math.max(0, window.game.canvas.height - this.height); this.vy = -Math.abs(this.vy); }

            // bobbing animation around the anchorY (vertical)
            this.bobPhase += dt * this.bobFrequency * Math.PI * 2;
            var bobOffsetY = Math.sin(this.bobPhase) * this.bobAmplitude;
            this.y = this.anchorY + bobOffsetY;
            // horizontal bobbing (offset from anchored right side)
            var bobOffsetX = 0;
            if(this.bobHorizontalAmplitude && this.bobHorizontalFrequency){
                // use a separate phase offset so horizontal motion is not locked to vertical
                if(typeof this.bobHPhase === 'undefined') this.bobHPhase = Math.random() * Math.PI * 2;
                this.bobHPhase += dt * this.bobHorizontalFrequency * Math.PI * 2;
                bobOffsetX = Math.sin(this.bobHPhase) * this.bobHorizontalAmplitude;
            }
            // clamp final y just in case
            this.y = Math.max(0, Math.min(window.game.canvas.height - this.height, this.y));
            // anchor the boss to the right side, then apply horizontal bob offset
            var targetX = Math.max(0, window.game.canvas.width - this.width - 20);
            this.x = targetX + bobOffsetX;
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

        // Fire a spread of bullets aimed at player using configured parameters
        var count = this.shootCount || 5;
        var spread = this.shootSpread || Math.PI * 0.25;
        for(var i=0;i<count;i++){
            var t = (count === 1) ? 0.5 : i / (count - 1);
            var angle = baseAngle - spread/2 + t * spread;
            var base = (typeof this.bulletSpeedBase === 'number') ? this.bulletSpeedBase : 180;
            var variance = (typeof this.bulletSpeedVar === 'number') ? this.bulletSpeedVar : 60;
            var speed = base + (Math.random() - 0.5) * variance * 2; // centered variation around base
            var vx = Math.cos(angle) * speed;
            var vy = Math.sin(angle) * speed;
            var b = new Bullet(cx - 4, cy - 4, 8, 8, null, vx, vy);
            b.owner = 'boss';
            b.color = this.bulletColor || '#f80';
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
        // No hacer nada si el jefe ya está muerto
        if (this.health <= 0) return;

        this.health -= amount || 1;
        this.hitFlash = 0.8; // flash por un corto tiempo
        
        // Comprobar si ESTE golpe fue el que lo mató
        if(this.health <= 0){ 
            // --- ¡COMIENZA LA SECUENCIA DE MUERTE! ---
            this.active = false; // Oculta al jefe (el cuadrado rojo)

            if (window.game) {
                // 1. Vibra MUCHO (0.8 segundos, 15 píxeles de fuerza)
                window.game.triggerShake(1, 20);

                // 2. Sonido de explosión
                if (typeof audioManager !== 'undefined') {
                    audioManager.playSound("explosion"); 
                }

                // 3. Animación de explosión (GRANDE)
                var centerX = this.x + this.width / 2;
                var centerY = this.y + this.height / 2;
                // (Radio 150, Duración 1.5 segundos)
                var bossExplosion = new Explosion(centerX, centerY, 300, 1.5);
                window.game.entities.push(bossExplosion);

                // 4. Mostrar pantalla de Nivel Superado (después de 2 segundos)
                setTimeout(function() {
                    try {
                        if (window.game && typeof audioManager !== 'undefined') {
                            audioManager.stopAllMusic(); // Detiene la música del nivel
                            audioManager.playSound("youWin");
                        }
                        window.game.ended = true;
                        if(typeof window.game.showEndingScreen === 'function'){
                            window.game.showEndingScreen('level-success');
                        }
                    } catch(e) {}
                }, 2000); // 2 segundos
            }
        }
    };

    // ==========================================================
    //              CLASE DE EXPLOSIÓN
    // ==========================================================
    /**
     * Una entidad temporal que dibuja un círculo que se expande y se desvanece.
     * @param {number} x - Posición central X
     * @param {number} y - Posición central Y
     * @param {number} [maxRadius] - Radio máximo que alcanzará
     * @param {number} [duration] - Duración en segundos
     */
    function Explosion(x, y, maxRadius, duration){
        // Llama al constructor base (tamaño no importa, solo posición)
        Entity.call(this, x, y, 0, 0);
        
        this.maxRadius = maxRadius || 40; // Radio final (en píxeles)
        this.duration = duration || 0.4; // Duración (en segundos)
        this.timer = 0; // Temporizador interno
        this.active = true;
    }
    Explosion.prototype = Object.create(Entity.prototype);
    Explosion.prototype.constructor = Explosion;

    Explosion.prototype.update = function(dt){
        this.timer += dt;
        if(this.timer >= this.duration){
            this.active = false; // Se destruye al terminar
        }
    };

    Explosion.prototype.draw = function(ctx){
        // Calcula el progreso (de 0 a 1)
        var progress = this.timer / this.duration;
        
        // El radio se expande con el tiempo
        var currentRadius = this.maxRadius * progress;
        
        // La opacidad se desvanece (de 1 a 0)
        var alpha = 1 - progress;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2, false);
        
        // Color blanco-amarillo brillante que se desvanece
        ctx.fillStyle = "rgba(255, 255, 200, " + alpha + ")"; 
        ctx.fill();
    };

    // Expose to global namespace
    window.Entity = Entity;
    window.Player = Player;
    window.Bullet = Bullet;
    window.Boss = Boss;
    window.Enemy = Enemy;
    window.Explosion = Explosion; // <-- AÑADE ESTA LÍNEA
})();
