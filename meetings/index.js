const [fs, path, electron, mm, showdown, DEFAULT_SETTINGS] = ['fs-extra', 'path', 'electron', 'musicmetadata', 'showdown', './default-settings'].map(require);
const { ipcRenderer, remote } = electron;
const { dialog, BrowserWindow, shell, app } = remote;
const markdown = new showdown.Converter();

const { presenter: winPresenter, main: winMain } = JS.indexBy(BrowserWindow.getAllWindows(), 'name');

const USER_DATA_PATH = app.getPath('userData');
const USER_LYRICS_PATH = path.join(USER_DATA_PATH, 'meetings-lyrics.json');
const USER_SETTINGS_PATH = path.join(USER_DATA_PATH, 'meetings-settings.json');
const USER_WOL_LANGUAGES_PATH = path.join(USER_DATA_PATH, 'wol-languages.json');

const THUMB_WIDTH = 300;

const SONG_CODES = [1102009094,1102009115,1102009080,1102009121,1102009129,1102009124,1102009098,1102009083,1102009087,1102009089,1102009122,1102009151,1102009095,1102009096,1102009099,1102009100,1102009101,1102009102,1102009103,1102009097,1102009104,1102009105,1102009106,1102009107,1102009163,1102009109,1102009110,1102009111,1102009113,1102009116,1102009117,1102009118,1102009119,1102009120,1102009123,1102009141,1102009112,1102009125,1102009127,1102009170,1102009156,1102009126,1102009128,1102009130,1102009131,1102009145,1102009144,1102009148,1102009149,1102009150,1102009153,1102009154,1102009162,1102009168,1102009108,1102009142,1102009210,1102009202,1102009160,1102009212,1102009208,1102009200,1102009091,1102009172,1102009140,1102009181,1102009157,1102009171,1102009209,1102009161,1102009137,1102009188,1102009152,1102009178,1102009164,1102009197,1102009093,1102009193,1102009186,1102009189,1102009173,1102009155,1102009134,1102009092,1102009174,1102009166,1102009143,1102009169,1102009138,1102009180,1102009139,1102009136,1102009185,1102009198,1102009204,1102009207,1102009147,1102009082,1102009158,1102009114,1102009086,1102009159,1102009084,1102009194,1102009196,1102009088,1102009165,1102009175,1102009167,1102009135,1102009132,1102009184,1102009183,1102009090,1102009146,1102009133,1102009081,1102009187,1102009211,1102009179,1102009192,1102009191,1102009203,1102009205,1102009085,1102009176,1102009177,1102009199,1102009190,1102009213,1102009201,1102009195,1102009206,1102009214,1102009182,1102014550,1102014551,1102014552,1102014554,1102014555,1102014556,1102014557,1102014558,1102014559,1102014560,1102014561,1102014562,1102014563,1102014564,1102014565,1102014566,1102014567,1102014568,1102014569];
const SONG_COUNT = SONG_CODES.length;

const AceModeMarkdown = ace.require('ace/mode/markdown').Mode,
      AceModeText = ace.require('ace/mode/text').Mode,
      AceModeCSS = ace.require('ace/mode/css').Mode,
      AceModeJavaScript = ace.require('ace/mode/javascript').Mode;

const isDirectorySync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isDirectory(),
      isFileSync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

var textEditor, propCodeEditor;

var bibleVue,
    cropperVue,
    translations,
    lastSongIndex,
    musicImagesPaths = [],
    songs = [],
    resizers = [],
    songTitlesToLyricsIndex = {};

var appSettings = {
  _onSavers: [],
  _: (function() {
    var data = { code: '' };
    try {
      try {
        data = readFileJSON(USER_SETTINGS_PATH);
      }
      catch (e) {
        data = jQuery.extend(true, {}, DEFAULT_SETTINGS);
      }
    }
    catch (e) {
      console.error(`${e.name}\n${e.message}\n${e.stack}`);
    }
    return data;
  })(),
  set(keyOrValues, value, opt_onSave) {
    var isOneValue = JS.typeOf(keyOrValues, 'String'), data = this._;
    if (isOneValue) {
      data[keyOrValues] = value;
    }
    else {
      JS.walk(keyOrValues, function(value, key) {
        data[key] = value;
      });
      opt_onSave = JS.nth(arguments, -1);
    }
    if (opt_onSave) {
      this._onSavers.push(opt_onSave);
    }
    this.save();
    return isOneValue ? value : keyOrValues;
  },
  get(key, opt_defaultValue) {
    return JS.has(this._, key) ? this._[key] : opt_defaultValue;
  },
  save: JS.debounce(function() {
    var me = this;
    fs.writeFileSync(USER_SETTINGS_PATH, JSON.stringify(me._, 2, 2), 'utf8');
    me._onSavers.splice(0).forEach((onSave) => onSave(me._));
  }, 500)
};

ipcRenderer.on('ended-presenter-video', (event) => {
  $('.btn.show-video').removeClass('active');
  $('#modalVideo').modal('hide');
});

ipcRenderer.on('playing-video', (event, currentTime) => {
  $('#modalVideo .range').val(currentTime);
  $('#modalVideo .current-time').text(formatTime(~~currentTime));
});

ipcRenderer.on('ended-presenter-song', onMusicEnd);

function getAppProp(id) {
  return JS.indexBy(appSettings.get('properties', {}), 'id')[id];
}

function listWOLLangs() {
  fs.readJson(USER_WOL_LANGUAGES_PATH, function(err, arrLangs) {
    if (!err) {
      var prevLocale = appSettings.get('wolLang');
      $('#selWOLLangs')
        .html('')
        .append(arrLangs.sort((a, b) => JS.compare(a.name, b.name)).map((lang) => JS.dom({
          _: 'option',
          text: `${lang.lang} - ${lang.name}`,
          value: lang.locale,
          selected: prevLocale == lang.locale
        })));
      showWOLContent();
    }
  });
}

function showWOLContent() {
  var lang = $('#selWOLLangs').val();
  var biblePath = path.join(USER_DATA_PATH, `bible-${lang}`);
  var indexPath = path.join(biblePath, 'index.json');
  JS.extend(bibleVue, {
    hebrew: {},
    greek: {},
    book: null,
    chapterIndex: null,
    verseIndex: null
  });
  if (isDirectorySync(biblePath) && isFileSync(indexPath)) {
    var data = fs.readJsonSync(indexPath, {encoding: 'utf8'});
    if (data.hebrew) {
      bibleVue.hebrew = data.hebrew;
    }
    if (data.greek) {
      bibleVue.greek = data.greek;
    }
  }
}

function updatePresenterCSS(code) {
  winPresenter.webContents.send('update-presenter-css', code);
  var style = $('#presenterStyle')[0];
  if (style.styleSheet && !style.sheet) {
    style.styleSheet.cssText = code;
  }
  else {
    style.innerHTML = '';
    style.appendChild(document.createTextNode(code));
  }
}

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
      .display-panel .image-wrap > div {
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

function parseTime(str) {
  return str.split(':').reverse().reduce(function(total, value, index) {
    return total + Math.pow(60, index) * parseInt(value, 10);
  }, 0);
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
  video.onseeked = function(event) {
    var canvas = document.createElement('canvas');
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.src = canvas.toDataURL();
    callback.call(me, img, {path: videoPath, currentTime: this.currentTime, duration: this.duration, event: event});
  };
  video.onerror = function(event) {
    callback.call(me, undefined, {path: videoPath, event: event});
  };
  video.src = getCleanPath(videoPath);
}

function getAudioDuration(audioPath, callback) {
  JS.dom({
    _: 'audio',
    src: getCleanPath(audioPath),
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

function loadSettings() {
  var properties = appSettings.get('properties', []);
  var propsByID = JS.indexBy(properties, 'id');
  jQuery.extend(true, {}, DEFAULT_SETTINGS).properties.forEach(function(prop) {
    if (!JS.has(propsByID, prop.id)) {
      console.warn(`Adding "${prop.id}" property from default settings:`, prop);
      properties.push(prop);
    }
  });
  properties = properties.sort((prop1, prop2) => JS.compare(prop1.name, prop2.name));
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
      updatePresenterCSS(prop.value);
    }

    if (!i) {
      selectProperty(prop, i);
    }

    if (prop.id == 'translations') {
      fillInTranslations(prop.value);
      removeOldTranslations(prop.value, JS.indexBy(DEFAULT_SETTINGS.properties, 'id').translations.value);
    }
  });

  $('#tdWrapAllTabs [data-toggle=tab]').filter((i, elem) => $(elem).text() == appSettings.get('mainTabText')).click();

  JS.walk(appSettings.get('collapsibles', {}), (action, id) => $(`#${id}`).collapse(action));

  var songsDir = appSettings.get('songsDir'),
      musicPicDir = appSettings.get('musicPicDir'),
      displayDir = appSettings.get('displayDir'),
      texts = appSettings.get('texts');

  if (songsDir) {
    if (!isDirectorySync(songsDir)) {
      appSettings.set('songsDir', songsDir = undefined);
      appSettings.set('songs', songs = []);
    }
    setSongsDir(songsDir);
  }

  if (musicPicDir) {
    if (!isDirectorySync(musicPicDir)) {
      appSettings.set('musicPicDir', musicPicDir = undefined);
    }
    setMusicPicDir(musicPicDir);
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

  listWOLLangs();
}

function removeOldTranslations(userTrans, defaultTrans) {
  var defaultKeys = JS(defaultTrans).indexBy('id').map((v,k) => true).$;
  for (var i = userTrans.length; i-- > 0;) {
    if (!defaultKeys.hasOwnProperty(userTrans[i].id)) {
      console.warn(`Removing the "${userTrans[i].id}" translation:`, userTrans[i]);
      userTrans.splice(i, 1);
    }
  }
  appSettings.save();
}

function fillInTranslations(values) {
  translations = values.reduce(function(carry, obj) {
    carry[obj.id] = obj.value;
    return carry;
  }, {});
  fillInTranslationFor('music-tab', '#tdWrapAllTabs [aria-controls=musicPanel]');
  fillInTranslationFor('settings-tab', '#tdWrapAllTabs [aria-controls=settingsPanel]');
  fillInTranslationFor('bg-music-button', '#btnBGMusic');
  fillInTranslationFor('display-images-tab', '[aria-controls=displayImagesPanel]');
  fillInTranslationFor('display-videos-tab', '[aria-controls=displayVideosPanel]');
  fillInTranslationFor('display-bible-tab', '[aria-controls=displayBiblePanel]');
  fillInTranslationFor('display-texts-tab', '[aria-controls=displayTextsPanel]');
  fillInTranslationFor('display-directory-button', '.js-btn-set-media-dir');
  fillInTranslationFor('directories-panel', '#collapseHeaderDirs a');
  fillInTranslationFor('settings-texts-panel', '#collapseTextHeading a');
  fillInTranslationFor('lyrics-panel', '#collapseLyricsHeading a');
  fillInTranslationFor('properties-panel', '#collapsePropsHeading a');
  fillInTranslationFor('songs-directory-button', '#btnSetSongsDir');
  fillInTranslationFor('music-pics-directory-button', '#btnSetMusicPicDir');
}

function fillInTranslationFor(id, target) {
  if (JS.isString(target)) {
    if (!$(target).text(getTranslationFor(id))[0]) {
      console.error(`Target for translation not found:  ${target}`);
    }
  }
  else {
    console.error(`Filling in translations for a target of type ${JS.typeOf(target)} is not supported.`);
  }
}

function getTranslationFor(id) {
  if (!JS.has(translations, id)) {
    if (pullDefaultTranslationFor(id)) {
      console.warn(`There was not tranlation for "${id}" so it was pulled from the default settings.`);
    }
    else {
      console.error(`There is no default translation for "${id}".`);
    }
  }
  return translations[id];
}

function pullDefaultTranslationFor(id) {
  try {
    var translation = JS.indexBy(JS.indexBy(DEFAULT_SETTINGS.properties, 'id').translations.value, 'id')[id];
    translations[translation.id] = translation.value;
    
    var properties = appSettings.get('properties');
    JS.indexBy(properties, 'id').translations.value.push(translation);
    appSettings.set('properties', properties);
  }
  catch (e) {
    return false;
  }
  return true;
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

  setDisplayTextListItem($('<div class="list-item">').appendTo('#displayTextsWrap'), text, i);

  if (selectIt) {
    selectText(text, i);
  }
}

function setSongsDir(dirPath) {
  var loader = new Loader({ title: 'Load Songs from Directory', max: 0, value: 0 });

  $('#txtSongsDir').val(dirPath);

  songs = [];

  var f = JS.on0(function() {
        loader.close();
        appSettings.set('songs', songs.sort((a, b) => compareFileNames(a.title, b.title)));
        showSongsList();
      }),
      oldSongsByPath = JS.indexBy(appSettings.get('songs', []), 'path');

  recurseDirSync(dirPath, Infinity, function(filePath, isFile, stat) {
    var relFilePath = filePath.replace(new RegExp(`^${JS.quoteRegExp(dirPath)}`), '');
    if (isFile && !path.basename(filePath).startsWith('.') && /\.mp3$/i.test(relFilePath)) {
      loader.max++;
      var song = oldSongsByPath[relFilePath];
      // if the old song is found simply add it to the current list
      if (song) {
        songs.push(song);
        loader.value++;
      }
      // if the old song is not found parse the file and add it to the current list
      else {
        f(true);
        mm(fs.createReadStream(filePath), function (err, metadata) {
          if (err) {
            loader.max--;
            f();
          }
          else {
            getAudioDuration(filePath, function(e, duration) {
              if (e.type == 'error') {
                loader.max--;
              }
              else {
                songs.push({
                  path: relFilePath,
                  title: executePropFunc('song-title-parser', [filePath, metadata.title]),
                  duration
                });
                loader.value++;
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

function playSongAt(songIndex, isBGMusic, opt_lyricsIndex, opt_startPaused) {
  var lyricsData, song = songs[lastSongIndex = songIndex];

  if (opt_lyricsIndex != undefined) {
    try {
      lyricsData = readFileJSON(USER_LYRICS_PATH)[opt_lyricsIndex];
    }
    catch (e) {
      console.error(`There are no lyrics at index ${opt_lyricsIndex}.`, e);
    }
  }

  presentMedia(
    'song',
    [{
      path: getCleanPath(appSettings.get('songsDir') + song.path),
      isBGMusic: isBGMusic,
      lyrics: lyricsData,
      linesToShowAtEnd: 3,
      imagePaths: musicImagesPaths,
      secsDuration: song.duration,
      secsDelay: 12,
      secsToEndEarly: 2,
      startPaused: opt_startPaused
    }],
    isBGMusic ? null : unpressActiveMediaButtons
  );

  toggleMusicPauseButton(!!opt_startPaused);
  $('#modalMusic .lyrics-navigator')[isBGMusic ? 'hide' : 'show']();
  $('#txtMusicTitle').val(song.title);
  $('#txtMusicDuration').val(formatTime(~~song.duration));

  if (!$('#modalMusic').is(':visible')) {
    $('#modalMusic').removeData('bs.modal').modal({
      backdrop: isBGMusic || 'static',
      keyboard: false
    });
  }
}

// Pass true to show play button and false to show pause button or pass nothing
//     to simply toggle button.
// Returns true showing play button.
function toggleMusicPauseButton(opt_startPaused) {
  var jButton = $('#modalMusic .btn-pause-music');
  if (!JS.isBoolean(opt_startPaused) || opt_startPaused == jButton.is('.btn-warning')) {
    jButton.toggleClass('btn-success btn-warning')
      .find('.glyphicon').toggleClass('glyphicon-play glyphicon-pause');
  }
  return jButton.is('.btn-success');
}

// Pass true to show play button and false to show pause button or pass nothing
//     to simply toggle button.
// Returns true showing play button.
function toggleVideoPauseButton(opt_startPaused) {
  var jButton = $('#modalVideo .btn-pause-video');
  if (!JS.isBoolean(opt_startPaused) || opt_startPaused == jButton.is('.btn-warning')) {
    jButton.toggleClass('btn-success btn-warning')
      .find('.glyphicon').toggleClass('glyphicon-play glyphicon-pause');
  }
  return jButton.is('.btn-success');
}

function unpressActiveMediaButtons() {
  $('#btnBGMusic, .btn.show-video, .btn.show-image, .btn.show-text').removeClass('active');
}

function showSongsList() {
  songTitlesToLyricsIndex = {};
  try {
    function testSongMatchAt(songIndex, lyricsIndex) {
      var song = songs[songIndex];
      if ((new RegExp(`\\b${lyricsIndex+1}\\b`)).test(song.title)) {
        songTitlesToLyricsIndex[song.title] = lyricsIndex;
        return true;
      }
      return false;
    }
    if (isFileSync(USER_LYRICS_PATH)) {
      readFileJSON(USER_LYRICS_PATH).map(function(lyrics, lyricsIndex) {
        if (!testSongMatchAt(lyricsIndex, lyricsIndex)) {
          for (var songIndex = 0, l = songs.length; songIndex < l; songIndex++) {
            if (lyricsIndex != songIndex && testSongMatchAt(songIndex, lyricsIndex)) {
              break;
            }
          }
        }
      });
    }
  }
  catch(e) {
    console.error(e);
  }

  $('#songsList').html('').append(
    songs.map((song, i) => JS.dom({
      _: 'div',
      cls: 'song-line',
      $: [
        {
          _: 'div',
          cls: 'btn-group',
          $: [
            {
              _: 'button',
              cls: 'btn btn-default btn-play',
              $: [
                { _: 'span', cls: 'glyphicon glyphicon-play', 'aria-hidden': true },
                ' ' + getTranslationFor(`play-${songTitlesToLyricsIndex.hasOwnProperty(song.title)?'lyrics':'song'}-button`)
              ],
              onclick() {
                unpressActiveMediaButtons();
                playSongAt(i, false, songTitlesToLyricsIndex[song.title]);
              }
            },
            {
              _: 'button',
              type: 'button',
              cls: 'btn btn-default dropdown-toggle',
              'data-toggle': 'dropdown',
              'aria-haspopup': true,
              'aria-expanded': false,
              $: [
                { _: 'span', cls: 'caret' }
              ]
            },
            {
              _: 'ul',
              cls: 'dropdown-menu',
              $: [
                {
                  _: 'li',
                  $: [
                    {
                      _: 'a',
                      href: '#',
                      text: getTranslationFor('show-song-button'),
                      onclick() {
                        unpressActiveMediaButtons();
                        playSongAt(i, false, songTitlesToLyricsIndex[song.title], true);
                      }
                    },
                    {
                      _: 'a',
                      href: '#',
                      text: getTranslationFor('play-song-button'),
                      onclick() {
                        unpressActiveMediaButtons();
                        playSongAt(i, false);
                      }
                    },
                    {
                      _: 'a',
                      href: '#',
                      text: getTranslationFor('play-lyrics-button'),
                      onclick() {
                        unpressActiveMediaButtons();
                        playSongAt(i, false, songTitlesToLyricsIndex[song.title]);
                      }
                    }
                  ].slice(
                    songTitlesToLyricsIndex.hasOwnProperty(song.title) ? 0 : 1,
                    songTitlesToLyricsIndex.hasOwnProperty(song.title) ? 3 : 2
                  )
                }
              ]
            }
          ]
        },
        ` ${song.title}`
      ]
    }))
  );
}

function setMusicPicDir(dirPath) {
  $('#txtMusicPicDir').val(dirPath);

  musicImagesPaths = [];

  if (dirPath) {
    recurseDirSync(dirPath, 3, function(filePath, isFile, stat) {
      if (isFile && !path.basename(filePath).startsWith('.') && /\.(?:png|jpe?g|gif)$/i.test(filePath)) {
        musicImagesPaths.push(filePath);
      }
      return !isFile && !/^\./.test(path.basename(filePath));
    });
  }

  winPresenter.webContents.send('update-song-images', musicImagesPaths);
}

function setDisplayDir(dirPath) {
  $('.js-txt-media-dir').val(dirPath);

  $('#displayImagesWrap, #displayVideosWrap').html('');

  if (dirPath) {
    recurseDirSync(dirPath, 3, function(filePath, isFile, stat) {
      var [ext, extImg, extVid] = filePath.match(/\.(?:(png|jpe?g|gif)|(mp4))$/i) || [];
      if (isFile && ext && !path.basename(filePath).startsWith('.')) {
        if (extVid) {
          var jListItem = $('<div class="list-item">').appendTo('#displayVideosWrap');
          getVideoImage(filePath, (t) => t / 3, (img, obj) => {
            if (obj.event.type == 'error') {
              jListItem.remove();
            }
            else {
              var metadata = {
                title: path.basename(filePath),
                realDuration: obj.duration
              };
              setDisplayListItem(jListItem, filePath, metadata, img);

              // Try to get extra title info.
              mm(fs.createReadStream(filePath), function (err, newMetaData) {
                if (!err) {
                  JS.extend(metadata, newMetaData);
                }
                setDisplayListItem(jListItem, filePath, metadata, img);
              });
            }
          });
        }
        else {
          var jListItem = $('<div class="list-item">').appendTo('#displayImagesWrap');
          setDisplayListItem(jListItem, filePath, { title: path.parse(filePath).name });
        }
      }
      return !isFile && !/^\./.test(path.basename(filePath));
    });
  }
}

var getCleanPath = filePath => filePath.replace(/^(ftp|https?):/i.test(filePath) ? /#/g : /[#\?]/g, JS.escape);

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
    opt_img.src = getCleanPath(filePath);
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

      jContentWrap
        .find('.title')
        .after(JS.dom({
          _: 'div',
          cls: 'dimensions',
          $: [
            { _: 'b', text: `${getTranslationFor('dimensions-label')}:` },
            ` ${width} \xD7 ${height}`
          ]
        }));

      if (data && data.realDuration) {
        jContentWrap
          .find('.dimensions')
          .after(JS.dom({
            _: 'div',
            cls: 'duration',
            $: [
              { _: 'b', text: `${getTranslationFor('video-duration-label')}:` },
              ` ${formatTime(parseInt(data.realDuration))}`
            ]
          }));
      }

      // "Show Image" or "Show Video" button
      var objButton = {
        _: 'button',
        cls: `btn btn-default show-${isImage?'image':'video'}`,
        $: [
          { _: 'span', cls: 'glyphicon glyphicon-picture', 'aria-hidden': true },
          ' ',
          getTranslationFor(`show-${isImage?'image':'video'}-button`)
        ],
        onclick() {
          if (isImage) {
            var jThis = $(this);
            $('#modalImage')
              .modal({ backdrop: 'static', keyboard: false })
              .one('shown.bs.modal', () => {
                var size = aspectFor(width, height, $('#cropper').parent().width(), 400);
                cropperVue.width = width;
                cropperVue.height = height;
                cropperVue.filePath = getCleanPath(filePath);
                cropperVue.reset();
                $('#cropper').css({
                  height: `${size.height}px`,
                  width: `${size.width}px`,
                  backgroundImage: `url("${getCleanPath(filePath)}"`
                });
              });
            presentMedia('image', [getCleanPath(filePath), { width, height}]);
          }
          else {
            var currentTime = parseTime(jContentWrap.find(':text.time').val()),
                duration = data.realDuration;
            toggleVideoPauseButton(true);
            $('#modalVideo')
              .find('#txtVideoTitle').val(title).end()
              .find('.range').prop({ max: duration, value: currentTime, disabled: false }).end()
              .find('.current-time').text(formatTime(currentTime)).end()
              .find('#txtVideoDuration').val(formatTime(~~duration)).end()
              .find('.duration').text(formatTime(~~duration)).end()
              .modal({ backdrop: 'static', keyboard: false });
            presentMedia('video', [getCleanPath(filePath), { width, height, time: currentTime, paused: true }], unpressActiveMediaButtons);
          }
        }
      };

      if (isImage) {
        jContentWrap.append(JS.dom(objButton));
      }
      else {
        jContentWrap.append(JS.dom({
          _: 'div',
          $: [
            {
              _: 'div',
              cls: 'btn-group',
              style: { paddingRight: '1em' },
              $: [
                objButton,
                {
                  _: 'button',
                  cls: `btn btn-default play-video`,
                  $: [
                    { _: 'span', cls: 'glyphicon glyphicon-play' },
                    ' ',
                    getTranslationFor(`play-video-button`)
                  ],
                  onclick() {
                    var currentTime = parseTime(jContentWrap.find(':text.time').val()),
                        duration = data.realDuration;
                    toggleVideoPauseButton(false);
                    $('#modalVideo')
                      .find('#txtVideoTitle').val(title).end()
                      .find('.range').prop({ max: duration, value: currentTime, disabled: true }).end()
                      .find('.current-time').text(formatTime(currentTime)).end()
                      .find('#txtVideoDuration').val(formatTime(~~duration)).end()
                      .find('.duration').text(formatTime(~~duration)).end()
                      .modal({ backdrop: 'static', keyboard: false });
                    presentMedia('video', [getCleanPath(filePath), { width, height, time: currentTime }], unpressActiveMediaButtons);
                  }
                }
              ]
            },
            {
              _: 'div',
              style: { display: 'inline-block', verticalAlign: 'top' },
              $: {
                _: 'div',
                cls: 'input-group',
                style: { width: '1px' },
                $: [
                  {
                    _: 'span',
                    cls: 'input-group-btn',
                    $: {
                      _: 'button',
                      title: 'Click to take off a second.  Hold down ALT and click to take off 10 seconds.',
                      cls: 'btn btn-default btn-danger',
                      $: {
                        _: 'span',
                        cls: 'glyphicon glyphicon-minus',
                        'aria-hidden': true
                      },
                      onmousedown: (e) => offsetTime(e.altKey ? -10 : -1)
                    }
                  },
                  {
                    _: 'input',
                    type: 'text',
                    cls: 'form-control time',
                    placeholder: '0:00',
                    style: { width: '6em', textAlign: 'center' },
                    value: '0:00',
                    onchange: () => offsetTime(0)
                  },
                  {
                    _: 'span',
                    cls: 'input-group-btn',
                    $: {
                      _: 'button',
                      title: 'Click to add a second.  Hold down ALT and click to add 10 seconds.',
                      cls: 'btn btn-default btn-success',
                      $: {
                        _: 'span',
                        cls: 'glyphicon glyphicon-plus',
                        'aria-hidden': true
                      },
                      onmousedown: (e) => offsetTime(e.altKey ? 10 : 1)
                    }
                  }
                ]
              }
            }
          ]
        }));

        jContentWrap.find('.btn-show-media').remove().prependTo(jContentWrap.find('.controls'));

        var time,
            updatePreview = JS.debounce(() => getVideoImage(filePath, time, (img) => jImageWrap.find('img').prop('src', img.src)), 250);

        function offsetTime(offset) {
          var jTxt = jContentWrap.find(':text.time');
          jTxt.filter(':not(:disabled)').val(formatTime(time = JS.clamp((parseTime(jTxt.val()) || 0) + offset, 0, ~~data.realDuration)));
          updatePreview();
        }
      }
    }
  });

  jTable
    .appendTo(jListItem.html(''))
    .addClass('list-item-wrap');
}

function setDisplayTextListItem(jListItem, text, textIndex) {
  var jTable = $('<table border="0" cellpadding="0" cellspacing="0"><tbody><tr><td></td><td></td></tr></tbody></table>');
  var jContentWrap = jTable.find('td:eq(1)');
  jTable.find('td:eq(0)')
        .addClass('image-wrap')
        .append(`
          <div>
            <div class="presenter-aspect-ratio-wrap body showing-text">
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

  jContentWrap.append(JS.dom({
    _: 'div',
    cls: 'btn-group',
    $: [
      {
        _: 'button',
        cls: `btn btn-default btn-primary show-text`,
        $: [
          { _: 'span', cls: 'glyphicon glyphicon-picture', 'aria-hidden': true },
          ' ',
          getTranslationFor('show-text-button')
        ],
        onclick: function() {
          var jThis = $(this);
          if (jThis.hasClass('active')) {
            unpresentMedia();
          }
          else {
            presentMedia('text', [text.text], unpressActiveMediaButtons);
            jThis.addClass('active');
          }
        }
      },
      {
        _: 'button',
        cls: `btn btn-default default-text`,
        $: [
          { _: 'span', cls: 'glyphicon glyphicon-check', 'aria-hidden': true },
          ' ',
          getTranslationFor('default-text-button')
        ],
        onclick: function() {
          var jThis = $(this);
          if (jThis.hasClass('active')) {
            appSettings.set('defaultTextIndex', undefined, () => winPresenter.webContents.send('update-default-text', undefined));
          }
          else {
            appSettings.set('defaultTextIndex', textIndex, () => winPresenter.webContents.send('update-default-text', text));
            $('.btn.default-text').removeClass('active');
          }
          jThis.toggleClass('active');
        }
      }
    ]
  }));

  var defaultTextIndex = appSettings.get('defaultTextIndex');
  if (defaultTextIndex === textIndex) {
    jContentWrap.find('.btn.default-text').click();
  }

  jTable.appendTo(jListItem)
        .addClass('list-item-wrap');

  updateDisplayText(text, textIndex);
}

function updateDisplayText(text, i) {
  var jListItem = $('#displayTextsWrap > .list-item').eq(i);
  jListItem.find('.content-wrap .title').text(text.name);
  jListItem.find('.image-wrap .middler-content:eq(0)').html(markdown.makeHtml(text.text));
}

function onMusicEnd() {
  if ($('#btnBGMusic').hasClass('active')) {
    var songIndex = executePropFunc('song-randomizer', [songs, lastSongIndex]);
    var song = songs[songIndex = songIndex == undefined ? JS.random(songs.length - 1, true) : songIndex];
    playSongAt(songIndex, true, songTitlesToLyricsIndex[song.title]);
  }
  else {
    $('#modalMusic').modal('hide');
    unpressActiveMediaButtons();
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

function updateLibLangsCombobox() {
  var property = JS.indexBy(appSettings.get('properties', {}), 'id')['jw-library-languages-page'];
  if (property) {
    var url = property.value;
    $.ajax({
      url,
      success(html) {
        //selLibLangs
        var [rsconf, lib] = (url.match(/\/(r\d+)\/(lp-\w+)(?:[\/#\?]|$)/) || []).slice(1);
        var langs = executePropFunc('parse-jw-library-languages-page', [html, rsconf, lib]);
        var saved_rsconf = appSettings.get('rsconf');
        if (!saved_rsconf) {
          $('#selLibLangs').html('<option></option>');
        }
        langs.forEach(({name, lang, rsconf, lib}, index) => {
          $('#selLibLangs').append($(JS.dom({
            _: 'option',
            value: index,
            text: `${name} - ${lang}`,
            selected: rsconf == saved_rsconf 
          })).data('rsconf', rsconf).data('lib', lib));
        });
        $('#selLibLangs').combobox('refresh');
        $('#collapseLyrics .panel-body > .success').show();
        $('#formLyricsLang :input:visible:eq(0)').focus();
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
}

function updateLyricsImportTable() {
  var jTBody = $('#tblLyricsImport > tbody').html('');
  try {
    jTBody.append(readFileJSON(USER_LYRICS_PATH).map(({heading, title, theme, stanzas}) => JS.dom({
      _: 'tr',
      $: [
        { _: 'td', text: heading },
        { _: 'td', text: title },
        { _: 'td', text: theme },
        { _: 'td', text: stanzas.length }
      ]
    })));
  }
  catch (e) {
    jTBody.append(`<tr><td style="text-align: center; font-style: italic;" colspan="4">No lyrics have been loaded yet.</td></tr>`);
  }
}

function onSubmitLyricsLang(e) {
  try { fs.unlinkSync(USER_LYRICS_PATH); } catch(e){}
  updateLyricsImportTable();

  var jOpt = $(`#selLibLangs > option[value=${$('#selLibLangs').val()}]`);
  var rsconf = jOpt.data('rsconf');
  var lib = jOpt.data('lib');
  var songs = [];
  if (rsconf) {
    appSettings.set('rsconf', rsconf);
    var urls = SONG_CODES.map((pubCode, i) => executePropFunc('get-jw-library-lyrics-page-url', [i + 1, rsconf, lib, pubCode]));

    var loader = new Loader({ max: SONG_COUNT, title: 'Load Lyrics from Online JW Library' });

    function f() {
      var url = urls.shift();
      var songNumber = SONG_COUNT - urls.length;
      loader.value = songNumber - 1;
      loader.text = `Loading song #${songNumber}...`;
      if (url) {
        $.ajax({
          url,
          success(html) {
            var song = executePropFunc('parse-jw-library-lyrics-page', [html]);
            if (song) {
              songs.push(song);
              f();
            }
          },
          error() {
            loader.close();
          },
          dataType: 'html'
        });
      }
      else {
        // Done
        fs.writeFileSync(USER_LYRICS_PATH, JSON.stringify(songs), 'utf8');
        updateLyricsImportTable();
        loader.close();
      }
    }
    f();
  }
  e.preventDefault();
  return false;
}

function onClickDeleteText() {
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

      $('#displayTextsWrap > .list-item').eq(index).remove();

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
}

function onReady() {
  JS.addTypeOf(jQuery, 'jQuery');

  $('select.combobox').combobox();

  $('.panel:not(.dont-save-collapse) .panel-collapse').on('show.bs.collapse hide.bs.collapse', e => {
    var collapsibles = appSettings.get('collapsibles', {});
    collapsibles[e.target.id] = e.type;
    appSettings.set('collapsibles', collapsibles);
  });

  $('#collapseLyrics')
    .on('show.bs.collapse', () => {
      updateLibLangsCombobox();
      updateLyricsImportTable();
    })
    .on('hidden.bs.collapse', JS.callReturn(() => $('#collapseLyrics .panel-body').find('> .alert, > .success').hide()));

  $('#btnSetSongsDir').click(() => {
    dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: appSettings.get('songsDir')
    }, dirPaths => {
      if (dirPaths) {
        var dirPath = dirPaths[0].replace(new RegExp(`(${JS.quoteRegExp(path.sep)})?$`), path.sep);
        appSettings.set('songsDir', dirPath);
        appSettings.set('songs', songs = []);
        setSongsDir(dirPath);
      }
    });
  });

  $('#btnRefreshSongsDir').click(function() {
    var dirPath = appSettings.get('songsDir');
    if (!isDirectorySync(dirPath)) {
      appSettings.set('songsDir', dirPath = undefined);
    }
    setSongsDir(dirPath);
  });

  $('#btnSetMusicPicDir').click(() => {
    dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: appSettings.get('musicPicDir')
    }, ([dirPath]) => {
      if (dirPath) {
        var dirPath = dirPath.replace(new RegExp(`(${JS.quoteRegExp(path.sep)})?$`), path.sep);
        appSettings.set('musicPicDir', dirPath);
        setMusicPicDir(dirPath);
      }
    });
  });

  $('#btnRefreshMusicPicDir').click(function() {
    var dirPath = appSettings.get('musicPicDir');
    if (!isDirectorySync(dirPath)) {
      appSettings.set('musicPicDir', dirPath = undefined);
    }
    setMusicPicDir(dirPath);
  });

  $('#formLyricsLang').on('submit', onSubmitLyricsLang);

  $('#btnUpdateLanguages').click(function() {
    var url = getAppProp('jw-library-languages-page').value;
    $.get(url, function(html) {
      var [rsconf, lib] = (url.match(/\/(r\d+)\/(lp-\w+)(?:[\/#\?]|$)/) || []).slice(1);
      var langs = executePropFunc('parse-jw-library-languages-page', [html, rsconf, lib]);
      fs.writeJsonSync(USER_WOL_LANGUAGES_PATH, langs, { spaces: 2 });
      listWOLLangs();
    });
  });

  $('.js-btn-set-media-dir').click(() => {
    dialog.showOpenDialog(
      {
        properties: ['openDirectory'],
        defaultPath: appSettings.get('displayDir')
      },
      (dirPaths) => {
        if (dirPaths) {
          var dirPath = dirPaths[0];
          appSettings.set('displayDir', dirPath);
          setDisplayDir(dirPath);
        }
      }
    );
  });

  $('.js-btn-refresh-media-dir').click(() => {
    var dirPath = appSettings.get('displayDir');
    if (!isDirectorySync(dirPath)) {
      appSettings.set('displayDir', dirPath = undefined);
    }
    setDisplayDir(dirPath);
  });

  $('#btnBGMusic').click(({target}) => {
    var j = $(target);
    var wasPressed = j.hasClass('active');
    // Done this way cuz of unpressActiveMediaButtons()
    if (wasPressed) {
      unpresentMedia();
    }
    else {
      j.addClass('active');
    }
    onMusicEnd();
  });

  $('#lblText').click(() => textEditor.focus());

  $('#tdWrapAllTabs [data-toggle=tab]').click(({target}) => {
    appSettings.set('mainTabText', $(target).text());
    $('#tdWrapAllTabs [role=tabpanelhead]').hide();
    $(`#${$(target).data('panelhead')}`).show();
  });

  $('#btnResetProp').click(() => {
    $('#txtPropName').data('index', null);
    $('#propsList > li.active > a').triggerHandler('click');
  });

  $('#btnSaveProp').click(() => updatePropCode(true));

  $('#txtTextName').on('input', (event) => {
    var texts = appSettings.get('texts', []);
    var j = $(event.target);
    var index = j.data('index');
    var text = texts[index];
    if (text) {
      $('#textsList > li.text').eq(index).find('a').text(text.name = j.val());
      appSettings.set('texts', texts);
      updateDisplayText(text, index);
    }
  });

  $('#linkAddText').click(() => {
    var texts = appSettings.get('texts', []);
    var index = texts.length;
    var text = {name:`Text #${index}`,text:''};
    texts.push(text);
    appSettings.set('texts', texts);
    addTextToList(text, index, true);
  });

  $('#btnDeleteText').click(onClickDeleteText);

  $('#collapseText').on('shown.bs.collapse', adjustTextPreviewZoom);

  textEditor = ace.edit('divText');
  textEditor.session.setOptions({
    mode: 'ace/mode/markdown',
    tabSize: 2,
    useSoftTabs: true
  });
  textEditor.on('change', JS.debounce((e, editor) => {
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

  $('#modalMusic .btn-stop-music, #modalVideo .btn-stop-video').click(() => {
    unpresentMedia();
  });

  $('#modalVideo .range').on('change', ({target}) => {
    $('#modalVideo .current-time').text(formatTime(~~target.value));
    winPresenter.webContents.send('set-video-time', target.value);
  });

  $('#modalVideo .btn-pause-video').click(() => {
    var isPaused = toggleVideoPauseButton();
    $('#modalVideo .range').prop('disabled', !isPaused);
    winPresenter.webContents.send('pause-video');
  });

  ['move-lyrics-up', 'move-lyrics-down', 'pause-music'].forEach(
    (name) => $(`#modalMusic .btn-${name}`).click(() => {
      if (name == 'pause-music') {
        toggleMusicPauseButton();
      }
      winPresenter.webContents.send(name);
    })
  );

  $('#selWOLLangs').on('change', ({target}) => {
    appSettings.set('wolLang', target.value);
    showWOLContent();
  });

  $('#btnDownloadBible').click((event) => {
    $('#selWOLLangs').each((i, el) => {
      executePropFunc('parse-bible-from-wol', [
        `https://wol.jw.org/${el.value}/`,
        (success, results) => {
          if (success) {
            var biblePath = path.join(USER_DATA_PATH, `bible-${results.locale}`);
            fs.ensureDirSync(biblePath);
            fs.emptyDirSync(biblePath);

            var books = [];
            if (results.hebrew) {
              results.hebrew.books = results.hebrew.books.map(book => {
                books.push(book);
                var bareBook = JS.extend({}, book);
                bareBook.chapters = book.chapters.map(chapter => chapter.verses.length);
                return bareBook;
              });
            }
            if (results.greek) {
              results.greek.books = results.greek.books.map(book => {
                books.push(book);
                var bareBook = JS.extend({}, book);
                bareBook.chapters = book.chapters.map(chapter => chapter.verses.length);
                return bareBook;
              });
            }
            books.forEach(book => {
              var bookPath = path.join(biblePath, `${book.no} - ${book.name}.json`);
              fs.writeJsonSync(bookPath, book, {encoding: 'utf8', spaces: 0});
            });
            var indexPath = path.join(biblePath, 'index.json');
            fs.writeJsonSync(indexPath, results, {encoding: 'utf8', spaces: 0});
            dialog.showMessageBox({
              title: 'Bible Downloaded',
              message: `The Bible downloaded successfully in ${results.lang}.`,
              buttons: ['OK'],
              type: 'info'
            });
          }
          else {
            console.error('parse-bible-from-wol:', results);
            dialog.showErrorBox('Watchtower Online Library Parser Failed', JSON.stringify(results, null, 2));
          }
        }
      ]);
    });
  });

  $(window).on('mousemove', function(event) {
    var j = $('#cropper'),
        offset = j.offset(),
        w = j.innerWidth(),
        h = j.innerHeight(),
        x = Math.min(Math.max(0, event.pageX - offset.left), w) / w,
        y = Math.min(Math.max(0, event.pageY - offset.top), h) / h;
    // For the first point that is found moving...
    for (var movingPoint, movingIndex = cropperVue.points.length; movingIndex-- > 0; ) {
      movingPoint = cropperVue.points[movingIndex];
      if (movingPoint.point.moving) {
        var fnName = movingIndex % 2 ? 'max' : 'min';
        var candidate = movingIndex < 2 ? x : y;
        var extreme = cropperVue.points[movingIndex - 2 * (movingIndex % 2 - 0.5)].point.value;
        movingPoint.point.value = Math[fnName](candidate, extreme);
        break;
      }
    }
  });

  loadSettings();

  initVues();

  // Call any functions that will affect the created vues.
  showWOLContent();
}

function initVues() {
  window.bibleVue = bibleVue = new Vue({
    el: '#displayBibleWrap',
    data: { hebrew: {}, greek: {}, book: null, chapterIndex: null, verseIndex: null },
    methods: {
      goToSettings() {
        $('a[aria-controls=settingsPanel]')
          .click()
          .one('shown.bs.tab', () => {
            $('a[aria-controls=collapseWOL].collapsed').click()[0];
            $('#collapseWOL')[0].scrollIntoViewIfNeeded();
          });
      },
      setBook(book) {
        this.book = book;
        this.chapterIndex = null;
        this.verseIndex = null;
        Vue.nextTick(() => $('a[aria-controls=collapseBibleChapters].collapsed').click()[0]);
      },
      setChapterIndex(index) {
        this.chapterIndex = index;
        this.verseIndex = null;
        Vue.nextTick(() => $('a[aria-controls=collapseBibleVerses].collapsed').click()[0]);
      },
      setVerseIndex(index) {
        this.verseIndex = this.verseIndex == index ? null : index;
        if (this.verseIndex != null) {
          var lang = $('#selWOLLangs').val();
          var biblePath = path.join(USER_DATA_PATH, `bible-${lang}`);
          var book = this.book;
          var chapterIndex = this.chapterIndex;
          var bookPath = path.join(biblePath, `${book.no} - ${book.name}.json`);
          var bookData = fs.readJsonSync(bookPath, {encoding: 'utf8'});
          var text = bookData.chapters[chapterIndex].verses[this.verseIndex];
          var source = `${book.name} ${chapterIndex+1}:${this.verseIndex+1}`;
          presentMedia('bible', [text.trim(), source], (type, text, source) => {
            if (type != 'bible') {
              this.verseIndex = null;
            }
          });
        }
        else {
          unpresentMedia();
        }
      }
    }
  });
  cropperVue = new Vue({
    el: '#modalImage',
    data: {
      width: null,
      height: null,
      filePath: null,
      xPoints: [
        { value: 0.25, moving: false },
        { value: 0.75, moving: false }
      ],
      yPoints: [
        { value: 0.25, moving: false },
        { value: 0.75, moving: false }
      ]
    },
    methods: {
      mouseDown(event, thisPoint) {
        $(window).one('mouseup', function() {
          thisPoint.point.moving = false;
        });
        thisPoint.point.moving = true;
        event.preventDefault();
      },
      reset() {
        this.points.forEach(({point}, index) => JS.extend(point, { value: index % 2, moving: false }));
      },
      update() {
        var img = new Image();
        img.onload = () => {
          var x = cropperVue.xPoints[0].value * cropperVue.width;
          var y = cropperVue.yPoints[0].value * cropperVue.height;
          var w = cropperVue.xPoints[1].value * cropperVue.width - x;
          var h = cropperVue.yPoints[1].value * cropperVue.height - y;
          var canvas = JS.dom({ _: 'canvas', width: w, height: h });
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          presentMedia('image', [canvas.toDataURL(), { width: w, height: h}]);
        };
        img.src = getCleanPath(cropperVue.filePath);
      },
      close() {
        unpresentMedia();
      }
    },
    computed: {
      points: function() {
        var midX = (this.xPoints[0].value + this.xPoints[1].value) / 2;
        var midY = (this.yPoints[0].value + this.yPoints[1].value) / 2;
        return this.xPoints.concat(this.yPoints).map(function(point, index) {
          var newPoint = index < 2 ? { x: point.value, y: midY } : { x: midX, y: point.value };
          newPoint.point = point;
          return newPoint;
        });
      },
      overlays: function() {
        return [
          { left: 0, right: 1 - this.xPoints[0].value, top: 0, bottom: 1 - this.yPoints[1].value },
          { left: 0, right: 1 - this.xPoints[1].value, top: this.yPoints[1].value, bottom: 0 },
          { left: this.xPoints[1].value, right: 0, top: this.yPoints[0].value, bottom: 0 },
          { left: this.xPoints[0].value, right: 0, top: 0, bottom: 1 - this.yPoints[0].value }
        ];
      }
    }
  });
}

var [presentMedia, unpresentMedia] = (function(lastOnUnpresent) {
  function callOnUnpresent(newOnUnpresent, argsNew) {
    try {
      if (JS.isFunction(lastOnUnpresent)) {
        lastOnUnpresent.apply(null, argsNew);
      }
    }
    catch (e) {
      throw e;
    }
    finally {
      lastOnUnpresent = newOnUnpresent;
    }
  }
  return [
    function presentMedia(type, args, opt_onUnpresent) {
      var argsSlice1 = [type].concat(args);
      callOnUnpresent(opt_onUnpresent, argsSlice1);
      winPresenter.webContents.send.apply(winPresenter.webContents, ['present-media'].concat(argsSlice1));
    },
    function unpresentMedia() {
      callOnUnpresent();
      winPresenter.webContents.send('unpresent-media');
    }
  ];
})();

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

  $('#divPropFuncSig, #divPropCodeWrap, #divPropInputWrap, #divPropList').hide();

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
  else if (property.type == 'properties-list') {
    $('#divPropList')
      .append(property.value.map(({label, value}, i, a) => JS.dom({
        _: 'div',
        cls: `input-group ${i+1<a.length?'line-margin-after':''}`,
        $: [
          {
            _: 'label',
            cls: 'input-group-addon',
            text: label,
            for: `labelProp${i}`
          },
          {
            _: 'input',
            id: `labelProp${i}`,
            type: 'text',
            cls: `form-control`,
            placeholder: value,
            value: value,
            oninput: JS.debounce(() => updatePropCode(true), 250)
          }
        ]
      })))
      .show();
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
  else if (property.type == 'properties-list') {
    for (var jInputs = $('#divPropList :text'), props = property.value, i = props.length; i--;) {
      if (props[i].value != jInputs.eq(i).val()) {
        return true;
      }
    }
    return false;
    property.value.forEach(function(prop, i) {
      prop.value = jInputs.eq(i).val();
    });
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
        updatePresenterCSS(property.value);
      }
    }
    else if (['text', 'url'].includes(property.type)) {
      property.value = $('#txtPropInput').val();
    }
    else if (property.type == 'properties-list') {
      var jInputs = $('#divPropList :text');
      property.value.forEach(function(prop, i) {
        prop.value = jInputs.eq(i).val();
      });
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

function aspectFor(width, height, maxWidth, maxHeight, opt_cover) {
  var w = Math[opt_cover ? 'max' : 'min'](maxHeight * width / height, maxWidth);
  return { width: w, height: w * height / width };
}

$(onReady);
