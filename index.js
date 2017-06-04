const fs = require('fs');
const path = require('path');
const {ipcMain, BrowserWindow, shell, app, dialog, clipboard} = require('electron').remote;

const isDirectorySync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isDirectory(),
      isFileSync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

const USER_DATA_PATH = app.getPath('userData');

const SECRET_FUNCTIONS = [
  {
    rgx: 'secrets',
    name: 'Show Secret Functions',
    exec() {
      var text = SECRET_FUNCTIONS.map(({rgx, name})=>`- ${name}:\n\t/${rgx}`).join('\n');
      clipboard.writeText(text);
      dialog.showMessageBox({
        title: 'Secret Functions',
        message: `The following secret functions and their corresponding regular expression triggers have been copied to the clipboard:\n${text}`
      });
    }
  },
  {
    rgx: 'dev-?tools',
    name: 'Toggle DevTools',
    exec() {
      BrowserWindow.getFocusedWindow().toggleDevTools();
    }
  },
  {
    rgx: 'user-?data',
    name: 'Show User Data Directory',
    exec() {
      shell.openItem(USER_DATA_PATH);
    }
  },
  {
    rgx: 'relaunch',
    name: 'Relaunch App',
    exec() {
      app.relaunch();
      app.quit();
    }
  },
  {
    rgx: '(?:set-)?meetings?-lyrics',
    name: 'Choose Meeting Lyrics File',
    exec() {
      var [filePath] = dialog.showOpenDialog({
        title: 'Select file to be stored as meetings-settings.json',
        filters: [{ name: 'JSON', extensions: ['json']}]
      }) || [];
      if (filePath) {
        copyTextFileSync(filePath, path.join(USER_DATA_PATH, 'meetings-settings.json'))
      }
    }
  },
  {
    rgx: '(?:set-)?meetings?-translations',
    name: 'Set Meeting Translations From Clipboard',
    exec() {
      try {
        var objTrans = JSON.parse(clipboard.readText());
        try {
          var filePath = path.join(USER_DATA_PATH, 'meetings-settings.json');
          var settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          var translations = JS.indexBy(settings.properties, 'id').translations.value.forEach(function({ id }) {
            if (JS.has(objTrans, id)) {
              arguments[0].value = objTrans[id];
            }
          });
          fs.writeFileSync(filePath, JSON.stringify(settings), 'utf8');
          dialog.showMessageBox({
            title: 'Translations Modified',
            message: 'Translations have been successfully modified in meetings-settings.json.'
          });
        }
        catch (e) {
          dialog.showErrorBox('No Meetings Translations Added', `The translations could not be added into meetings-settings.json.`);
        }
      }
      catch (e) {
        dialog.showErrorBox('No Meetings Translations Added', `You must first copy the edited meeting translations JSON to the clipboard.`);
      }
    }
  },
  {
    rgx: '(?:get-)?meetings?-translations',
    name: 'Copy Meeting Translations To Clipboard',
    exec() {
      try {
        var filePath = path.join(USER_DATA_PATH, 'meetings-settings.json');
        var settings = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        var translations = JS.indexBy(settings.properties, 'id').translations.value.reduce((carry, {id, value}) => JS(carry).set(id, value).$, {});
        clipboard.writeText(JSON.stringify(translations, 2, 2));
        dialog.showMessageBox({
          title: 'Translations Copied',
          message: 'Translations have been copied to the clipboard as JSON.'
        });
      }
      catch (e) {
        dialog.showErrorBox('No Meetings Translations', `No translations could be found in meetings-settings.json.`);
      }
    }
  }
];
const RGX_SECRET_FUNCTIONS = new RegExp(`/(?:${SECRET_FUNCTIONS.map(({rgx})=>`(${rgx})`).join('|')})$`, 'i');

function copyTextFileSync(filePathSource, filePathTarget) {
  return fs.writeFileSync(filePath2, fs.readFileSync(filePathSource, 'utf8'), 'utf8');
}

$(function() {
  $('#btnOpenMeetingsApp').click(() => ipcMain.emit('start-meetings-app'));
  $('#btnOpenPreachingApp').click(() => ipcMain.emit('start-preaching-app'));
  $('#btnClose').click(() => BrowserWindow.getFocusedWindow().close());

  $('body')
    .on('keypress', (function() {
      const MAX_TIME = 2000;
      var lastTimeStamp = 0;
      var str = '';
      const J = $('#contentWrap');

      function onInterval() {
        if (+new Date - lastTimeStamp > MAX_TIME) {
          J.removeClass('entering-command');
          str = '';
        }
      }

      setInterval(onInterval, 100);

      return function({ key }) {
        var realLastTimeStamp = lastTimeStamp;
        lastTimeStamp = +new Date;

        if (key) {
          if (key == '/') {
            J.addClass('entering-command');
          }
          if (J.hasClass('entering-command')) {
            str += key;
          }



          str.replace(
            RGX_SECRET_FUNCTIONS,
            function() {
              onInterval(lastTimeStamp = 0);
              for (var i = arguments.length - 2; i--;) {
                if (arguments[i]) {
                  return SECRET_FUNCTIONS[i - 1].exec();
                }
              }
            }
          );
        }
      };
    })());

  setTimeout(() => $('#contentWrap').css('opacity', 1), 1000);
});
