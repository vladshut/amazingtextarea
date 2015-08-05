$(function() {
  var $amazingtextarea = $('#amazingtextarea'); // Amazing textarea!

  var socket = io();

  // emit event if user change textarea content
  $amazingtextarea.bind('input propertychange', function() {
    socket.emit('new changes', $amazingtextarea.val());
  });

  // update textarea content if other users change it
  socket.on('new changes', function (data) {
    $amazingtextarea.val(data.text);
  });

  // emit new user event
  socket.emit('new user');

});
