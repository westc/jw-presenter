var path = require('path');
const {app, BrowserWindow, Menu, shell, powerSaveBlocker, ipcMain} = require('electron');
const JS = require('./YourJS/JS.js');

var appWindows = {
  opener: [],
  meeting: [],
  preaching: []
};

function onWindowClose(nameToClear) {
  if (!JS(appWindows).set(nameToClear, []).map((a) => a.length).values().sum().$) {
    app.quit();
  }
}

app.on('ready', function() {
  var win = new BrowserWindow({
    icon: path.join(__dirname, 'assets/icons/256×256.png'),
    frame: false,
    transparent: true,
    shadow: false,
    height: 512,
    width: 512
  });
  win.loadURL(`file://${__dirname}/index.html`);
  win.once('focus', function() {
    var menu = Menu.getApplicationMenu();
    win.on('focus', function() {
      Menu.setApplicationMenu(menu);
    });
  });
  win.on('close', () => onWindowClose('opener'));

  appWindows.opener = [win];
});

ipcMain.on('start-preaching-app', () => {
  if (appWindows.preaching.length) { return; }

  function setMenu() {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {
        label: "JW Presenter",
        submenu: [
          { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: function() { app.quit(); } }
        ]
      },
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
            click() { mainWindow.reload(); }
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
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        ]
      }
    ]));
  }

  var mainWindow = new BrowserWindow({
    // https://codepen.io/cwestify/pen/eWVNwx
    icon: path.join(__dirname, 'assets/icons/256×256.png')
  });
  mainWindow.maximize();
  mainWindow.on('focus', setMenu);
  mainWindow.once('show', setMenu);
  mainWindow.loadURL('file:///' + __dirname + '/preaching/index.html');
  mainWindow.on('close', () => onWindowClose('preaching'));

  appWindows.preaching = [mainWindow];
});

ipcMain.on('start-meeting-app', () => {
  if (appWindows.meeting.length) { return; }

  // Prevents display(s) from sleeping
  var PREVENT_DISPLAY_SLEEP_ID = powerSaveBlocker.start('prevent-display-sleep');

  var quitCallCount = 0;
  function onQuit() {
    !winMain.isDestroyed() && winMain.close();
    !winPresenter.isDestroyed() && winPresenter.close();

    // Re-enable display auto sleep
    powerSaveBlocker.stop(PREVENT_DISPLAY_SLEEP_ID);

    onWindowClose('meeting');
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
          // {
          //   label: 'Reload',
          //   accelerator: 'CmdOrCtrl+R',
          //   role: 'reload'
          // },
          // { type: 'separator' },
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
    icon: path.join(__dirname, 'assets/icons/256×256.png'),
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
    icon: path.join(__dirname, 'assets/icons/256×256.png')
  });
  winMain.name = 'main';
  winMain.on('focus', setMenu);
  winMain.once('show', setMenu);
  winMain.once('close', onQuit);
  winMain.loadURL(`file://${__dirname}/meetings/index.html`);

  appWindows.meeting = [winMain, winPresenter];
});
