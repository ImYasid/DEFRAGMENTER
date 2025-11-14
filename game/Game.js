var game = {
    init: function(){
        levels.init();
        loader.init();
        mouse.init();
		audioManager.init();
    
		window.addEventListener('mousedown', audioManager.setupFirstPlayBound, false);
        window.addEventListener('mouseup', audioManager.setupFirstPlayBound, false);

        // ⚠️ BINDING DE MÉTODOS DE AUDIO
        // Es más limpio hacerlo en Audio.js, pero lo mantenemos aquí para asegurar el contexto en Game.js si es necesario
        audioManager.playLobbyMusic = audioManager.playLobbyMusic.bind(audioManager);
        audioManager.playGameMusic = audioManager.playGameMusic.bind(audioManager);
        audioManager.toggleMusic = audioManager.toggleMusic.bind(audioManager);
        
        // Asignación de eventos del menú HTML (botones)
        game.setupMenuEvents();
            
        // Hide all game layers and dis\u00A0 the start screen
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
        
        //Get handler for game canvas and context
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
		// Entities list for gameplay (Player, Enemies, Bullets...)
		game.entities = [];
		game.keys = {};

		// Keyboard handlers for shmup controls (arrow keys + WASD + Z/Space)
		var keyDownHandler = function(e){
			e = e || window.event;
			var kc = e.which || e.keyCode;
			if(kc === 37) { game.keys.left = true; if(e.preventDefault) e.preventDefault(); }
			if(kc === 39) { game.keys.right = true; if(e.preventDefault) e.preventDefault(); }
			if(kc === 38) { game.keys.up = true; if(e.preventDefault) e.preventDefault(); }
			if(kc === 40) { game.keys.down = true; if(e.preventDefault) e.preventDefault(); }
			if(kc === 65) { game.keys.left = true; } // A
			if(kc === 68) { game.keys.right = true; } // D
			if(kc === 87) { game.keys.up = true; } // W
			if(kc === 83) { game.keys.down = true; } // S
			if(kc === 32) { game.keys.space = true; if(e.preventDefault) e.preventDefault(); } // Space
			if(kc === 90) { game.keys.fire = true; } // Z
		};

		var keyUpHandler = function(e){
			e = e || window.event;
			var kc = e.which || e.keyCode;
			if(kc === 37) { game.keys.left = false; }
			if(kc === 39) { game.keys.right = false; }
			if(kc === 38) { game.keys.up = false; }
			if(kc === 40) { game.keys.down = false; }
			if(kc === 65) { game.keys.left = false; }
			if(kc === 68) { game.keys.right = false; }
			if(kc === 87) { game.keys.up = false; }
			if(kc === 83) { game.keys.down = false; }
			if(kc === 32) { game.keys.space = false; }
			if(kc === 90) { game.keys.fire = false; }
		};

		// Attach handlers with jQuery if available, else fallback to native
		if (typeof $ === 'function' && $.fn && $.fn.bind) {
			// older jQuery supports bind; use namespaced events to allow removal later
			$(window).bind('keydown.gamekeys', keyDownHandler);
			$(window).bind('keyup.gamekeys', keyUpHandler);
		} else if (typeof window.addEventListener === 'function') {
			window.addEventListener('keydown', keyDownHandler, false);
			window.addEventListener('keyup', keyUpHandler, false);
		} else if (typeof window.attachEvent === 'function') {
			window.attachEvent('onkeydown', keyDownHandler);
			window.attachEvent('onkeyup', keyUpHandler);
		} else {
			// last resort
			window.onkeydown = keyDownHandler;
			window.onkeyup = keyUpHandler;
		}
    },     
setupMenuEvents: function() {
        $('#start-button').click(function() {
            // 🚨 El audio ya se inició con el primer clic, ahora solo se cambia el estado visual
            levels.init(); 
            game.showLevelScreen();
        });
        
        // ... (otros eventos de botones)
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
		game.offsetLeft = 0;
		game.ended = false;
		// Prepare timing for dt
		game.lastTime = performance.now();

		// Create player entity (center-left)
		try{
			var px = 40;
			var py = Math.round(game.canvas.height/2 - 16);
			game.player = new Player(px, py);
			game.entities.push(game.player);
		} catch(e){
			// Player class may not be available yet; defensive
			console.warn('Player class not available:', e);
		}

		game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
    },  

    

    // Maximum panning speed per frame in pixels
    maxSpeed:3,
    // Minimum and Maximum panning offset
    minOffset:0,
    maxOffset:300,
    // Current panning offset
    offsetLeft:0,
    // The game score
    score:0,

    //Pan the screen to center on newCenter
    panTo:function(newCenter){
        if (Math.abs(newCenter-game.offsetLeft-game.canvas.width/4)>0 
            && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){
        
            var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
            if (deltaX && Math.abs(deltaX)>game.maxSpeed){
                deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
            }
            game.offsetLeft += deltaX; 
        } else {
            
            return true;
        }
        if (game.offsetLeft <game.minOffset){
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset){
            game.offsetLeft = game.maxOffset;
            return true;
        }        
        return false;
    },
    handlePanning:function(){
        if(game.mode=="intro"){        
            if(game.panTo(700)){
                game.mode = "load-next-hero";
            }             
        }       

        if(game.mode=="wait-for-firing"){  
            if (mouse.dragging){
                game.panTo(mouse.x + game.offsetLeft)
            } else {
                game.panTo(game.slingshotX);
            }
        }
        
        if (game.mode=="load-next-hero"){
            // TODO: 
            // Check if any villains are alive, if not, end the level (success)
            // Check if there are any more heroes left to load, if not end the level (failure)
            // Load the hero and set mode to wait-for-firing
            game.mode="wait-for-firing";            
        }
        
        if(game.mode == "firing"){  
            game.panTo(game.slingshotX);
        }
        
        if (game.mode == "fired"){
            // TODO:
            // Pan to wherever the hero currently is
        }
    },
    showEndingScreen:function(mode){
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

		// Handle panning if necessary (kept for level parallax)
		game.handlePanning();

		// Draw the background with parallax scrolling (if available)
		if(game.currentLevel && game.currentLevel.backgroundImage){
			game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
		} else {
			game.context.clearRect(0,0,game.canvas.width, game.canvas.height);
		}
		if(game.currentLevel && game.currentLevel.foregroundImage){
			game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
		}

		// Update entities
		for(var i=0;i<game.entities.length;i++){
			var e = game.entities[i];
			if(e && e.active && typeof e.update === 'function'){
				e.update(dt);
			}
		}

		// Simple collision handling placeholder (player bullets vs enemies)
		// TODO: implement enemy class and collision responses

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



// Espera a que la página esté lista
$(function() {

    // PRUEBA 1: ¿Se ejecuta este código?
    console.log("¡jQuery listo! Buscando el botón #start-button...");

    // ==========================================================
    //  LA SOLUCIÓN: Usa .click() en lugar de .on()
    // ==========================================================
    $('#start-button').click(function() { 
        
        // PRUEBA 2: ¿Funciona el clic?
        console.log("¡Botón presionado!");
        
        game.showLevelScreen();
    });

    // También cambia los otros botones a .click()
    $('#highscores-button').click(function() {
        console.log("Botón de Puntuaciones presionado");
    });

    $('#settings-button').click(function() {
        console.log("Botón de Ajustes presionado");
    });

	

});

