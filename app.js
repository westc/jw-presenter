var path = require('path');
const {app, BrowserWindow, Menu, shell, powerSaveBlocker} = require('electron');

// Prevents display(s) from sleeping
const PREVENT_DISPLAY_SLEEP_ID = powerSaveBlocker.start('prevent-display-sleep');

app.on('quit', function() {
  // Re-enable display auto sleep
  powerSaveBlocker.stop(PREVENT_DISPLAY_SLEEP_ID);
});

app.on('ready', function() {
  // Load the presenter first so that any settings will propagate into it afterwards (eg. presenter-css)
  var winPresenter = new BrowserWindow({
    // https://codepen.io/cwestify/pen/rmdZBN
    icon: path.join(__dirname, 'assets/icons/256×256.png'),
    frame: true,
    transparent: false,
    shadow: true
  });
  winPresenter.name = 'presenter';
  winPresenter.loadURL(`file://${__dirname}/presenter.html`);
  winPresenter.on('close', () => app.quit());
  winPresenter.maximize();

  var winMain = new BrowserWindow({
    // https://codepen.io/cwestify/pen/rmdZBN
    icon: path.join(__dirname, 'assets/icons/256×256.png')
  });
  winMain.name = 'main';
  winMain.loadURL(`file://${__dirname}/index.html`);
  winMain.on('close', () => app.quit());

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'JW Videos',
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
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          role: 'reload'
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
});
