var path = require('path');
const {app, BrowserWindow, Menu} = require('electron');

app.on('ready', function() {
  var mainWindow = new BrowserWindow({
    // https://codepen.io/cwestify/pen/rmdZBN
    icon: path.join(__dirname, 'assets/icons/256×256.png')
  });
  mainWindow.maximize();
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.on('close', function() {
    app.quit();
  });

  // var presenterWindow = new BrowserWindow({
  //   // https://codepen.io/cwestify/pen/rmdZBN
  //   icon: path.join(__dirname, 'assets/icons/256×256.png'),
  //   frame: true,
  //   transparent: false,
  //   shadow: true
  // });
  // presenterWindow.loadURL(`file://${__dirname}/presenter.html`);

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
        }
      ]
    }
  ]));
});
