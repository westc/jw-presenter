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
