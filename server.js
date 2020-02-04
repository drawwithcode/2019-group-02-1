console.log("server is running");

// require('./p5.js');
// require('./p5.collide2d.js');
var express = require("express");


var app = express();

var port = process.env.PORT || 3000;

app.use(express.static('public'));

var server = app.listen(port);

console.log("http://localhost:"+port);

var socket = require('socket.io');

var io = socket(server);

io.on("connection",newConnection);

function newConnection(socket){
  console.log(socket.id);

  socket.on("mouse",mouseMessage);

  function mouseMessage(recieveData){
    console.log(recieveData);

    socket.broadcast.emit("mouseBroadcast",recieveData);
  }
}
