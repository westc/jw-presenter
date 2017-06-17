const fs = require('fs');
const isFileSync = pathToCheck => (fs.existsSync(pathToCheck) || undefined) && fs.statSync(pathToCheck).isFile();

const path = require('path');
const electron = require('electron');
const { ipcRenderer, remote } = electron;
const { BrowserWindow } = remote;
const { presenter: winPresenter, main: winMain } = JS.indexBy(BrowserWindow.getAllWindows(), 'name');
const markdown = new (require('showdown').Converter);

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
          winMain.webContents.send('ended-presenter-video');
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
  song: function({path, isBGMusic, lyrics, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, startPaused}) {
    if (isBGMusic) {
      $('<div class="music-presenter-bg">')
        .css({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        })
        .appendTo('body');
      $('<div class="middler-wrap music-presenter"><div class="middler-table"><div class="middler-content"><div class="image">')
        .css({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        })
        .appendTo('body');
      $('<div class="music-presenter-details"><div class="time"></div><div class="song-title"></div></div>')
        .css({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0
        })
        .appendTo('body');
      if (!$('body').is('.showing-background-music')) {
        changeSongImage();
      }
      $('body, .body').addClass('showing-background-music');
    }
    else if (lyrics) {
      $('body, .body').addClass('showing-lyrics');
      lyricsControl = showSongLyrics(lyrics, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, () => showDefaultText());
    }

    audio.pause();
    audio.volume = 1;
    audio.src = path;
    audio.currentTime = 0;
    if (!startPaused) {
      audio.play();
    }
  }
};

var media, mediaWidth, mediaHeight, objDefaultText, lyricsControl, songImagePaths, audio;

function showDefaultText(opt_avoidReset) {
  if (!opt_avoidReset) {
    reset();
  }
  
  $('body, .body').addClass('showing-default-text showing-text');
  $('.middler-content:eq(0)').html(markdown.makeHtml(JS.get(objDefaultText, 'text', '')));
}

function changeSongImage() {
  if (JS.get(songImagePaths, 'length')) {
    var imagePath = songImagePaths.pop();
    songImagePaths.unshift(imagePath);

    // On Windows the backslash needs to be doubly escaped:
    // http://cwestblog.com/2017/06/16/css-local-file-system-paths-on-windows/
    var cssImagePath = imagePath.replace(/\\/g, '\\\\');

    var jMusicPresenter = $('.music-presenter');
    var jMusicPresenterBG = $('.music-presenter-bg');
    var img = new Image();
    img.src = imagePath;
    img.onload = function() {
      jMusicPresenterBG.css('background-image', `url("${cssImagePath}")`);
      jMusicPresenter
        .find('.image')
          .css({
            backgroundImage: `url("${cssImagePath}")`,
            display: 'inline-block',
            backgroundSize: 'contain',
            transform: `rotate(${JS.random(0, 2, true) * 360}deg)`
          })
          .data('width', img.width)
          .data('height', img.height);
      resizeMedia();
    };
  }
  else {
    showDefaultText(true);
  }
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

  if ($('body').is('.showing-background-music')) {
    var j = $('.music-presenter-bg, .music-presenter, .music-presenter-details').fadeTo(500, 0, () => j.remove());
    fadeMusicOut();
  }
  else {
    audio.pause();
  }

  media = null;
  $('body, .body')
    .removeClass('showing-media showing-text showing-default-text showing-video showing-image showing-lyrics showing-background-music showing-song')
    .css('background-image', '');
  $('.middler-content').html('');
}

function resizeMedia() {
  var [winWidth, winHeight] = winPresenter.getContentSize();
  if (media) {
    var {width, height} = fitInto(winWidth, winHeight, mediaWidth, mediaHeight);
    JS.extend(media.style, { width: `${width}px`, height: `${height}px` });
  }

  var jMusicPresenter = $('.music-presenter');
  if (jMusicPresenter[0]) {
    var jImage = jMusicPresenter.find('.image');
    console.log({winWidth, winHeight, width:jImage.data('width'), height:jImage.data('height')});
    var {width, height} = fitInto(winWidth, winHeight, jImage.data('width'), jImage.data('height'));
    jImage.css({ width: width, height: height });
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
  var secsScrollTime = (secsDuration - secsDelay - secsToEndEarly);
  var percentOffset = 0;

  function play() {
    interval = setInterval(function() {
      var tsNow = +new Date();
      var secsPast = audio.currentTime + audio.duration * percentOffset / 100;
      if (secsPast >= secsDelay) {
        var percent = Math.min((secsPast - secsDelay) / (secsScrollTime - secsToEndEarly), 1);
        var fullDistance = jWrap.outerHeight() - jLine.outerHeight() * linesToShowAtEnd;
        jWrap.css('top', -percent * fullDistance);
        if (secsPast >= secsDuration) {
          stop('ended');
        }
      }
    }, 100);
  }

  function stop(type) {
    clearInterval(interval);
    interval = undefined;
    jWrap.remove();
    onEnd && onEnd('ended');
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
    else if (action == 'offset') {
      percentOffset += value;
      console.log({percentOffset});
    }
    else {
      throw new Error(`Unsupported action "${action}".`);
    }
  };
}

ipcRenderer.on('present-media', function(event, mediaType) {
  reset();

  var caller = MEDIA_PRESENTERS[mediaType];
  if (caller) {
    $('body, .body').addClass(`showing-media showing-${mediaType}`);
    caller.apply(this, JS.slice(arguments, 2));
  }
  else {
    console.error(`Unsupported media type: ${mediaType}`);
  }
});

ipcRenderer.on('update-song-images', (event, arrOfPaths) => {
  songImagePaths = JS.randomize(arrOfPaths);
});

ipcRenderer.on('update-default-text', (event, objNewDefaultText) => {
  objDefaultText = objNewDefaultText;
  if ($('body').is(':not(.showing-media)')) {
    showDefaultText();
  }
});

ipcRenderer.on('unpresent-media', () => showDefaultText());

ipcRenderer.on('update-presenter-css', (event, code) => {
  var style = $('#presenterStyle')[0];
  if (style.styleSheet && !style.sheet) {
    style.styleSheet.cssText = code;
  }
  else {
    style.innerHTML = '';
    style.appendChild(document.createTextNode(code));
  }
});

ipcRenderer.on('move-lyrics-up', () => lyricsControl('offset', 1));

ipcRenderer.on('move-lyrics-down', () => lyricsControl('offset', -1));

ipcRenderer.on('pause-music', () => audio[audio.paused ? 'play' : 'pause']());

winPresenter.on('resize', () => {
  winPresenter.setMenuBarVisibility(!winPresenter.isFullScreen());
  resizeMedia();
});

function fadeMusicOut() {
  audio.volume = 0.99;
  var interval = setInterval(function() {
    if (audio.volume >= 1 || audio.volume <= 0) {
      clearInterval(interval);
    }
    audio.volume = JS.clamp(audio.volume - 0.01, 0, 1);
  }, 10);
}

function onReady() {
  $('body').on('dblclick', function(e) {
    e.preventDefault();
    // Toggle fullscreen mode on the browser window.
    winPresenter.setFullScreen(!winPresenter.isFullScreen());
    // Make sure to deselect everything cuz often times double-clicking causes
    // a range to be selected
    document.getSelection().removeAllRanges();
  });

  window.audio = audio = $('<audio>')
    .on('ended', function() {
      winMain.webContents.send('ended-presenter-song');
      if (!$('body').is('.showing-background-music')) {
        showDefaultText();
      }
    })
    .on('error', function() {
      console.error('Error loading music:', { audio: audio, src: audio.src, arguments: arguments });
      winMain.webContents.send('ended-presenter-song');
      if (!$('body').is('.showing-background-music')) {
        showDefaultText();
      }
    })
    [0];

  setInterval(function() {
    if ($('body').is('.showing-background-music')) {
      changeSongImage();
    }
  }, 5000);

  setInterval(function() {
    $('.music-presenter-details > .time').text(JS.formatDate(new Date, 'h:mm:ss A'));
  }, 500);
}

$(onReady);
