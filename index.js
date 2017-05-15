const fs = require('fs');
const path = require('path');
const { dialog, BrowserWindow } = require('electron').remote;
const mm = require('musicmetadata');

const APP_BASE_PATH = path.dirname(require.main.filename);
const APP_SETTINGS_PATH = path.join(APP_BASE_PATH, 'settings.json');

const audio = $('<audio>').on('ended', onMusicEnd).on('error', function() {
  console.error('Error loading music:', { audio: audio, src: audio.src, arguments: arguments });
  onMusicEnd();
})[0];

const AceModeMarkdown = ace.require('ace/mode/markdown').Mode,
      AceModeText = ace.require('ace/mode/text').Mode,
      AceModeCSS = ace.require('ace/mode/css').Mode,
      AceModeJavaScript = ace.require('ace/mode/javascript').Mode;

var textEditor, textStyleEditor;

var songs = [];

var appSettings = {
  _: (function() {
    var data = { code: '' };
    try {
      data = readFileJSON(APP_SETTINGS_PATH);
    }
    catch (e) {
      console.error(`${e.name}\n${e.message}\n${e.stack}`);
    }
    return data;
  })(),
  set(keyOrValues, value) {
    var isOneValue = JS.typeOf(keyOrValues, 'String'), data = this._;
    if (isOneValue) {
      data[keyOrValues] = value;
    }
    else {
      JS.walk(keyOrValues, function(value, key) {
        data[key] = value;
      });
    }
    this.save();
    return isOneValue ? value : keyOrValues;
  },
  get(key, opt_defaultValue) {
    return JS.has(this._, key) ? this._[key] : opt_defaultValue;
  },
  save: JS.debounce(function() {
    fs.writeFileSync(APP_SETTINGS_PATH, JSON.stringify(this._), 'utf8');
  }, 500)
};

function readFileJSON(filePath) {
  fs.openSync(filePath, 'r+');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatTime(secs) {
  return `${~~(secs / 3600)}:0${~~(secs % 3600 / 60)}:0${secs % 60}`
    .replace(/:0(\d\d)/g, ':$1')
    .replace(/^0:0/, '');
}

function maximizeFontSize(elem, opt_dontApplyFontSize) {
  var canBeBigger, isNotTooMany,
      iters = 0,
      doc = elem.ownerDocument,
      nextSibling = elem.nextSibling,
      newFontSize = 0.5,
      diff = 0.5,
      fontSize = elem.style.fontSize,
      display = elem.style.display;

  elem.style.display = 'block';

  do {
    newFontSize += diff;
    elem.style.fontSize = `${newFontSize}px`;
    if (canBeBigger = (elem.scrollWidth <= elem.offsetWidth && elem.scrollHeight <= elem.offsetHeight)) {
      diff *= 2;
    }
    else {
      newFontSize -= diff;
      diff /= 2;
    }
    isNotTooMany = iters++ < 99;
  } while((!canBeBigger || diff >= 0.5) && isNotTooMany);

  elem.style.display = display;

  if (!isNotTooMany || opt_dontApplyFontSize) {
    elem.style.fontSize = fontSize;
  }

  return isNotTooMany ? newFontSize : undefined;
}

// https://gist.github.com/westc/f6de681820d78df64c01e10bfd03f985
function getVideoImage(videoPath, secs, callback) {
  var me = this, video = document.createElement('video');
  video.onloadedmetadata = function() {
    if ('function' === typeof secs) {
      secs = secs(this.duration);
    }
    this.currentTime = Math.min(Math.max(0, (secs < 0 ? this.duration : 0) + secs), this.duration);
  };
  video.onseeked = function(e) {
    var canvas = document.createElement('canvas');
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.src = canvas.toDataURL();
    callback.call(me, img, this.currentTime, e);
  };
  video.onerror = function(e) {
    callback.call(me, undefined, undefined, e);
  };
  video.src = videoPath.replace(/\?/g, '%3F');
}

function recurseDirSync(currentDirPath, depthLeft, opt_filter) {
  depthLeft--;

  var result = {
    isFile: false,
    path: currentDirPath,
    stat: fs.statSync(currentDirPath),
    files: []
  };

  fs.readdirSync(currentDirPath).forEach(function (name) {
    var filePath = path.join(currentDirPath, name),
      stat = fs.statSync(filePath),
      isFile = stat.isFile();
    if ((isFile || stat.isDirectory()) && (!opt_filter || opt_filter(filePath, isFile, stat))) {
      result.files.push((isFile || !depthLeft) ? { isFile: isFile, path: filePath, stat: stat } : recurseDirSync(filePath, depthLeft, opt_filter));
    }
  });
  return result;
}

var isDirectorySync = (pathToCheck) => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isDirectory(),
    isFileSync = (pathToCheck) => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

function loadSettings() {
  var songsDir = appSettings.get('songsDir'),
      bgDir = appSettings.get('bgDir'),
      displayDir = appSettings.get('displayDir'),
      texts = appSettings.get('texts');

  if (songsDir) {
    if (!isDirectorySync(songsDir)) {
      appSettings.set('songsDir', songsDir = undefined);
    }
    setSongsDir(songsDir);
  }

  if (bgDir) {
    if (!isDirectorySync(bgDir)) {
      appSettings.set('bgDir', bgDir = undefined);
    }
    $('#txtBGDir').val(bgDir);
  }

  if (displayDir) {
    if (!isDirectorySync(displayDir)) {
      appSettings.set('displayDir', displayDir = undefined);
    }
    setDisplayDir(displayDir);
  }

  if (!texts) {
    appSettings.set('texts', texts = [{ name: 'Text #1', text: '', style: '' }]);
  }
  texts.forEach(function() {

  });

  $('#tdWrapAllTabs [data-toggle=tab]').filter((i, elem) => $(elem).text() == appSettings.get('mainTabText')).click();
}

function setSongsDir(dirPath) {
  $('#txtSongsDir').val(dirPath);
  var oldSongsIndex = appSettings.get('songsIndex', {}),
      newSongsIndex = {},
      f = JS.on0(function() {
        appSettings.set('songsIndex', newSongsIndex);
      });
  recurseDirSync(dirPath, Infinity, function(filePath, isFile, stat) {
    if (isFile && /\.mp3$/i.test(filePath)) {
      var title = oldSongsIndex[filePath];
      if (title) {
        newSongsIndex[filePath] = title;
      }
      else {
        f(true);
        mm(fs.createReadStream(filePath), function (err, metadata) {
          if (!err) {
            newSongsIndex[filePath] = metadata.title;
          }
          f();
        });
      }
    }
    return true;
  });
}

function setDisplayDir(dirPath) {
  $('#txtDisplayDir').val(dirPath);

  var jDisplayList = $('#displayList').html('');

  recurseDirSync(dirPath, 3, function(filePath, isFile, stat) {
    if (isFile && /\.(png|jpe?g|gif|mp4)$/i.test(filePath)) {
      var jListItem = $('<div class="list-item">').appendTo(jDisplayList);
      if (/\.mp4$/.test(filePath)) {
        mm(fs.createReadStream(filePath), function (err, metadata) {
          if (err) {
            jListItem.remove();
          }
          else {
            getVideoImage(filePath, (t) => t / 3, (img) => setDisplayListItem(jListItem, filePath, metadata, img));
          }
        });
      }
      else {
        setDisplayListItem(jListItem, filePath, { title: path.parse(filePath).name });
      }

      // displayList
    }
    return !isFile && !/^\./.test(path.basename(filePath));
  });
}

// data = { title: String }
function setDisplayListItem(jListItem, filePath, data, opt_img) {
  if (!opt_img) {
    opt_img = new Image();
    opt_img.src = filePath;
  }
  $('<table border="0" cellpadding="0" cellspacing="0"><tbody><tr><td></td><td></td></tr></tbody></table>')
    .addClass('list-item-wrap')
    .find('td:eq(0)').addClass('image-wrap').append(opt_img).end()
    .find('td:eq(1)').addClass('content-wrap').append($('<div>').addClass('title').text(data.title)).end()
    .appendTo(jListItem);
}

function onMusicEnd() {
  audio.pause();
  if ($('#btnBGMusic').hasClass('checked')) {
    audio.src = JS.random(Object.keys(appSettings.get('songsIndex')));
    audio.play();
  }
}

$(function() {
  JS.addTypeOf(jQuery, 'jQuery');

  $('#btnSetSongsDir').click(function() {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, function(dirPaths) {
      if (dirPaths) {
        var dirPath = dirPaths[0];
        appSettings.set('songsDir', dirPath);
        setSongsDir(dirPath);
      }
    });
  });

  $('#btnSetDisplayDir').click(function() {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, function(dirPaths) {
      if (dirPaths) {
        var dirPath = dirPaths[0];
        appSettings.set('displayDir', dirPath);
        setDisplayDir(dirPath);
      }
    });
  });

  $('#btnBGMusic').click(function() {
    $(this).toggleClass('checked');
    onMusicEnd();
  });

  $('#lblText').click(function() {
    textEditor.focus();
  });

  $('#tdWrapAllTabs [data-toggle=tab]').click(function() {
    appSettings.set('mainTabText', $(this).text());
  });

  textEditor = ace.edit('divText');
  textEditor.session.setMode(new AceModeMarkdown());

  textStyleEditor = ace.edit('divTextStyle');
  textStyleEditor.session.setMode(new AceModeCSS());

  loadSettings();
});
