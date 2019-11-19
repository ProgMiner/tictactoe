<?php
/* MIT License

Copyright (c) 2017 Eridan Domoratskiy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

function isGameOver($seriCells) {
    $empties = 0;

    {
        $crosses = 0;
        $zeroes = 0;

        for ($i = 0; $i < 9; $i++)
           if ($seriCells[$i] == 0) $empties++;
           else if ($seriCells[$i] == 1) $crosses++;
           else if ($seriCells[$i] == 2) $zeroes++;

        if ($zeroes < 3 && $crosses < 3) return false;
    }

    $winCombos = array(
            array(
            1, 10, 100,  // ---
            0, 0, 0,     //
            0, 0, 0),    //

            array(
            0, 0, 0,     //
            1, 10, 100,  // ---
            0, 0, 0),    //

            array(
            0, 0, 0,     //
            0, 0, 0,     //
            1, 10, 100), // ---

            array(
            1, 0, 0,     // |
            10, 0, 0,    // |
            100, 0, 0),  // |

            array(
            0, 1, 0,     //  |
            0, 10, 0,    //  |
            0, 100, 0),  //  |

            array(
            0, 0, 1,     //   |
            0, 0, 10,    //   |
            0, 0, 100),  //   |

            array(
            1, 0, 0,     // \
            0, 10, 0,    //  \
            0, 0, 100),  //   \

            array(
            0, 0, 100,   //   /
            0, 10, 0,    //  /
            1, 0, 0)     // /
        );
    $winner = 0;

    foreach ($winCombos as $item) {
        $sum = 0;
        for ($i = 0; $i < 9; $i++) $sum += $item[$i] * $seriCells[$i];

        if ($sum == 0 || $sum % 111 != 0) continue;

        $winner = $sum / 111;
    }

    if ($winner > 0 || $empties <= 0) return true;
    return false;
}

$do = '';
if (isset($_GET['do'])) $do = $_GET['do'];

if ($do === '') die();
if (isset($_POST['id']) && !(strval(intval($_POST['id'])) === $_POST['id'] && intval($_POST['id']) > 0)) unset($_POST['id']);
if (isset($_POST['pid']) && strval(intval($_POST['pid'])) !== $_POST['pid']) unset($_POST['pid']);

require_once("db.php");

if ($do === 'new') { // Creating a new game
    $mysqli->query('UPDATE `tictactoe` SET `currentPlayer` = `currentPlayer` + 1 WHERE `id` = 0 LIMIT 1', MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);

    $id = $mysqli->query('SELECT `currentPlayer` FROM `tictactoe` WHERE `id` = 0 LIMIT 1', MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);

    $id = $id->fetch_row()[0];
    $time = time();
    $pid = rand() + 1;

    $mysqli->query("INSERT INTO `tictactoe` (`id`, `pid1`, `pid2`, `matrix`, `currentPlayer`, `created`, `cross)
                                 VALUES ({$id}, {$pid}, 0, '[0, 0, 0, 0, 0, 0, 0, 0, 0]', 0, {$time}, 0)", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);

    die(json_encode(array(
            'id' => $id,
            'pid' => $pid
        )));
} elseif ($do === 'connect' && isset($_POST['id'])) { // Connecting to the game
    $result = $mysqli->query("SELECT `pid2`, `cross` FROM `tictactoe` WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);
    $result = $result->fetch_assoc();

    if ($result['pid2'] != 0) die(json_encode(array(
            'state' => ($result['cross'] % 2) + 1,
            'pid'   => $result['pid2']
        )));

    $cross = rand(1, 2);
    $pid = rand() + 1;

    $mysqli->query("UPDATE `tictactoe` SET `pid2` = {$pid}, `cross` = {$cross}, `currentPlayer` = {$cross} WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);

    die(json_encode(array(
            'state' => ($cross % 2) + 1,
            'pid'   => $pid
        )));
} elseif ($do === 'checkConnection' && isset($_POST['id']) && isset($_POST['pid'])) { // Checking connection to the game
    $result = $mysqli->query("SELECT `pid2`, `cross` FROM `tictactoe` WHERE (`id` = {$_POST['id']} && `pid1` = {$_POST['pid']}) LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);
    $result = $result->fetch_assoc();

    if($result['pid2'] == 0) die('false');
    
    die($result['cross']);
}
/* elseif ($do === "leave" && isset($_POST['id']) && isset($_POST['pid'])){ // Leaving from the game
    $result = $mysqli->query("SELECT `pid1`, `pid2` FROM `tictactoe` WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);
    $result = $result->fetch_assoc();

    if($result['pid2'] === $_POST['pid']){
        $mysqli->query("UPDATE `tictactoe` SET `pid2` = 0 WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
            or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);

        die();
    }

    if($result['pid1'] !== $_POST['pid']) die();

    $mysqli->query("DELETE FROM `tictactoe` WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);
}*/
elseif ($do === 'move' && isset($_POST['id']) && isset($_POST['pid']) && isset($_POST['matrix'])) { // Player's move
    $result = $mysqli->query("SELECT `pid1`, `pid2`, `matrix`, `currentPlayer`, `cross` FROM `tictactoe` WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);
    $result = $result->fetch_assoc();
    
    $currentPID = $result['pid' . $result['currentPlayer']];

    if ($_POST['pid'] !== $currentPID) die('false');

    $currentState = (($result['cross'] + $result['currentPlayer']) % 2) + 1;
    $matrixDB = json_decode($result['matrix']);
    $matrixPlayer = json_decode($_POST['matrix']);

    $validMove = false;
    for ($i = 0; $i < 9; $i++) {
        if ($matrixDB[$i] !== 0) continue;

        $matrixTmp = $matrixDB;
        $matrixTmp[$i] = $currentState;
        if ($matrixTmp === $matrixPlayer) {
            $validMove = true;
            break;
        }
    }

    $gameOver = isGameOver($matrixPlayer);

    if (!$validMove && !$gameOver) die(json_encode(array(
            'matrix' => $matrixDB,
            'state' => $currentState,
            'gameOver' => false
        )));

    $mysqli->query("UPDATE `tictactoe` SET `currentPlayer` = " . (($result['currentPlayer']) % 2 + 1) . ", `matrix` = '{$_POST['matrix']}' WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);

    if ($gameOver) die(json_encode(array(
            'matrix' => $matrixPlayer,
            'state' => $currentState,
            'gameOver' => $gameOver
        )));

    die('false');
} elseif ($do === 'wait' && isset($_POST['id']) && isset($_POST['pid'])) { // Wait a move
    $result = $mysqli->query("SELECT `pid1`, `pid2`, `matrix`, `currentPlayer`, `cross` FROM `tictactoe` WHERE `id` = {$_POST['id']} LIMIT 1", MYSQLI_USE_RESULT)
        or die('MySQL Error (' . $mysqli->errno . ') ' . $mysqli->error);
    $result = $result->fetch_assoc();
    
    $currentPID = $result['pid' . $result['currentPlayer']];

    if($_POST['pid'] !== $currentPID) die('false');

    $matrixDB = json_decode($result['matrix']);
    die(json_encode(array(
            'matrix' => $matrixDB,
            'state' => (($result['cross'] + $result['currentPlayer']) % 2) + 1,
            'gameOver' => isGameOver($matrixDB)
        )));
}

