<!doctype html>
<html>
    <head>
        <title>Крестики-Нолики</title>
        <link rel="stylesheet" href="assets/style.css?<?echo time();?>">
        <script type="text/javascript" src="assets/js/jquery.min.js"></script>
        <script type="text/javascript" src="assets/js/fabric.min.js"></script>
        <meta name="viewport" content="width=device-width">
    </head>
    <body>
        <canvas id="canvas" width="480" height="700">Обновите браузер</canvas>

        <script type="text/javascript" src="assets/js/script.js?<?echo time();?>"></script>
        <?if(isset($_GET['connect'])):?>
            <script type="text/javascript">
                alert("Ждите");
                setTimeout(function(){
                    var gameID = <?echo $_GET['connect'];?>;

                    $.post("/game.php?do=connect", {
                        id: gameID
                    }, function(data){
                        data = JSON.parse(data);

                        tictactoe.startInternetGame(gameID, data.pid, data.state);
                    });
                }, 1000);
            </script>
        <?endif;?>
    </body>
</html>