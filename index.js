// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// default text
var text = 'Edit me!';

io.on('connection', function (socket) {

  // when the client emits 'new changes', this listens and executes
  socket.on('new changes', function (data) {

    // saves updated content
    text = data;

    // tells the client to execute 'new changes'
    socket.broadcast.emit('new changes', {
      text: data
    });
  });

  // when new user is connected
  socket.on('new user', function () {

    // sends him newest version of content
    socket.emit('new changes', {
      text: text
    });
  });
});
