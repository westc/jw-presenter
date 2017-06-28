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

    appendMiddler(media = JS.dom({ _: 'img', src: cleanPath }), 'showing-image');

    resizeMedia();
  },
  video: function(cleanPath, details) {
    ({width: mediaWidth, height: mediaHeight} = details);

    appendMiddler(
      media = JS.dom({
        _: 'video',
        src: cleanPath,
        onended() {
          winMain.webContents.send('ended-presenter-video');
          showDefaultText();
        },
        currentTime: details.time
      }),
      'showing-video'
    );

    resizeMedia();

    if (!details.paused) {
      media.play();
    }
  },
  text: function(strText) {
    appendMiddler(markdown.makeHtml(strText), 'showing-text');
  },
  song: function({path, isBGMusic, lyrics: lyricsData, imagePaths, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, startPaused}) {
    if (isBGMusic) {
      if (!$('.body.active').is('.showing-background-music')) {
        appendBGMusicPresenter('showing-song showing-background-music');
        songImagePaths = JS.randomize(imagePaths);
        if (songImagePaths.length) {
          changeSongImage();
        }
      }
    }
    else if (lyricsData) {
      var jBody = appendSongLyrics(lyricsData, 'showing-song showing-lyrics');
      console.log({jBody});
      lyricsControl = showSongLyrics(jBody, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, () => showDefaultText());
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

function appendBody(contents, bodyClassName) {
  return $(`<div class="body active ${bodyClassName}"></div>`)
    .css({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: '9',
      opacity: '0',
      overflow: 'hidden'
    })
    .fadeTo(500, 1)
    .append(contents)
    .appendTo('body');
}

function appendMiddler(contents, bodyClassName) {
  return appendBody(
    `
      <div class="middler-wrap">
        <div class="middler-content"></div>
      </div>
    `,
    bodyClassName
  )
    .find('.middler-wrap')
      .css({
        display: 'table',
        width: '100%',
        height: '100%'
      })
      .find('.middler-content')
        .css({
          display: 'table-cell',
          textAlign: 'center',
          verticalAlign: 'middle'
        })
        .append(contents)
        .end()
      .end();
}

function appendBGMusicPresenter(bodyClassName) {
  return appendBody(
    `
      <div class="music-presenter-bg"></div>
      <div class="music-presenter middler-wrap">
        <div class="middler-content">
          <div class="image"></div>
        </div>
      </div>
      <div class="music-presenter-details">
        <div class="time"></div>
        <div class="song-title"></div>
      </div>
    `,
    bodyClassName
  )
    .find('.music-presenter-bg')
      .css({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
      })
      .end()
    .find('.music-presenter-details')
      .css({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0
      })
      .end()
    .find('.middler-wrap')
      .css({
        display: 'table',
        width: '100%',
        height: '100%'
      })
      .find('.middler-content')
        .css({
          display: 'table-cell',
          textAlign: 'center',
          verticalAlign: 'middle'
        })
        .end()
      .end();
}

function appendSongLyrics({heading, title, theme, stanzas}, bodyClassName) {
  return appendBody(
    `
      <div class="song-wrap">
        <div class="heading-wrap">
          <div class="song-number"></div>
          <div class="title"></div>
          <div class="theme-text"></div>
        </div>
        <div class="lyrics-table"></div>
      </div>
    `,
    bodyClassName
  )
    .find('.song-number').text(heading).end()
    .find('.title').text(title).end()
    .find('.theme').text(theme).end()
    .find('.lyrics-table')
      .css('fontSize', '100vw')
      .append(
        stanzas.map((lines, i) =>
          $('<div class="stanza"></div>').append(
            $('<div class="number-cell"></div>').text(`${i+1}.`),
            $('<div class="lines-cell"></div>').append(
              lines.map((line, i) => $('<div class="line"></div>').css('paddingLeft', `${i&&(i%2+1)}em`).text(line))
            )
          )
        )
      )
      .end();
}

function showDefaultText() {
  reset();

  appendMiddler(
    markdown.makeHtml(JS.get(objDefaultText, 'text', '')),
    'showing-default-text showing-text'
  );
}

function changeSongImage() {
  var imagePath = songImagePaths.pop();
  songImagePaths.unshift(imagePath);

  // On Windows the backslash needs to be doubly escaped:
  // http://cwestblog.com/2017/06/16/css-local-file-system-paths-on-windows/
  var cssImagePath = imagePath.replace(/\\/g, '\\\\');

  var jMusicPresenter = $('.body.active .music-presenter');
  var jMusicPresenterBG = $('.body.active .music-presenter-bg');
  var img = new Image();
  img.src = imagePath;
  img.onload = () => {
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

function readFileJSON(filePath) {
  fs.openSync(filePath, 'r+');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function reset() {
  var jActiveBody = $('.body.active');

  if (lyricsControl && jActiveBody.is('.showing-lyrics')) {
    lyricsControl('stop');
    lyricsControl = null;
  }

  if (jActiveBody.is('.showing-background-music')) {
    fadeMusicOut();
  }
  else {
    audio.pause();
  }

  if (media) {
    media.pause && media.pause();
    media = null;
  }

  jActiveBody.removeClass('active').fadeTo(500, 0, () => jActiveBody.remove());
}

function resizeMedia() {
  var [winWidth, winHeight] = winPresenter.getContentSize();
  if (media) {
    var {width, height} = fitInto(winWidth, winHeight, mediaWidth, mediaHeight);
    JS.extend(media.style, { width: `${width}px`, height: `${height}px` });
  }

  var jMusicPresenter = $('.body.active .music-presenter');
  if (jMusicPresenter[0]) {
    var jImage = jMusicPresenter.find('.image');
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

function showSongLyrics(jBody, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, onEnd) {
  var jWrap = jBody.find('.song-wrap:eq(0)'),
      jTable = jWrap.find('.lyrics-table:eq(0)'),
      jLine = jTable.find('.line:eq(0)');
  
  jTable.css('fontSize', `${100*$(window).outerWidth()/jTable.outerWidth()}vw`);
  
  var msPassedAtPause, interval;
  var tsStart = +new Date();
  var secsScrollTime = (secsDuration - secsDelay - secsToEndEarly);
  var percentOffset = 0;

  function play() {
    interval = setInterval(() => {
      var tsNow = +new Date();
      var secsPast = audio.currentTime + audio.duration * percentOffset / 100;
      if (secsPast >= secsDelay) {
        var percent = Math.min((secsPast - secsDelay) / (secsScrollTime - secsToEndEarly), 1);
        var fullDistance = jWrap.outerHeight() - jLine.outerHeight() * linesToShowAtEnd;
        jWrap.css('top', -percent * fullDistance);
        if (secsPast >= secsDuration) {
          console.log({secsPast,secsDuration});
          stop('ended');
        }
      }
    }, 100);
  }

  function stop(type) {
    clearInterval(interval);
    interval = undefined;
    jBody.remove();
    onEnd && onEnd('ended');
  }

  play();
  
  return (action, value) => {
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
    }
    else {
      throw new Error(`Unsupported action "${action}".`);
    }
  };
}

ipcRenderer.on('present-media', function(event, mediaType) {
  // Always reset unless this is a new song but the background music was already playing.
  if (!(mediaType == 'song' && arguments[2].isBGMusic && $('.body.active').is('.showing-background-music'))) {
    reset();
  }

  var caller = MEDIA_PRESENTERS[mediaType];
  if (caller) {
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
  var jActiveBody = $('.body.active');
  objDefaultText = objNewDefaultText;
  if (!jActiveBody[0] || jActiveBody.is('.showing-default-text')) {
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

ipcRenderer.on('pause-video', () => media[media.paused ? 'play' : 'pause']());

ipcRenderer.on('set-video-time', (event, time) => media.currentTime = time);

winPresenter.on('resize', () => {
  winPresenter.setMenuBarVisibility(!winPresenter.isFullScreen());
  resizeMedia();
});

function fadeMusicOut() {
  audio.volume = 0.99;
  var interval = setInterval(() => {
    if (audio.volume >= 1 || audio.volume <= 0) {
      clearInterval(interval);
    }
    audio.volume = JS.clamp(audio.volume - 0.01, 0, 1);
  }, 10);
}

function onReady() {
  $('body').on('dblclick', (e) => {
    e.preventDefault();
    // Toggle fullscreen mode on the browser window.
    winPresenter.setFullScreen(!winPresenter.isFullScreen());
    // Make sure to deselect everything cuz often times double-clicking causes
    // a range to be selected
    document.getSelection().removeAllRanges();
  });

  window.audio = audio = $('<audio>')
    .on('ended', () => {
      winMain.webContents.send('ended-presenter-song');
      if (!$('.body.active').is('.showing-background-music')) {
        showDefaultText();
      }
    })
    .on('error', () => {
      console.error('Error loading music:', { audio: audio, src: audio.src, arguments: arguments });
      winMain.webContents.send('ended-presenter-song');
      if (!$('.body.active').is('.showing-background-music')) {
        showDefaultText();
      }
    })
    [0];

  setInterval(() => {
    if ($('.body.active').is('.showing-background-music')) {
      changeSongImage();
    }
  }, 7e3);

  setInterval(() => {
    var jActiveBody = $('.body.active');
    if (jActiveBody.hasClass('showing-background-music')) {
      $('.music-presenter-details > .time').text(JS.formatDate(new Date, 'h:mm:ss A'));
    }
    else if (jActiveBody.hasClass('showing-video') && !media.paused) {
      winMain.webContents.send('playing-video', media.currentTime);
    }
  }, 500);
}

$(onReady);
