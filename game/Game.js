var game = {
    // Variable para rastrear el nivel/oleada actual (comenzamos en el índice 0)
    currentLevelNumber: 0, 

    // --- Variables de la Cuadrícula ---
    backgroundOffset: 0,     // Posición actual del scroll de la cuadrícula
    backgroundSpeed: -50,     // Velocidad de scroll (píxeles por segundo)
    gridSize: 30,            // Tamaño de cada cuadrado de la cuadrícula
    gridColor: "rgba(102, 249, 51, 0.2)", // Verde neón con transparencia
    // --- Fin de Variables ---
// --- AÑADIR ESTAS LÍNEAS (Variables de Vibración) ---
    shakeDuration: 0,
    shakeMagnitude: 0,
    shakeX: 0,
    shakeY: 0,
    rsgState: "", // Estado actual: "Ready", "Set", "Go!"
    rsgTimer: 0,  // Temporizador para cada estado
    // Boss spawn countdown (seconds)
    bossCountdownRemaining: 0,
    bossCountdownActive: false,
    bossToSpawn: null,

    init: function(){
        levels.init();
        loader.init();
        mouse.init();
        audioManager.init();
    
        window.addEventListener('mousedown', audioManager.setupFirstPlayBound, false);
        window.addEventListener('mouseup', audioManager.setupFirstPlayBound, false);

        // BINDING DE MÉTODOS DE AUDIO
        audioManager.playLobbyMusic = audioManager.playLobbyMusic.bind(audioManager);
        audioManager.playGameMusic = audioManager.playGameMusic.bind(audioManager);
        audioManager.toggleMusic = audioManager.toggleMusic.bind(audioManager);
        
        // Asignación de eventos del menú HTML (botones)
        game.setupMenuEvents(); // <-- Esto asigna los clics
            
        // Oculta todas las capas y muestra la pantalla de inicio
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
        
        //Get handler for game canvas and context
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
        // Entities list for gameplay (Player, Enemies, Bullets...)
        game.entities = [];
        game.keys = {};

        // Keyboard handlers
        var keyDownHandler = function(e){
            e = e || window.event;
            var kc = e.which || e.keyCode;
            if(kc === 37 || kc === 65) { game.keys.left = true; if(e.preventDefault && kc === 37) e.preventDefault(); }
            if(kc === 39 || kc === 68) { game.keys.right = true; if(e.preventDefault && kc === 39) e.preventDefault(); }
            if(kc === 38 || kc === 87) { game.keys.up = true; if(e.preventDefault && kc === 38) e.preventDefault(); }
            if(kc === 40 || kc === 83) { game.keys.down = true; if(e.preventDefault && kc === 40) e.preventDefault(); }
            if(kc === 32) { game.keys.space = true; if(e.preventDefault) e.preventDefault(); } // Space
            if(kc === 90) { game.keys.fire = true; } // Z
        };

        var keyUpHandler = function(e){
            e = e || window.event;
            var kc = e.which || e.keyCode;
            if(kc === 37 || kc === 65) { game.keys.left = false; }
            if(kc === 39 || kc === 68) { game.keys.right = false; }
            if(kc === 38 || kc === 87) { game.keys.up = false; }
            if(kc === 40 || kc === 83) { game.keys.down = false; }
            if(kc === 32) { game.keys.space = false; }
            if(kc === 90) { game.keys.fire = false; }
        };

        // Attach handlers
        if (typeof $ === 'function' && $.fn && $.fn.bind) {
            $(window).bind('keydown.gamekeys', keyDownHandler);
            $(window).bind('keyup.gamekeys', keyUpHandler);
        } else if (typeof window.addEventListener === 'function') {
            window.addEventListener('keydown', keyDownHandler, false);
            window.addEventListener('keyup', keyUpHandler, false);
        }
        $('#playcurrentlevel').click(function() {
            $('#endingscreen').hide(); // Oculta la pantalla final
            // Vuelve a cargar el nivel actual (el número ya está en game.currentLevelNumber)
            levels.load(game.currentLevelNumber); 
        });

        // Botón: PLAY NEXT LEVEL
        $('#playnextlevel').click(function() {
            $('#endingscreen').hide(); // Oculta la pantalla final
            // Carga el siguiente nivel
            levels.load(game.currentLevelNumber + 1); 
        });

        // Botón: RETURN TO LEVEL SCREEN
        $('#showLevelScreen').click(function() {
            $('#endingscreen').hide(); // Oculta la pantalla final
            game.showLevelScreen(); // Muestra el selector de niveles
        });
    },  
       
    
    setupMenuEvents: function() {
        $('#start-button').click(function() {
            game.showLevelScreen();
        });
        
        // Añadimos los otros botones que estaban en el bloque duplicado
        $('#highscores-button').click(function() {
            console.log("Botón de Puntuaciones presionado");
        });

        $('#settings-button').click(function() {
            console.log("Botón de Ajustes presionado");
        });
    }, 
    
    showLevelScreen:function(){
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
        if (typeof audioManager !== 'undefined') {
            audioManager.stopAllMusic();
            audioManager.playLobbyMusic();
        }
    },
    
    // Game Mode
    mode:"intro", 
    // Set to true to spawn a boss immediately when the level starts
    spawnBossImmediately: true,
    
    start:function(){
        game.entities = [];
        $('.gamelayer').hide();
        // Display the game canvas and score 
        $('#gamecanvas').show();
        $('#scorescreen').show();
        // --- MODIFICADO ---
        // En lugar de 'running', empezamos en 'ready'
        game.mode = "ready"; 
        game.rsgState = "Ready";
        game.rsgTimer = 1.0; // 1 segundo para "Ready"
        // --- FIN DE MODIFICACIÓN ---

        audioManager.playGameMusic();
        
        
        game.ended = false;
        // Prepare timing for dt
        game.lastTime = performance.now();

        // Create player entity (center-left)
        try{
            var px = 40;
            var py = Math.round(game.canvas.height/2 - 16);
            game.player = new Player(px, py); // <-- Asume que Player está en entity.js
            game.entities.push(game.player);
            // Clear any previous scheduled spawn or wave timers / countdowns
            if(game.bossSpawnTimer){ clearTimeout(game.bossSpawnTimer); game.bossSpawnTimer = null; }
            if(game.waveSpawnIntervalId){ clearInterval(game.waveSpawnIntervalId); game.waveSpawnIntervalId = null; }
            game.waves = null; game.waveIndex = 0; game.waveSpawning = false; game.waitingForWaveClear = false;
            // reset boss countdown state
            game.bossCountdownActive = false;
            game.bossCountdownRemaining = 0;
            game.bossToSpawn = null;
            game.pendingBoss = false;

            var lvl = (typeof levels !== 'undefined' && levels.data && levels.data[game.currentLevelNumber]) ? levels.data[game.currentLevelNumber] : null;
            var bossCfg = (lvl && lvl.boss) ? lvl.boss : null;
            // If the level defines wave entities, start the wave system and spawn boss after waves
            if(game.spawnBossImmediately && lvl && Array.isArray(lvl.entities) && lvl.entities.length > 0){
                game.startWaves(lvl.entities, bossCfg);
            } else if(game.spawnBossImmediately) {
                // No waves defined: spawn boss directly (respect spawnDelay if provided)
                var scale = (bossCfg && bossCfg.scale) ? bossCfg.scale : 3;
                var bx = Math.max(0, game.canvas.width - Math.round(game.player.width * scale) - 20);
                var by = Math.round(game.canvas.height/2 - (game.player.height * scale)/2);
                if(bossCfg && typeof bossCfg.spawnDelay === 'number' && bossCfg.spawnDelay > 0){
                    // schedule via countdown (so we can show warning)
                    game.pendingBoss = true;
                    game.bossCountdownRemaining = bossCfg.spawnDelay;
                    game.bossCountdownActive = true;
                    game.bossToSpawn = { bx: bx, by: by, scale: scale, cfg: bossCfg };
                } else {
                    var boss = new Boss(bx, by, game.player, scale, bossCfg || {});
                    game.entities.push(boss);
                }
            }
        } catch(e){
            console.warn('Player class not available:', e);
        }
        

        game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
    },     
	
    score:0,

    showEndingScreen:function(mode){
        // (Tu función showEndingScreen se mantiene igual)
        if (mode=="level-success"){
            if(game.currentLevel.number<levels.data.length-1){
                $('#endingmessage').html('Level Completed!');
                $("#playnextlevel").show();
            } else {
                $('#endingmessage').html('YOU WIN!');
                $("#playnextlevel").hide();
            }
        } else if (mode=="level-failure"){        
            $('#endingmessage').html('You Failed');
            $("#playnextlevel").hide();
        }        
        
        $('#endingscreen').show();
    },

    // --- AÑADIR ESTA FUNCIÓN ---
    /**
     * Activa el efecto de vibración de pantalla.
     * @param {number} duration - Duración en segundos (ej. 0.2)
     * @param {number} magnitude - Fuerza en píxeles (ej. 4)
     */
    triggerShake: function(duration, magnitude) {
        // No dejes que un shake más débil reemplace uno más fuerte
        game.shakeDuration = Math.max(game.shakeDuration, duration);
        game.shakeMagnitude = Math.max(game.shakeMagnitude, magnitude);
    },
    updateReadySetGo: function(dt) {
        if (game.mode !== "ready") return;
        game.rsgTimer -= dt; // Descontar tiempo

        if (dt === 0) return; 
        game.rsgTimer -= dt; // Descontar tiempo

        if (game.rsgTimer <= 0) {
            // Si el tiempo se acabó, cambia al siguiente estado
            if (game.rsgState === "Ready") {
                game.rsgState = "Set";
                game.rsgTimer = 1.0; // 1 segundo para "Set"
            } else if (game.rsgState === "Set") {
                game.rsgState = "Go!";
                game.rsgTimer = 0.5; // 0.5 segundos para "Go!"
            } else if (game.rsgState === "Go!") {
                // Se acabó
                game.rsgState = "";
                game.mode = "running"; // ¡INICIA EL JUEGO!
            }
        }
    },

    drawReadySetGo: function(ctx) {
        // Si no hay texto que mostrar, salir
        if (game.rsgState === "") return;

        var canvasWidth = game.canvas.width;
        var canvasHeight = game.canvas.height;
        
        // Estilo del texto
        ctx.font = "bold 50px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Opacidad aleatoria para efecto "glitch"
        var alpha = 0.8 + Math.random() * 0.2;
        
        // Sombra/Borde negro
        ctx.fillStyle = "rgba(0, 0, 0, " + (alpha * 0.5) + ")";
        ctx.fillText(game.rsgState, canvasWidth / 2 + 3, canvasHeight / 2 + 3);
        
        // Texto principal (Blanco brillante)
        ctx.fillStyle = "rgba(255, 255, 255, " + alpha + ")";
        ctx.fillText(game.rsgState, canvasWidth / 2, canvasHeight / 2);
    },
    // --- FIN DE FUNCIONES AÑADIDAS ---
    // ---------------------
    // Wave / Spawner system
    // ---------------------
    startWaves: function(waves, bossCfg){
        if(!Array.isArray(waves) || waves.length === 0) return;
        // clear any existing
        if(game.waveSpawnIntervalId){ clearInterval(game.waveSpawnIntervalId); game.waveSpawnIntervalId = null; }
        game.waves = waves;
        game.waveIndex = 0;
        game.waveSpawning = false;
        game.waitingForWaveClear = false;
        game.bossCfgForLevel = bossCfg || null;
        // start first wave after short delay so player is ready
        setTimeout(function(){ game._startNextWave(); }, 500);
    },

    _startNextWave: function(){
        if(!game.waves) return;
        if(game.waveIndex >= game.waves.length){
            // all waves spawned; now wait for remaining enemies to be cleared
            game.waitingForWaveClear = true;
            return;
        }
        var wave = game.waves[game.waveIndex];
        var count = wave.count || 1;
        var spawned = 0;
        game.waveSpawning = true;
        game.pendingSpawns = count;
        var spawnFn = function(){
            if(game.ended) return;
            if(spawned >= count){
                // finished spawning this wave
                clearInterval(game.waveSpawnIntervalId);
                game.waveSpawnIntervalId = null;
                game.waveSpawning = false;
                game.waitingForWaveClear = true; // wait until enemies are cleared before next wave
                game.waveIndex++;
                return;
            }
            game._spawnEnemy(wave);
            spawned++;
            game.pendingSpawns = Math.max(0, count - spawned);
        };
        var interval = Math.max(50, wave.spawnInterval || 800);
        // spawn first immediately
        spawnFn();
        game.waveSpawnIntervalId = setInterval(spawnFn, interval);
    },

    _spawnEnemy: function(wave){
        try{
            var y = (typeof wave.yMin === 'number' && typeof wave.yMax === 'number') ? Math.round(wave.yMin + Math.random() * (wave.yMax - wave.yMin)) : Math.round(Math.random() * (game.canvas.height - 40));
            var x = game.canvas.width + 40;
            var cfg = {
                speed: wave.speed || 120,
                health: wave.health || 1,
                score: wave.score || 10,
                type: wave.type || 'grunt',
                color: wave.color || '#f0a',
                bobAmplitude: wave.bobAmplitude || 0,
                bobFrequency: wave.bobFrequency || 0
            };
            var e = new Enemy(x, y, 28, 28, cfg);
            game.entities.push(e);
        } catch(e){}
    },

    _onWavesComplete: function(){
        // called after all waves have been spawned and cleared
        var bossCfg = game.bossCfgForLevel || null;
        if(!game.spawnBossImmediately) return;
        var scale = (bossCfg && bossCfg.scale) ? bossCfg.scale : 3;
        var bx = Math.max(0, game.canvas.width - Math.round(game.player.width * scale) - 20);
        var by = Math.round(game.canvas.height/2 - (game.player.height * scale)/2);
        if(bossCfg && typeof bossCfg.spawnDelay === 'number' && bossCfg.spawnDelay > 0){
            // schedule boss spawn via countdown so warning can be shown
            game.pendingBoss = true;
            game.bossCountdownRemaining = bossCfg.spawnDelay;
            game.bossCountdownActive = true;
            game.bossToSpawn = { bx: bx, by: by, scale: scale, cfg: bossCfg };
        } else {
            var boss = new Boss(bx, by, game.player, scale, bossCfg || {});
            game.entities.push(boss);
        }
    },
    animate:function(){
        // Compute delta time
        var now = performance.now();
        var dt = (game.lastTime) ? (now - game.lastTime) / 1000 : 0;
        game.lastTime = now;
        game.updateReadySetGo(dt);

        // vibración de pantalla
        if (game.shakeDuration > 0) {
            game.shakeDuration -= dt; // Reducir la duración
            if (game.shakeDuration <= 0) {
                // Si se acabó, resetear
                game.shakeX = 0;
                game.shakeY = 0;
                game.shakeMagnitude = 0;
            } else {
                // Calcular un offset aleatorio
                game.shakeX = Math.round((Math.random() - 0.5) * 2 * game.shakeMagnitude);
                game.shakeY = Math.round((Math.random() - 0.5) * 2 * game.shakeMagnitude);
            }
        }
        // --- AÑADIDO: APLICAR VIBRACIÓN (Traducción del Canvas) ---
        // Guarda el estado "limpio" del canvas (sin offset)
        game.context.save();
        // Mueve todo el canvas por el offset de la vibración
        game.context.translate(game.shakeX, game.shakeY);
        // --- FIN DE APLICAR VIBRACIÓN ---



        // --- LÓGICA DE DIBUJADO DE CUADRÍCULA ---

        // 1. Actualizar el desplazamiento de la cuadrícula
        game.backgroundOffset = (game.backgroundOffset + game.backgroundSpeed * dt) % game.gridSize;

        // 2. Dibujar el fondo negro sólido
        game.context.fillStyle = "#000000";
        game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);

        // 3. Dibujar la cuadrícula
       	var randomAlpha = 0.1 + Math.random() * 0.2; 
        game.context.strokeStyle = "rgba(102, 249, 51, " + randomAlpha + ")";
        
        game.context.lineWidth = 1;
        game.context.beginPath();
        // Líneas Verticales (las que se mueven)
      for (var x = game.backgroundOffset; x < game.canvas.width; x += game.gridSize) {
            game.context.moveTo(x, 0);
            game.context.lineTo(x, game.canvas.height);
        }

        // Líneas Horizontales (estáticas)
      for (var y = 0; y < game.canvas.height; y += game.gridSize) {
            game.context.moveTo(0, y);
            game.context.lineTo(game.canvas.width, y);
        }
        game.context.stroke(); // Dibuja todas las líneas
        // HUD: draw player lives
        try{
            if(game.player){
                var lives = (typeof game.player.lives === 'number') ? game.player.lives : 0;
                var px = 12, py = 8;
                game.context.font = '14px monospace';
                game.context.textAlign = 'left';
                game.context.fillStyle = '#fff';
                game.context.fillText('Lives:', px, py + 12);
                // draw small boxes for each life
                for(var li=0; li< (game.player.lives || 0); li++){
                    var lx = px + 60 + li*20;
                    var ly = py;
                    // flash if invulnerable
                    if(game.player.invulTimer > 0){ game.context.fillStyle = '#fff'; }
                    else { game.context.fillStyle = game.player.color || '#0ff'; }
                    game.context.fillRect(lx, ly + 6, 14, 14);
                }
                // draw empty slots (up to 3) for clarity
                for(var ei= (game.player.lives || 0); ei<3; ei++){
                    var lx2 = px + 60 + ei*20;
                    game.context.strokeStyle = '#555';
                    game.context.strokeRect(lx2, py + 6, 14, 14);
                }
            }
        } catch(e){}
        // --- FIN DE LÓGICA DE CUADRÍCULA ---

        // Update entities
        for(var i=0;i<game.entities.length;i++){
            var e = game.entities[i];
            if(e && e.active && typeof e.update === 'function'){
                e.update(dt);
            }
        }

        // Simple collision handling: player bullets vs enemies (Boss, other enemies)
        for(var bi=0; bi<game.entities.length; bi++){
            var be = game.entities[bi];
            if(!be || !be.active) continue;
            if(typeof be === 'object' && be.constructor && be.constructor.name === 'Bullet' && be.owner === 'player'){
                // check against all other entities
                for(var ei=0; ei<game.entities.length; ei++){
                    var oe = game.entities[ei];
                    if(!oe || !oe.active) continue;
                    if(oe === be) continue;
                    if(oe instanceof Player) continue; // don't hit player
                    if(be.intersects(oe)){
                        if(typeof oe.takeDamage === 'function'){
                            oe.takeDamage(10); // arbitrary damage value
                        } else {
                            // default: deactivate target
                            oe.active = false;
                        }
                        be.active = false; // bullet consumed
                        break;
                    }
                }
            }
        }

        // Collision: boss (or enemy) bullets -> player
        for(var b2=0; b2<game.entities.length; b2++){
            var bullet = game.entities[b2];
            if(!bullet || !bullet.active) continue;
            if(bullet.constructor && bullet.constructor.name === 'Bullet' && (bullet.owner === 'boss' || bullet.owner === 'enemy')){
                if(game.player && game.player.active && bullet.intersects(game.player)){
                    // apply damage and consume bullet
                    if(typeof game.player.takeDamage === 'function'){
                        game.player.takeDamage(1); // boss bullets deal 1 life per hit
                    }
                    bullet.active = false;
                }
            }
        }

        // Collision: enemies (contact) -> player
        for(var ei=0; ei<game.entities.length; ei++){
            var en = game.entities[ei];
            if(!en || !en.active) continue;
            var isEnemy = (en.constructor && en.constructor.name === 'Enemy') || (typeof Enemy !== 'undefined' && en instanceof Enemy);
            if(isEnemy){
                if(game.player && game.player.active && en.intersects && en.intersects(game.player)){
                    try{
                        // Damage the player by 1 life (you can tune this)
                        if(typeof game.player.takeDamage === 'function'){
                            game.player.takeDamage(1);
                        }
                        // Destroy the enemy on contact (spawn small explosion but do not award score)
                        en.active = false;
                        var ex = new Explosion(en.x + en.width/2, en.y + en.height/2, 28, 0.45);
                        game.entities.push(ex);
                    } catch(e){}
                }
            }
        }

        // Draw entities
        for(var j=0;j<game.entities.length;j++){
            var d = game.entities[j];
            if(d && d.active && typeof d.draw === 'function'){
                d.draw(game.context);
            }
        }

        // Remove inactive entities
        game.entities = game.entities.filter(function(ent){ return ent && ent.active; });

        // Wave progression detection: if we are waiting for current wave to clear and there are no enemies alive, proceed
        try{
            if(game.waitingForWaveClear){
                var anyEnemy = false;
                for(var ei=0; ei<game.entities.length; ei++){
                    var ent = game.entities[ei];
                    if(!ent) continue;
                    if((ent.constructor && ent.constructor.name === 'Enemy') || (typeof Enemy !== 'undefined' && ent instanceof Enemy)){
                        anyEnemy = true; break;
                    }
                }
                if(!anyEnemy){
                    game.waitingForWaveClear = false;
                    // If there are more waves, start next; otherwise call waves complete
                    if(game.waves && game.waveIndex < game.waves.length){
                        game._startNextWave();
                    } else {
                        // all waves done
                        game._onWavesComplete();
                    }
                }
            }
        } catch(e){}
        game.context.restore();
        // Draw boss HP bar on HUD (outside of shake effect)
        try{
            var bossEnt = null;
            for(var bi=0; bi<game.entities.length; bi++){
                var e = game.entities[bi];
                if(!e) continue;
                if((e.constructor && e.constructor.name === 'Boss') || (typeof Boss !== 'undefined' && e instanceof Boss)){
                    bossEnt = e; break;
                }
            }
            if(bossEnt && bossEnt.active){
                var ctx = game.context;
                var barW = Math.min(600, Math.round(game.canvas.width * 0.6));
                var barH = 18;
                var bx = Math.round((game.canvas.width - barW)/2);
                var by = 12;
                // background
                ctx.save();
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(bx-4, by-4, barW+8, barH+8);
                // empty
                ctx.fillStyle = '#222';
                ctx.fillRect(bx, by, barW, barH);
                // health
                var ratio = Math.max(0, Math.min(1, bossEnt.health / bossEnt.maxHealth));
                ctx.fillStyle = '#f55';
                ctx.fillRect(bx, by, Math.round(barW * ratio), barH);
                // border and text
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, barW, barH);
                ctx.fillStyle = '#fff';
                ctx.font = "12px 'Press Start 2P', monospace";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('BOSS', bx + barW/2, by + barH/2 + 1);
                ctx.restore();
            }
        } catch(e){}

        // Boss incoming countdown handling + draw
        try{
            if(game.bossCountdownActive && game.bossCountdownRemaining > 0){
                game.bossCountdownRemaining = Math.max(0, game.bossCountdownRemaining - dt);
                var seconds = Math.ceil(game.bossCountdownRemaining);
                var ctx = game.context;
                ctx.save();
                ctx.font = "bold 36px 'Press Start 2P', monospace";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // background box
                var msg = 'BOSS INCOMING: ' + seconds;
                var mw = ctx.measureText(msg).width + 40;
                var mx = Math.round(game.canvas.width/2 - mw/2);
                var my = Math.round(game.canvas.height/2 - 140);
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(mx, my, mw, 56);
                ctx.fillStyle = '#ff4444';
                ctx.fillText(msg, game.canvas.width/2, my + 28);
                ctx.restore();
                if(game.bossCountdownRemaining <= 0){
                    // spawn boss now
                    try{
                        if(game.bossToSpawn && !game.ended){
                            var s = game.bossToSpawn.scale || 3;
                            var boss = new Boss(game.bossToSpawn.bx, game.bossToSpawn.by, game.player, s, game.bossToSpawn.cfg || {});
                            game.entities.push(boss);
                        }
                    } catch(e){}
                    game.bossCountdownActive = false;
                    game.bossCountdownRemaining = 0;
                    game.bossToSpawn = null;
                    game.pendingBoss = false;
                }
            }
        } catch(e){}

        game.drawReadySetGo(game.context);

        if (!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
        
    }
};