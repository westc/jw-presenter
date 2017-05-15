var variablesIncluded = {};

loadAll = JS.reParam(function(ids, build_id, lib_name, build) {
  window.build = build;
  var snippetsToBeLoaded = JS.walk(ids, function(id) {
    loadScript('snippets/' + id + '.js', function() {
      if (!--snippetsToBeLoaded) {
        finalize();
      }
    });
  });

  addMainMenuItem('YourJS Download', "http://yourjs.com/build/" + build_id + "?libName=" + JS.escape(lib_name));
  addMainMenuItem('YourJS License', "http://yourjs.com/license?build_id=" + build_id);
  addMainMenuItem('YourJS Details', function() {
    alert([
      'Variable Name: ' + lib_name,
      'Build Number: ' + build_id,
      'Build Time: ' + JS.formatDate(new Date(build.time * 1e3), "DDDD, MMMM D, YYYY 'at' h:mmA"),
      'Snippet Count: ' + build.snippets.length,
      'Extra Snippet Count: ' + (ids.length - build.snippets.length),
      'Extra Members Count: ' + JS.keys(variablesIncluded).length
    ].join('\r\n'));
  });
  addMainMenuItem('YourJS.com', 'http://yourjs.com');
  addMainMenuItem('CWestBlog.com', 'http://cwestblog.com');
}, ['0.ids', '0.build.id', '0.build.name', '0.build']);

addMenuItem = JS.param(function(text, url, menu, target) {
  var dom = { _: 'a', text: text };
  if (JS.isFunction(url)) {
    JS.extend(dom, { href: 'javascript:;', onclick: url });
  }
  else {
    dom.href = url;
    if (target) {
      dom.target = target;
    }
  }
  $('#' + menu).append(JS.dom(dom));
}, ['text', 'url', 'menu', 'target']);

function finalize() {
  // Syntax highlight code snippets.
  Prism.highlightAll();

  // Fix ordering of Snippet menu.
  $('#yourjsMenu > a').sort(function(a, b) {
    var a = $(a).text().toUpperCase(), b = $(b).text().toUpperCase();
    return a < b ? -1 : 1;
  }).remove().appendTo('#yourjsMenu');

  if (location.hash) {
    location = location.hash;
  }
}

function addMainMenuItem(text, url) {
  addMenuItem({ menu: 'mainMenu', text: text, url: url, target: '_blank' });
}

function addSnipMenuItem(text, id) {
  addMenuItem({ menu: 'yourjsMenu', text: text, url: '#snippet' + id });
}

var storeSnippetCalled;

storeSnippet = JS.param(function(id, name, description, js, post, tags, required_ids, variables, snippetData) {
  addSnipMenuItem(name, id);

  var children = [{
    _: 'h2',
    $: [{ _: 'a', href: 'http://yourjs.com/snippets/' + id, text: name, target: '_blank' }]
  }];

  if (description) {
    children.push({ _: 'div', text: description });
  }

  if (variables.length) {
    JS.walk(variables, function(name) {
      variablesIncluded[name] = true;
    });
    children.push({
      _: 'div',
      style: 'margin-top: 10px',
      $: [{
        _: 'b',
        text: 'The following variables exist: '
      }].concat(JS(variables).map(JS.reParam(function(v, i, l) {
        return [
          i ? i + 1 == l ? ' and ' : ', ' : '',
          { _: 'code', text: build.name + '.' + v }
        ];
      }, [0, 1, '2.length'])).flatten().$)
    });
  }

  children.push({ _: 'pre', className: 'language-javascript line-numbers', $: [{ _: 'code', text: js }] });

  if (post = JS.trim(post)) {
    children.push({
      _: 'div',
      html: post
        .replace(/(^|[\r\n])[ \t]*```(\w*)\r?\n([\s\S]+?)\r?\n[ \t]*```([\r\n]|$)/g, function(m, start, lang, code, end) {
          return '\r\n<pre' + (lang ? ' class="language-' + lang + '"' : '') + '><code>' + code + '</code></pre>\r\n';
        })
        .replace(/`([^\r\n`]+)`/g, '<code>$1</code>')
    });
  }

  if (storeSnippetCalled) {
    children.unshift({ _: 'hr', style: { margin: '20px 0 -5px' } });
  }
  storeSnippetCalled = true;

  $('#contentWrapper').append(JS.dom({ _: 'div', id: 'snippet' + id, $: children }));
}, ['id', 'name', 'description', 'js', 'post', 'tags', 'required_ids', 'variables']);

function loadScript(src, opt_callback) {
  document.body.appendChild(JS.dom({ _: 'script', src: src, onload: opt_callback }));
}

$(function() {
  loadScript('snippets/load-all.js');

  // Load YourJS icon.
  JS.walk(['shortcut ', ''], function(s) {
    $('head').append('<link rel="' + s + 'icon" href="data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAOr/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARERERERERAREAABEQAAEREAAAAQAAABEQARABAREAEREREAEREAAREREQAREAARERERABEAAREREREAEAARAREREQAQAAABERERABEAABERERERERERERARAAEAAQEBEBEBAQEBABEBAQEBAQEBAQEBAAEBAQARARERERERERCAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQAA" type="image/x-icon"/>')
  });
});
