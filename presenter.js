const path = require('path');
const { BrowserWindow, ipcMain } = require('electron').remote;
const { presenter: winPresenter, main: winMain } = JS.indexBy(BrowserWindow.getAllWindows(), 'name');
const markdown = new (require('showdown').Converter);

var media, mediaWidth, mediaHeight, defaultText;

ipcMain.on('show-image', function(cleanPath, details) {
  reset();

  $('body').addClass('showing-media showing-image');

  ({width: mediaWidth, height: mediaHeight} = details);
  $('.middler-content').append(media = JS.dom({ _: 'img', src: cleanPath }));
  resizeMedia();
});

ipcMain.on('show-video', function(cleanPath, details) {
  reset();

  $('body').addClass('showing-media showing-video');

  ({width: mediaWidth, height: mediaHeight} = details);
  $('.middler-content')
    .append(media = JS.dom({
      _: 'video',
      src: cleanPath,
      onended: function() {
        reset();
        ipcMain.emit('ended-presenter-video');
      }
    }));
  resizeMedia();
  media.play();
});

ipcMain.on('show-text', function(strText) {
  reset();
  $('body').addClass('showing-media showing-text');
  $('.middler-content:eq(0)').html(markdown.makeHtml(strText));
});

ipcMain.on('unset-default-text', function() {
  if (!$('body').is('.showing-media')) {
    reset();
  }
  defaultText = undefined;
});

ipcMain.on('set-default-text', function(strText) {
  reset();
  defaultText = strText;
  if (!$('body').is('.showing-media')) {
    $('.middler-content:eq(0)').html(markdown.makeHtml(defaultText));
  }
});

ipcMain.on('reset-presenter', function() {
  reset();
  ipcMain.emit('resend-default-text');
});

function reset() {
  media = null;
  $('body')
    .removeClass('showing-media showing-text showing-video showing-image')
    .css('background-image', '');
  $('.middler-content').html('');
}

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

winPresenter.on('resize', resizeMedia);

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

function showSong({heading, title, theme, stanzas}, linesToShowAtEnd, secsDuration, secsDelay, secsToEndEarly, onEnd) {
  var jLine, jWrap = $('<div class="song-wrap"></div>').appendTo('body');
  var jHeadWrap = $('<div class="heading-wrap"></div>').appendTo(jWrap);
  var jHeading = $('<div class="song-number"></div>').text(heading).appendTo(jHeadWrap);
  var jTitle = $('<div class="title"></div>').text(title).appendTo(jHeadWrap);
  var jTheme = $('<div class="theme-text"></div>').text(theme).appendTo(jHeadWrap);
  var jTable = $('<div class="lyrics-table"></div>').appendTo(jWrap);
  
  stanzas.forEach(function(lines, i) {
    var jRow = $('<div class="stanza"></div>').appendTo(jTable);
    
    var jCell1 = $('<div class="number-cell"></div>').text(`${i+1}.`).appendTo(jRow);
    
    var jCell2 = $('<div class="lines-cell"></div>').appendTo(jRow);
    
    lines.forEach(function(line, i) {
      jLine = $('<div class="line"></div>').css('paddingLeft', i % 2 ? '1em' : 0).text(line).appendTo(jCell2);
    });
  });
  
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
          clearInterval(interval);
          onEnd('ended');
        }
      }
    }, 100);
  }
  
  return function(action, value) {
    if (interval == undefined) {
      throw new Error('The song has already finished being shown.');
    }
    
    if (action == 'stop') {
      clearInterval(interval);
      interval = undefined;
      onEnd('stopped');
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
