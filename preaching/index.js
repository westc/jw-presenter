const fs = require('fs');
const path = require('path');
const remote = require('electron').remote;

const APP_BASE_PATH = path.dirname(require.main.filename);
const APP_SETTINGS_PATH = path.join(APP_BASE_PATH, 'settings.json');

var isPlayingAll = false, isPlaying = false, isToShowSlides = false, videoFiles = [], randomOrder = [], lastIndexInRandom = 0;

var appSettings = {
  _: (function() {
    var data = { code: '' };
    try {
      data = readFileJSON(APP_SETTINGS_PATH);
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
    fs.writeFileSync(APP_SETTINGS_PATH, JSON.stringify(this._), 'utf8');
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

function scoreTextSearch(searchTerm, arrRecords) {
  // Make sure that each record is an array of texts to be searched.
  var arrayOfArrays = arrRecords.slice().map(function(record) {
    return JS.toArray(record).slice().map(function(text) {
      return JS.deburr(text);
    });
  });

  // Zero out the scores to start off.
  var scores = JS(arrayOfArrays).slice().fill(0).$;

  // Loop through all search terms modifying the scores appropriately.
  var trash = JS.deburr(searchTerm).replace(
    /(?:(\+)|(-))?(?:"(.+?)"|\/((?:[^\\\/]|\\.)+)\/(i)?|([^\s,.:;"\[\]\{\}\!\?\xA1\xBF]+))/g,
    function(keyword, mustHave, hide, quoted, regExpBody, regExpI, normal) {
      var rgx = new RegExp(
        regExpBody || JS.quoteRegExp(quoted || normal).replace(/\\\*/g, "\\S*").replace(/^|$/g, '\\b').replace(/\s+/, '\\b\\s+\\b'),
        regExpBody ? regExpI : 'i'
      );
      arrayOfArrays.forEach(function(arrayOfTexts, i) {
        if (scores[i] > -Infinity) {
          JS.walk(arrayOfTexts, function(text) {
            if (rgx.test(text) ? hide : mustHave) {
              this(scores[i] = -Infinity);
            }
            else if (rgx.test(text) == !hide) {
              scores[i]++;
            }
          });
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

function showDetailSlides(file, imagesIndex) {
  var sw = screen.width, sh = screen.height;

  var jList = $('#olSlideList');

  var imageURLs = jList.find('.slide-thumbnail').map(function(i, elem) {
    return $(elem).data('img-url');
  }).toArray();

  jList.html('').append(
    file.vid.slides.map(function(slide, slideIndex, slides) {
      var updateVideoImage = JS.debounce(function(time) {
        function setBGVideoImage(img) {
          var jDiv = $('.slide-thumbnail', li);

          maximizeFontSize(
            jDiv.css({
                  backgroundImage: JS.sub("url('{}')", img.src),
                  height: (sh * jDiv.width() / sw) + 'px'
                })
                .data('img-url', img.src)
                .find('.text')[0]
          );
        }

        var img, imageIndex = imagesIndex && imagesIndex[slideIndex];
        if (imageIndex != undefined) {
          imagesIndex[slideIndex] = undefined;
          setBGVideoImage({ src: imageURLs[imageIndex] });
        }
        else {
          getVideoImage(file.path.replace(/\?/g, '%3F'), time, setBGVideoImage);
        }
      }, 250);

      var li = JS.dom({
        _: 'li',
        cls: 'slide',
        $: [
          {
            _: 'div',
            $: [
              'Slide ',
              {
                _: 'select',
                $: JS.range(slides.length).map(function(i) {
                  return { _: 'option', text: i + 1, selected: i == slideIndex };
                }),
                onchange: function() {
                  var imagesIndex = JS.range(slides.length);
                  imagesIndex.splice(this.selectedIndex, 0, imagesIndex.splice(slideIndex, 1)[0]);
                  slides.splice(this.selectedIndex, 0, slides.splice(slideIndex, 1)[0]);
                  showDetailSlides(file, imagesIndex);
                }
              },
              JS.sub(' of {} ', slides.length),
              {
                _: 'button',
                type: 'button',
                cls: 'btn btn-danger',
                $: { _: 'i', cls: 'glyphicon glyphicon-trash' },
                onclick: function() {
                  var imagesIndex = JS(slides.length).range().splice(slideIndex, 1).$;
                  slides.splice(slideIndex, 1);
                  showDetailSlides(file, imagesIndex);
                }
              }
            ]
          },
          {
            _: 'div',
            cls: 'slide-thumbnail',
            $: {
              _: 'div',
              cls: 'text',
              text: slide.text
            }
          },
          {
            _: 'div',
            $: [
              {
                _: 'table',
                cls: 'table-time',
                border: 0,
                cellPadding: 0,
                cellSpacing: 0,
                $: {
                  _: 'tr',
                  $: [
                    {
                      _: 'td',
                      cls: 'td-text',
                      $: { _: 'input', type: 'text', cls: 'time', readOnly: true, size: 5 }
                    },
                    {
                      _: 'td',
                      cls: 'td-range',
                      $: {
                        _: 'input',
                        type: 'range',
                        min: 0,
                        max: Math.floor(file.vid.duration),
                        value: slide.time,
                        oninput: function() {
                          updateVideoImage(this.value);
                          $(this).parents('tr:eq(0)').find('.time').val(formatTime(this.value));
                          slide.time = +this.value;
                        }
                      }
                    }
                  ]
                }
              }
            ]
          },
          {
            _: 'div',
            $: [
              {
                _: 'input',
                type: 'text',
                cls: 'text',
                value: slide.text,
                placeholder: JS.sub('Text for slide {} of {}.', slideIndex + 1, slides.length),
                oninput: function () {
                  maximizeFontSize($(this).parents('.slide').find('.slide-thumbnail .text').text(slide.text = this.value)[0]);
                }
              }
            ]
          }
        ]
      });
      $('input[type=range]', li).triggerHandler('input');
      return li;
    })
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
                    ' Play'
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
                      ' Show Slides'
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
                  ' Edit'
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
        { _: 'b', text: 'Duration: ' },
        { _: 'span', cls: 'duration' }
      ]
    },
    (function() {
      if (file.vid.keywords.length) {
        return {
          _: 'div',
          $: [ { _: 'b', text: 'Keywords:' } ].concat(file.vid.keywords.map(function(keyword) {
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
              .find('.keyword-form-group').removeClass('has-error')
                .find('.text-keyword').val('').end()
                .end()
              .find('.form-new-keyword').unbind('submit').on('submit', addKeywordToFile)
                .find('#btnAddKeywords').unbind('click').click(addKeywordToFile).end()
                .end()
              .find('#btnAddSlide').unbind('click').click(addSlideToFile).end()
              .find('.nav-tabs > li:eq(0) > a').tab('show').end()
              .find('.nav-tabs > li:eq(1) > a').one('shown.bs.tab', JS.partial(showDetailSlides, file, null)).end()
              .one('shown.bs.modal', function() {
                jModal.find('#txtVidTitle').focus();
              })
              .modal('show');
          }
          else if ($(e.target).is('.btn-play, .btn-play *, :not(.buttons *)')) {
            showVideo(file);
          }
          else if ($(e.target).is(':not(.disabled) > .btn-playSlides')) {
            $('#slideWrap').data('slide-file', file).data('slide-index', 0)[0].webkitRequestFullScreen();;
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
    onended: function() {
      if (isPlayingAll) {
        incrementVideoCount();
        playNextVideo();
      }
      else {
        $('#slideWrap').data('slide-file', file).data('slide-index', 0);
        $('#videoModal').modal('hide');
      }
    }
  });
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

  getVideoImage(file.path.replace(/\?/g, '%3F'), slide.time, function(img, time, event) {
    if (event.type != 'error') {
      maximizeFontSize(
        jSlideWrap.css('background-image', JS.sub("url('{}')", img.src))
          .find('.text').text(slide.text)[0]
      );
    }
  });
}

function showDuration(file, ancestorElem) {
  $('.duration', ancestorElem).text(JS.formatDate(new Date(file.vid.duration * 1000), 'm:ss'));
}

function showThumbnail(file, div) {
  function callback() {
    $('.video-thumbnail', div).append(JS.dom({
      _: 'img',
      src: path.join(path.dirname(file.path), '.jw-videos', file.vid.name + '.png').replace(/\?/g, '%3F')
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

// https://gist.github.com/westc/f6de681820d78df64c01e10bfd03f985
function getVideoImage(path, secs, callback) {
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
  video.src = path;
}

var generateMetaData = (function(argsStack, blocked) {
  return function (file, callback) {
    if (!blocked) {
      blocked = true;
      getVideoImage(
        file.path.replace(/\?/g, '%3F'),
        function (duration) {
          file.vid.duration = duration;
          return duration * 3 / 4;
        },
        function (img, currentTime, event) {
          if (event.type != 'error') {
            var buf = new Buffer(img.src.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            fs.writeFileSync(path.join(path.dirname(file.path), '.jw-videos', file.vid.name + '.png'), buf);
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
  var jwvPath = path.join(dirPath, '.jw-videos'),
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
      var oldThumbnailPath = path.join(path.dirname(file.path), '.jw-videos', vid.name + '.png');
      if (!fs.existsSync(oldThumbnailPath)) {
        throw 0;
      }
      var newThumbnailPath = path.join(path.dirname(file.path), '.jw-videos', path.basename(file.path) + '.png');
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

          // Create .jw-videos directory if this directory has MP4s.
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
  var history = JS.get(appSettings.get('last'), 'history', []);
  $('#detailsModal .modal-body').html('')
    .append(JS([
      {
        _: 'div',
        text: JS.sub('You have shown {0?{0}:one} video{0?s:}.', [history.length])
      },
      {
        _: 'table',
        cls: 'table table-striped table-hover',
        $: [
          {
            _: 'thead',
            $: [
              { 
                _: 'tr',
                $: [
                  { _: 'th', text: 'Time Shown' },
                  { _: 'th', text: 'File Name' }
                ]
              }
            ]
          },
          {
            _: 'tbody',
            $: history.map(function(item) {
              return {
                _: 'tr',
                $: [
                  { _: 'td', text: JS.formatDate(new Date(item.time), "DDD, MMM D, YYYY 'at' h:mm:ss A") },
                  { _: 'td', text: path.basename(item.path) }
                ]
              };
            }).reverse()
          }
        ] 
      }
    ]).map('dom').$);
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
  var videoTexts = videoFiles.map(function(file) {
    return (file.vid.title + ' ' +  file.vid.keywords.join(',')).replace(/\b@(\w+)\b/g, '$1') + (file.vid.slides.length ? ' _slides' : '') + (file.vid.keywords.length ? ' _keywords' : '');
  });
  var elems = $('.video-div-wrap');
  scoreTextSearch(searchTerm.replace(/@/g, '_'), videoTexts).forEach(function(score, i) {
    $(elems[i])[score > 0 ? 'removeClass' : 'addClass']('hidden');
  });
  appSettings.set('searchTerm', searchTerm);
}

$(function() {
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
    remote.dialog.showOpenDialog({
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

  loadFromPrevious();
});
