const {ipcMain, BrowserWindow} = require('electron').remote;

$(function() {
  $('#btnOpenMeetingApp').click(() => ipcMain.emit('start-meeting-app'));
  $('#btnClose').click(() => BrowserWindow.getFocusedWindow().close());

  setTimeout(() => $('#contentWrap').css('opacity', 1), 1000);
});