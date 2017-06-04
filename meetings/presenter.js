const fs = require('fs');
const isFileSync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

const path = require('path');
const { BrowserWindow, ipcMain } = require('electron').remote;
const { presenter: winPresenter, main: winMain } = JS.indexBy(BrowserWindow.getAllWindows(), 'name');
const markdown = new (require('showdown').Converter);

const APP_BASE_PATH = path.dirname(require.main.filename);
const APP_SETTINGS_PATH = path.join(APP_BASE_PATH, 'settings.json');

const MEDIA_PRESENTERS = {
  image: function(cleanPath, details) {
    ({width: mediaWidth, height: mediaHeight} = details);
    $('.middler-content').append(media = JS.dom({ _: 'img', src: cleanPath }));
    resizeMedia();
  },
  video: function(cleanPath, details) {
    ({width: mediaWidth, height: mediaHeight} = details);
    $('.middler-content')
      .append(media = JS.dom({
        _: 'video',
        src: cleanPath,
        onended() {
          ipcMain.emit('ended-presenter-video');
          showDefaultText();
        },
        currentTime: details.time
      }));
    resizeMedia();
    media.play();
  },
  text: function(strText) {
    $('.middler-content:eq(0)').html(markdown.makeHtml(strText));
  },
  lyrics: function(lyrics, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly) {
    lyricsControl = showSongLyrics(lyrics, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, showDefaultText);
  }
};

var media, mediaWidth, mediaHeight, defaultText, lyricsControl;

function showDefaultText() {
  reset();
  
  var defaultText = getDefaultText();
  if (defaultText) {
    $('body, .body').addClass('showing-default-text showing-text');
  }
  $('.middler-content:eq(0)').html(markdown.makeHtml(defaultText.text || ''));
}

function getDefaultText() {
  try {
    var settings = readFileJSON(APP_SETTINGS_PATH);
    return settings.texts[settings.defaultTextIndex];
  } catch(e){}
}

function readFileJSON(filePath) {
  fs.openSync(filePath, 'r+');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function reset() {
  if (lyricsControl && $('body').is('.showing-lyrics')) {
    lyricsControl('stop');
    lyricsControl = null;
  }

  media = null;
  $('body, .body')
    .removeClass('showing-media showing-text showing-default-text showing-video showing-image showing-lyrics')
    .css('background-image', '');
  $('.middler-content').html('');
}

function resizeMedia() {
  if (media) {
    var [width, height] = winPresenter.getContentSize();
    ({width, height} = fitInto(width, height, mediaWidth, mediaHeight));
    JS.extend(media.style, { width: `${width}px`, height: `${height}px` });
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

function showSongLyrics({heading, title, theme, stanzas}, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, onEnd) {
  var jWrap = $('<div class="song-wrap"></div>').appendTo('body').append(
        $('<div class="heading-wrap"></div>').append(
          $('<div class="song-number"></div>').text(heading),
          $('<div class="title"></div>').text(title),
          $('<div class="theme-text"></div>').text(theme)
        ),
        $('<div class="lyrics-table"></div>').css('fontSize', '100vw').append(
          stanzas.map((lines, i) =>
            $('<div class="stanza"></div>').append(
              $('<div class="number-cell"></div>').text(`${i+1}.`),
              $('<div class="lines-cell"></div>').append(
                lines.map((line, i) => $('<div class="line"></div>').css('paddingLeft', `${i&&(i%2+1)}em`).text(line))
              )
            )
          )
        )
      ).css('opacity', 0).fadeTo(1000, 1),
      jTable = jWrap.find('.lyrics-table:eq(0)'),
      jLine = jTable.find('.line:eq(0)');
  
  jTable.css('fontSize', `${100*$(window).outerWidth()/jTable.outerWidth()}vw`);
  
  var msPassedAtPause, interval;
  var tsStart = +new Date();
  var msDelay = secsDelay * 1000;
  var msEndEarly = secsToEndEarly * 1000;
  var msScrollTime = (secsDuration - secsDelay - secsToEndEarly) * 1000;
  var msDuration = secsDuration * 1000;

  function play() {
    interval = setInterval(function() {
      var tsNow = +new Date();
      var timePast = tsNow - tsStart;
      if (timePast >= msDelay) {
        var percent = Math.min((timePast - msDelay) / (msScrollTime - msEndEarly), 1);
        var fullDistance = jWrap.outerHeight() - jLine.outerHeight() * linesToShowAtEnd;
        Math.min(percent, 1);
        jWrap.css('top', -percent * fullDistance);
        if (timePast >= msDuration) {
          stop('ended');
        }
      }
    }, 100);
  }

  function stop(type) {
    clearInterval(interval);
    interval = undefined;
    jWrap.remove();
    onEnd('ended');
  }

  play();
  
  return function(action, value) {
    if (interval == undefined && action != 'stop') {
      throw new Error('The song has already finished being shown.');
    }
    
    if (action == 'stop') {
      if (interval != undefined) {
        stop('stop');
      }
    }
    else if (action == 'time') {
      tsStart = +new Date() - value * 1000;
    }
    else if (action == 'pause') {
      clearInterval(interval);
      msPassedAtPause = msPassedAtPause || +new Date() - tsStart;
    }
    else if (action == 'play') {
      tsStart = +new Date() - msPassedAtPause;
      msPassedAtPause = 0;
      play();
    }
    else {
      throw new Error(`Unsupported action "${action}".`);
    }
  };
}

function onReady() {
  ipcMain.on('present-media', function(mediaType) {
    reset();

    var caller = MEDIA_PRESENTERS[mediaType];
    if (caller) {
      $('body, .body').addClass(`showing-media showing-${mediaType}`);
      caller.apply(this, JS.slice(arguments, 1));
      ipcMain.emit('media-presented');
    }
    else {
      console.error(`Unsupported media type: ${mediaType}`);
    }
  });

  ipcMain.on('update-default-text', function() {
    if ($('body').is(':not(.showing-media)')) {
      showDefaultText();
    }
  });

  ipcMain.on('unpresent-media', function() {
    showDefaultText();
  })

  ipcMain.on('set-default-text', function(strText) {
    reset();
    defaultText = strText;
    if (!$('body').is('.showing-media')) {
      $('.middler-content:eq(0)').html(markdown.makeHtml(defaultText));
    }
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

  winPresenter.on('resize', () => {
    winPresenter.setMenuBarVisibility(!winPresenter.isFullScreen());
    resizeMedia();
  });

  $('body').on('dblclick', function(e) {
    e.preventDefault();
    if (document.webkitIsFullScreen) {
      document.webkitCancelFullScreen();
    }
    else {
      $('body')[0].webkitRequestFullScreen();
    }
  });
}

$(onReady);
