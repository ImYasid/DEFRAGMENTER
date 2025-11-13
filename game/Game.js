var game = {
  // Start initializing objects, preloading assets and display start screen
    init: function(){
        // Initialize objects   
        levels.init();
        loader.init();
        mouse.init();
            
        // Hide all game layers and dis\u00A0 the start screen
        $('.gamelayer').hide();
        $('#gamestartscreen').show();
        
        //Get handler for game canvas and context
        game.canvas = $('#gamecanvas')[0];
        game.context = game.canvas.getContext('2d');
    },      
    showLevelScreen:function(){
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },
    // Game Mode
    mode:"intro", 
    // X & Y Coordinates of the slingshot
    slingshotX:140,
    slingshotY:280,
    start:function(){
        $('.gamelayer').hide();
        // Display the game canvas and score 
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.mode = "intro";    
        game.offsetLeft = 0;
        game.ended = false;
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
        // Animate the background
       game.handlePanning();
       
       // Animate the characters
        
        
        //  Draw the background with parallax scrolling
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);
        

        // Draw the slingshot
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);
        
        game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        if (!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        } 
    }
}