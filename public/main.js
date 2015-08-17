$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize varibles
  var $window = $(window);
  var $amazingtextarea = $('#amazingtextarea'); // Amazing textarea!
  var $usersarea = $('#usersarea');
  var $usernameInput = $('#usernameInput'); // Input for username

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.edit.page'); // The edit page

  var socket = io();
  
  // Prompt for setting a username
  var username;
  var userNames = {};
  var typingUsers = [];
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  // update textarea content if other users change it
  socket.on('new changes', function (data) {
    var caretPos = doGetCaretPosition(document.getElementById('amazingtextarea'));
    $amazingtextarea.val(data.text);
    setCaretPosition(document.getElementById('amazingtextarea'), caretPos);
  });

  // updates users array and refill users area with updated user array
  socket.on('user gone', function(data) {
    delete(users[data.userName]);
    updateUsersArea();
  })

// FUNCTIONS

function updateUserList() {
  $usersarea.html(''); 
  $.each(userNames, function(i, item) {
      
      var userText = item;

      if ($.inArray(item, typingUsers) !== -1) {
        userText += ' <small class="typing">editing...<small>';
      }
      // Don't fade the message in if there is an 'X was typing'
      var $usernameDiv = '<li class="username" style="color: ' + getUsernameColor(item) + '">' + userText + '</li>';
      $usersarea.append($usernameDiv); 
    });
}

function doGetCaretPosition (ctrl) {
  var CaretPos = 0; // IE Support
  if (document.selection) {
  ctrl.focus ();
    var Sel = document.selection.createRange ();
    Sel.moveStart ('character', -ctrl.value.length);
    CaretPos = Sel.text.length;
  }
  // Firefox support
  else if (ctrl.selectionStart || ctrl.selectionStart == '0')
    CaretPos = ctrl.selectionStart;
  return (CaretPos);
}

function setCaretPosition(ctrl, pos){
  if(ctrl.setSelectionRange)
  {
    ctrl.focus();
    ctrl.setSelectionRange(pos,pos);
  }
  else if (ctrl.createTextRange) {
    var range = ctrl.createTextRange();
    range.collapse(true);
    range.moveEnd('character', pos);
    range.moveStart('character', pos);
    range.select();
  }
}

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $amazingtextarea.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Adds the visual chat typing message
  function addUserTyping (username) {
    typingUsers.push(username);
    updateUserList();
  }

  // Removes the visual chat typing message
  function removeUserTyping (username) {
    typingUsers = jQuery.grep(typingUsers, function(value) {
      return value != username;
    });
    updateUserList();
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (!username) {
        setUsername();
      }
    }
  });

  $amazingtextarea.on('input', function() {

    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $amazingtextarea.click(function () {
    $amazingtextarea.focus();
  });

    // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    $amazingtextarea.val(data.text);
    userNames = data.usernames;
    updateUserList();
    // emit event if user change textarea content
    $amazingtextarea.bind('input propertychange', function() {
      socket.emit('new changes', $amazingtextarea.val());
      updateTyping();
    });
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    userNames[data.username] = data.username;
    updateUserList();
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    if (data !== null && data !== undefined) {
      delete(userNames[data.username]);
      updateUserList();
      removeUserTyping(data.username);
    }
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addUserTyping(data.username);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeUserTyping(data.username);
  });

});
