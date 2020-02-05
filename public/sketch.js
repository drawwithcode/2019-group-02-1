var socket;

var numOfPlayer = 1;
var brick;
var brickScaleX = 1,
  brickScaleY = 1; //板接球形变
// var ball, ballMove;
var ballOSX, ballOSY;
var collideBX, collideBY;
var collideSt = false,
  fallSt = false;

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

let bgArr = [],
  blArr = [],
  bkhArr = [],
  bkvArr = []; //关卡美术资源数组

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
  // ball = new balls();
  brick = new bricks();
  // ball.xSpd = random(-1, 1);
  // ball.ySpd = ball.xSpd / abs(ball.xSpd) * sqrt(1 - ball.xSpd * ball.xSpd);

  //设置选项style
  select('#btnFullscreen').mousePressed(toggleFullscreen);
  select('#btnMute').mouseClicked(MuteMusic);
  // select('#btnMB').mouseClicked(ToggleMotionBlur);
  select('#btnSoundEffects').mouseClicked(ToggleSoundEffects);


  //画布大小自适应
  if (windowHeight < windowWidth) {
    myCanvas.style('height', '90%');
    myCanvas.style('width', 'auto');
    // select("#setting").style('transform','translate(-'++'px,-50%)');
  } else {
    myCanvas.style('height', 'auto');
    myCanvas.style('width', '90%');
  }

  // ballMove = setInterval(ball.move(), 16);

  //接收数据
  socket = io();
  socket.on("mouseBroadcast", newDrawing);
  socket.on("gamestatusemit", downloadGameSt);

  function newDrawing(recievedData) {
    //获取玩家数量
    numOfPlayer = recievedData.numOfPlayer;
    console.log(recievedData);

    //创建其他brick
    var brickWidthPercentage = 0.8 / numOfPlayer + 0.2;
    imageMode(CENTER);
    if (recievedData.brickXPos == 0 || recievedData.brickXPos == width) {
      image(bkvArr[currentLevel - 1], recievedData.brickXPos, recievedData.brickYPos, 50, 200 * brickWidthPercentage);
    } else {
      image(bkhArr[currentLevel - 1], recievedData.brickXPos, recievedData.brickYPos, 200 * brickWidthPercentage, 50);
    }
  }

  function downloadGameSt(recievedData) {
    ballOSX = recievedData.ballxPos;
    ballOSY = recievedData.ballyPos;
    score = recievedData.score;
    highScore = recievedData.highscore;
    collideSt = recievedData.collideStatus;
    fallSt = recievedData.fallStatus;
    collideBX = recievedData.collideBrickX;
    collideBY = recievedData.collideBrickY;
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
  // console.log(currentLevel);


  //Motion Blur
  if (motionBlur == true) {
    push();
    translate(width / 2, height / 2);
    scale((sin(millis() * PI / 150) + 1) * 0.003 + 1);
    translate(-width / 2, -height / 2);
    tint(255, 255, 255, 150);
    image(bgArr[currentLevel - 1], 500, 500, 1000, 1000);
    pop();
  } else {
    push();
    translate(width / 2, height / 2);
    scale((sin(millis() * PI / 150) + 1) * 0.003 + 1);
    translate(-width / 2, -height / 2);
    image(bgArr[currentLevel - 1], 500, 500, 1000, 1000);
    pop();
  }

  //渲染球
  imageMode(CENTER);
  image(blArr[currentLevel - 1], ballOSX, ballOSY, 32, 32);

  //击球声  //失球声效
  if (soundEffects == true) {

    if (collideSt == true) {
      collideSt = false;
      hitSound.setVolume(1);
      hitSound.play();
    }
    if (fallSt == true) {
      fallSt = false;
      fallSound.setVolume(0.1);
      fallSound.play();
    }
  }

  //启动分数条
  touchPt();
  select('#currentScore').html(score);
  select('#Highscore').html(highScore);

  //板冷却时间+接球形变
  // cd = constrain(cd - 1, 0, 10);
  // brickScaleX = constrain(brickScaleX + 0.05, 0.6, 1);
  // brickScaleY = constrain(brickScaleY + 0.05, 0.6, 1);
  // console.log(cd);
  // console.log(brickScaleX + " " + brickScaleY);

  //开启bounce+球跌落+绘制球和板
  // bounce();
  // gameOver();
  // ball.move();
  brick.brickMove();
  brick.brickRect(brick.bX, brick.bY, brick.bW, brick.bH);




}

function ResetTouchPt() {
  //分数条重置
  select('#lvl1').html('▇');
  select('#lvl2').html('▇');
  select('#lvl3').html('▇');
  select('#lvl4').html('▇');
  select('#lvl5').html('▇');
  select('#lvl6').html('▇');
}

function touchPt() {
  //设置各等级分数
  var touchpoint = [0, 5, 10, 15, 20, 25, 30];

  //分数条指针位置
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
      // console.log(lvl);
      // console.log(prevscore);
      break;
    } else if (score >= touchpoint[6]) {
      lvl = "#lvl6";
      break;
    }
  }
  ResetTouchPt();
  select(lvl).html('👉▇');
}

// function gameOver() {
//   //重置球位置
//   if (abs(ball.xPos - width / 2) > width / 2 + 100 || abs(ball.yPos - height / 2) > height / 2 + 100) {
//     if (soundEffects == true) {
//       fallSound.setVolume(0.1);
//       fallSound.play();
//     } //播放跌落音效
//     ball.xPos = random(0.25, 0.75) * width;
//     ball.yPos = random(0.25, 0.75) * height;
//     score = prevscore; //降分数
//   }
// }



// function bounce() {
//   //检测碰撞
//   var hit = collideRectCircle(brick.bX - brick.bW / 2, brick.bY - brick.bH / 2, brick.bW, brick.bH, ball.xPos, ball.yPos, ball.r);
//
//   //碰撞行为
//   if (hit == true && cd == 0) {
//     // console.log("hit");
//     if (soundEffects == true) {
//       hitSound.setVolume(1);
//       hitSound.play();
//     }
//     score++;
//     if (score > highScore) {
//       highScore = score;
//     }
//
//     //random the ball orientation
//     if (brick.bX == 0 || brick.bX == width) {
//       ball.xSpd *= -1;
//       // ball.ySpd = random(-1, 1);
//       ball.ySpd = random(constrain(-brick.bY / height * 2, -1, 0), constrain(2 - 2 * brick.bY / height, 0, 1));
//       cd = 10;
//       brickScaleX = 0.6;
//       // ball.xSpd = ball.ySpd / abs(ball.ySpd) * sqrt(1 - ball.ySpd * ball.ySpd);
//     } else if (brick.bY == 0 || brick.bY == height) {
//       ball.ySpd *= -1;
//       // ball.xSpd = random(-1, 1);
//       ball.xSpd = random(constrain(-brick.bX / width * 2, -1, 0), constrain(2 - 2 * brick.bX / width, 0, 1));
//       cd = 10;
//       brickScaleY = 0.6;
//       // ball.ySpd = ball.xSpd / abs(ball.xSpd) * sqrt(1 - ball.xSpd * ball.xSpd);
//     }
//   }
// }

// function balls() {
//   //球 参数
//   this.r = 32;
//   this.xSpd;
//   this.ySpd;
//   this.xPos = width / 2;
//   this.yPos = height / 2;
//
//
//   //球运动
//   this.move = function () {
//     // this.xPos += this.xSpd * deltaTime * 1;
//     // this.yPos += this.ySpd * deltaTime * 1;
//     this.xPos += this.xSpd * 5;
//     this.yPos += this.ySpd * 5;
//     // console.log(this.xPos);
//     // console.log(this.yPos);
//
//     //绘制球样式
//     noFill();
//     ellipse(this.xPos, this.yPos, this.r);
//     imageMode(CENTER);
//     image(blArr[currentLevel - 1], this.xPos, this.yPos, this.r, this.r);
//   }
//
// }

function bricks() {
  //板 参数
  this.bX = 0;
  this.bY = 0;
  this.bW = 200;
  this.bH = 50;
  var k = height / width;
  var brickOrien;


  //板 运动
  this.brickMove = function () {
    var m = k * mouseX - mouseY;
    var n = height - k * mouseX - mouseY;
    var a = mouseX - width / 2;
    var b = mouseY - height / 2;
    //mouseXY -> brick position
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

    // console.log(this.bX);
    // console.log(this.bY);
  }

  //绘制板
  this.brickRect = function (_brickX, _brickY, _brickW, _brickH) {
    //create brick
    var brickWidthPercentage = 0.8 / numOfPlayer + 0.2;

    rectMode(CENTER);
    noFill();
    rect(_brickX, _brickY, _brickW, _brickH);
    imageMode(CENTER);
    // rotate(brickOrien);
    push();
    translate(_brickX, _brickY);
    // scale(brickScaleX, brickScaleY);
    translate(-_brickX, -_brickY);
    if (_brickX == 0 || _brickX == width) {
      image(bkvArr[currentLevel - 1], _brickX, _brickY, _brickW, _brickH * brickWidthPercentage);
    } else {
      image(bkhArr[currentLevel - 1], _brickX, _brickY, _brickW * brickWidthPercentage, _brickH);
    }
    pop();
    // image();
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
  return false; //CANVAS NO MOVING
}
