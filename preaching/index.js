const fs = require('fs');
const path = require('path');
const {dialog, app, shell} = require('electron').remote;
const DEFAULT_SETTINGS = require('./default-settings');

const USER_DATA_PATH = app.getPath('userData');
const USER_SETTINGS_PATH = path.join(USER_DATA_PATH, 'preaching-settings.json');

var isPlayingAll = false, isPlaying = false, isToShowSlides = false, videoFiles = [], randomOrder = [], lastIndexInRandom = 0;

var detailsVue;

var appSettings = {
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
      console.error(e.name + '\n' + e.message + '\n' + e.stack);
    }
    return data;
  })(),
  set: function(keyOrValues, value) {
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
  get: function(key, opt_defaultValue) {
    return JS.has(this._, key) ? this._[key] : opt_defaultValue;
  },
  save: JS.debounce(function() {
    fs.writeFileSync(USER_SETTINGS_PATH, JSON.stringify(this._, 2, 2), 'utf8');
  }, 500)
};

function readFileJSON(path) {
  fs.openSync(path, 'r+');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

var sleepMouse = JS.debounce(function() {
  if (isPlaying) {
    $('body').addClass('no-mouse');
  }
}, 1000);

function scoreSearch(searchTerm, arrRecords) {
  // Zero out the scores to start off.
  var scores = JS(arrRecords).slice().fill(0).$;

  // Loop through all search terms modifying the scores appropriately.
  var trash = JS.deburr(searchTerm).replace(
    /(?:(\+)|(-))?(?:"(.+?)"|\/((?:[^\\\/]|\\.)+)\/(i)?|([^\s,.:;"<>@\[\]\{\}\!\?\xA1\xBF]+)|(@\w+)|([<>]=?)(\d+))/g,
    function(keyword, mustHave, hide, quoted, regExpBody, regExpI, normal, meta, minsSign, mins) {
      if (minsSign) {
        mins = parseInt(mins, 10);
      }
      else if (!meta) {
        var rgx = new RegExp(
          regExpBody || JS.quoteRegExp(quoted || normal).replace(/\\\*/g, "\\S*").replace(/^|$/g, '\\b').replace(/\s+/, '\\b\\s+\\b'),
          regExpBody ? regExpI : 'i'
        );
      }
      arrRecords.forEach(function(record, i) {
        var {text, duration} = record;
        if (scores[i] > -Infinity) {
          var isMatch = minsSign
            ? minsSign == '<'
              ? duration < mins
              : minsSign == '<='
                ? duration <= mins
                : minsSign == '>'
                  ? duration > mins
                  : duration >= mins
            : meta
              ? record[meta]
              : rgx.test(JS.deburr(text));
          if (isMatch ? hide : mustHave) {
            scores[i] = -Infinity;
          }
          else if (isMatch === !hide) {
            scores[i]++;
          }
        }
      });
    }
  );

  // If no search terms were found just return scores of 1 for all records.
  if (trash.indexOf('undefined') < 0) {
    JS.fill(scores, 1);
  }

  // Return the scores as an array where positive numbers should be shown.
  return scores;
}

function compareStrNumArray(arrA, arrB) {
  for (var a, b, i = 0, l = arrA.length, l2 = arrB.length; i < l; i++) {
    a = arrA[i];
    b = i < l2 ? arrB[i] : '';
    if (a != b) {
      return a < b ? -1 : 1;
    }
  }
  return l - l2;
}

function processStrNum(v) {
  var arr = [];
  v.replace(/(\d+)|\D+/g, function(m, isDigit) {
    arr.push(isDigit ? parseInt(m, 10) : m);
  });
  return arr;
}

function playNextVideo() {
  // show next valid video
  var visibleIndex = JS.map($('.video-div-wrap'), function(elem) {
    return !$(elem).is('.hidden');
  });
  JS.walk(
    randomOrder.slice(lastIndexInRandom + 1).concat(randomOrder.slice(0, lastIndexInRandom + 1)),
    function(file, i) {
      if (visibleIndex[videoFiles.indexOf(file)]) {
        $('#videoModal video')
          .one('loadedmetadata', function() {
            this.play();
          })
          .prop('src', file.path.replace(/\?/g, '%3F'));
        lastIndexInRandom = randomOrder.indexOf(file);
        return this();
      }
    }
  );
}

function showDetailKeywords(file) {
  $('#editModal .list-keywords')
    .html('')
    .append(JS(file.vid.keywords).sort(compareStrNumArray, processStrNum).map(function(keyword) {
      return JS.dom({
        _: 'li',
        cls: 'keyword-wrap',
        text: keyword,
        onclick: function() {
          file.vid.keywords = JS.subtract(file.vid.keywords, [keyword]);
          showDetailKeywords(file);
          $('#editModal .text-keyword').val(keyword).select();
        }
      });
    }).$);
}

function showPreviewSlides(file) {
  $('#slidePreviewWrap').html('');
  getVideoImage(file.path.replace(/\?/g, '%3F'), {start: 1, end: -1, width: 75}, (imgs, times) => {
    $('#slidePreviewWrap').append(imgs.map((img, i) => {
      img.title = formatTime(times[i]);
      return img;
    }));
  });
}

function showDetailSlides(file, imagesIndex) {
  editVue.file = file;
  editVue.slides.splice.apply(
    editVue.slides,
    [0, Infinity].concat(file.vid.slides.map(function(slide) {
      slide = JS.extend({}, slide);
      slide.image = !!slide.image;
      return slide;
    }))
  );
}

function addKeyword(jModal, file, e) {
  var jTxt = jModal.find('.text-keyword');
  var newKeyword = jTxt.val();
  var matchText = JS.deburr(newKeyword.toUpperCase());
  var keywords = file.vid.keywords;
  var walkResult = JS.walk(keywords, function(keyword) {
    if (JS.deburr(keyword.toUpperCase()) == matchText) {
      jModal.find('.keyword-form-group').addClass('has-error');
      jTxt
        .popover({
          title: 'Keyword Already Exists',
          content: 'This keyword already exists as "' + keyword + '".',
          placement: 'top',
          trigger: 'focus'
        })
        .popover('show')
        .on('keyup', function() {
          if (this.value != newKeyword) {
            jModal.find('.keyword-form-group').removeClass('has-error');
            $(this).popover('destroy').unbind('keyup');
          }
        })
        .select();
      this(keyword);
    }
  });
  if (JS.isNumber(walkResult)) {
    keywords.push(newKeyword);
    showDetailKeywords(file);
    $('#txtNewKeyword').val('').focus();
  }
  e.preventDefault();
  return false;
}

function formatTime(secs) {
  return (~~(secs / 1440) + ':0' + ~~(secs % 1440 / 60) + ':0' + (secs % 60))
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
    elem.style.fontSize = newFontSize + 'px';
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

function addSlide(file, e) {
  file.vid.slides.push({ text: '', time: 0 });
  showDetailSlides(file, JS.range(file.vid.slides.length));
}

function updateVideoDetails(td, file) {
  $(td).html('').append(JS([
    {
      _: 'div',
      cls: 'title-wrap',
      $: [
        { _: 'span', cls: 'title-text', text: file.vid.title },
        {
          _: 'div',
          cls: 'buttons',
          $: JS.filter([
            {
              _: 'div',
              cls: 'btn-group',
              $: [
                {
                  _: 'button', type: 'button', cls: 'btn btn-default btn-play', title: 'Play', $: [
                    { _: 'span', cls: 'glyphicon glyphicon-play', 'aria-hidden': true },
                    ' Reproducir'
                  ]
                }
                /*** COMMENTED THIS OUT UNTIL I IMPLEMENT A BETTER WAY TO GO FULLSCREEN WITHOUT USER GESTURES ***/
                // ,
                // { _: 'button', type: 'button', cls: 'btn btn-default dropdown-toggle', 'data-toggle': 'dropdown', 'aria-haspop': true, 'aria-expanded': false, $: [ {_:'span',cls:'caret'}, {_:'span',cls:'sr-only',text:'Toggle Dropdown'} ] },
                // {
                //   _: 'ul',
                //   cls: 'dropdown-menu',
                //   role: 'menu',
                //   $: [
                //     // TO BE ADDED BACK IN ONCE I FIGURE OUT HOW TO GO FULLSCREEN WITHOUT USER GESTURE
                //     // { _: 'li', $: { _: 'a', href: '#', text: 'Play with Slides', cls: 'btn-playWithSlides' }, cls: file.vid.slides.length ? '' : 'disabled' },
                //     { _: 'li', $: { _: 'a', href: '#', text: 'Show Slides Only', cls: 'btn-playSlides' }, cls: file.vid.slides.length ? '' : 'disabled' }
                //   ]
                // }
              ]
            },
            (function() {
              if (file.vid.slides.length) {
                return {
                  _: 'div',
                  cls: 'btn-group',
                  $: {
                    _: 'button', type: 'button', cls: 'btn btn-default btn-playSlides', title: 'Edit', $: [
                      { _: 'span', cls: 'glyphicon glyphicon-picture', 'aria-hidden': true },
                      ' Diapositivas'
                    ]
                  }
                };
              }
            })(),
            {
              _: 'div',
              cls: 'btn-group',
              $: {
                _: 'button', type: 'button', cls: 'btn btn-default btn-edit', title: 'Edit', $: [
                  { _: 'span', cls: 'glyphicon glyphicon-edit', 'aria-hidden': true },
                  ' Editar'
                ]
              }
            }
          ])
        }
      ]
    },
    {
      _: 'div',
      $: [
        { _: 'b', text: 'Duración: ' },
        { _: 'span', cls: 'duration' }
      ]
    },
    (function() {
      if (file.vid.keywords.length) {
        return {
          _: 'div',
          $: [ { _: 'b', text: 'Palabras claves:' } ].concat(file.vid.keywords.map(function(keyword) {
            return { _: 'span', cls: 'keyword', text: keyword };
          }))
        };
      }
    })()
  ]).filter().map('dom').$);

  if (file.vid.duration) {
    showDuration(file, td);
  }
}

function showVids(files) {
  var vidDivs = files.map(function(file) {
    var div = JS.dom({
      _: 'div',
      cls: 'video-div-wrap',
      $: [{
        _: 'table',
        cls: 'video-table-wrap',
        onclick: function(e) {
          if ($(e.target).is('.btn-edit, .btn-edit *')) {
            showDetailKeywords(file);

            var jModal = $('#editModal'),
                addKeywordToFile = JS.partial(addKeyword, jModal, file),
                addSlideToFile = JS.partial(addSlide, file);
            jModal
              .find('#txtFileName').val(path.basename(file.path)).end()
              .find('#txtVidTitle').val(file.vid.title).end()
              .find('.btn-save').unbind('click').on('click', function() {
                $(div).find('.title-text').text(file.vid.title = jModal.find('#txtVidTitle').val());
                updateVideoDetails($('.video-details', div), file);
                file.saveIndex();
              }).end()
              .find('.btn-show-in-folder').unbind('click').click(function() {
                shell.showItemInFolder(file.path);
              }).end()
              .find('.keyword-form-group').removeClass('has-error')
                .find('.text-keyword').val('').end()
                .end()
              .find('.form-new-keyword').unbind('submit').on('submit', addKeywordToFile)
                .find('#btnAddKeywords').unbind('click').click(addKeywordToFile).end()
                .end()
              .find('.nav-tabs > li:eq(0) > a').tab('show').end()
              .find('.nav-tabs > li:eq(1) > a').one('shown.bs.tab', JS.partial(showDetailSlides, file, null)).end()
              // .find('.nav-tabs > li:eq(2) > a').one('shown.bs.tab', JS.partial(showPreviewSlides, file, null)).end()
              .one('shown.bs.modal', function() {
                jModal.find('#txtVidTitle').focus();
              })
              .modal({ backdrop: 'static', keyboard: false });
          }
          else if ($(e.target).is('.btn-play, .btn-play *, :not(.buttons *)')) {
            showVideo(file);
          }
          else if ($(e.target).is(':not(.disabled) > .btn-playSlides')) {
            $('#slideWrap').data('slide-file', file).data('slide-index', 0)[0].webkitRequestFullScreen();
            showSlides();
          }
          else if ($(e.target).is(':not(.disabled) > .btn-playWithSlides')) {
            showVideo(file);
            isToShowSlides = true;
          }
        },
        border: 0,
        cellPadding: 0,
        cellSpacing: 0,
        $: [{
          _: 'tr',
          $: [
            { _: 'td', cls: 'video-thumbnail' },
            { _: 'td', cls: 'video-details' }
          ]
        }]
      }]
    });

    showThumbnail(file, div);
    updateVideoDetails($('.video-details', div), file);

    return div;
  });
  $('#body').html('').append(vidDivs);
}

function showVideo(file) {
  lastIndexInRandom = randomOrder.indexOf(file);

  var vidElem = JS.dom({
    _: 'video',
    src: file.path.replace(/\?/g, '%3F'),
    controls: true,
    onended() {
      if (isPlayingAll) {
        incrementVideoCount();
        playNextVideo();
      }
      else {
        $('#slideWrap').data('slide-file', file).data('slide-index', 0);
        $('#videoModal').modal('hide');
      }
    },
    onvolumechange() {
      appSettings.set('volume', this.volume);
    },
    volume: appSettings.get('volume', 1)
  });

  (new MediaElementAmplifier(vidElem)).setLoudness(appSettings.get('loudness', 5));

  $('#videoModal').modal('show').find('.modal-body').html('').append(vidElem);
  vidElem.play();
  vidElem.webkitRequestFullScreen();
  isPlaying = true;
}

// `file` must be set in $('#slideWrap').data('slide-file') prior to initial call
function showSlides(opt_offset) {
  var jSlideWrap = $('#slideWrap'),
      slideIndex = (opt_offset || 0) + jSlideWrap.data('slide-index');
  jSlideWrap.addClass('showing').data('slide-index', slideIndex);

  var file = jSlideWrap.data('slide-file'),
      slides = file.vid.slides, 
      slide = slides[slideIndex];

  jSlideWrap.find('.previous')[slideIndex > 0 ? 'removeClass' : 'addClass']('disabled');
  jSlideWrap.find('.next')[slideIndex + 1 < slides.length ? 'removeClass' : 'addClass']('disabled');

  ensureSlideImage(slide, file, (slideImagePath, newlyCreated) => {
    maximizeFontSize(
      jSlideWrap.css('background-image', JS.sub("url('{}')", slideImagePath.replace(/\\/g, '/').replace(/'/g, "\\'")))
        .find('.text').text(slide.text)[0]
    );
  });
}

function showDuration(file, ancestorElem) {
  $('.duration', ancestorElem).text(JS.formatDate(new Date(file.vid.duration * 1000), 'm:ss'));
}

function showThumbnail(file, div) {
  function callback() {
    $('.video-thumbnail', div).append(JS.dom({
      _: 'img',
      src: path.join(path.dirname(file.path), '.jw-presenter', file.vid.name + '.png').replace(/\?/g, '%3F')
    }));
    showDuration(file, div);
  }

  if (file.vid.has_thumbnail && file.vid.height) {
    callback();
  }
  else {
    generateMetaData(file, callback);
  }
}

// Derived from https://gist.github.com/westc/f6de681820d78df64c01e10bfd03f985
function getVideoImage(path, opts, callback) {
  opts = opts || {};
  var duration,
      me = this,
      video = document.createElement('video'),
      times = [0],
      imgs = [],
      seekIndex = 0,
      timeWasArray = Object.prototype.toString.call(opts.time) == '[object Array]',
      canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');
  video.onloadedmetadata = function() {
    duration = video.duration;
    if ('undefined' != typeof opts.start && 'undefined' != typeof opts.end) {
      var start = getTime(opts.start),
          end = getTime(opts.end);
      var step = opts.step || 1;
      if (end - start > 0 != step > 0) {
        step = -step;
      }
      timeWasArray = true;
      times = [];
      for (var time = start; step > 0 ? time < end : (time > end); time += step) {
        times.push(time);
      }
    }
    else {
      var time = opts.time;
      if (time) {
        times = timeWasArray ? time : [time];
      }
    }
    seekNext();
  };
  function getTime(time) {
    if ('function' === typeof time) {
      time = time(duration);
    }
    return Math.max(0, Math.min(time < 0 ? Math.max(0, time + duration) : time, duration));
  }
  function seekNext() {
    if (times.length > seekIndex) {
      times[seekIndex] = video.currentTime = getTime(times[seekIndex]);
      seekIndex++;
    }
    else if (timeWasArray) {
      callback.call(me, imgs, times);
    }
    else {
      callback.call(me, imgs[0], times[0]);
    }
  }
  video.onseeked = function(e) {
    var width = opts.width, height = opts.height;
    if (!width && !height) {
      height = video.videoHeight;
      width = video.videoWidth;
    }
    else if (!width) {
      width = height * video.videoWidth / video.videoHeight;
    }
    else if (!height) {
      height = width * video.videoHeight / video.videoWidth;
    }
    canvas.width = width;
    canvas.height = height;
    if (seekIndex) {
      ctx.clearRect(0, 0, width, height);
    }
    ctx.drawImage(video, 0, 0, width, height);
    var img = new Image();
    img.src = canvas.toDataURL();
    imgs.push(img);
    seekNext();
  };
  video.onerror = function(e) {
    callback.call(me, undefined, undefined, e);
  };
  video.src = path;
}

var generateMetaData = (function(argsStack, blocked) {
  return function (file, callback) {
    if (!blocked) {
      blocked = true;
      getVideoImage(
        file.path.replace(/\?/g, '%3F'),
        {
          time(duration) {
            file.vid.duration = duration;
            return duration * 3 / 4;
          }
        },
        function (img, currentTime, event) {
          if (!event || event.type != 'error') {
            var buf = new Buffer(img.src.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            fs.writeFileSync(path.join(path.dirname(file.path), '.jw-presenter', file.vid.name + '.png'), buf);
            JS.extend(file.vid, { has_thumbnail: true, width: img.width, height: img.height });
            file.saveIndex();
          }

          callback();
          blocked = false;
          if (argsStack.length) {
            generateMetaData.apply(0, argsStack.pop());
          }
        }
      );
    }
    else {
      argsStack.push(arguments);
    }
  };
})([], false);

function refreshIndex(dirPath, files) {
  var jwvPath = path.join(dirPath, '.jw-presenter'),
      indexPath = path.join(jwvPath, 'index.json');
  if (!fs.existsSync(jwvPath)) {
    fs.mkdirSync(jwvPath);
  }
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '{}', 'utf8');
  }

  var index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  index.vids = JS.pull(index, 'vids', []);

  var filesByName = files.reduce(function(carry, file) {
    carry[path.basename(file.path)] = file;
    return carry;
  }, {});

  // Remove any thumbnails and vid records that no longer exist
  var vidsNotFoundByName = [];
  index.vids = index.vids.filter(function(vid) {
    if (JS.has(filesByName, vid.name)) {
      var file = filesByName[vid.name];
      delete filesByName[vid.name];
      file.vid = updateVid(vid, file);
      return true;
    }
    vidsNotFoundByName.push(vid);
  });

  // Add all videos to vids that are not already included.
  JS.walk(filesByName, function(file, fileName) {
    // Check to see if the file name was changed by matching against file size and birth time.
    var result = JS.walk(vidsNotFoundByName, function(vid, i) {
      if (vid.birth_time == file.stat.birthtime.getTime() && vid.size == file.stat.size) {
        file.vid = updateVid(vid, file);
        vidsNotFoundByName.splice(i, 1);
        return this(vid);
      }
    });

    // If file name wasn't changed add it as a new vid.
    if (JS.typeOf(result, 'Number')) {
      result = [file.vid = updateVid({
        title: fileName.replace(/(?!^)\.\w+$/, ''),
        show_time: null,
        duration: null,
        has_thumbnail: false,
        keywords: [],
        slides: []
      }, file)];
    }

    index.vids.push(result[0]);
  });

  appSettings.set('orphanVids', appSettings.get('orphanVids', []).concat(vidsNotFoundByName));

  files.forEach(JS(JS.set).setArgs({
    1: 'saveIndex',
    2: JS.callReturn(function() {
      fs.writeFileSync(indexPath, JSON.stringify(index), 'utf8');
    })
  }).cap(1).$);

  return { path: indexPath, index: index };
}

function updateVid(vid, file) {
  if (vid.has_thumbnail) {
    try {
      var oldThumbnailPath = path.join(path.dirname(file.path), '.jw-presenter', vid.name + '.png');
      if (!fs.existsSync(oldThumbnailPath)) {
        throw 0;
      }
      var newThumbnailPath = path.join(path.dirname(file.path), '.jw-presenter', path.basename(file.path) + '.png');
      fs.renameSync(oldThumbnailPath, newThumbnailPath);
    }
    catch(e) {
      vid.has_thumbnail = false;
    }
  }
  return JS.extend(vid, {
    name: path.basename(file.path),
    birth_time: file.stat.birthtime.getTime(),
    size: file.stat.size
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

function loadFromPrevious() {
  var last = appSettings.get('last', {});
  var lastDirPath = JS.pull(last, 'path', undefined);
  if (lastDirPath) {
    if (!setDirPath(lastDirPath)) {
      appSettings.set('last', {});
    }
  }
  filterVideos.call($('#txtSearch').val(appSettings.get('searchTerm', ''))[0]);
}

function setDirPath(dirPath, clearHistory) {
  var pathExists = fs.existsSync(dirPath);
  if (pathExists) {
    videoFiles = [];
    JS.unnest(
      [recurseDirSync(dirPath, Infinity)],
      function(dir, index, add, recurse) {
        if (dir.files) {
          var vidsAtStart = videoFiles.length;

          dir.files.forEach(function(file) {
            if (file.isFile && file.stat.size >= 1e6 && /\.mp4$/i.test(file.path)) {
              videoFiles.push(file);
            }
          });

          // Create .jw-presenter directory if this directory has MP4s.
          if (vidsAtStart < videoFiles.length) {
            refreshIndex(dir.path, videoFiles.slice(vidsAtStart));
          }

          recurse(dir.files);
        }
      }
    );

    videoFiles = JS.sort(
      videoFiles,
      function(arrA, arrB) {
        for (var a, b, i = 0, l = arrA.length, l2 = arrB.length; i < l; i++) {
          a = arrA[i];
          b = i < l2 ? arrB[i] : '';
          if (a != b) {
            return a < b ? -1 : 1;
          }
        }
        return l - l2;
      },
      function(v) {
        var arr = [];
        v.path.toUpperCase().replace(/(\d+)|\D+/g, function(m, isDigit) {
          arr.push(isDigit ? parseInt(m, 10) : m);
        });
        return arr;
      }
    );

    randomOrder = JS.randomize(videoFiles);

    showVids(videoFiles);

    if (clearHistory) {
      appSettings.set('last', { path: dirPath, history: [] });
    }
  }
  return pathExists;
}

function showTimesShown() {
  detailsVue.history.splice.apply(
    detailsVue.history,
    [0, Infinity].concat(JS.get(appSettings.get('last'), 'history', []))
  );
}

function incrementVideoCount() {
  var vidElem = $('#videoModal video')[0];
  if (vidElem && vidElem.currentTime / vidElem.duration >= 0.75) {
    var last = appSettings.get('last');
    last.history.push({
      time: (new Date).getTime(),
      path: randomOrder[lastIndexInRandom].path
    });
    appSettings.set('last', last);
  }
}

function filterVideos() {
  var searchTerm = this.value;
  var arrVideoData = videoFiles.map(function(file) {
    return {
      text: file.vid.title + ' ' +  file.vid.keywords.join(','),
      '@diapositivas': file.vid.slides.length > 0,
      '@claves': file.vid.keywords.length > 0,
      duration: ~~(file.vid.duration / 60)
    };
  });
  var elems = $('.video-div-wrap');
  scoreSearch(searchTerm, arrVideoData).forEach(function(score, i) {
    $(elems[i])[score > 0 ? 'removeClass' : 'addClass']('hidden');
  });
  appSettings.set('searchTerm', searchTerm);
}

function getImagePathParts(slide, file) {
  let filePath = file.path,
    jwpPath = path.join(path.dirname(filePath), '.jw-presenter');
  return {
    filePath,
    jwpPath,
    slideImagePath: path.join(
      jwpPath,
      path.basename(filePath) + '-' + JS.round(slide.time, 2)
    )
  };
}

function ensureSlideImage(slide, file, opt_callback) {
  let { filePath, jwpPath, slideImagePath } = getImagePathParts(slide, file);
  if (!slide.image || !fs.existsSync(slideImagePath)) {
    if (!fs.existsSync(jwpPath)) {
      fs.mkdirSync(jwpPath);
    }
    getVideoImage(
      filePath.replace(/\?/g, '%3F'),
      { time: slide.time },
      function (img) {
        let data = img.src.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(slideImagePath, new Buffer(data, 'base64'));
        slide.image = true;
        opt_callback && opt_callback(slideImagePath, true);
      }
    );
  }
  else {
    opt_callback && opt_callback(slideImagePath, false);
  }
}

function initVues() {
  detailsVue = new Vue({
    el: '#detailsModal',
    data: {
      history: []
    },
    methods: {
      ref: function(name) {
        return window[name];
      },
      basename: function (pathname) {
        return path.basename(pathname);
      }
    }
  });

  editVue = new Vue({
    el: '#editModal',
    data: {
      file: null,
      slides: []
    },
    updated() {
      this.ensureSlideImages();
    },
    mounted() {
      this.ensureSlideImages();
    },
    computed: {
      screenRatio() {
        return screen.height / screen.width;
      }
    },
    watch: {
      slides: {
        handler() {
          let thisVue = this;
          thisVue.slides.forEach((slide, slideIndex) => {
            if (!fs.existsSync(thisVue.getImagePathParts(slide).slideImagePath)) {
              slide.image = false;
              ensureSlideImage(slide, thisVue.file);
            }
            if (!JS.has(thisVue.file.vid.slides, slideIndex)) {
              thisVue.file.vid.slides[slideIndex] = {};
            }
            JS.extend(thisVue.file.vid.slides[slideIndex], slide);
          });
        },
        deep: true
      }
    },
    methods: {
      addSlide() {
        this.slides.push({ text: '', time: 0, image: false });
      },
      deleteSlide(slideIndex) {
        this.slides.splice(slideIndex, 1);
      },
      moveSlide(currentIndex, newIndex) {
        this.slides.splice(newIndex, 0, this.slides.splice(currentIndex, 1)[0]);
      },
      getImagePathParts: function (slide) {
        return getImagePathParts(slide, this.file);
      },
      ensureSlideImages() {
        let thisVue = this;
        $('#editModal .slide-thumbnail .text').each((i, elem) => {
          maximizeFontSize(elem);
        });
        thisVue.slides.forEach(slide => ensureSlideImage(slide, thisVue.file));
      },
      formatTime
    }
  });

  var settingsVue = new Vue({
    el: '#settingsModal',
    data: {
      loudness: appSettings.get('loudness', 5)
    },
    watch: {
      loudness(val) {
        appSettings.set('loudness', val);
      }
    }
  });
}

function onReady() {
  JS.addTypeOf(jQuery, 'jQuery');

  $('body').on('mousemove', function() {
    $('body').removeClass('no-mouse');
    sleepMouse();
  });

  $('#formFilter').on('submit', function(e) {
    e.preventDefault();
    return false;
  });

  $('#linkRndVid').click(function() {
    $(JS.random($('.video-div-wrap:not(.hidden) .video-table-wrap').toArray())).click();
  });

  $("#linkSetDir").click(function() {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, function(paths) {
      if (paths) {
        setDirPath(paths[0], true);
      }
    });
  });

  $('#linkPlayAll').click(function() {
    isPlayingAll = true;
    $('#linkRndVid').click();
  });

  $('#linkDetails').click(function() {
    $('#detailsModal').modal('show');
    showTimesShown();
  });

  $('#detailsModal .btn-reset').click(function() {
    var last = appSettings.get('last');
    last.history = [];
    appSettings.set('last', last);
    showTimesShown();
  });

  $('#videoModal')
    .on('hide.bs.modal', incrementVideoCount)
    .on('hidden.bs.modal', function() {
      isPlayingAll = isPlaying = false;
      $('#videoModal video').remove();
      if (isToShowSlides) {
        isToShowSlides = false;
        document.webkitCancelFullScreen();
        $('#slideWrap')[0].webkitRequestFullScreen();
        showSlides();
      }
    });

  $('#txtSearch').on('keyup keypress', JS.debounce(filterVideos, 200));

  $(window).on('beforeunload', () => {
    let jwpSlideDirs = {};
    videoFiles.forEach(videoFile => {
      let jwpPath = path.dirname(path.join(path.dirname(videoFile.path), '.jw-presenter', 'd'));
      
      // if the .jw-presenter directory hasn't been read yet...
      if (!JS.has(jwpSlideDirs, jwpPath)) {
        let slidePaths = jwpSlideDirs[jwpPath] = {};
        fs.readdirSync(jwpPath).forEach(name => {
          let filePath = path.join(jwpPath, name);
          let isFile = fs.statSync(filePath).isFile();
          if (/-\d+$/.test(filePath)) {
            slidePaths[filePath] = false;
          }
        });
      }

      videoFile.vid.slides.forEach(slide => {
        let slideImagePath = path.join(
          jwpPath,
          path.basename(videoFile.path) + '-' + JS.round(slide.time, 2)
        );
        if (JS.has(jwpSlideDirs[jwpPath], slideImagePath)) {
          jwpSlideDirs[jwpPath][slideImagePath] = true;
        }
      });
    });

    JS.walk(jwpSlideDirs, (slidePaths, jwpPath) => {
      JS.walk(slidePaths, (keepIt, slideImagePath) => {
        if (!keepIt) {
          fs.unlinkSync(slideImagePath);
        }
      });
    });
  });

  var jSlideWrap = $('#slideWrap');

  jSlideWrap
    .find('.previous').click(function() {
      if (!$(this).is('.disabled')) {
        showSlides(-1);
      }
    }).end()
    .find('.next').click(function() {
      if (!$(this).is('.disabled')) {
        showSlides(1);
      }
    }).end()
    .find('.end').click(function() {
      document.webkitCancelFullScreen();
      jSlideWrap.removeClass('showing');
    });

  initVues();
  loadFromPrevious();
}

$(onReady);
