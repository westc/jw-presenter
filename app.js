var path = require('path');
const {app, BrowserWindow, Menu, shell, powerSaveBlocker, ipcMain} = require('electron');

var isMeetingAppOpen, isServiceAppOpen;

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
  win.name = 'opener';
});

ipcMain.on('start-meeting-app', function() {
  if (isMeetingAppOpen) { return; }
  isMeetingAppOpen = true;

  // Prevents display(s) from sleeping
  var PREVENT_DISPLAY_SLEEP_ID = powerSaveBlocker.start('prevent-display-sleep');

  var quitCallCount = 0;
  function onQuit() {
    !winMain.isDestroyed() && winMain.close();
    !winPresenter.isDestroyed() && winPresenter.close();

    // Re-enable display auto sleep
    powerSaveBlocker.stop(PREVENT_DISPLAY_SLEEP_ID);

    isMeetingAppOpen = false;
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
});
