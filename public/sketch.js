var socket;

var numOfPlayer = 1;
var brick;
var brickScaleX = 1,
  brickScaleY = 1; //板接球形变
// var ball, ballMove;
var ballOSX, ballOSY;
var pBallx = 0,
  pBally = 0;
var deltaX = 0,
  deltaY = 0;
var pdeltaX = 0,
  pdeltaY = 0;
var fallSt = false;
var hit = false;
var strokeColor;

var lvl = "#lvl1",
  currentLevel = 1; //当前等级
var score = 0,
  prevscore = 0; //分数，失败跌落分
var highScore = 0; //最高分
// var cd = 0; //冷却时间

var myCanvas; //画布
var music, hitSound, fallSound; //音频
var motionBlur = false,
  soundEffects = true; //设置音量开关，运动模糊开关
var touchpoint = [0, 5, 10, 15, 20, 25, 30];

let bgArr = [],
  blArr = [],
  bkhArr = [],
  bkvArr = [],
  brickFillv,
  brickFillh;
var brickWidthPercentage;

function preload() {
  music = loadSound('assets/Theme music cutted.mp3');
  hitSound = loadSound('assets/hit.wav');
  fallSound = loadSound('assets/fall.wav');

  for (i = 1; i < 7; i++) {
    var bg = loadImage('assets/background' + i + '.png');
    var bl = loadImage('assets/ball' + i + '.png');
    var bkh = loadImage('assets/brick' + i + 'a.png');
    var bkv = loadImage('assets/brick' + i + 'b.png');
    bgArr.push(bg);
    blArr.push(bl);
    bkhArr.push(bkh);
    bkvArr.push(bkv);
  }
}

function setup() {
  //初始设置背景音乐
  music.setVolume(0.1);
  music.loop();

  frameRate(60);

  // 创建画布，球，板
  myCanvas = createCanvas(1000, 1000);
  noStroke();
  brick = new bricks();

  //设置选项style
  select('#btnFullscreen').mousePressed(toggleFullscreen);
  select('#btnMute').mouseClicked(MuteMusic);
  // select('#btnMB').mouseClicked(ToggleMotionBlur);
  select('#btnSoundEffects').mouseClicked(ToggleSoundEffects);


  //画布大小自适应
  if (windowHeight < windowWidth) {
    myCanvas.style('height', '90%');
    myCanvas.style('width', 'auto');
  } else {
    myCanvas.style('height', 'auto');
    myCanvas.style('width', '90%');
  }

  //接收数据
  socket = io();
  socket.on("mouseBroadcast", newDrawing);
  socket.on("gamestatusemit", downloadGameSt);

  function newDrawing(recievedData) {
    //获取玩家数量
    numOfPlayer = recievedData.numOfPlayer;

    //创建其他brick
    brickWidthPercentage = 0.8 / numOfPlayer + 0.2;
    imageMode(CENTER);
    rectMode(CENTER);
    noFill();
    stroke(strokeColor);
    strokeWeight(3);
    if (recievedData.brickXPos == 0 || recievedData.brickXPos == width) {
      image(brickFillv, recievedData.brickXPos, recievedData.brickYPos, 50, 200 * brickWidthPercentage);
      rect(recievedData.brickXPos, recievedData.brickYPos, 50, 200 * brickWidthPercentage);
    } else {
      image(brickFillh, recievedData.brickXPos, recievedData.brickYPos, 200 * brickWidthPercentage, 50);
      rect(recievedData.brickXPos, recievedData.brickYPos, 200 * brickWidthPercentage, 50);
    }
  }

  function downloadGameSt(recievedData) {
    ballOSX = recievedData.ballxPos;
    ballOSY = recievedData.ballyPos;
    score = recievedData.score;
    highScore = recievedData.highscore;
    fallSt = recievedData.fallStatus;
    touchpoint = recievedData.touchPoint;

    deltaX = pBallx - ballOSX;
    deltaY = pBally - ballOSY;
    pBallx = ballOSX;
    pBally = ballOSY;
    if (frameCount > 30) {
      if (pdeltaX * deltaX < 0 || pdeltaY * deltaY < 0) {
        hit = true;
      } else if (fallSt != true) {
        hit = false;
      }
    }
    pdeltaX = deltaX;
    pdeltaY = deltaY;
  }
}


function draw() {

  var sendData = {
    brickXPos: brick.bX,
    brickYPos: brick.bY
  }

  socket.emit('mouse', sendData);

  //计算当前等级
  currentLevel = lvl.match(/\d+(.\d+)?/g) * 1;

  push();
  translate(width / 2, height / 2);
  scale((sin(millis() * PI / 150) + 1) * 0.003 + 1);
  translate(-width / 2, -height / 2);
  image(bgArr[currentLevel - 1], 500, 500, 1000, 1000);
  pop();

  //渲染球
  imageMode(CENTER);
  image(blArr[currentLevel - 1], ballOSX, ballOSY, 32, 32);

  strokeColor = bkhArr[currentLevel - 1].get(1, 1);
  brickFillv = bkvArr[currentLevel - 1].get(0, (1 - 1 / numOfPlayer) * 80, 50, 200 * (0.8 / numOfPlayer + 0.2));
  brickFillh = bkhArr[currentLevel - 1].get((1 - 1 / numOfPlayer) * 80, 0, 200 * (0.8 / numOfPlayer + 0.2), 50);

  //启动分数条
  touchPt();
  select('#currentScore').html(score);
  select('#Highscore').html(highScore);

  //板冷却时间+接球形变
  brickScaleX = constrain(brickScaleX + 0.05, 0.6, 1);
  brickScaleY = constrain(brickScaleY + 0.05, 0.6, 1);

  brick.brickMove();
  brick.brickRect(brick.bX, brick.bY, brick.bW, brick.bH);

  //击球声  //失球声效
  if (frameCount > 30 && soundEffects == true) {
    if (hit == true) {
      hitSound.setVolume(1);
      hitSound.play();
    }
    if (fallSt == true) {
      fallSt = false;
      fallSound.setVolume(0.1);
      fallSound.play();
      fill(255);
      rect(500, 500, 1000, 1000);
    }
  }
}


function ResetTouchPt() {
  //initial touchpoint
  select('#lvl1').html('▇');
  select('#lvl2').html('▇');
  select('#lvl3').html('▇');
  select('#lvl4').html('▇');
  select('#lvl5').html('▇');
  select('#lvl6').html('▇');
}

function touchPt() {
  lvl = "#lvl1";
  var i;
  for (i = 0; i < 7; i++) {
    if (score < touchpoint[i]) {
      lvl = "#lvl" + i;
      if (i > 1) {
        prevscore = touchpoint[i - 2];
      } else {
        prevscore = 0;
      }
      break;
    } else if (score >= touchpoint[6]) {
      lvl = "#lvl6";
      break;
    }
  }
  ResetTouchPt();
  select(lvl).html('👉▇');
}

function bricks() {
  this.bX = 0;
  this.bY = 0;
  this.bW = 200;
  this.bH = 50;
  var k = height / width;
  var brickOrien;

  //brick move
  this.brickMove = function () {
    var m = k * mouseX - mouseY;
    var n = height - k * mouseX - mouseY;
    var a = mouseX - width / 2;
    var b = mouseY - height / 2;

    //mouseXY -> project brick position
    if (m * n > 0) {
      this.bW = 200;
      this.bH = 50;
      brickOrien = 0;
      if (b > 0) {
        this.bY = height;
        this.bX = height / 2 * a / b + width / 2;
      } else {
        this.bY = 0;
        this.bX = -height / 2 * a / b + width / 2;
      }
    } else if (m * n < 0) {
      this.bW = 50;
      this.bH = 200;
      brickOrien = 1;
      if (a > 0) {
        this.bY = width / 2 * b / a + height / 2;
        this.bX = width;
      } else {
        this.bY = -width / 2 * b / a + height / 2;
        this.bX = 0;
      }
    } else {
      this.bX = -500;
      this.bY = -500;
    }
  }

  //绘制板
  this.brickRect = function (_brickX, _brickY, _brickW, _brickH) {
    //create brick
    var brickWidthPercentage = 0.8 / numOfPlayer + 0.2;

    rectMode(CENTER);
    noFill();
    // rect(_brickX, _brickY, _brickW, _brickH);
    stroke(strokeColor);
    strokeWeight(3);
    imageMode(CENTER);
    // rotate(brickOrien);
    push();

    if (dist(_brickX, _brickY, ballOSX, ballOSY) <= 100 * brickWidthPercentage && hit == true) {
      if (_brickX == 0 || _brickX == width) {
        brickScaleX = 0.6;
      } else if (_brickY == 0 || _brickY == height) {
        brickScaleY = 0.6;
      }
    }
    translate(_brickX, _brickY);
    scale(brickScaleX, brickScaleY);
    translate(-_brickX, -_brickY);

    if (_brickX == 0 || _brickX == width) {
      image(brickFillv, _brickX, _brickY, _brickW, _brickH * brickWidthPercentage);
      rect(_brickX, _brickY, _brickW, _brickH * brickWidthPercentage);
    } else {
      image(brickFillh, _brickX, _brickY, _brickW * brickWidthPercentage, _brickH);
      rect(_brickX, _brickY, _brickW * brickWidthPercentage, _brickH);
    }
    pop();
  }
}

function MuteMusic() { //静音
  if (music.isLooping()) {
    music.pause();
    select('#btnMute').style('color', '#e94e1a');
    select('#btnMute').html('× Music');
  } else {
    music.loop();
    select('#btnMute').style('color', 'white');
    select('#btnMute').html('√ Music');
  }
}

function ToggleSoundEffects() { //关闭音效
  if (soundEffects == true) {
    soundEffects = false;
    select('#btnSoundEffects').style('color', '#e94e1a');
    select('#btnSoundEffects').html('× Sound Effects');
  } else {
    soundEffects = true;
    select('#btnSoundEffects').style('color', 'white');
    select('#btnSoundEffects').html('√ Sound Effects');
  }
}

function ToggleMotionBlur() { //开启运动模糊
  if (motionBlur == true) {
    motionBlur = false;
    select('#btnMB').style('color', '#e94e1a');
    select('#btnMB').html('× Motion Blur');
  } else {
    motionBlur = true;
    select('#btnMB').style('color', 'white');
    select('#btnMB').html('√ Motion Blur');
  }
}

function toggleFullscreen(elem) { //开启全屏
  elem = elem || document.documentElement;
  if (!document.fullscreenElement && !document.mozFullScreenElement &&
    !document.webkitFullscreenElement && !document.msFullscreenElement) {

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      select('#btnFullscreen').html('√ Fullscreen');
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
      select('#btnFullscreen').html('√ Fullscreen');
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
      select('#btnFullscreen').html('√ Fullscreen');
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      select('#btnFullscreen').html('√ Fullscreen');
    }
  } else {

    if (document.exitFullscreen) {
      document.exitFullscreen();
      select('#btnFullscreen').html('× Fullscreen');
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
      select('#btnFullscreen').html('× Fullscreen');
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
      select('#btnFullscreen').html('× Fullscreen');
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
      select('#btnFullscreen').html('× Fullscreen');
    }
  }
}

function touchMoved() {
  return false;
}
