const fs = require('fs');
const path = require('path');
const { dialog, BrowserWindow, ipcMain, shell } = require('electron').remote;
const mm = require('musicmetadata');
const markdown = new (require('showdown').Converter);

const { presenter: winPresenter, main: winMain } = JS.indexBy(BrowserWindow.getAllWindows(), 'name');

const APP_BASE_PATH = path.dirname(require.main.filename);
const APP_SETTINGS_PATH = path.join(APP_BASE_PATH, 'settings.json');

const THUMB_WIDTH = 300;

const SONG_CODES = [1102009094,1102009115,1102009080,1102009121,1102009129,1102009124,1102009098,1102009083,1102009087,1102009089,1102009122,1102009151,1102009095,1102009096,1102009099,1102009100,1102009101,1102009102,1102009103,1102009097,1102009104,1102009105,1102009106,1102009107,1102009163,1102009109,1102009110,1102009111,1102009113,1102009116,1102009117,1102009118,1102009119,1102009120,1102009123,1102009141,1102009112,1102009125,1102009127,1102009170,1102009156,1102009126,1102009128,1102009130,1102009131,1102009145,1102009144,1102009148,1102009149,1102009150,1102009153,1102009154,1102009162,1102009168,1102009108,1102009142,1102009210,1102009202,1102009160,1102009212,1102009208,1102009200,1102009091,1102009172,1102009140,1102009181,1102009157,1102009171,1102009209,1102009161,1102009137,1102009188,1102009152,1102009178,1102009164,1102009197,1102009093,1102009193,1102009186,1102009189,1102009173,1102009155,1102009134,1102009092,1102009174,1102009166,1102009143,1102009169,1102009138,1102009180,1102009139,1102009136,1102009185,1102009198,1102009204,1102009207,1102009147,1102009082,1102009158,1102009114,1102009086,1102009159,1102009084,1102009194,1102009196,1102009088,1102009165,1102009175,1102009167,1102009135,1102009132,1102009184,1102009183,1102009090,1102009146,1102009133,1102009081,1102009187,1102009211,1102009179,1102009192,1102009191,1102009203,1102009205,1102009085,1102009176,1102009177,1102009199,1102009190,1102009213,1102009201,1102009195,1102009206,1102009214,1102009182,1102014550,1102014551,1102014552,1102014554,1102014555,1102014556,1102014557,1102014558,1102014559,1102014560,1102014561,1102014562,1102014563,1102014564,1102014565,1102014566,1102014567,1102014568,1102014569];

const audio = $('<audio>').on('ended', onMusicEnd).on('error', function() {
  console.error('Error loading music:', { audio: audio, src: audio.src, arguments: arguments });
  onMusicEnd();
})[0];

const AceModeMarkdown = ace.require('ace/mode/markdown').Mode,
      AceModeText = ace.require('ace/mode/text').Mode,
      AceModeCSS = ace.require('ace/mode/css').Mode,
      AceModeJavaScript = ace.require('ace/mode/javascript').Mode;

var textEditor, propCodeEditor;

var lastSongIndex,
    songs = [],
    resizers = [];

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

ipcMain.on('ended-presenter-video', function() {
  $('.btn.show-video').removeClass('active');
});

ipcMain.on('update-presenter-css', function(code) {
  var style = $('#presenterStyle')[0];
  if (style.styleSheet && !style.sheet) {
    style.styleSheet.cssText = code;
  }
  else {
    style.innerHTML = '';
    style.appendChild(document.createTextNode(code));
  }
});

ipcMain.on('resend-default-text', function() {
  var defaultTextIndex = appSettings.get('defaultTextIndex');
  if (defaultTextIndex != undefined) {
    var texts = appSettings.get('texts', []);
    var text = texts[defaultTextIndex];
    if (text) {
      ipcMain.emit('set-default-text', text.text);
    }
  }
});

function adjustTextPreviewZoom() {
  var jBody = $('#divTextPreview .presenter-aspect-ratio-wrap.body');
  jBody.find('> *').css('zoom', jBody.width() / winPresenter.getContentSize()[0]);
}

winMain.on('resize', JS.debounce(adjustTextPreviewZoom, 250));

// Cause target="_blank" links to open in the default browser
winMain.webContents.on('new-window', function(event, url) {
  if (/^https?:\/\//i.test(url)) {
    BrowserWindow.getAllWindows().forEach((w) => !w.name && w.close());
    shell.openExternal(url);
  }
});

winPresenter.on('resize', JS(function() {
  adjustTextPreviewZoom();

  var [width, height] = winPresenter.getContentSize();
  updateCssRule(
    `
      #displayPanel .image-wrap > div {
        width: ${THUMB_WIDTH}px;
      }
    `,
    'thumb-width'
  );
  updateCssRule(
    `
      .presenter-aspect-ratio-wrap {
        padding-bottom: ${100*height/width}%;
      }
    `,
    'aspect-ratio'
  );
  updateCssRule(
    `
      .image-wrap .presenter-aspect-ratio-wrap.body > * {
        zoom: ${THUMB_WIDTH/width};
      }
    `,
    'image-wrap-zoom'
  );

  // Go through and resize all of the elements that have thumbnails based on the presenter window size.
  for (var elem, fnResizer, i = 0; i < resizers.length; i += 2) {
    elem = resizers[i];
    if (elem.ownerDocument) {
      resizers[i + 1]();
    }
    else {
      resizers.splice(i, 2);
      i -= 2;
    }
  }
}).debounce(250).callReturn().$);

function updateCssRule(rule, opt_id) {
  var sheet = $('#dynamicStyle')[0].sheet;
  var ids = updateCssRule.ids = updateCssRule.ids || [];
  for (var l = sheet.cssRules.length, i = opt_id == undefined ? l : 0; i < l && ids[i] != opt_id; i++);
  if (i == l) {
    sheet.insertRule(rule, i);
    ids[i] = opt_id = opt_id || `rule${i}`;
  }
  else {
    sheet.deleteRule(i);
    if (rule) {
      sheet.insertRule(rule, i);
    }
    else {
      ids.splice(i, 1);
    }
  }
  return opt_id;
}

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

function getAudioDuration(audioPath, callback) {
  JS.dom({
    _: 'audio',
    src: audioPath.replace(/\?/g, '%3F'),
    onloadedmetadata: function(e) {
      callback(e, this.duration);
    },
    onerror: callback
  });
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

var isDirectorySync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isDirectory(),
    isFileSync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

function loadSettings() {
  $('#tdWrapAllTabs [data-toggle=tab]').filter((i, elem) => $(elem).text() == appSettings.get('mainTabText')).click();

  JS.walk(appSettings.get('collapsibles', {}), (action, id) => $(`#${id}`).collapse(action));

  var songsDir = appSettings.get('songsDir'),
      bgDir = appSettings.get('bgDir'),
      displayDir = appSettings.get('displayDir'),
      texts = appSettings.get('texts');

  if (songsDir) {
    if (!isDirectorySync(songsDir)) {
      appSettings.set('songsDir', songsDir = undefined);
      appSettings.set('songs', songs = []);
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
    appSettings.set('texts', texts = [{ name: 'Year Text', text: '' }]);
  }
  texts.forEach((text, i) => addTextToList(text, i, !i));

  var properties = appSettings.get('properties', []).sort(({ name: name1 }, { name: name2 }) => JS.compare(name1, name2));
  appSettings.set('properties', properties);
  JS.walk(properties, function(prop, i) {
    $('#propsList').append(JS.dom({
      _: 'li',
      $: {
        _: 'a',
        href: '#',
        text: prop.name,
        onclick(e) {
          e.preventDefault();
          selectProperty(prop, i);
        }
      }
    }));

    if (prop.id == 'presenter-css') {
      ipcMain.emit('update-presenter-css', prop.value);
    }

    if (!i) {
      selectProperty(prop, i);
    }
  });
}

function addTextToList(text, i, selectIt) {
  $('#textsList > .divider:eq(0)').before(JS.dom({
    _: 'li',
    cls: 'text',
    $: {
      _: 'a',
      href: '#',
      text: text.name,
      onclick(e) {
        e.preventDefault();
        selectText(text, i);
      }
    }
  }));

  setDisplayTextListItem($('<div class="list-item">').appendTo('#collapseDisplayTexts > .panel-body'), text, i);

  if (selectIt) {
    selectText(text, i);
  }
}

function setSongsDir(dirPath) {
  var jMiddle = $(`
        <div class="middler-wrap">
          <div class="middler-table">
            <div class="middler-content">
              <progress value="0" max="0"></progress>
            </div>
          </div>
        </div>
      `).appendTo('body'),
      eProgress = jMiddle.find('progress')[0];

  $('#txtSongsDir').val(dirPath);

  var f = JS.on0(function() {
        jMiddle.remove();
        appSettings.set('songs', songs.sort((a, b) => compareFileNames(a.title, b.title)));
        showSongsList();
      }),
      oldSongsByPath = JS.indexBy(appSettings.get('songs', []), 'path');

  recurseDirSync(dirPath, Infinity, function(filePath, isFile, stat) {
    var relFilePath = filePath.replace(new RegExp(`^${JS.quoteRegExp(dirPath)}`), '');
    if (isFile && /\.mp3$/i.test(relFilePath)) {
      eProgress.max++;
      var song = oldSongsByPath[relFilePath];
      // if the old song is found simply add it to the current list
      if (song) {
        songs.push(song);
        eProgress.value++;
      }
      // if the old song is not found parse the file and add it to the current list
      else {
        f(true);
        mm(fs.createReadStream(filePath), function (err, metadata) {
          if (err) {
            eProgress.max--;
            f();
          }
          else {
            getAudioDuration(filePath, function(e, duration) {
              if (e.type == 'error') {
                eProgress.max--;
              }
              else {
                songs.push({
                  path: relFilePath,
                  title: executePropFunc('song-title-parser', [filePath, metadata.title]),
                  duration
                });
                eProgress.value++;
              }
              f();
            });
          }
        });
      }
    }
    return true;
  });
  f(0);
}

function compareFileNames(a, b) {
  a = a.match(/\D+|\d+/g);
  b = b.match(/\D+|\d+/g);
  for (var ai, bi, i = 0, l = Math.min(a.length, b.length); i < l; i++) {
    ai = /\d/.test(ai = a[i]) ? parseInt(ai, 10) : ai;
    bi = /\d/.test(bi = b[i]) ? parseInt(bi, 10) : bi;
    if (ai != bi) {
      return ai < bi ? -1 : 1;
    }
  }
}

var playSongAt = i => playAudio(appSettings.get('songsDir') + songs[lastSongIndex = i].path);

function playAudio(path) {
  audio.pause();
  audio.currentTime = 0;
  audio.src = path.replace(/\?/g, '%3F');
  audio.play();

  $('.btn.show-video, .btn.show-image, .btn.show-text').removeClass('active');
  ipcMain.emit('reset-presenter');
}

function showSongsList() {
  $('#songsList').html('').append(
    songs.map((song, i) => JS.dom({
      _: 'div',
      cls: 'song-line',
      $: [
        {
          _: 'button',
          cls: 'btn btn-default btn-play',
          $: [
            { _: 'span', cls: 'glyphicon glyphicon-play', 'aria-hidden': true },
            ' Play Song'
          ],
          onclick: function() {
            if ($(this).hasClass('active')) {
              audio.pause();
            }
            else {
              playSongAt(i);
              $('#btnBGMusic, .btn-play').removeClass('active');
            }
            $(this).toggleClass('active');
          }
        },
        ` ${song.title}`
      ]
    }))
  );
}

function parseSongTitle(title) {
  return title.replace(/^0*(\d+)[_ ]/g, '$1 - ').replace(/_/g, ' ');
}

function setDisplayDir(dirPath) {
  $('#txtDisplayDir').val(dirPath);

  $('#collapseImages, #collapseVideos').find('> .panel-body').html('');

  if (dirPath) {
    recurseDirSync(dirPath, 3, function(filePath, isFile, stat) {
      var [ext, extImg, extVid] = filePath.match(/\.(?:(png|jpe?g|gif)|(mp4))$/i) || [];
      if (isFile && ext) {
        if (extVid) {
          var jListItem = $('<div class="list-item">').appendTo('#collapseVideos > .panel-body');
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
          var jListItem = $('<div class="list-item">').appendTo('#collapseImages > .panel-body');
          setDisplayListItem(jListItem, filePath, { title: path.parse(filePath).name });
        }
      }
      return !isFile && !/^\./.test(path.basename(filePath));
    });
  }
}

var getCleanPath = filePath => /^(ftp|https?):/i.test(filePath) ? filePath : filePath.replace(/[#\?]/g, JS.escape);

function getImageSize(src, callback) {
  JS.extend(i = new Image, {
    src,
    onload () { callback.call(this.src, true, this.width, this.height); },
    onerror: e => callback.call(this.src, false)
  });
}

// data = { title: String }
function setDisplayListItem(jListItem, filePath, data, opt_img) {
  var isImage = !opt_img;
  if (isImage) {
    opt_img = new Image();
    opt_img.src = filePath;
  }

  var basename = path.basename(filePath),
      title = data.title || basename,
      jTable = $('<table border="0" cellpadding="0" cellspacing="0"><tbody><tr><td></td><td></td></tr></tbody></table>'),
      jImageWrap = jTable.find('td:eq(0)')
        .addClass('image-wrap')
        .append(`
          <div>
            <div class="presenter-aspect-ratio-wrap body">
              <div class="middler-wrap">
                <div class="middler-table">
                  <div class="middler-content">
                    <img />
                  </div>
                </div>
              </div>
            </div>
          </div>
        `),
      jContentWrap = jTable.find('td:eq(1)')
        .addClass('content-wrap')
        .append(JS.dom({
          _: 'div',
          cls: 'title',
          $: [ title, ' (', { _: 'i', text: basename }, ')'].slice(0, basename == title ? 1 : 4)
        }));

  getImageSize(opt_img.src, function(foundSize, width, height) {
    if (foundSize) {
      var imgPath = this + '';
      resizers.push(
        jTable[0],
        JS.callReturn(function() {
          var [ winWidth, winHeight ] = winPresenter.getContentSize();
          var { width: imgWidth, height: imgHeight } = fitInto(winWidth, winHeight, width, height);

          jImageWrap.find('img').css({ width: `${imgWidth}px`, height: `${imgHeight}px` }).prop('src', imgPath);
        })
      );

      jContentWrap.find('.title').after(`<div><b>Dimensions:</b> ${width} \xD7 ${height}</div>`);
      jContentWrap.append(JS.dom({
        _: 'button',
        cls: `btn btn-default show-${isImage?'image':'video'}`,
        text: isImage ? 'Show Image' : 'Play Video',
        onclick: function() {
          var jThis = $(this);
          if (jThis.hasClass('active')) {
            ipcMain.emit('reset-presenter');
          }
          else {
            audio.pause();
            $('#btnBGMusic, .btn-play, .btn.show-video, .btn.show-image, .btn.show-text').removeClass('active');
            ipcMain.emit(`show-${isImage?'image':'video'}`, getCleanPath(filePath), { width, height });
          }
          jThis.toggleClass('active');
        }
      }));
    }
  });

  jTable
    .appendTo(jListItem)
    .addClass('list-item-wrap');
}

function setDisplayTextListItem(jListItem, text, textIndex) {
  var jTable = $('<table border="0" cellpadding="0" cellspacing="0"><tbody><tr><td></td><td></td></tr></tbody></table>');
  var jContentWrap = jTable.find('td:eq(1)');
  jTable.find('td:eq(0)')
        .addClass('image-wrap')
        .append(`
          <div>
            <div class="presenter-aspect-ratio-wrap body">
              <div class="middler-wrap">
                <div class="middler-table">
                  <div class="middler-content">
                  </div>
                </div>
              </div>
            </div>
          </div>
        `);

  jContentWrap
        .addClass('content-wrap')
        .append('<div class="title"></div>');


  jContentWrap.append([
    JS.dom({
      _: 'button',
      cls: `btn btn-default show-text`,
      text: 'Show Text',
      onclick: function() {
        var jThis = $(this);
        if (jThis.hasClass('active')) {
          ipcMain.emit('reset-presenter');
        }
        else {
          audio.pause();
          $('#btnBGMusic, .btn-play, .btn.show-video, .btn.show-image, .btn.show-text').removeClass('active');
          ipcMain.emit(`show-text`, text.text);
        }
        jThis.toggleClass('active');
      }
    }),
    JS.dom({
      _: 'button',
      cls: `btn btn-default default-text`,
      text: 'Set As Default',
      onclick: function() {
        var jThis = $(this);
        if (jThis.hasClass('active')) {
          ipcMain.emit('unset-default-text');
        }
        else {
          appSettings.set('defaultTextIndex', textIndex);
          ipcMain.emit('set-default-text', text.text);
          $('.btn.default-text').removeClass('active');
        }
        jThis.toggleClass('active');
      }
    })
  ]);

  var defaultTextIndex = appSettings.get('defaultTextIndex');
  if (defaultTextIndex === textIndex) {
    jContentWrap.find('.btn.default-text').click();
  }

  jTable.appendTo(jListItem)
        .addClass('list-item-wrap');

  updateDisplayText(text, textIndex);
}

function updateDisplayText(text, i) {
  var jListItem = $('#collapseDisplayTexts .panel-body > .list-item').eq(i);
  jListItem.find('.content-wrap .title').text(text.name);
  jListItem.find('.image-wrap .middler-content:eq(0)').html(markdown.makeHtml(text.text));
}

function onMusicEnd() {
  audio.pause();
  if ($('#btnBGMusic').hasClass('active')) {
    var songIndex = executePropFunc('song-randomizer', [songs, lastSongIndex]);
    playSongAt(songIndex == undefined ? JS.random(songs.length - 1, true) : songIndex);
  }
  else {
    $('.btn-play').removeClass('active');
  }
}

function executePropFunc(id, args) {
  var func = appSettings.get('properties', []).filter(func => func.type == 'function' && func.id == id)[0];
  if (func) {
    return JS.func(
      func.arguments.map(arg => arg.name),
      func.value
    ).apply(this, args);
  }
  else {
    throw new Error(`No property function of ID "${id}" was found.`);
  }
}

$(function() {
  JS.addTypeOf(jQuery, 'jQuery');

  $('select.combobox').combobox();

  $('.panel:not(.dont-save-collapse) .panel-collapse').on('show.bs.collapse hide.bs.collapse', e => {
    var collapsibles = appSettings.get('collapsibles', {});
    collapsibles[this.id] = e.type;
    appSettings.set('collapsibles', collapsibles);
  });

  $('#collapseLyrics')
    .on('shown.bs.collapse', () => {
      var property = JS.indexBy(appSettings.get('properties', {}), 'id')['jw-library-languages-page'];
      if (property) {
        var url = property.value;
        console.log(url);
        $.ajax({
          url,
          success(html) {
            //selLibLangs
            var [rsconf, lib] = (url.match(/\/(r\d+)\/(lp-\w+)(?:[\/#\?]|$)/) || []).slice(1);
            var langs = executePropFunc('parse-jw-library-languages-page', [html, rsconf, lib]);
            $('#selLibLangs').html('<option></option>');
            langs.forEach(({name, lang, rsconf, lib}) => {
              $('#selLibLangs').append(JS.dom({
                _: 'option',
                value: `${rsconf}/${lib}`,
                text: `${name} - ${lang}`
              }));
            });
            $('#selLibLangs').combobox('refresh');
            $('#collapseLyrics .panel-body > .success').show();
          },
          error() {
            $('#collapseLyrics .panel-body > .alert')
              .show()
              .find(' > .message')
                .html(`An error occurred preventing the <a href="${url}" class="alert-link" target="_blank">Online JW Library language page</a> from loading.`);
          },
          dataType: 'html'
        });
      }
      else {
        $('#collapseLyrics .panel-body > .alert:eq(0)')
          .show()
          .find(' > .message')
            .html(`The settings file is missing the <code>jw-library-languages-page</code> property.`);
      }
    })
    .on('hidden.bs.collapse', JS.callReturn(() => $('#collapseLyrics .panel-body').find('> .alert, > .success').hide()));

  $('#btnSetSongsDir').click(() => {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, dirPaths => {
      if (dirPaths) {
        var dirPath = dirPaths[0].replace(new RegExp(`(${JS.quoteRegExp(path.sep)})?$`), path.sep);
        appSettings.set('songsDir', dirPath);
        appSettings.set('songs', songs = []);
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

  $('#btnRefreshDisplayDir').click(function() {
    var dirPath = appSettings.get('displayDir');
    if (!isDirectorySync(dirPath)) {
      appSettings.set('displayDir', dirPath = undefined);
    }
    setDisplayDir(dirPath);
  });

  $('#btnBGMusic').click(function() {
    $('.btn-play').removeClass('active');
    $(this).toggleClass('active');
    onMusicEnd();
  });

  $('#lblText').click(function() {
    textEditor.focus();
  });

  $('#tdWrapAllTabs [data-toggle=tab]').click(function() {
    appSettings.set('mainTabText', $(this).text());
    $('#tdWrapAllTabs [role=tabpanelhead]').hide();
    $(`#${$(this).data('panelhead')}`).show();
  });

  $('#btnResetProp').click(function() {
    $('#txtPropName').data('index', null);
    $('#propsList > li.active > a').triggerHandler('click');
  });

  $('#btnSaveProp').click(() => updatePropCode(true));

  $('#txtTextName').on('input', function() {
    var texts = appSettings.get('texts', []);
    var index = $(this).data('index');
    var text = texts[index];
    if (text) {
      $('#textsList > li.text').eq(index).find('a').text(text.name = this.value);
      appSettings.set('texts', texts);
      updateDisplayText(text, index);
    }
  });

  $('#linkAddText').click(function() {
    var texts = appSettings.get('texts', []);
    var index = texts.length;
    var text = {name:`Text #${index}`,text:''};
    texts.push(text);
    appSettings.set('texts', texts);
    addTextToList(text, index, true);
  });

  $('#btnDeleteText').click(function() {
    var texts = appSettings.get('texts', []);
    if (texts.length > 1) {
      var response = dialog.showMessageBox({
        title: 'Delete Text',
        message: 'Are you sure you want to delete this text?',
        buttons: ['Yes', 'No'],
        type: 'question'
      });
      if (response == 0) {
        var index = $('#txtTextName').data('index');
        texts.splice(index, 1);
        appSettings.set('texts', texts);

        var defaultTextIndex = appSettings.get('defaultTextIndex');
        if (defaultTextIndex > index) {
          defaultTextIndex--;
        }
        else if(defaultTextIndex === index) {
          defaultTextIndex = undefined;
        }
        appSettings.set('defaultTextIndex', defaultTextIndex);

        $('#collapseDisplayTexts .panel-body > .list-item').eq(index).remove();

        $('#textsList > li.text').eq(index).remove();
        $(`#textsList > li.text:gt(${index-1})`).each(function() {
          $(this).data('index', $(this).data('index') - 1);
        });

        if (index == texts.length) {
          index--;
        }

        selectText(texts[index], index);
      }
    }

  });

  $('#collapseText').on('shown.bs.collapse', adjustTextPreviewZoom);

  textEditor = ace.edit('divText');
  textEditor.session.setOptions({
    mode: 'ace/mode/markdown',
    tabSize: 2,
    useSoftTabs: true
  });
  textEditor.on('change', JS.debounce(function(e, editor) {
    var texts = appSettings.get('texts', []);
    var index = $('#txtTextName').data('index');
    var text = texts[index];
    var newText = editor.getValue();
    if (text.text != newText) {
      text.text = newText;
      appSettings.set('texts', texts);
      updateTextPreview(text);
      updateDisplayText(text, index);
    }
  }, 250));
  addKeyBindingsMenuTo(textEditor);

  propCodeEditor = ace.edit('divPropCode');
  propCodeEditor.session.setOptions({ tabSize: 2, useSoftTabs: true });
  propCodeEditor.commands.addCommand({
    name: 'updatePropCode',
    bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
    exec: JS.partial(updatePropCode, true)
  });
  addKeyBindingsMenuTo(propCodeEditor);

  loadSettings();
});

function addKeyBindingsMenuTo(editor) {
  editor.commands.addCommand({
    name: 'showKeyboardShortcuts',
    bindKey: { win: 'Ctrl-Alt-h', mac: 'Cmd-Alt-h' },
    exec: function(editor) {
      ace.config.loadModule('ace/ext/keybinding_menu', function(module) {
        module.init(editor);
        editor.showKeyboardShortcuts();
      });
    }
  });
}

function updateTextPreview(text) {
  $('#divTextPreview .middler-content').html(markdown.makeHtml(text.text));
}

function selectProperty(property, index) {
  if ($('#txtPropName').data('index') != undefined) {
    updatePropCode(false);
  }

  $('#propsList > li').removeClass('active').eq(index).addClass('active');

  $('#txtPropName').val(property.name).data('index', index);

  $('#divPropFuncSig, #divPropCodeWrap, #divPropInputWrap').hide();

  if (property.type == 'function') {
    $('#divPropFuncSig, #divPropCodeWrap').show();
    $('#divPropFuncSig')
      .html('')
      .append(JS.dom({
        _: 'pre',
        $: JS.flatten([
          'function (',
          property.arguments.map(function(argument, i) {
            return JS.splice([
              ', ',
              {
                _: 'code',
                text: argument.name,
                'data-toggle': 'tooltip',
                'data-placement': 'bottom',
                title: `{${argument.type}}\n${argument.text}`
              }
            ], 0, i ? 0 : 1);
          }),
          ')',
          (function() {
            var result = [], ret = property['return'];
            if (ret) {
              result.push(
                ': ',
                {
                  _: 'code',
                  text: ret.type,
                  'data-toggle': 'tooltip',
                  'data-placement': 'bottom',
                  title: ret.text
                }
              );
            }
            return result;
          })()
        ], true)
      }))
      .find('[data-toggle="tooltip"]').tooltip();
    propCodeEditor.session.setMode(new AceModeJavaScript);
    propCodeEditor.setValue(property.value);
    propCodeEditor.focus();
  }
  else if (property.type == 'css') {
    $('#divPropCodeWrap').show();
    propCodeEditor.session.setMode(new AceModeCSS);
    propCodeEditor.setValue(property.value);
    propCodeEditor.focus();
  }
  else if (['text', 'url'].includes(property.type)) {
    $('#divPropInputWrap').show();
    $('#txtPropInput').prop('type', property.type).val(property.value).focus();
  }
  else {
    throw new Error(`Property type "${property.type}" is not handled.`);
  }
}

function selectText(text, index) {
  $('#textsList > li.text').removeClass('active').eq(index).addClass('active');
  $('#txtTextName').val(text.name).data('index', index);
  textEditor.setValue(text.text);
  textEditor.focus();
  updateTextPreview(text);
}

function hasCodeChanged() {
  var properties = appSettings.get('properties');
  var property = properties[$('#txtPropName').data('index')];
  if (['function', 'css'].includes(property.type)) {
    return property.value != propCodeEditor.getValue();
  }
  else if (['text', 'url'].includes(property.type)) {
    return property.value != $('#txtPropInput').val();
  }
  else {
    throw new Error(`Property type "${property.type}" is not handled.`);
  }
}

function updatePropCode(isUserInitiated) {
  if (hasCodeChanged()) {
    if (isUserInitiated) {
      savePropCode();
    }
    else {
      var response = dialog.showMessageBox({
        title: 'Save Property?',
        message: 'Would you like to save the changes that you made to this property?',
        buttons: ['Yes', 'No'],
        type: 'question'
      });
      if (response == 0) {
        savePropCode();
      }
    }
  }

  function savePropCode() {
    var properties = appSettings.get('properties');
    var property = properties[$('#txtPropName').data('index')];
    if (['function', 'css'].includes(property.type)) {
      property.value = propCodeEditor.getValue();
      if (property.id == 'presenter-css') {
        ipcMain.emit('update-presenter-css', property.value);
      }
    }
    else if (['text', 'url'].includes(property.type)) {
      property.value = $('#txtPropInput').val();
    }
    else {
      throw new Error(`Property type "${property.type}" is not handled.`);
    }
    appSettings.set('properties', properties);
  }
}

function fitInto(desiredWidth, desiredHeight, actualWidth, actualHeight) {
  var actualSlope = actualHeight / actualWidth;
  if (isFinite(actualSlope || '@')) {
    if (desiredHeight / desiredWidth > actualSlope) {
      desiredHeight = desiredWidth * actualSlope;
    }
    else {
      desiredWidth = desiredHeight / actualSlope;
    }
  }
  else {
    desiredWidth = desiredHeight = NaN;
  }
  return { width: desiredWidth, height: desiredHeight };
}