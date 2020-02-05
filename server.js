console.log("server is running");

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
var ballxSpd = Random(-1, 1),
  ballySpd = Random(-1, 1);
var ballxPos = 500,
  ballyPos = 500;
var cd = 0;

io.on("connection", newConnection);
io.on("connection", function (socket) {
  playerNum = io.eio.clientsCount;
});

setInterval(function () {
  ballxPos += ballxSpd * 5;
  ballyPos += ballySpd * 5;
  collideBall(brickXPosition, brickYPosition, ballxPos, ballyPos);
  scorechange();
}, 10);



function newConnection(socket) {
  socket.on("mouse", mouseMessage);

  function mouseMessage(recievedData) {

    recievedData["numOfPlayer"] = playerNum;

    brickXPosition = recievedData.brickXPos;
    brickYPosition = recievedData.brickYPos;
    if (brickXPosition == 0 || brickXPosition == 1000) {
      brickHeight = 200 * (0.8 / playerNum + 0.2);
      brickWidth = 50;
    } else {
      brickHeight = 50;
      brickWidth = 200 * (0.8 / playerNum + 0.2);
    }

    // recievedData["ballxPos"] = ballxPos;
    // recievedData["ballyPos"] = ballyPos;
    // recievedData["score"] = score;
    // recievedData["highscore"] = highscore;
    // recievedData["collideStatus"] = collideStatus;
    // recievedData["collideBrickX"] = collideBrickX;
    // recievedData["collideBrickY"] = collideBrickY;
    // recievedData["fallStatus"] = fallStatus;


    var gSEmitData = {};
    gSEmitData["numOfPlayer"] = playerNum;
    gSEmitData["ballxPos"] = ballxPos;
    gSEmitData["ballyPos"] = ballyPos;
    gSEmitData["score"] = score;
    gSEmitData["highscore"] = highscore;
    gSEmitData["collideStatus"] = collideStatus;
    gSEmitData["collideBrickX"] = collideBrickX;
    gSEmitData["collideBrickY"] = collideBrickY;
    gSEmitData["fallStatus"] = fallStatus;


    // console.log(recievedData);
    socket.broadcast.emit("mouseBroadcast", recievedData);
    socket.emit("gamestatusemit", gSEmitData);

    resetStatus();
  }
}

function scorechange() {
  cd = Constrain(cd - 1, 0, 10);

  if (collideStatus == true) {
    score++;
    if (brickXPosition == 0 || brickXPosition == 1000) {
      ballxSpd = (500 - ballxPos) / (500 * Random(0.75, 2));
      ballySpd = Random(Constrain(-brickYPosition / 500, -1, 0), Constrain(2 - brickYPosition / 500, 0, 1));
    } else {
      ballySpd = (500 - ballyPos) / (500 * Random(0.75, 2));
      ballxSpd = Random(Constrain(-brickXPosition / 500, -1, 0), Constrain(2 - brickXPosition / 500, 0, 1));
    }
  }

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

  if (score > highscore) {
    highscore = score;
  }

  if (abs(ballxPos - 500) > 600 || abs(ballyPos - 500) > 600) {
    ballxPos = Random(350, 650);
    ballyPos = Random(350, 650);
    score = lastLevelScore;
    fallStatus = true;
    console.log("Fall!");
  }
}

function resetStatus() {
  fallStatus = false;
  collideStatus = false;
  collideBrickX = -500;
  collideBrickY = -500;
}


function collideBall(_bkX, _bkY, _blX, _blY) {
  if (Math.pow(_bkX - _blX, 2) + Math.pow(_bkY - _blY, 2) <= 12100 && cd === 0) {
    if (_blY <= 41 && _blY >= 0 || _blY >= 959 && _blY <= 1000) {
      if (abs(_blX - _bkX) <= 16 + brickWidth / 2) {
        collideStatus = true;
        collideBrickX = _bkX;
        collideBrickY = _bkY;
        cd = 20;
        console.log("Collide!" + _bkX + " " + _bkY + " " + _blX + " " + _blY);
      }
    }

    if (_blX <= 41 && _blX >= 0 || _blX >= 959 && _blX <= 1000) {
      if (abs(_blY - _bkY) <= 16 + brickHeight / 2) {
        collideStatus = true;
        collideBrickX = _bkX;
        collideBrickY = _bkY;
        cd = 20;
        console.log("Collide!" + _bkX + " " + _bkY + " " + _blX + " " + _blY);
      }
    }
  }
}

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
