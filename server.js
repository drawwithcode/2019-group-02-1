console.log("server is running");

// require('./p5.js');
// require('./p5.collide2d.js');
var express = require("express");

var app = express();

var port = process.env.PORT || 3000;

app.use(express.static('public'));

var server = app.listen(port);

console.log("http://localhost:" + port);

var socket = require('socket.io');

var io = socket(server);


var playerNum = 0;
var brickXPosition = -500,
  brickYPosition = -500;
var brickWidth = 0,
  brickHeight = 0;
var score = 0,
  highscore = 0,
  lastLevelScore = 0;
var collideStatus = false;
var collideBrickX = -500,
  collideBrickY = -500;
var fallStatus = false;
var touchpoint = [0, 5, 10, 15, 20, 25, 30];
var ballxSpd = Random(-1, 1);
var ballySpd = Random(-1, 1);
var ballxPos = 500;
var ballyPos = 500;


var cd = 0;

io.on("connection", newConnection);
io.on("connection", function (socket) {
  playerNum = io.eio.clientsCount;
})

setInterval(function () {
  ballxPos += ballxSpd * 5;
  ballyPos += ballySpd * 5;
  collideBall(brickXPosition, brickYPosition, ballxPos, ballyPos);
  scoreIncrease();
  lastLevelS();
  updateHighscore();
  ballFall();
  if (cd > 0) {
    cd = cd - 1;
  } else {
    cd = 0;
  }
}, 10);



function newConnection(socket) {
  // console.log(socket.id);
  // console.log(playerNum);
  socket.on("mouse", mouseMessage);

  function mouseMessage(recieveData) {

    var numOfPlayer = "numOfPlayer";
    recieveData[numOfPlayer] = playerNum;

    // console.log("ID: " + socket.id + " x = " + recieveData.brickXPos + ", y = " + recieveData.brickYPos);

    brickXPosition = recieveData.brickXPos;
    brickYPosition = recieveData.brickYPos;
    if (brickXPosition == 0 || brickXPosition == 1000) {
      brickHeight = 200 * (0.8 / playerNum + 0.2);
      brickWidth = 50;
    } else {
      brickHeight = 50;
      brickWidth = 200 * (0.8 / playerNum + 0.2);
    }

    recieveData["ballxPos"] = ballxPos;
    recieveData["ballyPos"] = ballyPos;
    recieveData["score"] = score;
    recieveData["highscore"] = highscore;
    recieveData["collideStatus"] = collideStatus;
    recieveData["collideBrickX"] = collideBrickX;
    recieveData["collideBrickY"] = collideBrickY;
    recieveData["fallStatus"] = fallStatus;


    // console.log(recieveData);
    socket.broadcast.emit("mouseBroadcast", recieveData);
    resetStatus();
  }
}

function scoreIncrease() {
  // console.log("scoreIncrease" + "is running");
  if (collideStatus == true) {
    score++;
    if (brickXPosition == 0 || brickXPosition == 1000) {
      ballxSpd *= -1;
      ballySpd = Random(Constrain(-brickYPosition / 500, -1, 0), Constrain(2 - brickYPosition / 500, 0, 1));
    } else {
      ballySpd *= -1;
      ballxSpd = Random(Constrain(-brickXPosition / 500, -1, 0), Constrain(2 - brickXPosition / 500, 0, 1));
    }
  }
}

function lastLevelS() {
  // console.log("lastLevelS" + "is running");
  for (i = 0; i < 7; i++) {
    if (score < touchpoint[i]) {
      if (i > 1) {
        lastLevelScore = touchpoint[i - 2];
      } else {
        lastLevelScore = 0;
      }
      break;
    } else if (score >= touchpoint[6]) {
      lastLevelScore = touchpoint[4];
      break;
    }
  }
}

function updateHighscore() {
  // console.log("updateHighscore" + "is running");
  if (score > highscore) {
    highscore = score;
  }
}

function resetStatus() {
  fallStatus = false;
  collideStatus = false;
  collideBrickX = -500;
  collideBrickY = -500;
}


function collideBall(_bkX, _bkY, _blX, _blY) {
  // console.log("collideBall" + "is running");
  if (cd === 0) {
    if (_blY <= 41 && _blY >= 20 || _blY >= 959 && _blY <= 980) {
      if (abs(_blX - _bkX) <= brickWidth / 2) {
        collideStatus = true;
        collideBrickX = _bkX;
        collideBrickY = _bkY;
        cd = 20;
        console.log("Collide!" + _bkX + " " + _bkY + " " + _blX + " " + _blY);
      }
    }

    if (_blX <= 41 && _blX >= 20 || _blX >= 959 && _blX <=980) {
      if (abs(_blY - _bkY) <= brickHeight / 2) {
        collideStatus = true;
        collideBrickX = _bkX;
        collideBrickY = _bkY;
        cd = 20;
        console.log("Collide!" + _bkX + " " + _bkY + " " + _blX + " " + _blY);
      }
    }
  }
}

function ballFall() {
  if (abs(ballxPos - 500) > 600 || abs(ballyPos - 500) > 600) {
    ballxPos = Random(350, 650);
    ballyPos = Random(350, 650);
    score = lastLevelScore;
    fallStatus = true;
    console.log("Fall!");
  }
}

// function cdReduce() {
//   if (cd > 0) {
//     cd = cd - 1;
//   } else {
//     cd = 0;
//   }
// }

function Constrain(x, min, max) {
  if (x < min) {
    return min;
  } else if (x >= min && x <= max) {
    return x;
  } else if (x > max) {
    return max;
  }
}

function Random(_min, _max) {
  return Math.random() * (_max - _min) + _min;
}

function abs(x) {
  if (x >= 0) {
    return x;
  } else {
    return -x;
  }
}
