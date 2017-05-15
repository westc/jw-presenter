const path = require('path');
const { BrowserWindow } = require('electron').remote;
var winMe = BrowserWindow.getAllWindows().filter(function(win) {
  return path.basename(win.getURL()) == 'presenter.html';
})[0];

winMe.on('show-video', function() {

});

winMe.on('show-image', function() {

});