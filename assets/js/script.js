var tictactoe = {};

// General

tictactoe.canvasJQuery = $("#canvas");
tictactoe.canvas = new fabric.Canvas(tictactoe.canvasJQuery.get(0), {
    renderOnAddRemove: false,
    hoverCursor: 'default',
    moveCursor: 'default',
    selection: false,
    scale: 1
});
tictactoe.state = 0;
tictactoe.cellSprite = [];

// Pre-loading

fabric.loadSVGFromURL("assets/svg/logo.svg", function(objects, options){
    tictactoe.logo = fabric.util.groupSVGElements(objects, options);
    tictactoe.logo.set({
        selectable: false,
        top: 15, left: (tictactoe.canvas.width - tictactoe.logo.width) / 2,
        shadow: new fabric.Shadow("1px 1px 0px #000")
    });
    tictactoe.canvas.add(tictactoe.logo);
    tictactoe.canvas.renderAll();
});
fabric.loadSVGFromURL("assets/svg/copyright.svg", function(objects, options){
    tictactoe.copyright = fabric.util.groupSVGElements(objects, options);
    tictactoe.copyright.set({
        scaleX: 1.2, scaleY: 1.2, selectable: false,
        top: tictactoe.canvas.height - 30, left: (tictactoe.canvas.width - tictactoe.copyright.width) / 2,
        shadow: new fabric.Shadow("1px 1px 0px #000")
    }).on("mousedown", function(){
        window.open("https://byprogminer.ru/", "_blank");
    });
    tictactoe.copyright.getCursor = function(){return "pointer";};
    tictactoe.canvas.add(tictactoe.copyright);
    tictactoe.canvas.renderAll();
});

fabric.loadSVGFromURL("assets/svg/ground.svg", function(objects, options){
    tictactoe.groundbg = fabric.util.groupSVGElements(objects, options);
    tictactoe.groundbg.set({
        selectable: false,
        top: 202, left: (tictactoe.canvas.width - tictactoe.groundbg.width) / 2,
        shadow: new fabric.Shadow("1px 1px 0px #000")
    });
});
fabric.loadSVGFromURL("assets/svg/x.svg", function(objects, options){
    tictactoe.cellSprite[1] = {
        objects: objects,
        options: options,
        state: 1
    };
});
fabric.loadSVGFromURL("assets/svg/o.svg", function(objects, options){
    tictactoe.cellSprite[2] = {
        objects: objects,
        options: options,
        state: 2
    };
});

// Classes

tictactoe.Button = fabric.util.createClass(fabric.Group, {

    selectable: false,

    initialize: function(args = {}){
        args.__proto__ = {text: "", y: 0, x: 90, width: 300, height: 30, click: function(e){}};

        this.callSuper("initialize", [new fabric.Rect({
            width: args.width, height: args.height, rx: 15,
            fill: "#fff", stroke: "#000",
            originX: "center", originY: "center",
            shadow: new fabric.Shadow("0px 1px 1px rgba(0, 0, 0, 0.25)")
        }), new fabric.Text(args.text, {
            originX: "center", originY: "center", fontSize: 18
        })], {
            top: args.y, left: args.x
        });

        this.on("mousedown", function(e){
            args.click(e);
        });

        var thisVar = this;
        tictactoe.canvas.on("mouse:move", function(opt){
            if(!opt.target || opt.target != thisVar){
                if(thisVar.item(1).getTextDecoration() == "underline") thisVar.item(1).set({textDecoration: ""});
                if(thisVar.item(0).getShadow().color != "rgba(0, 0, 0, 0.5)") thisVar.item(0).getShadow().color = "rgba(0, 0, 0, 0.5)";
            }else{
                thisVar.item(1).set({textDecoration: "underline"});
                thisVar.item(0).getShadow().color = "rgba(0, 0, 0, 0.75)";
            }
            tictactoe.canvas.renderAll();
        });
    }, getCursor: function(){
        return "pointer";
    }
});

tictactoe.Cell = fabric.util.createClass(fabric.Group, {

    state: 0, 
    selectable: false,

    initialize: function(args = {}){
        args.__proto__ = {x: 0, y: 0, width: 130, height: 130};

        var thisVar = this;
        this.callSuper("initialize", [], {
            top: args.y + 200, left: args.x + 56,
            width: args.width, height: args.height
        })
        this.on("mousedown", function(e){
            if(!tictactoe.gameSettings || !tictactoe.gameSettings.canMove || thisVar.state != 0 || this.getObjects().length > 0) return;

            thisVar.setState(tictactoe.gameSettings.playerState);

            setTimeout(function(){
                tictactoe.gameSettings.canMove = false;
                tictactoe.gameSettings.betweenMoves();

                if(!tictactoe.gameSettings) return;

                tictactoe.gameSettings.enemyMove();
                tictactoe.gameSettings.canMove = true;

                tictactoe.gameSettings.betweenMoves();
            }, 1);
        });
    },
    setState: function(state){
        if(!tictactoe.gameSettings || this.state != 0 || this.getObjects().length > 0) return;

        this.state = state;
        this.add(fabric.util.groupSVGElements(tictactoe.cellSprite[state].objects, tictactoe.cellSprite[state].options));
        this.item(0).set({
            selectable: false,
            originX: "center", originY: "center",
            shadow: new fabric.Shadow("1px 1px 0px #000")
        });

        tictactoe.canvas.renderAll();
    }, getState: function(){
        return this.state;
    }, resetState: function(){
        do{
            var arr = this.getObjects();
            if(arr.length > 0) this.remove(arr[0]);
        }while(arr.length > 0);

        this.state = 0;

        tictactoe.canvas.renderAll();
    }, getCursor: function(){
        return (!tictactoe.gameSettings || !tictactoe.gameSettings.canMove || this.state != 0 || this.getObjects().length > 0) ? "default" : "pointer";
    }
});

// Functions

tictactoe.clearCanvas = function(){
    do{
        var arr = tictactoe.canvas.getObjects().filter(function(item){
            return item != tictactoe.logo && item != tictactoe.copyright;
        });
        if(arr.length > 0) tictactoe.canvas.remove(arr[0]);
    }while(arr.length > 0);
};

tictactoe.startGame = function(settings = {}){
    for(var key in tictactoe.cells) tictactoe.cells[key].resetState();

    tictactoe.gameSettings = settings;
    tictactoe.gameSettings.__proto__ = {
        playerState: Math.floor(Math.random() * 2) + 1,
        canMove: true,

        enemyMove: function(){
            console.error("Enemy's move function isn't changed!");
        }, betweenMoves: function(){
            var obj = tictactoe.isGameOver();
            if(obj === false) return;

            tictactoe.gameOver(obj.winner, obj.winCombo);
        }
    };
    tictactoe.gameSettings.canMove = tictactoe.gameSettings.playerState == 1;

    if(!tictactoe.gameSettings.canMove){
        tictactoe.gameSettings.enemyMove();
        tictactoe.gameSettings.canMove = true;
        tictactoe.gameSettings.betweenMoves();
    }

    tictactoe.state = 1;
    tictactoe.makeScene();
}

tictactoe.serializeGround = function(){
    var ret = [];
    for(var i = 0; i < tictactoe.cells.length; i++)
        ret[i] = tictactoe.cells[i].getState();

    return ret;
}

tictactoe.deserializeGround = function(cells = [0, 0, 0, 0, 0, 0, 0, 0, 0]){
    for(var i = 0; i < tictactoe.cells.length; i++){
    	tictactoe.cells[i].resetState();
        if(cells[i] === 0) continue;
        tictactoe.cells[i].setState(cells[i]);
    }
}

tictactoe.isGameOver = function(seriCells = tictactoe.serializeGround()){
    var empties = 0;

    {
        var crosses = 0, zeroes = 0;

        for(var i = 0; i < seriCells.length; i++)
           if(seriCells[i] == 0) empties++;
           else if(seriCells[i] == 1) crosses++;
           else if(seriCells[i] == 2) zeroes++;

        if(zeroes < 3 && crosses < 3) return false;
    }

    var winCombos = [
        [1, 10, 100,  // ---
         0, 0, 0,     //
         0, 0, 0],    //

        [0, 0, 0,     //
         1, 10, 100,  // ---
         0, 0, 0],    //

        [0, 0, 0,     //
         0, 0, 0,     //
         1, 10, 100], // ---

        [1, 0, 0,     // |
         10, 0, 0,    // |
         100, 0, 0],  // |

        [0, 1, 0,     //  |
         0, 10, 0,    //  |
         0, 100, 0],  //  |

        [0, 0, 1,     //   |
         0, 0, 10,    //   |
         0, 0, 100],  //   |

        [1, 0, 0,     // \
         0, 10, 0,    //  \
         0, 0, 100],  //   \

        [0, 0, 100,   //   /
         0, 10, 0,    //  /
         1, 0, 0]     // /
    ], winner = 0, winCombo;

    winCombos.forEach(function(item){
        var sum = 0;
        for(var i = 0; i < 9; i++) sum += item[i] * seriCells[i];

        if(sum == 0 || sum % 111 != 0) return false;

        winner = sum / 111;
        winCombo = item;
    });

    if(winner > 0 || empties <= 0) return {winner: winner, winCombo: winCombo};
    return false;
}

tictactoe.quitGame = function(){
    if(!tictactoe.gameSettings) return;

    delete tictactoe.gameSettings;
}

tictactoe.gameOver = function(winner = 0, combination = [0, 0, 0, 0, 0, 0, 0, 0, 0]){
    tictactoe.gameSettings.canMove = false;

    combination.forEach(function(item, i){combination[i] = Math.pow(item, 0) % (item + 1);});

    var combiPoints = [];

    combination.forEach(function(item, i){
        if(item == 0) return;

        combiPoints[combiPoints.length] = {
            x: tictactoe.cells[i].left + 0.5 * tictactoe.cells[i].width,
            y: tictactoe.cells[i].top + 0.5 * tictactoe.cells[i].height
        };
    });

    tictactoe.canvas.add(new fabric.Polyline(combiPoints, {
        selectable: false,
        strokeWidth: 3, stroke: "#fff",
        strokeLineJoin: "round",
        shadow: new fabric.Shadow("1px 1px 0px #000"),
    }));
    tictactoe.canvas.renderAll();

    setTimeout(function(){
        if(winner > 0) alert("Победили " + (winner == 1 ? "крестики" : "нолики") + "!");
        else alert("Ничья!");
    }, 1);

    tictactoe.quitGame();
}

tictactoe.startInternetGame = function(gameID, playerID, state){
    tictactoe.startGame({
        playerState: state,

        enemyMove: function(){
            var response = false, sync = function(){
                if(response === false || !tictactoe.gameSettings) return;

                tictactoe.deserializeGround(response.matrix);
                tictactoe.gameSettings.playerState = response.state;

                if(response.gameOver) tictactoe.gameSettings.__proto__.betweenMoves();

                tictactoe.gameSettings.canMove = true;
            }, wait = function(){
                $.post("/game.php?do=wait", {
                    id: gameID,
                    pid: playerID
                }, function(data){
                    if(!tictactoe.gameSettings) return;

                    response = JSON.parse(data);

                    if(response === false) setTimeout(wait, 500);
                    else sync();
                });
            };

            $.post("/game.php?do=move", {
                id: gameID,
                pid: playerID,
                matrix: JSON.stringify(tictactoe.serializeGround())
            }, function(data){
                if(!tictactoe.gameSettings) return;
                
                response = JSON.parse(data);

                if(response === false) setTimeout(wait, 1);
                else sync();
            });
        }, betweenMoves: function(){
            tictactoe.gameSettings.canMove = false;
        }

    });
}

tictactoe.makeScene = function(){
    tictactoe.clearCanvas();

    // Draw current screen
    switch(tictactoe.state){
    case 0: // Main menu
        tictactoe.canvas.add(new tictactoe.Button({text: "Игра с ботом", y: 230, click: function(e){
            tictactoe.startGame({
                enemyMove: function(){
                    var seriCells = tictactoe.serializeGround(), newCells, empties = 0, bot = (this.playerState % 2) + 1;

                    for(var i = 0; i < 9; i++){
                        if(seriCells[i] != 0) continue;
                        newCells = seriCells.slice(0);

                        newCells[i] = bot;
                        if(tictactoe.isGameOver(newCells) === false) continue;

                        tictactoe.cells[i].setState(bot);
                        return; 
                    }

                    for(var i = 0; i < 9; i++){
                        if(seriCells[i] != 0) continue;
                        newCells = seriCells.slice(0);
                        empties++;

                        newCells[i] = this.playerState;
                        if(tictactoe.isGameOver(newCells) === false) continue;

                        tictactoe.cells[i].setState(bot);
                        return; 
                    }

                    var randCell = Math.floor(Math.random() * (empties));
                    for(var i = 0, j = 0; i < 9; i++){
                        if(seriCells[i] != 0) continue;

                        if(j == randCell){
                            tictactoe.cells[i].setState(bot);
                            return;
                        }

                        j++;
                    }
                }
            });
        }}));

        tictactoe.canvas.add(new tictactoe.Button({text: "Игра на одном компьютере", y: 275, click: function(e){
            tictactoe.startGame({
                playerState: 1,

                enemyMove: function(){
                    this.playerState = (this.playerState % 2) + 1;
                }
            });
        }}));
        
        tictactoe.canvas.add(new tictactoe.Button({text: "Игра по интернету", y: 320, click: function(e){
            $.post("/game.php?do=new", {}, function(data){
                data = JSON.parse(data);
            	var gameID = data.id, playerID = data.pid;

                tictactoe.state = 2;
                tictactoe.makeScene();
            
                tictactoe.canvas.add(new tictactoe.Button({text: "Получить ссылку на игру", y: 275, click: function(e){
                    setTimeout(function(){
                    	prompt("Скопируйте ссылку в поле ниже:", location.protocol + "//" + location.hostname + "?connect=" + gameID);
                    }, 1);
                }}));
            
                tictactoe.canvas.add(new tictactoe.Button({text: "Отмена", y: 320, click: function(e){
                    $.post("/game.php?do=leave", {
                        id: gameID,
                        pid: playerID
                    });

                    //location.reload(true);
                    //return;
        
                    tictactoe.state = 0;
                    tictactoe.makeScene();
                }}));

                var checkConnection = function(){
                    $.post("/game.php?do=checkConnection", {
                        id: gameID,
                        pid: playerID
                    }, function(data){
                        if(data === "false"){
                            setTimeout(checkConnection, 500);
                            return;
                        }

                        tictactoe.startInternetGame(gameID, playerID, data);
                    });
                };
                setTimeout(checkConnection, 1);
            });
        }}));

        break;
    case 1: // Game
        tictactoe.canvas.add(tictactoe.groundbg);

        for(var key in tictactoe.cells) tictactoe.canvas.add(tictactoe.cells[key]);

        tictactoe.canvas.add(new tictactoe.Button({text: "Выйти из игры", y: 600, click: function(e){
            tictactoe.quitGame();

            //location.href = "/";
            //return;

            tictactoe.state = 0;
            tictactoe.makeScene();
        }}));
        break;
    case 2: // Lobby
        tictactoe.canvas.add(new fabric.Group([
            new fabric.Text("Ожидание противника", {
                originX: "center", fontSize: 22, fill: "#fff",
                shadow: new fabric.Shadow("1px 1px 0px #000")
            })], {
                selectable: false,
                top: 230, left: 90,
                width: 300
            }));
    }

    tictactoe.canvas.renderAll();
};

// Start

tictactoe.cells = [
    new tictactoe.Cell({x: 7, y: 0, width: 110, height: 110}),    // 1:1
    new tictactoe.Cell({x: 120, y: 2, height: 110}),              // 1:2
    new tictactoe.Cell({x: 258, y: 7, width: 110, height: 110}),  // 1:3
    
    new tictactoe.Cell({x: 4, y: 114, width: 110}),               // 2:1
    new tictactoe.Cell({x: 117, y: 117}),                         // 2:2
    new tictactoe.Cell({x: 254, y: 122, width: 110}),             // 2:3

    new tictactoe.Cell({x: 0, y: 251, width: 110, height: 110}),  // 3:1
    new tictactoe.Cell({x: 114, y: 254, height: 110}),            // 3:2
    new tictactoe.Cell({x: 251, y: 255, width: 110, height: 110}) // 3:3
];

tictactoe.canvas.on("mouse:move", function(e){
    if(!e.target || !e.target.getCursor)
        tictactoe.canvas.set("defaultCursor", "default");
    else tictactoe.canvas.set("defaultCursor", e.target.getCursor());
});

tictactoe.makeScene();
