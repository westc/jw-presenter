const {ipcMain, BrowserWindow, shell, app} = require('electron').remote;

$(function() {
  $('#btnOpenMeetingsApp').click(() => ipcMain.emit('start-meetings-app'));
  $('#btnOpenPreachingApp').click(() => ipcMain.emit('start-preaching-app'));
  $('#btnClose').click(() => BrowserWindow.getFocusedWindow().close());

  $('body').on('click contextmenu', function({shiftKey, altKey, ctrlKey}) {
    if (shiftKey && altKey && ctrlKey) {
      shell.openItem(app.getPath('userData'));
    }
  });

  setTimeout(() => $('#contentWrap').css('opacity', 1), 1000);
});
