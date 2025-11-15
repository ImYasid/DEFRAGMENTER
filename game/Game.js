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
        // --- FIN DE LÓGICA DE CUADRÍCULA ---

        // Update entities
        for(var i=0;i<game.entities.length;i++){
            var e = game.entities[i];
            if(e && e.active && typeof e.update === 'function'){
                e.update(dt);
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