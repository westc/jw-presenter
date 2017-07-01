const path = require('path');
const fs = require('fs');
const os = require('os');
const {app, BrowserWindow, Menu, shell, powerSaveBlocker, ipcMain} = require('electron');
const JS = require('./YourJS/JS');

const IS_MAC = /^darwin/.test(os.platform());

var isFileSync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

var appWindows = {
  opener: [],
  meetings: [],
  preaching: [],
  'big-it': []
};

function onWindowClose(nameToClear) {
  if (!JS(appWindows).set(nameToClear, []).map((a) => a.length).values().sum().$) {
    app.quit();
  }
}

function focusOrOpen(id, fnIfNotOpen) {
  for (var windows = appWindows[id], i = windows.length; i--; ) {
    windows[i].show();
    if (!i) { return; }
  }

  appWindows[id] = fnIfNotOpen();
}

app.on('ready', function() {
  function setMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: 'Big It!',
        submenu: [
          { label: 'Close', accelerator: 'CmdOrCtrl+W', click: () => BrowserWindow.getFocusedWindow().close() }
        ]
      }
    ]));
  }

  var win = new BrowserWindow({
    icon: path.join(__dirname, 'assets/icons/256.png'),
    frame: !IS_MAC,
    transparent: IS_MAC,
    shadow: !IS_MAC,
    height: 512,
    width: 512,
    useContentSize: true,
    center: true
  });
  win.loadURL(`file://${__dirname}/index.html`);
  win.on('focus', setMenu);
  win.once('show', setMenu);
  win.on('close', () => onWindowClose('opener'));

  appWindows.opener = [win];
});

ipcMain.on('start-big-it-app', () => {
  focusOrOpen('big-it', () => {
    function setMenu() {
      Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
          label: "Edit",
          submenu: [
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
            { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
            { type: 'separator' },
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
          ]
        },
        {
          label: "View",
          submenu: [
            {
              label: 'Reload',
              accelerator: 'CmdOrCtrl+R',
              click() { win.reload(); }
            },
            { type: 'separator' },
            {
              label: 'Toggle Dev Tools',
              accelerator: 'CmdOrCtrl+Alt+I',
              click() {
                var focusedWindow = BrowserWindow.getFocusedWindow();
                focusedWindow && focusedWindow.webContents.toggleDevTools();
              }
            },
            { type: 'separator' },
            {
              label: 'Toggle Fullscreen',
              role: 'togglefullscreen',
              click: function() {
                win.setFullScreen(!win.isFullScreen());
              }
            }
          ]
        }
      ]));
    }

    var win = new BrowserWindow({
      // https://codepen.io/cwestify/pen/eWVNwx
      icon: path.join(__dirname, 'assets/icons/256.png')
    });
    win.maximize();
    win.on('focus', setMenu);
    win.once('show', setMenu);
    win.loadURL('file:///' + __dirname + '/big-it/index.html');
    win.on('close', () => onWindowClose('big-it'));
    win.name = 'big-it';

    return [win];
  });
});

ipcMain.on('start-preaching-app', () => {
  focusOrOpen('preaching', function() {
    function setMenu() {
      Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
          label: "Edit",
          submenu: [
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
            { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
            { type: 'separator' },
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
          ]
        },
        {
          label: "View",
          submenu: [
            {
              label: 'Reload',
              accelerator: 'CmdOrCtrl+R',
              click() { win.reload(); }
            },
            { type: 'separator' },
            {
              label: 'Toggle Dev Tools',
              accelerator: 'CmdOrCtrl+Alt+I',
              click() {
                var focusedWindow = BrowserWindow.getFocusedWindow();
                focusedWindow && focusedWindow.webContents.toggleDevTools();
              }
            },
            { type: 'separator' },
            {
              label: 'Toggle Fullscreen',
              role: 'togglefullscreen',
              click: function() {
                win.setFullScreen(!win.isFullScreen());
              }
            }
          ]
        }
      ]));
    }

    var win = new BrowserWindow({
      // https://codepen.io/cwestify/pen/eWVNwx
      icon: path.join(__dirname, 'assets/icons/256.png')
    });
    win.maximize();
    win.on('focus', setMenu);
    win.once('show', setMenu);
    win.loadURL('file:///' + __dirname + '/preaching/index.html');
    win.on('close', () => onWindowClose('preaching'));

    return [win];
  });
});

ipcMain.on('start-meetings-app', () => {
  focusOrOpen('meetings', function() {
    // Prevents display(s) from sleeping
    var PREVENT_DISPLAY_SLEEP_ID = powerSaveBlocker.start('prevent-display-sleep');

    var quitCallCount = 0;
    function onQuit() {
      !winMain.isDestroyed() && winMain.close();
      !winPresenter.isDestroyed() && winPresenter.close();

      // Re-enable display auto sleep
      powerSaveBlocker.stop(PREVENT_DISPLAY_SLEEP_ID);

      onWindowClose('meetings');
    }

    function setMenu() {
      Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
          label: 'JW Presenter',
          submenu: [
            {
              label: 'Relaunch',
              accelerator: 'CmdOrCtrl+Shift+R',
              click() { app.relaunch(); app.quit(); }
            },
            { type: 'separator' },
            { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click() { app.quit(); } }
          ]
        },
        {
          label: 'Edit',
          submenu: [
            { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
            { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
            { type: 'separator' },
            { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
          ]
        },
        {
          label: 'View',
          submenu: [
            {
              label: 'Toggle Dev Tools',
              accelerator: 'CmdOrCtrl+Alt+I',
              click() {
                var focusedWindow = BrowserWindow.getFocusedWindow();
                focusedWindow && focusedWindow.webContents.toggleDevTools();
              }
            },
            { type: 'separator' },
            {
              label: 'Toggle Fullscreen',
              role: 'togglefullscreen',
              click() {
                var focusedWindow = BrowserWindow.getFocusedWindow();
                focusedWindow && focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
              }
            },
            {
              label: 'Maximize',
              accelerator: 'CmdOrCtrl+Alt+M',
              click() {
                var win = BrowserWindow.getFocusedWindow();
                win[`${win.isMaximized()?'un':''}maximize`]();
              }
            }
          ]
        },
        {
          label: 'Help',
          role: 'help',
          submenu: [
            {
              label: 'Learn More (GitHub)',
              click: () => shell.openExternal('https://github.com/westc/jw-presenter#readme')
            }
          ]
        }
      ]));
    }

    // Load the presenter first so that any settings will propagate into it afterwards (eg. presenter-css)
    var winPresenter = new BrowserWindow({
      // https://codepen.io/cwestify/pen/rmdZBN
      icon: path.join(__dirname, 'assets/icons/256.png'),
      frame: true,
      transparent: false,
      shadow: true
    });
    winPresenter.name = 'presenter';
    winPresenter.on('focus', setMenu);
    winPresenter.once('close', onQuit);
    winPresenter.loadURL(`file://${__dirname}/meetings/presenter.html`);
    winPresenter.maximize();

    var winMain = new BrowserWindow({
      // https://codepen.io/cwestify/pen/rmdZBN
      icon: path.join(__dirname, 'assets/icons/256.png'),
      width: 1000,
      useContentSize: true,
      center: true
    });
    winMain.name = 'main';
    winMain.on('focus', setMenu);
    winMain.once('show', setMenu);
    winMain.once('close', onQuit);
    winMain.loadURL(`file://${__dirname}/meetings/index.html`);

    return [winMain, winPresenter];
  });
});
