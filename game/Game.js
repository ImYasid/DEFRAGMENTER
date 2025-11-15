var game = {
    // Variable para rastrear el nivel/oleada actual (comenzamos en el índice 0)
    currentLevelNumber: 0, 

    // --- Variables de la Cuadrícula ---
    backgroundOffset: 0,     // Posición actual del scroll de la cuadrícula
    backgroundSpeed: -40,     // Velocidad de scroll (píxeles por segundo)
    gridSize: 30,            // Tamaño de cada cuadrado de la cuadrícula
    gridColor: "rgba(102, 249, 51, 0.2)", // Verde neón con transparencia
    // --- Fin de Variables ---

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
    },     
    
    setupMenuEvents: function() {
        $('#start-button').click(function() {
            // [CORREGIDO] levels.init() solo se llama una vez, en game.init()
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
        audioManager.playLobbyMusic();
    },
    
    // Game Mode
    mode:"intro", 
    // Set to true to spawn a boss immediately when the level starts
    spawnBossImmediately: true,
    
    start:function(){
        $('.gamelayer').hide();
        // Display the game canvas and score 
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.mode = "running";
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
            // Example: spawn a boss proportional to the player size
            // You can enable immediate boss spawn by setting `game.spawnBossImmediately = true`.
            if(game.spawnBossImmediately){
                var scale = 3; // boss will be roughly 3x the player's size
                var bx = Math.max(0, game.canvas.width - Math.round(game.player.width * scale) - 20);
                var by = Math.round(game.canvas.height/2 - (game.player.height * scale)/2);
                var boss = new Boss(bx, by, game.player, scale);
                game.entities.push(boss);
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
                $('#endingmessage').html('Level Complete. Well Done!!!');
                $("#playnextlevel").show();
            } else {
                $('#endingmessage').html('All Levels Complete. Well Done!!!');
                $("#playnextlevel").hide();
            }
        } else if (mode=="level-failure"){        
            $('#endingmessage').html('Failed. Play Again?');
            $("#playnextlevel").hide();
        }        
        
        $('#endingscreen').show();
    },

    
    animate:function(){
        // Compute delta time
        var now = performance.now();
        var dt = (game.lastTime) ? (now - game.lastTime)/1000 : 0;
        game.lastTime = now;

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
            if(bullet.constructor && bullet.constructor.name === 'Bullet' && bullet.owner === 'boss'){
                if(game.player && game.player.active && bullet.intersects(game.player)){
                    // apply damage and consume bullet
                    if(typeof game.player.takeDamage === 'function'){
                        game.player.takeDamage(1); // boss bullets deal 1 life per hit
                    }
                    bullet.active = false;
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

        if (!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }
        
    }
};