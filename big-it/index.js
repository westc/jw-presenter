const markdown = new (require('showdown').Converter);

const {BrowserWindow} = require('electron').remote;
const win = JS.indexBy(BrowserWindow.getAllWindows(), 'name')['big-it'];

// Cause target="_blank" links to open in the default browser
win.webContents.on('new-window', function(event, url) {
  if (/^https?:\/\//i.test(url)) {
    BrowserWindow.getAllWindows().forEach((w) => !w.name && w.close());
    shell.openExternal(url);
  }
});

var text = JS.parseURL().params.text || JS.getCookie('text', '');

function toggleFullscreen(e) {
  var d = document, done;
  e = e || d.documentElement;
  '-frsexit ms-FRsExit moz-FRSCancel webkit-FRsExit'.replace(/(\w*)-(f)(r)(s)(\w+)/gi, function(_, p, f, r, s, c) {
    if (!done) {
      s = 'ull' + s + 'creen';
      if (d[p + f + s + 'Element'] && d[c = p + c + 'F' + s]) {
        d[c]();
        done = 1;
      }
      else if (done = e[r = p + r + 'equestF' + s]) {
        e[r]();
      }
    }
  });
}

function showModal(options) {
  options.options = options.options || {};

  var idSuffix = (Math.random() + '').replace('0.', ''),
      btns = options.buttons || [{ text: 'OK', type: 'primary' }],
      HTML = `
        <div class="modal fade" id="modal[#]" tabindex="-1" role="dialog" aria-labelledby="modalLabel[#]">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <button type="button" class="modal-close close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title" id="modalLabel[#]"></h4>
              </div>
              <div class="modal-body"></div>
              <div class="modal-footer"></div>
            </div>
          </div>
        </div>
        `.replace(/\[#\]/g, idSuffix);
  var jModal = $(HTML);
  var jModalBody = jModal.find('.modal-body');
  var jFields;
  if (options.title) {
    jModal.find('.modal-title').text(options.title);
  }
  if (options.fields) {
    var jForm = $('<form>').appendTo(jModalBody);
    jFields = [];
    options.fields.forEach(function(field, fieldIndex) {
      var jField,
          jFormGroup = $('<div>').addClass('form-group').appendTo(jForm),
          fieldId = 'modalFieldLabel' + idSuffix + '-' + fieldIndex,
          labelType;
      if (labelType = (field.label && 'text') || (field.labelHTML && 'html')) {
        $('<label>').attr('for', fieldId).appendTo(jFormGroup)[labelType](field[labelType == 'text' ? 'label' : 'labelHTML']);
      }
      if (/^(multiline|textarea)$/i.test(field.type)) {
        jFields.push(jField = $('<textarea>').attr('id', fieldId).addClass('form-control').appendTo(jFormGroup));
      }
      else {
        jFields.push(jField = $('<input>').attr('id', fieldId).addClass('form-control').attr('type', field.type || 'text').appendTo(jFormGroup));
      }
      'min max placeholder value indeterminate name readOnly step disabled pattern size rows cols maxLength checked'.replace(/\w+/g, function(propName) {
        if (field.hasOwnProperty(propName)) {
          jField.prop(propName, field[propName]);
        }
      });
    });
  }
  else if (options.text) {
    jModalBody.text(options.text);
  }
  else if (options.html) {
    jModalBody.html(options.html);
  }
  if (options.onlyCloseWithButton) {
    options.options.backdrop = 'static';
    options.options.keyboard = false;
  }
  if (!options.closeButton) {
    jModal.find('.close-button').remove();
  }
  btns.forEach(function(btn, index) {
    if (Object.prototype.toString.call(btn).slice(8, -1) == 'String') {
      btn = { text: btn, type: 'default' };
    }
    var jElem = $('<button type="button" class="btn">');
    if (btn.text) {
      jElem.text(btn.text);
    }
    else if (btn.html) {
      jElem.html(btn.html);
    }
    if (btn.classList) {
      jElem.addClass(btn.classList.join(' '));
    }
    if (btn.type) {
      jElem.addClass(btn.type.replace(/\w+/g, 'btn-$&'));
    }
    jElem.click(function(e) {
      var result;
      if (options.onButtonClick) {
        var fieldValues = [];
        fieldValues.byName = {};
        result = options.onButtonClick.call(
          jElem[0],
          e,
          { text: jElem.text(), index: index },
          jFields && jFields.reduce(function(fieldValues, jField) {
            var name = jField.prop('name');
            if (name) {
              fieldValues.byName[name] = jField.val();
            }
            fieldValues.push(jField.val());
            return fieldValues;
          }, fieldValues)
        );
      }
      if (!result) {
        jModal.modal('hide');
      }
    });
    jModal.find('.modal-footer').append(jElem);
    jModal
      .appendTo('body')
      .on('hidden.bs.modal', function(e) {
      jModal.remove();
    })
      .modal(options.options || {});
  });
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
    elem.style.fontSize = newFontSize + 'px';
    var {scrollWidth, offsetWidth, scrollHeight, offsetHeight} = elem;
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

function htmlify(str, opt_useBR) {
  return str.replace(/[<>&\xA0\u0100-\uFFFF]|(\r?\n|\r)/g, function(c, isNewLine) {
    return isNewLine && opt_useBR ? '<br />' : ('&#' + c.charCodeAt(0) + ';');
  });
}

function setInput() {
  showModal({
    title: 'Input',
    fields: [
      {
        type: 'multiline',
        labelHTML: 'Full screen text (<a href="https://guides.github.com/features/mastering-markdown/#syntax" target="_blank">markdown</a> accepted):',
        placeholder: 'Text to show on the screen',
        rows: 5,
        value: text
      }
    ],
    buttons: [
      { text: 'Show', type: 'primary default' },
      { text: 'Fullscreen', type: 'warning' },
      { text: 'Cancel', type: 'danger' }
    ],
    onlyCloseWithButton: true,
    closeButton: false,
    onButtonClick: function(e, button, fields) {
      if (button.index === 0) {
        $('#divText').html(markdown.makeHtml(text = fields[0]));
        JS.setCookie('text', text);
        resize();
      }
      else if (button.index == 1) {
        win.setFullScreen(!win.isFullScreen());
        return true;
      }
    }
  });
}

function resize() {
  var jText = $('#divText'), elemText = jText[0];
  if (jText.text().trim()) {
    elemText.style.paddingTop = elemText.style.bottom = null;
    maximizeFontSize(elemText);
    var oldHeight = elemText.offsetHeight;
    jText.css('bottom', 'inherit');
    var newHeight = elemText.offsetHeight;
    if (oldHeight < newHeight) {
      elemText.style.paddingTop = elemText.style.bottom = null;
    }
    else {
      elemText.style.paddingTop = (oldHeight - newHeight) / 2 + 'px';
    }
  }
}

$(function() {
  $('#divText').html(markdown.makeHtml(text));
  resize();

  $(window).resize(resize);

  $('#divText').click(setInput).triggerHandler('click');
});