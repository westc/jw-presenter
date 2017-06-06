/**
 * @preserve YourJS - Your Very Own JS Library
 * http://yourjs.com
 *
 * Copyright (c) 2015-2017 Christopher West (cwest)
 * Licensed under the MIT license.
 * http://yourjs.com/license?build_id=26
 *
 * Download: http://yourjs.com/build/26?libName=JS
 */
(function(__global, __EMPTY_OBJECT, __EMPTY_ARRAY, undefined) {
  var document = __global.document;
  function YourJS(o, opt_multi) {
    if (o instanceof YourJS) {
      return o;
    }
    if (!(this instanceof YourJS)) {
      return new YourJS(o, opt_multi);
    }
    this.$ = (this.$$ = opt_multi ? slice(o) : [o]).shift();
  }

  var has = alias(__EMPTY_OBJECT.hasOwnProperty, 'call');
  var slice = alias(__EMPTY_ARRAY.slice, 'call');

  function typeOf(value) {
    for (
      var test,
          argv = arguments,
          argc = argv.length,
          i = argc,
          typeName = value == undefined
            ? value === undefined
              ? 'undefined'
              : 'null'
            : __EMPTY_OBJECT.toString.call(value).slice(8, -1);
      --i > 0 && ((typeof(test = argv[i]) == 'string' || typeOf(test) != 'RegExp') ? typeName != test : !test.test(typeName));
    );
    return argc > 1 ? !!i : typeName;
  }

  function alias(context, name) {
    return function() {
      return context[name].apply(context, arguments);
    };
  }

  function extend(objToExtend, objProps) {
    for (var k, args = arguments, i = 1; objProps = args[i++]; ) {
      for (k in objProps) {
        if (has(objProps, k)) {
          objToExtend[k] = objProps[k];
        }
      }
    }
    return objToExtend;
  }
  
  function identity(v) {
    return v;
  }

  // isArrayLike() & toArray() - http://yourjs.com/snippets/81
  function isArrayLike(o) {
    var l, i, t;
    return !!o
        && !o.nodeName
        && typeOf(l = o.length, 'Number')
        && (t = typeOf(o)) != 'String'
        && t != 'Function'
        && (!l || (l > 0 && (i = l - 1) % 1 == 0 && i in o));
  }
  
  function toArray(o) {
    return isArrayLike(o) ? slice(o) : [o];
  }

  // pull() - Get The Value At a Specific Path - http://yourjs.com/snippets/108
  function pull(obj, path, opt_noErrorDefault) {
    path = typeOf(path, 'String') ? path.split('.') : path;
    for (var doError = arguments.length < 3, i = 0, l = path.length; i < l; i++) {
      if (obj != undefined && path[i] in Object(obj)) {
        obj = obj[path[i]];
      }
      else if (doError) {
        throw new Error('There is no value at "' + slice(path, 0, i + 1).join('.') + '".');
      }
      else {
        return opt_noErrorDefault;
      }
    }
    return obj;
  }

  // walk() - Traverse Array/Object Values - http://yourjs.com/snippets/20
  function walk(arrOrObj, fn, opt_walkAll) {
    var done, c = 0, k = 0, l, endWalk = function() { done = arguments; },
      caller = function(k) { c++; fn.call(endWalk, arrOrObj[k], k, arrOrObj); };
    if (isArrayLike(opt_walkAll)) {
      for (l = opt_walkAll.length; k < l; k++) {
        if (has(opt_walkAll, k)) {
          caller(opt_walkAll[k]);
          if (done) { break; }
        }
      }
    }
    else if (isArrayLike(arrOrObj)) {
      for (l = arrOrObj.length; k < l; k++) {
        if (opt_walkAll || has(arrOrObj, k)) {
          caller(k);
          if (done) { break; }
        }
      }
    }
    else {
      for (k in arrOrObj) {
        if (opt_walkAll || has(arrOrObj, k)) {
          caller(k);
          if (done) { break; }
        }
      }
    }
    return done && done.length ? done : c;
  }

  // getSimpleCallback() - Get Callbacks By Name - http://yourjs.com/snippets/109
  var getSimpleCallback;
  (function(__callbacksByName) {
    getSimpleCallback = function (fn) {
      if (typeOf(fn, 'String')) {
        if (has(__callbacksByName, fn)) {
          fn = __callbacksByName[fn];
        }
        else {
          var func, name = fn.split(':'), indices = name[1], callbackName = fn + '';
          if (typeOf(fn = func = YourJS[name = name[0]], 'Function')) {
            if (indices != undefined) {
              indices = indices.split(',');
              fn = __callbacksByName[callbackName] = function() {
                for (var args = [], i = -1, index; index = indices[++i]; ) {
                  args[i] = index == 'this' ? this : pull(arguments, index, undefined);
                }
                return func.apply(this, args);
              };
            }
          }
          else {
            throw new Error('There is no "' + name + '" function.');
          }
        }
      }
      return fn || identity;
    };
  })({});

  // quoteRegExp() - Escaping RegExp Metacharacters - http://yourjs.com/snippets/27
  function quoteRegExp(str, opt_flagsOrMakeRegExp) {
    var ret = str.replace(/[[\](){}.+*^$|\\?-]/g, '\\$&');
    return opt_flagsOrMakeRegExp === '' || opt_flagsOrMakeRegExp
      ? new RegExp(ret, opt_flagsOrMakeRegExp == true ? '' : opt_flagsOrMakeRegExp)
      : ret;
  }

  // flagRegExp() - Modify RegExp Flags - http://yourjs.com/snippets/28
  function flagRegExp(rgx, modifiers) {
    var flags = (rgx + '').replace(/[\s\S]+\//, '');
    modifiers.replace(/([-+!]?)(\w)/g, function(index, op, flag) {
      index = flags.indexOf(flag)
      flags = op == '-' || (op == '!' && index >= 0)
        ? flags.replace(flag, '')
        : index < 0
          ? flags + flag
          : flags;
    });
    return new RegExp(rgx.source, flags);
  }

  // reduce() - http://yourjs.com/snippets/52
  function reduce(arrOrObj, accumulator, opt_initial) {
    var hasInitial = arguments.length > 2;
    walk(arrOrObj, function(value, key) {
      opt_initial = hasInitial
        ? accumulator(opt_initial, value, key, arrOrObj)
        : (hasInitial = 1, value);
    });
    if (hasInitial) {
      return opt_initial;
    }
    throw new TypeError('Reduce of empty subject with no initial value');
  }

  // indexOf() - http://yourjs.com/snippets/8
  function indexOf(obj, target, opt_fromIndex) {
    if (isArrayLike(obj)) {
      for (var i = opt_fromIndex ? opt_fromIndex < 0 ? Math.max(0, obj.length + opt_fromIndex) : opt_fromIndex : 0, l = obj.length; i < l; i++) {
        if (has(obj, i) && obj[i] === target) {
          return i;
        }
      }
      return -1;
    }
    else if (typeOf(obj = Object(obj), 'String')) {
      return obj.indexOf(target + '', opt_fromIndex);
    }
    for (var key in obj) {
      if (has(obj, key) && obj[key] === target) {
        return key;
      }
    }
  }

  // filter() - Keep Specific Values - http://yourjs.com/snippets/43
  function filter(arrOrObj, fnFilter, opt_filterOut) {
    opt_filterOut = !opt_filterOut;
    fnFilter = getSimpleCallback(fnFilter);
    var me = this, returnsArray = isArrayLike(arrOrObj);
    return reduce(arrOrObj, function(ret, value, key) {
      if (opt_filterOut != !fnFilter.call(me, value, key, arrOrObj)) {
        if (returnsArray) {
          ret.push(value);
        }
        else {
          ret[key] = value;
        }
      }
      return ret;
    }, returnsArray ? [] : {});
  }

  // Parsing URL Query Strings - http://yourjs.com/snippets/56
  function parseQS(url) {
    var vars = {};
    url.replace(/\?[^#]+/, function(query) {
      query.replace(/\+/g, ' ').replace(/[\?&]([^=&#]+)(?:=([^&#]*))?/g, function(m, key, value, arrIndicator, alreadyDefined, lastValue) {
        key = decodeURIComponent(key);
        if (arrIndicator = key.slice(-2) == '[]') {
          key = key.slice(0, -2);
        }
        value = value && decodeURIComponent(value);
        alreadyDefined = has(vars, key);
        lastValue = vars[key];
        vars[key] = arrIndicator || alreadyDefined
          ? typeOf(lastValue, 'Array')
            ? lastValue.concat([value])
            : alreadyDefined
              ? [lastValue, value]
              : [value]
          : value;
      });
    });
    return vars;
  }

  // isEmpty() & isFalsy() - http://yourjs.com/snippets/75
  function isEmpty(value) {
    if (isArrayLike(value = Object(value))) {
      return !value.length;
    }
    for (var k in value) {
      if (has(value, k)) {
        return false;
      }
    }
    return true;
  }
  
  function isFalsy(value, opt_strict) {
    return !value || (!opt_strict && (isArrayLike(value) || value.constructor == Object) && isEmpty(value));
  }

  // v1() - Determine 1st Non-nothing Value - http://yourjs.com/snippets/104
  function v1() {
    for (var args = arguments, i = 0, l = args.length; i < l && args[i] == undefined; i++);
    return has(args, i) ? args[i] : args[l - 1];
  }

  // isValidVarName() - http://yourjs.com/snippets/120
  function isValidVarName(varName) {
    try {
      Function((varName + '').replace(/[\s\xA0,\/]|^$/g, '.'), '');
      return true;
    }
    catch (e) {
      return false;
    }
  }

  // isRegExpMatch() - Match RegExp Against Start of String or Entire String - http://yourjs.com/snippets/123
  function isRegExpMatch(rgx, opt_str, opt_onlyCheckStart) {
    rgx = RegExp(rgx.source + '|([\\S\\s])', (rgx + '').replace(/[\s\S]+\/|g/g, '') + 'g');
    function f(str, opt_checkStartOnly) {
      rgx.lastIndex = undefined;
      opt_checkStartOnly = 1 in arguments ? opt_checkStartOnly : opt_onlyCheckStart;
      var isMatch = false, match, keepGoing = 1;
      while ((match = rgx.exec(str)) && keepGoing) {
        isMatch = slice(match, -1)[0] == undefined;
        keepGoing = isMatch && !opt_checkStartOnly;
      }
      return isMatch;
    }
    return opt_str == undefined ? f : f(opt_str, opt_onlyCheckStart);
  }

  // isClass() - http://yourjs.com/snippets/1
  function isClass(o) {
    if (typeOf(o, 'Function') && (o = o.prototype)) {
      for (var i in o) {
        if (has(o, i)) {
          return true;
        }
      }
      return has(o, 'toString');
    }
    return false;
  }

  // Type Checking Shortcuts - http://yourjs.com/snippets/2
  'Arguments Array Boolean Date Function null Number Object RegExp String undefined'.replace(/(\w)(\w+)/g, function(typeName, letter1, otherLetters) {
    YourJS['is' + letter1.toUpperCase() + otherLetters] = function(o) {
      return typeOf(o, typeName);
    };
  });

  // sub() - String Placeholder Substitution - http://yourjs.com/snippets/3
  var sub;
  (function(RGX) {
    sub = function(str, opt_subs) {
      opt_subs = opt_subs
        ? /^(Array|Object)$/.test(typeOf(opt_subs))
          ? opt_subs
          : slice(arguments, 1)
        : __global;
      var counter = 0;
      return str.replace(
        RGX,
        function(m, key, conditional, keyPlural, staticPlural, keySingular, staticSingular, mNone, keyNone, staticNone) {
          var args = slice(arguments); // To preserve the arguments passed to this function for any callback subs.
          keyPlural = keyPlural === '' ? counter++ : keyPlural;
          keySingular = keySingular === '' ? counter++ : keySingular;
          keyNone = keyNone === '' ? counter++ : keyNone;
          return has(opt_subs, key = key || counter++)
            ? (key = typeOf(key = opt_subs[key], 'Function') ? key.apply(str, args) : key, conditional)
              ? key - 1 != 0
                ? key || !mNone
                  ? (keyPlural && has(opt_subs, keyPlural)
                    ? typeOf(keyPlural = opt_subs[keyPlural], 'Function')
                      ? keyPlural.apply(str, args)
                      : keyPlural
                    : staticPlural)
                  : (keyNone && has(opt_subs, keyNone)
                    ? typeOf(keyNone = opt_subs[keyNone], 'Function')
                      ? keyNone.apply(str, args)
                      : keyNone
                    : staticNone)
                : (keySingular && has(opt_subs, keySingular)
                  ? typeOf(keySingular = opt_subs[keySingular], 'Function')
                    ? keySingular.apply(str, args)
                    : keySingular
                  : staticSingular)
              : key
            : m;
        }
      );
    };
  })(/\{([\$\w]*)(\?(?:\{([\$\w]*)\}|([\s\S]*?))\:(?:\{([\$\w]*)\}|([\s\S]*?))(\:(?:\{([\$\w]*)\}|([\s\S]*?)))?)?\}/g);

  // Cookies - http://yourjs.com/snippets/4
  function setCookie(name, value, opt_options) {
    opt_options = opt_options || {};
    // Set the name/value pair.
    var expires = opt_options.expires,
      path = opt_options.path,
      domain = opt_options.domain,
      secure = opt_options.secure,
      maxAge = opt_options['max-age'] || opt_options.maxAge;
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value)
      + (expires ? "; expires=" + (new Date(expires)).toGMTString() : "")
      + (path ? "; path=" + path : "; path=/")
      + (domain ? "; domain=" + opt_options.domain : "")
      + (secure ? "; secure" : "");
  }
  function getCookie(name, opt_defaultValue) {
    if(typeOf(name, 'RegExp')) {
      var ret = getCookie();
      for(var key in ret) {
        if(!name.test(key)) {
          delete ret[key];
        }
      }
    }
    else if(name == undefined) {
      var ret = {};
      document.cookie.replace(/(?:^|;\s*)(.+?)(?=;\s*|$)/g, function($0, $1) {
        $1 = $1.match(/(.*?)=(.*)/);
        ret[decodeURIComponent($1[1])] = decodeURIComponent($1[2]);
      });
    }
    else {
      name = document.cookie.match(new RegExp("(?:^|;\\s*)" + encodeURIComponent(name) + "=(.*?)(?:;\\s*|$)"));
      if(name) {
        var ret = decodeURIComponent(name[1]);
      }
    }
    return ret == undefined ? opt_defaultValue : ret;
  }
  function removeCookie(name, opt_options) {
    var key, ret = getCookie(name), cookies;
    if(ret && typeOf(ret, "String")) {
      (cookies = {})[name] = ret;
    }
    else {
      cookies = ret;
    }
    opt_options = opt_options || {};
    for(key in cookies) {
      if (has(cookies, key)) {
        setCookie(key, "", {
          path: opt_options.path,
          domain: opt_options.domain,
          secure: opt_options.secure,
          expires: new Date(0)
        });
      }
    }
    return ret;
  }

  // limit() - Limiting Function Calls - http://yourjs.com/snippets/5
  function limit(fn, opt_callLimit, opt_throwError) {
    opt_callLimit = opt_callLimit == undefined ? 1 : opt_callLimit;
    return function() {
      if (0 < opt_callLimit--) {
        return fn.apply(this, arguments);
      }
      if (opt_throwError) {
        throw new Error('Limited function called too many times.');
      }
    }
  }

  // css() - Embedding Stylesheets in JS - http://yourjs.com/snippets/6
  var css;
  (function(
    document,
    RGX_UPPER,
    RGX_AMP,
    RGX_NO_COMMAS_OR_NOTHING,
    RGX_NO_AMP,
    RGX_IND_SEL,
    RGX_CLS,
    RGX_TRIM_SELS,
    undefined
  ) {
    css = function(obj, selAncestors) {
      if (typeof selAncestors != 'string') {
        if (selAncestors) {
          var className = ('_' + Math.random()).replace(RGX_CLS, +new Date);
          selAncestors = typeOf(selAncestors, 'Array')
            ? selAncestors
            : [selAncestors];
          for (var i = selAncestors.length; i--;) {
            selAncestors[i].className += ' ' + className;
          }
        }
        selAncestors = className ? '.' + className : '';
      }
  
      var code = getCssCode(obj, selAncestors);
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet && !style.sheet) {
        style.styleSheet.cssText = code;
      }
      else {
        style.appendChild(document.createTextNode(code));
      }
      (document.getElementsByTagName('head')[0] || document.body).appendChild(style);
      return style;
    }
  
    function getCssCode(obj, selAncestors) {
      var rules = [];
      var rule = [];
      for (var key in obj) {
        if (has(obj, key)) {
          var value = obj[key];
          var typeName = typeOf(value);
          if (!key.indexOf('@media ')) {
            rules.push(key + '{' + getCssCode(value, selAncestors) + '}');
          }
          else if (typeName == 'Object') {
            // Trim selectors
            key = key.replace(RGX_TRIM_SELS, '$1');
            // Return all selectors
            key = key.replace(RGX_IND_SEL, function(sel) {
              sel = selAncestors ? sel.replace(RGX_NO_AMP, '& $&') : sel;
              return selAncestors.replace(RGX_NO_COMMAS_OR_NOTHING, function(selAncestor) {
                return sel.replace(RGX_AMP, selAncestor);
              });
            });
            rules.push(getCssCode(value, key));
          }
          else {
            value = typeName != 'Array'
              ? value != undefined
                ? value && typeof value == 'number'
                  ? value + 'px'
                  : ((value + '').slice(-1) == '!' ? value + 'important' : value)
                : 'none'
              : value.join(',');
            key = key.replace(RGX_UPPER, '-$&').toLowerCase();
            rule.push(key + ':' + value + ';');
          }
        }
      }
      if (rule[0]) {
          rules.unshift(selAncestors + '{' + rule.join('') + '}');
      }
      return rules.join('');
    }
  })(
    document,
    /[A-Z]/g,
    /&/g,
    /[^,]+|^$/g,
    /^[^&]+$/,
    /[^\s\xa0,][^,]*/g,
    /0(.|$)/,
    /^[\s\xa0]+|[\s\xa0]*(,)[\s\xa0]*|[\s\xa0]+$/g
  );

  // random() - http://yourjs.com/snippets/7
  function random(opt_ArrOrMinOrMax, opt_max, opt_round) {
    var argCount = arguments.length,
      arg0Type = typeOf(opt_ArrOrMinOrMax);
    if (arg0Type == 'Array') {
      return opt_ArrOrMinOrMax[random(opt_ArrOrMinOrMax.length - 1, true)];
    }
    if (arg0Type == 'Boolean') {
      opt_round = opt_ArrOrMinOrMax;
    }
    else if (typeOf(opt_max, 'Boolean')) {
      opt_round = opt_max;
      argCount = 1;
    }
    if (argCount < 2) {
      opt_max = argCount == 1 ? opt_ArrOrMinOrMax : 1;
      opt_ArrOrMinOrMax = 0;
    }
    var ret = Math.random() * (opt_max - opt_ArrOrMinOrMax) + opt_ArrOrMinOrMax;
    return ret = opt_round ? Math.round(ret) : ret;
  }

  // includes() - http://yourjs.com/snippets/9
  function includes(obj, target, opt_fromIndex) {
    var index = indexOf(obj, target, opt_fromIndex);
    return index !== -1 && index != undefined;
  }

  // htmlify() - http://yourjs.com/snippets/10
  function htmlify(str, opt_keepWhitespace) {
    str = str.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;')
             .replace(/"/g, '&quot;')
             .replace(/'/g, '&#x27;')
             .replace(/`/g, '&#x60;');
    return opt_keepWhitespace
      ? str.replace(/\r?\n|\r/g, '<br />')
           .replace(/\t/g, '    ')
           .replace(/^ | (?= )| $/g, '&nbsp;')
      : str;
  }

  // partial() - Partial Application - http://yourjs.com/snippets/11
  function partial(fn) {
    var arrArgs = slice(arguments, 1);
    fn = getSimpleCallback(fn);
    return function() {
      return fn.apply(this, arrArgs.concat(slice(arguments)));
    };
  }

  // setArgs() - Partial Application - http://yourjs.com/snippets/12
  function setArgs(fn, objPreArgs) {
    var n, arrPreArgIsSet = [];
    for (var k in objPreArgs) {
      n = parseInt(k, 10);
      if (n >= 0 && has(objPreArgs, n)) {
        arrPreArgIsSet[n] = true;
      }
    }
    var lOuter = arrPreArgIsSet.length;
  
    return function() {
      var arrArgs = [], arrPostArgs = slice(arguments), lInner = arrPostArgs.length;
      for (var iOuter = 0, iInner = 0; iOuter < lOuter; iOuter++) {
        arrArgs[iOuter] = arrPreArgIsSet[iOuter] ? objPreArgs[iOuter] : arrPostArgs[iInner++];
      }
      return fn.apply(this, arrArgs.concat(arrPostArgs.slice(iInner)));
    };
  }

  // rearg() - Rewriting Arguments - http://yourjs.com/snippets/13
  function rearg(fn, index0_or_argGetter) {
    if (!typeOf(index0_or_argGetter, 'Function')) {
      for (var keys = slice(arguments, 1), keysLen = keys.length, i = 0, key; key = keys[i], i < keysLen; i++) {
        keys[i] = ((/^(this|-?\d+)(?=\.|$)/.test(key) ? '' : 'this.') + key).split('.');
      }
  
      index0_or_argGetter = function(arg, argIndex, args, key, i, l, j) {
        if (argIndex < keysLen && (key = keys[argIndex])) {
          if (j = key[0]) {
            arg = j == 'this' ? this : slice(args, j, +j+1)[0];
            for (i = 1, l = key.length; j = key[i], i++ < l;) {
              arg = arg
                  ? (typeOf(arg, 'Array') && /^-?\d+$/.test(j))
                    ? arg.slice(j, +j+1)[0]
                    : arg[j]
                  : arg;
            }
          }
        }
        return arg;
      };
    }
  
    return function() {
      for (var args = arguments, arrArgs = [], i = Math.max(args.length, keysLen||0); i--;) {
        arrArgs[i] = index0_or_argGetter.call(this, args[i], i, args);
      }
      return fn.apply(this, arrArgs);
    }
  }

  // get() & set() - http://yourjs.com/snippets/14
  function get(obj, propName, opt_defaultValue) {
    return has(Object(obj), propName) ? obj[propName] : opt_defaultValue;
  }
  
  function set(obj, propName, value) {
    var prev = obj[propName];
    obj[propName] = value;
    return this instanceof YourJS ? obj : prev;
  }

  // cap() - Limit Function Argument Count - http://yourjs.com/snippets/15
  function cap(fn, opt_maxArity) {
    opt_maxArity = opt_maxArity != undefined ? opt_maxArity : fn.length;
    return function() {
      return fn.apply(this, slice(arguments, 0, opt_maxArity));
    };
  }

  // restParam() - http://yourjs.com/snippets/16
  function restParam(fn, opt_start) {
    opt_start = opt_start == undefined ? fn.length - 1 : opt_start;
    return function() {
      var args = slice(arguments, 0, opt_start);
      args.push(slice(arguments, opt_start));
      return fn.apply(this, args);
    }
  }

  // entries() - Get All Key/Value Pairs - http://yourjs.com/snippets/17
  function entries(arrOrObj, opt_allKeys) {
    var ret = [];
    if (/^A(?:rguments|rray.*$)/.test(typeOf(arrOrObj))) {
      for (var k = 0, l = arrOrObj.length; k < l; k++) {
        if (opt_allKeys || has(arrOrObj, k)) {
          ret.push([k, arrOrObj[k]]);
        }
      }
    }
    else {
      for (var k in arrOrObj) {
        if (opt_allKeys || has(arrOrObj, k)) {
          ret.push([k, arrOrObj[k]]);
        }
      }
    }
    return ret;
  }

  // Get All Keys & Values - http://yourjs.com/snippets/18
  function keys(arrOrObj, opt_allKeys) {
    var ret = [];
    if (/^A(?:rguments|rray.*$)/.test(typeOf(arrOrObj))) {
      for (var k = 0, l = arrOrObj.length; k < l; k++) {
        if (opt_allKeys || has(arrOrObj, k)) {
          ret.push(k);
        }
      }
    }
    else {
      for (var k in arrOrObj) {
        if (opt_allKeys || has(arrOrObj, k)) {
          ret.push(k);
        }
      }
    }
    return ret;
  }
  
  function values(arrOrObj, opt_allKeys) {
    var ret = [];
    if (/^A(?:rguments|rray.*$)/.test(typeOf(arrOrObj))) {
      for (var k = 0, l = arrOrObj.length; k < l; k++) {
        if (opt_allKeys || has(arrOrObj, k)) {
          ret.push(arrOrObj[k]);
        }
      }
    }
    else {
      for (var k in arrOrObj) {
        if (opt_allKeys || has(arrOrObj, k)) {
          ret.push(arrOrObj[k]);
        }
      }
    }
    return ret;
  }

  // put() - Assign A Value To A Path - http://yourjs.com/snippets/19
  function put(obj, path, value, opt_buildMissingPath) {
    path = typeOf(path, 'String') ? path.split('.') : path;
    
    for (var name, i = 0, e = path.length - 1; (name = path[i], i < e); i++) {
      if (obj[name] == undefined) {
        if (!opt_buildMissingPath) {
          throw new ReferenceError("Path couldn't be followed:  " + slice(path, 0, i + 1).join('.'));
        }
        obj[name] = {};
      }
      obj = obj[name];
    }
  
    if (e < 0) {
      throw new ReferenceError('Path must be specified.');
    }
  
    var oldValue = obj[name];
    obj[name] = value;
    return oldValue;
  }

  // param() - http://yourjs.com/snippets/21
  function param(callback, arrFields) {
    for (var t, defaults = [], len = arrFields.length, i = len; i--;) {
      t = toArray(arrFields[i]);
      if (1 in t) {
        defaults[i] = t[1];
      }
      arrFields[i] = t[0];
    }
  
    return function(fields) {
      fields = Object(fields);
      for (var t, args = slice(arguments, 0), i = len; i--;) {
        args.unshift(fields && (has(fields, t=arrFields[i]) || !has(defaults, i) ? fields[t] : defaults[i]));
      }
      return callback.apply(this, args);
    };
  }

  // titleCase() - Title Casing Strings - http://yourjs.com/snippets/22
  var titleCase;
  (function(RGX_WORD) {
    titleCase = function (str, opt_fnFilter) {
      return str.replace(RGX_WORD, function(word, start, rest, index) {
        return (!opt_fnFilter || opt_fnFilter(word, index, str) ? start.toUpperCase() : start) + rest;
      });
    };
  })(/(\S)((?:\B\S)*)/g);

  // Set-like Arrays - http://yourjs.com/snippets/23
  function subtract(array1, array2, opt_matchDups) {
    array1 = slice(array1);
    if (opt_matchDups) {
      array2 = slice(array2);
    }
    for (var e1, i1 = 0, l1 = array1.length, i2, l2 = array2.length; i1 < l1; i1++) {
      e1 = array1[i1];
      for (i2 = 0; i2 < l2; i2++) {
        if (e1 === array2[i2]) {
          l1--;
          array1.splice(i1--, 1);
          if (opt_matchDups) {
            l2--;
            array2.splice(i2--, 1);
          }
          break;
        }
      }
    }
    return array1;
  }
  
  function intersect(array1, array2) {
    return subtract(array1, subtract(array1, array2, 1), 1);
  }
  
  function union(array1, array2) {
    return array1.concat(subtract(array2, array1, 1));
  }

  // uniquify() - http://yourjs.com/snippets/24
  function uniquify(anArray) {
    anArray = slice(anArray);
    for (var e1, i1 = 0, l = anArray.length; i1 < l; i1++) {
      e1 = anArray[i1];
      for (i2 = i1 + 1; i2 < l; i2++) {
        if (e1 === anArray[i2]) {
          l--;
          anArray.splice(i2--, 1);
        }
      }
    }
    return anArray;
  }

  // jsonp() - http://yourjs.com/snippets/25
  function jsonp(url, callback, opt_callbackParamName) {
    var parent = document.getElementsByTagName('head')[0] || document.body;
    var script = document.createElement('script');
    var callbackName = '__jsonp';
    do {
      callbackName = (callbackName + Math.random()).replace('.', '');
    } while (has(__global, callbackName));
    var called;
    __global[callbackName] = function() {
      if (!called) {
        called = 1;
        delete __global[callbackName];
        callback.apply(this, arguments);
      }
    };
    script.src = (url + '&'
      + encodeURIComponent(opt_callbackParamName || 'callback')
      + '=' + callbackName).replace(/(^[^\?&]*)&/, '$1?');
    script.type = 'text/JavaScript';
    parent.appendChild(script);
  }

  // Encoding & Decoding URI Parameters - http://yourjs.com/snippets/26
  // The same as PHP's (from php.js) urlencode().
  function escape(str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+');
  }
  
  // The same as PHP's (from php.js) urldecode().
  function unescape(str) {
    return decodeURIComponent(str.replace(/%(?![\dA-F]{2})/gi, '%25').replace(/\+/g, '%20'));
  }

  // replace() - String Replacement - http://yourjs.com/snippets/29
  function replace(original, target, replacement, opt_maxReplacements) {
    var isRegExp = typeOf(target, 'RegExp');
    var isFn = typeOf(replacement, 'Function');
    return original.replace(
      new RegExp(
        isRegExp ? target.source : quoteRegExp(target),
        isRegExp ? (target + '').replace(/[\s\S]+\/(\w*?)g?(\w*)/, '$1$2g') : 'g'
      ),
      function(m) {
        return !(opt_maxReplacements-- <= 0) ? isFn ? replacement.apply(this, arguments) : replacement : m;
      }
    );
  }

  // nthRoot() - http://yourjs.com/snippets/30
  function nthRoot(root, x) {
    try {
      var negate = root % 2 == 1 && x < 0;
      if(negate)
        x = -x;
      var possible = Math.pow(x, 1 / root);
      root = Math.pow(possible, root);
      if(Math.abs(x - root) < 1 && (x > 0 == root > 0))
        return negate ? -possible : possible;
    } catch(e){}
  }

  // isoDate() - http://yourjs.com/snippets/31
  function isoDate(opt_date) {
    opt_date = opt_date || new Date;
    return opt_date.getUTCFullYear() + "-"
      + ("0" + (opt_date.getUTCMonth() + 1) + "-").slice(-3)
      + ("0" + opt_date.getUTCDate() + "T").slice(-3)
      + ("0" + opt_date.getUTCHours() + ":").slice(-3)
      + ("0" + opt_date.getUTCMinutes() + ":").slice(-3)
      + ("0" + opt_date.getUTCSeconds() + ".").slice(-3)
      + ("00" + opt_date.getUTCMilliseconds() + "Z").slice(-4);
  }

  // isPrimitive() - http://yourjs.com/snippets/32
  function isPrimitive(arg) {
    var type = typeof arg;
    return arg == undefined || (type != "object" && type != "function");
  }

  // Rounding with Precision - http://yourjs.com/snippets/33
  'ceil floor round'.replace(/\w+/g, function(fnName, RGX_NUM_BOUNDS, RGX_EXTRA_DOT) {
    RGX_NUM_BOUNDS = /^-?|$/g;
    RGX_EXTRA_DOT = /(\.\d*)\./;
    YourJS[fnName] = function(num, opt_precision) {
      opt_precision = opt_precision || 0;
      var absPrecision = Math.abs(opt_precision);
      var zeroesSub = '$&' + new Array(absPrecision + 2).join('0');
      var rgxGrow = new RegExp('(\\.)(\\d{' + absPrecision + '})');
      var rgxShrink = new RegExp('(\\d{' + absPrecision + '})(\\.)');
      num = (num + '.').replace(RGX_NUM_BOUNDS, zeroesSub)
        .replace(RGX_EXTRA_DOT, '$1')
        .replace(opt_precision < 0 ? rgxShrink : rgxGrow, '$2$1');
      num = (Math[fnName](+num) + '.').replace(RGX_NUM_BOUNDS, zeroesSub)
        .replace(RGX_EXTRA_DOT, '$1')
        .replace(opt_precision < 0 ? rgxGrow : rgxShrink, '$2$1');
      return +num;
    };
  });

  // isFloat() & isInt() - http://yourjs.com/snippets/34
  function isFloat(x) {
    return typeOf(x, 'Number') && !!(x % 1);
  }
  
  function isInt(x) {
    return typeOf(x, 'Number') && x % 1 == 0;
  }

  // swapCase() - http://yourjs.com/snippets/35
  function swapCase(s) {
    var l = s.toLowerCase(), u = s.toUpperCase(), lc, uc;
    return s.replace(/\S/g, function(m, i) {
      lc = l.charAt(i);
      uc = u.charAt(i);
      return lc != m ? uc == m ? lc : m : uc;
    });
  }

  // Simple Trigonometric Functions - http://yourjs.com/snippets/36
  'seccos;cscsin;cottan;'.replace(/(...)(?=(...)?;)/g, function(m, name, base, fn) {
    YourJS[name] = Function('a','b',fn = 'return ' + (base ? '1/' : '') + 'Math.' + (base || name) + '(b?a*'+Math.PI/180+':a);');
  });

  // getTimeAgo() - Relative Time Strings - http://yourjs.com/snippets/37
  function getTimeAgo(dateTime, opt_currDateTime) {
    opt_currDateTime = new Date(opt_currDateTime || new Date) - new Date(dateTime);
    return '31536e6year2592e6month864e5day36e5hour6e4minute1e3second'.replace(/(\d+e\d)([a-z]+)/g, function(m, ms, interval) {
      if (dateTime != undefined) {
        ms = Math.round(opt_currDateTime / +ms);
        if (ms >= 1 || interval == 'second') {
          dateTime = undefined;
          return ms + ' ' + interval + (ms - 1 ? 's' : '') + ' ago';
        }
      }
      return '';
    }) || undefined;
  }

  // frac() - Fractional Part of a Number - http://yourjs.com/snippets/38
  var frac;
  (function(RGX) {
    frac = function(num) {
      return +(+num).toExponential().replace(RGX, function(m, neg, num, dot, offset) {
        var zeroes = Array(Math.abs(offset) + 2).join('0');
        num = (zeroes + num + (dot ? '' : '.') + zeroes).split('.');
        return +(neg + '.' + num.join('').slice(+offset + num[0].length));
      });
    };
  })(/(-?)(\d+(\.?)\d*)e(.+)/);

  // trunc() - Integral Part of a Number - http://yourjs.com/snippets/39
  function trunc(num) {
    return Math[num < 0 ? 'ceil' : 'floor'](num);
  }

  // isSafeInt() ES6 Style - http://yourjs.com/snippets/40
  function isSafeInt(value) {
    return typeOf(value, 'Number') && value % 1 == 0 && Math.abs(value) <= (Math.pow(2,53) - 1);
  }

  // isNaN() ES6 Style - http://yourjs.com/snippets/41
  function isNaN(value) {
    return typeOf(value, 'Number') && __global.isNaN(value);
  }

  // isFinite() ES6 Style - http://yourjs.com/snippets/42
  function isFinite(value) {
    return typeOf(value, 'Number') && __global.isFinite(value);
  }

  // Splitting Strings - http://yourjs.com/snippets/44
  function dice(str, delim, opt_limit) {
    var arr = [], start = 0, i;
    if (str) {
      str.replace(
        (typeOf(delim, 'RegExp') ? flagRegExp : quoteRegExp)(delim, 'g'),
        function(m) {
          i = arguments;
          i = i[i.length - 2];
          if (!(opt_limit-- < 1)) {
            arr.push(str.slice(start, i));
            start = i + (m.length || 1);
          }
        }
      );
      arr.push(str.slice(start));
    }
    return arr;
  }

  // join() - http://yourjs.com/snippets/45
  function join(arr, opt_delimiter, opt_beforeEach, opt_afterEach) {
    opt_beforeEach = opt_beforeEach || '';
    opt_afterEach = opt_afterEach || '';
    return arr.length
      ? opt_beforeEach + arr.join(
          opt_afterEach
          + (opt_delimiter != undefined ? opt_delimiter : ',')
          + opt_beforeEach
        ) + opt_afterEach
      : '';
  }

  // debounce() - http://yourjs.com/snippets/46
  function debounce(fn, msBetweenCalls, opt_immediate) {
    var timeoutID,
        result;
    return function() {
      var objThis = this,
          args = arguments;
      if (opt_immediate && !timeoutID) {
        fnDebounced();
      }
      clearTimeout(timeoutID);
      timeoutID = setTimeout(fnDebounced, msBetweenCalls);
      function fnDebounced(oldTimeoutID) {
        timeoutID = 0;
        if (!opt_immediate) {
          result = fn.apply(objThis, args);
        }
      }
      return result;
    };
  }

  // randomize() - Randomize Array Values - http://yourjs.com/snippets/47
  function randomize(arr) {
    arr = slice(arr);
    for (var t, j, l = arr.length, i = l; i--;) {
      t = arr[i];
      arr[i] = arr[j = ~~(Math.random() * l)];
      arr[j] = t;
    }
    return arr;
  }

  // dom() - Write HTML in JS - http://yourjs.com/snippets/49
  var dom;
  (function(RGX_DASH, INNER_TEXT, TEXT_CONTENT, STRING, PROP_HASH) {
    function capAfterDash(m, afterDash) {
      return afterDash.toUpperCase();
    }
    dom = function(obj) {
      var elem, propName, propValue, i, l, j, c, style, stylePropName, kids;
      if (typeOf(obj, STRING)) {
        elem = slice(dom({ _: 'DIV', html: obj }).childNodes);
      }
      else {
        elem = document.createElement(obj.nodeName || obj._);
        for (propName in obj) {
          propValue = obj[propName];
          if (has(obj, propName) && (propName = PROP_HASH[propName] || propName) != '_') {
            if (propName == 'style') {
              style = elem[propName];
              if (typeOf(propValue, STRING)) {
                style.cssText = propValue;
              }
              else {
                for (stylePropName in propValue) {
                  if (has(propValue, stylePropName)) {
                    style[stylePropName.replace(RGX_DASH, capAfterDash)] = propValue[stylePropName];
                  }
                }
              }
            }
            else if (propName == INNER_TEXT || propName == TEXT_CONTENT) {
              elem[TEXT_CONTENT] = elem[INNER_TEXT] = propValue;
            }
            else if (propName == '$') {
              propValue = toArray(propValue);
              for (i = 0, l = propValue.length; i < l;) {
                for (kids = toArray(dom(propValue[i++])), j = 0, c = kids.length; j < c;) {
                  elem.appendChild(kids[j++]);
                }
              }
            }
            else if (/\W/.test(propName)) {
              elem.setAttribute(propName, propValue);
            }
            else {
              elem[propName] = propValue;
            }
          }
        }
      }
      return elem;
    };
  })(/-([^-])/g, 'innerText', 'textContent', 'String',
    {nodeName:'_',html:'innerHTML',text:'innerText',children:'$','for':'htmlFor','class':'className',cls:'className'});

  // reParam() - http://yourjs.com/snippets/50
  function reParam(callback, arrFields) {
    arrFields = arrFields.slice();
    for (var len = arrFields.length, i = len; i--;) {
      arrFields[i] = (arrFields[i] + '').split('.');
    }
    return function() {
      for (var args = arguments, arr = [args], i = len; i--;) {
        for (var part = args, parts = arrFields[i], pLen = parts.length, j = 0; j < pLen && part != undefined; j++) {
          part = part[parts[j]];
        }
        arr.unshift(part);
      }
      return callback.apply(this, arr);
    };
  }

  // Post URL Parameters - http://yourjs.com/snippets/51
  function postURL(url, opt_multipart) {
    var form = document.createElement("FORM");
    form.method = "POST";
    if(opt_multipart) {
      form.enctype = "multipart/form-data";
    }
    form.style.display = "none";
    document.body.appendChild(form);
    form.action = url.replace(/\?(.*)/, function(_, urlArgs) {
      urlArgs.replace(/\+/g, " ").replace(/([^&=]+)=([^&=]*)/g, function(input, key, value) {
        input = document.createElement("INPUT");
        input.type = "hidden";
        input.name = decodeURIComponent(key);
        input.value = decodeURIComponent(value);
        form.appendChild(input);
      });
      return "";
    });
    form.submit();
  }

  // doEvery() - http://yourjs.com/snippets/53
  function doEvery(fn, interval, opt_arrParams) {
    function wrappedFunction() {
      counter++;
      end && fn.apply(end, opt_arrParams.concat([counter, start]));
    }
    function end() {
      end = undefined;
      clearInterval(id);
    }
    opt_arrParams = opt_arrParams || [];
    setTimeout(wrappedFunction, 0);
    var id = setInterval(wrappedFunction, interval), start = new Date, counter = 0;
    return end;
  }

  // fuse() - Fusing Two or More Functions - http://yourjs.com/snippets/54
  function fuse(fn1, fn2, opt_excludeRetArgs) {
    var fns = slice(arguments), l = fns.length;
    opt_excludeRetArgs = typeOf(fns[l - 1], 'Function') ? 0 : (l--, fns.pop());
    return function() {
      for (var arrArgs = slice(arguments), extraArgs = [], me = this, i = 0, ret; i < l; i++) {
        ret = fns[i].apply(me, arrArgs.concat(extraArgs));
        if (!opt_excludeRetArgs) {
          extraArgs.push(ret);
        }
      }
      return ret;
    };
  }

  // check() - Object Validation - http://yourjs.com/snippets/55
  function check(obj, criteria) {
    if (typeOf(criteria, 'Function')) {
      for (var k in obj) {
        if (has(obj, k)) {
          var v = obj[k];
          var result = criteria(v, typeOf(v));
          if (result !== true) {
            return 'Property "' + k + '":  ' + result;
          }
        }
      }
    }
    else {
      for (var k in criteria) {
        if (has(criteria, k)) {
          var v = criteria[k];
          var vt = typeOf(v);
          if (vt == 'String') {
            if (!typeOf(obj[k], v)) {
              return 'Property "' + k + '" was not of type ' + v + ' as expected';
            }
          }
          else if (vt == 'Function') {
            var result = v(obj[k], typeOf(obj[k]));
            if (result !== true) {
              return 'Property "' + k + '":  ' + result;
            }
          }
          else {
            if (!has(obj, k)) {
              return 'Property "' + k + '" was expected but not found';
            }
          }
        }
      }
    }
    return true;
  }

  // map() - Map Array/Object Values - http://yourjs.com/snippets/57
  function map(arrOrObj, fn, opt_mapAll) {
    fn = getSimpleCallback(fn);
    var ret = isArrayLike(arrOrObj) ? [] : {};
    walk(arrOrObj, function(v, k) {
      ret[k] = fn.apply(this, arguments);
    }, opt_mapAll);
    return ret;
  }

  // findIndex() - Callback Based Index Of - http://yourjs.com/snippets/58
  function findIndex(arrOrObj, fn, opt_searchAll) {
    fn = getSimpleCallback(fn);
    var k = 0, l;
    if (isArrayLike(arrOrObj)) {
      for (l = arrOrObj.length; k < l; k++) {
        if ((opt_searchAll || has(arrOrObj, k)) && fn(arrOrObj[k], k, arrOrObj)) {
          return k;
        }
      }
      return -1;
    }
    else {
      for (k in arrOrObj) {
        if ((opt_searchAll || has(arrOrObj, k)) && fn(arrOrObj[k], k, arrOrObj)) {
          return k;
        }
      }
    }
  }

  // flatten() - http://yourjs.com/snippets/59
  function flatten(arr, opt_deep) {
    arr = slice(arr);
    for (var e, i = arr.length; i--;) {
      if (typeOf(e = arr[i], 'Array')) {
        arr.splice.apply(arr, [i, 1].concat(opt_deep ? flatten(e, 1) : e));
      }
    }
    return arr;
  }

  // copyArray() - Deep Copying Arrays - http://yourjs.com/snippets/60
  var copyArray;
  (function() {
    function helper(arr, pairs, i, t, copy) {
      for (i = pairs.length; t = pairs[--i];) {
        if (t.o === arr) {
          return t.c;
        }
      }
  
      pairs.push({ o: arr, c: copy = slice(arr) });
  
      for (i = copy.length; i--;) {
        if (typeOf(copy[i], 'Array')) {
          copy[i] = helper(arr[i], pairs);
        }
      }
  
      return copy;
    }
    copyArray = function(arr) {
      return helper(arr, []);
    };
  })();

  // nth() - nth Element In An Array - http://yourjs.com/snippets/61
  function nth(arr, n) {
    return arr[n < 0 ? arr.length + n : n];
  }

  // Setting Default Values for Functions - http://yourjs.com/snippets/62
  function setDefaults(fn) {
    var defaults = slice(arguments, 1);
    return function() {
      var args = slice(arguments), i = args.length;
      for (args = args.concat(slice(defaults, i)); i--;) {
        if (args[i] === undefined) {
          args[i] = defaults[i];
        }
      }
      return fn.apply(this, args);
    };
  }

  // range() - Array of Numbers - http://yourjs.com/snippets/63
  function range(opt_start, stop, opt_step) {
    if (arguments.length < 2) {
      stop = opt_start;
      opt_start = 0;
    }
    for (var ret = [], t = (opt_step = opt_step || 1) > 0; t ? opt_start < stop : opt_start > stop; opt_start += opt_step) {
      ret.push(opt_start);
    }
    return ret;
  }

  // Greatest Common Denominator & Least Common Multiple - http://yourjs.com/snippets/64
  function gcd(int1, int2) {
    return int2 ? gcd(int2, int1 % int2) : int1;
  }
  
  function lcm(int1, int2) {
    return Math.abs(int1 * int2) / gcd(int1, int2);
  }

  // matchAll() - Get All Matching Substrings - http://yourjs.com/snippets/65
  function matchAll(str, rgx, opt_fnMapper) {
    var arr, extras, matches = [];
    str.replace(rgx = rgx.global ? rgx : new RegExp(rgx.source, (rgx + '').replace(/[\s\S]+\//g , 'g')), function() {
      arr = slice(arguments);
      extras = arr.splice(-2);
      arr.index = extras[0];
      arr.input = extras[1];
      arr.source = rgx;
      matches.push(opt_fnMapper ? opt_fnMapper.apply(arr, arr) : arr);
    });
    return arr ? matches : null;
  }

  // String Padding - ES7 Style - http://yourjs.com/snippets/66
  function padStart(str, maxLength, opt_fillString) {
    str += '';
  
    var filler, fillLen, stringLength = str.length;
  
    return maxLength > stringLength
      ? (
          filler = (opt_fillString !== undefined ? opt_fillString + '' : '') || ' ',
          fillLen = maxLength - stringLength,
          (new Array(Math.ceil(fillLen / filler.length) + 1)).join(filler).slice(0, fillLen) + str
        )
      : str;
  }
  
  function padEnd(str, maxLength, opt_fillString) {
    str += '';
  
    var filler, fillLen, stringLength = str.length;
  
    return maxLength > stringLength
      ? (
          filler = (opt_fillString !== undefined ? opt_fillString + '' : '') || ' ',
          fillLen = maxLength - stringLength,
          str + (new Array(Math.ceil(fillLen / filler.length) + 1)).join(filler).slice(0, fillLen)
        )
      : str;
  }

  // Trimming Whitespace - http://yourjs.com/snippets/67
  function trim(str) {
    return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  }
  
  function trimLeft(str) {
    return str.replace(/^[\s\uFEFF\xA0]+/, '');
  }
  
  function trimRight(str) {
    return str.replace(/[\s\uFEFF\xA0]+$/g, '');
  }

  // splitLines() - Array of Lines - http://yourjs.com/snippets/68
  function splitLines(str, opt_keepEnds) {
    var start = 0, ret = [], l;
    // Not using split because of IE8 error.
    str.replace(/\r\n?|[\n\x0B\x0C\x1C-\x1E\x85\u2028\u2029]/g, function(m, i) {
      l = m.length;
      ret.push(str.slice(start, opt_keepEnds ? i + l : i));
      start = i + l;
    });
    if (str = str.slice(start)) {
      ret.push(str);
    }
    return ret;
  }

  // formatDate() - Date Formatter - http://yourjs.com/snippets/69
  var formatDate;
  (function(dayNames, monthNames, RGX_FORMAT, RGX_QUOTE, RGX_2_CHARS) {
    formatDate = function(date, format, opt_dayNames, opt_monthNames) {
      return format.replace(RGX_FORMAT, function(str) {
        var c1 = str.charAt(0),
            ret = str.charAt(0) == "'"
            ? (c1=0) || str.slice(1, -1).replace(RGX_QUOTE, "'")
            : str == "a"
              ? (date.getHours() < 12 ? "am" : "pm")
              : str == "A"
                ? (date.getHours() < 12 ? "AM" : "PM")
                : str == "Z"
                  ? (("+" + -date.getTimezoneOffset() / 60).replace('+-', "-").replace(RGX_2_CHARS, "$10$2") + "00")
                  : c1 == "S"
                    ? date.getMilliseconds()
                    : c1 == "s"
                      ? date.getSeconds()
                      : c1 == "H"
                        ? date.getHours()
                        : c1 == "h"
                          ? (date.getHours() % 12) || 12
                          : (c1 == "D" && str.length > 2)
                            ? (opt_dayNames || dayNames)[date.getDay()].slice(0, str.length > 3 ? 9 : 3)
                            : c1 == "D"
                              ? date.getDate()
                              : (c1 == "M" && str.length > 2)
                                ? (opt_monthNames || monthNames)[date.getMonth()].slice(0, str.length > 3 ? 9 : 3)
                                : c1 == "m"
                                  ? date.getMinutes()
                                  : c1 == "M"
                                    ? date.getMonth() + 1
                                    : ("" + date.getFullYear()).slice(-str.length);
        return c1 && str.length < 4 && ("" + ret).length < str.length
          ? ("00" + ret).slice(-str.length)
          : ret;
      });
    };
  })(
    "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
    "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
    /a|A|Z|S(SS)?|ss?|mm?|HH?|hh?|D{1,4}|M{1,4}|YY(YY)?|'([^']|'')*'/g,
    /''/g,
    /^(.)(.)$/
  );

  // now() - Current Date/Time - http://yourjs.com/snippets/70
  function now() {
    return new Date;
  }
  now.valueOf = function() {
    return +now();
  };

  // create() - Object.create() - http://yourjs.com/snippets/71
  function create(proto, opt_props) {
    function t() {}
    t.prototype = proto;
    proto = new t();
    for (t in opt_props = Object(opt_props)) {
      if (has(opt_props, t)) {
        proto[t] = opt_props[t];
      }
    }
    return proto;
  }

  // is() - Test for Equality - http://yourjs.com/snippets/72
  function is(x, y) {
    x = x === y
      ? x !== 0 || 1 / x == 1 / y // -0 vs 0
      : (x != x && y != y); // NaN
    y = arguments;
    return x && y.length > 2
      ? is.apply(0, slice(y, 1))
      : x;
  }

  // log() - Finding Any Logarithm - http://yourjs.com/snippets/73
  function log(x, opt_base) {
    x = Math.log(x);
    return opt_base ? (x / Math.log(opt_base)) : x;
  }

  // Pushing & Popping from Arrays - http://yourjs.com/snippets/74
  function push(array, value, opt_index) {
    opt_index == undefined ? array.push(value) : array.splice(opt_index, 0, value);
    return array;
  }
  
  function pop(array, opt_index) {
    return array.splice(opt_index == undefined ? -1 : opt_index, 1)[0];
  }

  // Spreading Array Values To A Function - http://yourjs.com/snippets/76
  function spread(fn) {
    return function(args) {
      return fn.apply(this, args);
    };
  }

  // Prime Numbers vs. Composite Numbers - http://yourjs.com/snippets/77
  function isPrime(num) {
    if(!isSafeInt(num)) {
      throw new TypeError("expected a finite integer");
    }
    if(num < 2) {
      return false;
    }
    if(num < 4) {
      return true;
    }
    if(num % 2 == 0 || num % 3 == 0) {
      return false;
    }
    for(var max = parseInt(Math.sqrt(num)) + 2, check = 6; check <= max; check += 6) {
      if(num % (check - 1) == 0 || num % (check + 1) == 0) {
        return false;
      }
    }
    return true;
  }
  
  function isComposite(num) {
    return num > 1 && !isPrime(num);
  }

  // offsetDate() - http://yourjs.com/snippets/78
  function offsetDate(opt_date, offset) {
    if (arguments.length < 2) {
      offset = opt_date;
      opt_date = new Date;
    }
    return new Date(+opt_date + (typeOf(offset, 'Date') ? +new Date - offset : +offset));
  }

  // fill() - Filling Arrays & Objects - http://yourjs.com/snippets/79
  function fill(arrOrObj, value) {
    walk(arrOrObj, function(v, k) {
      arrOrObj[k] = value;
    }, 1);
    return arrOrObj;
  }

  // time() - Timing Function Execution - http://yourjs.com/snippets/80
  function time(fn, times) {
    if (typeOf(times, 'Array')) {
      var arr = times;
      times = function(timeElapsed, start, end, returnValue, args, context) {
        arr.push(extend(Object(timeElapsed), {
          start: start,
          end: end,
          returnValue: returnValue,
          context: context,
          arguments: args
        }));
      };
    }
    return function() {
      var start = new Date,
          ret = fn.apply(this, arguments),
          end = new Date;
      times.call(fn, end - start, start, end, ret, arguments, this);
    };
  }

  // indexBy() - Indexing an Array/Object By New Criteria - http://yourjs.com/snippets/82
  function indexBy(arrOrObj, opt_key, opt_indexAsArrays, opt_objToExtend) {
    var k, hasNoKey = opt_key == undefined, keyIsFn = typeOf(opt_key, 'Function');
    opt_objToExtend = opt_objToExtend || {};
    walk(arrOrObj, function(t) {
      k = keyIsFn
        ? opt_key.call(opt_objToExtend, t, arrOrObj)
        : hasNoKey
          ? t
          : t[opt_key];
      if (k != undefined) {
        if (opt_indexAsArrays) {
          if (!(k in opt_objToExtend)) {
            opt_objToExtend[k] = [];
          }
          else if (!typeOf(opt_objToExtend[k], 'Array')) {
            opt_objToExtend[k] = [opt_objToExtend[k]];
          }
          opt_objToExtend[k].push(t);
        }
        else {
          opt_objToExtend[k] = t;
        }
      }
    });
    return opt_objToExtend;
  }

  // compact() - An Array or Object Without Falsy Values - http://yourjs.com/snippets/83
  function compact(arrOrObj, opt_filterOutNothings) {
    return filter(arrOrObj, function(value) {
      return opt_filterOutNothings ? !isNothing(value) : value;
    });
  }

  // ordinalize() - 1st, 2nd, 3rd, 4th & Beyond - http://yourjs.com/snippets/84
  var ordinalize;
  (function(o) {
    ordinalize = function(intNum, opt_excludeNumber) {
      return (opt_excludeNumber ? '' : intNum)
        + (o[((intNum = Math.abs(intNum % 100)) - 20) % 10] || o[intNum] || "th");
    };
  })([,"st","nd","rd"]);

  // getViewportSize() - Viewport Dimensions - http://yourjs.com/snippets/85
  function getViewportSize() {
    var doc = document,
      body = doc.body,
      docElem = doc.documentElement,
      docElemHeight = docElem.clientHeight,
      docElemWidth = docElem.clientWidth,
      css1Compat = doc.compatMode === 'CSS1Compat';
    return {
      height: css1Compat && docElemHeight || body && body.clientHeight || docElemHeight,
      width: css1Compat && docElemWidth || body && body.clientWidth || docElemWidth
    };
  }

  // toggle() - Toggling Array Values - http://yourjs.com/snippets/86
  function toggle(array, valuesToToggle, opt_fnTestEquality) {
    array = slice(array);
    valuesToToggle = slice(valuesToToggle);
    for (var j, i = array.length, valuesCount = valuesToToggle.length; i--;) {
      for (j = valuesCount; j--;) {
        if (opt_fnTestEquality ? opt_fnTestEquality(array[i], valuesToToggle[j]) : (array[i] === valuesToToggle[j])) {
          array.splice(i, 1);
          valuesToToggle.splice(j, 1);
          valuesCount--;
        }
      }
    }
    return array.concat(valuesToToggle);
  }

  // nthIndexOf() - Find the Nth Occurrence Of A Target - http://yourjs.com/snippets/87
  function nthIndexOf(subject, target, n) {
    var i, tLen,
        indices = [],
        nIsNegative = n < 0,
        fnName = (nIsNegative ? 'lastI' : 'i') + 'ndexOf',
        l = subject.length,
        increment = nIsNegative ? -1 : 1;
    if (n = ~~n) {
      if (isArrayLike(subject)) {
        for (i = nIsNegative ? l - 1 : 0; nIsNegative ? i >= 0 : (i < l); i += increment) {
          if (target === subject[i] && !(n -= increment)) {
            return i;
          }
        }
        return -1;
      }
      else if (typeOf(subject, 'String')) {
        if (typeOf(target, 'RegExp')) {
          target = flagRegExp(target, 'g');
          subject.replace(target, function(a) {
            a = arguments;
            indices.push(a[a.length - 2]);
          });
          return increment * n <= indices.length ? indices.slice(nIsNegative ? n : ~-n)[0] : -1;
        }
        else {
          subject = subject.split(target);
          return subject[n * increment] != undefined ? subject.slice(0, n).join(target).length : -1;
        }
      }
      else {
        for (i in subject) {
          if (target === subject[i]) {
            n -= increment;
            if (nIsNegative) {
              indices.push(i);
            }
            else if (!n) {
              return i;
            }
          }
        }
        if (n < indices.length) {
          return indices[n];
        }
      }
    }
  }

  // addTypeOf() - Augmenting the Type Checker - http://yourjs.com/snippets/89
  var addTypeOf;
  (function(baseTypeOf, EXTRA_TYPES, l) {
    addTypeOf = function(constructor, name) {
      for (var i = 0; i < l && EXTRA_TYPES[i][1] != name; i++);
      EXTRA_TYPES[i] = [constructor, name];
      l = EXTRA_TYPES.length;
      if (l == 2) {
        YourJS.typeOf = typeOf = function(value) {
          var test, i = 0, typeName = baseTypeOf(value), argv = arguments, argc = argv.length;
          if (typeName == 'Object') {
            for (; i < l; i++) {
              if (EXTRA_TYPES[i][0] == value.constructor) {
                typeName = EXTRA_TYPES[i][1];
                break;
              }
            }
          }
          for (i = argc; --i && ((typeof(test = argv[i]) == 'string' || typeOf(test) != 'RegExp') ? typeName != test : !test.test(typeName)); );
          return argc > 1 ? !!i : typeName;
        };
      }
    };
  })(typeOf, [[Object, 'Object']], 1);

  // inherit() - Basic Prototypal Inheritance - http://yourjs.com/snippets/90
  function inherit(subClass, baseClass, opt_prototype) {
    function SurrogateClass(){}
    SurrogateClass.prototype = baseClass.prototype;
    extend(subClass.prototype = new SurrogateClass(), { constructor: subClass, superClass: baseClass }, Object(opt_prototype));
    return subClass;
  }

  // parseURL() - Parse Any URL - http://yourjs.com/snippets/91
  function parseURL(opt_url) {
    var elem = document.createElement('a'),
        result = {
          params: parseQS(elem.href = opt_url = opt_url == undefined ? __global.location.href : opt_url),
          toString: function() {
            return href;
          }
        };
    walk(elem, function(value, key) {
      if (/^(hash|href|port|protocol|(user|path|host)(name)?|search|password)$/.test(key)) {
        result[key] = value;
      }
    }, 1);
    return result;
  }

  // frexp() & ldexp() - http://yourjs.com/snippets/92
  var frexp;
  (function(Math, log, LOG2) {
    log = Math.log;
    LOG2 = log(2);
    frexp = function(x) {
      if (isFinite(x = +x) && x !== 0) {
        var sign = x < 0 ? -1 : 1,
            pow2 = Math.floor(1 + log(x *= sign) / LOG2);
        return [sign * x / Math.pow(2, pow2), pow2];
      }
      return [x, 0];
    };
  })(Math);
  
  function ldexp(x, exp) {
    return x * Math.pow(2, exp);
  }

  // min() & max() - http://yourjs.com/snippets/93
  function min(x) {
    return Math.min.apply(x, isArrayLike(x) ? x : arguments);
  }
  
  function max(x) {
    return Math.max.apply(x, isArrayLike(x) ? x : arguments);
  }

  // sum() - http://yourjs.com/snippets/94
  function sum(x) {
    for (var result = 0, nums = isArrayLike(x) ? x : arguments, i = nums.length; i--;) {
      result += +nums[i];
    }
    return result;
  }

  // splice() - http://yourjs.com/snippets/95
  function splice(arrOrStr, start, opt_length, opt_replacement) {
    opt_length = opt_length != undefined
      ? opt_length < 0
        ? arrOrStr.length - start + opt_length
        : opt_length
      : Infinity;
    start = start < 0 ? Math.max(0, arrOrStr.length + start) : start;
    if (isArrayLike(arrOrStr)) {
      return slice(arrOrStr, 0, start).concat(opt_replacement || [], slice(arrOrStr, start + opt_length));
    }
    return arrOrStr.slice(0, start)
      + (opt_replacement === undefined ? '' : opt_replacement)
      + arrOrStr.slice(start + opt_length);
  }

  // Degree & Radian Converters - http://yourjs.com/snippets/96
  function degrees(radians) {
    return radians * 180 / Math.PI;
  }
  
  function radians(degrees) {
    return degrees * Math.PI / 180;
  }

  // clamp() - Confine Numbers To A Specific Range - http://yourjs.com/snippets/97
  function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
  }

  // throttle() - http://yourjs.com/snippets/98
  function throttle(fn, msBetweenCalls, opt_leading) {
    var lastTimeCalled = 0,
        objThis,
        args,
        result,
        timeoutID,
        leading = opt_leading,
        trailing = opt_leading != undefined && !opt_leading;
    function fnThrottled() {
      lastTimeCalled = new Date;
      clearTimeout(timeoutID);
      timeoutID = null;
      result = fn.apply(objThis, args);
    }
    return function() {
      var now = new Date,
          msTilAllowed = msBetweenCalls - (now - lastTimeCalled);
      objThis = this;
      args = arguments;
      if (trailing && msTilAllowed <= 0) {
        msTilAllowed = msBetweenCalls;
      }
      msTilAllowed > 0
        ? leading || timeoutID || (timeoutID = setTimeout(fnThrottled, msTilAllowed))
        : fnThrottled();
      return result;
    };
  }

  // callReturn() - Call & Return A Function - http://yourjs.com/snippets/99
  function callReturn(fn) {
    fn.apply(this, slice(arguments, 1));
    return fn;
  }

  // unnest() - Flatten Nested Structures - http://yourjs.com/snippets/100
  function unnest(arrOrObj, fn, opt_initial, opt_skipRecursives) {
    var initialIsArray = typeOf(opt_initial = opt_initial || (isArrayLike(arrOrObj) ? [] : {}), 'Array');
    function add(valueToAdd, opt_index) {
      if (opt_index == undefined && initialIsArray) {
        opt_initial.push(valueToAdd);
      }
      else {
        opt_initial[opt_index] = valueToAdd;
      }
    }
    function helper(parent, path, seen, seenCount) {
      var newPath;
      seen = [parent].concat(seen);
      seenCount++;
      function recurse(value) {
        for (var i = seenCount; i--;) {
          if (seen[i] === value) {
            if (opt_skipRecursives) {
              return;
            }
            throw new Error('Cannot unnest recursive, nested structures.');
          }
        }
        helper(value, newPath, seen, seenCount);
      }
      walk(parent, function(value, index) {
        fn(value, index, add, recurse, parent, newPath = path.concat([index]), arrOrObj);
      });
    }
    helper(arrOrObj, [], [], 0);
    return opt_initial;
  }

  // ids() - Unique Element IDs - http://yourjs.com/snippets/101
  function ids(ids, opt_document) {
    opt_document = opt_document || document;
    var suffix, i, l = (ids = typeOf(ids, 'Array') ? ids : [ids]).length, ret = [];
    ret.input = ids;
    do {
      ret.suffix = suffix = ('_' + Math.random()).replace('0.', '');
      for (i = 0; i < l && !opt_document.getElementById(ret[i] = ids[i] + suffix); i++);
    } while (i < l);
    return ret;
  }

  // curry() & rcurry() - Partial Application - http://yourjs.com/snippets/102
  function curry(fn, opt_arity) {
    opt_arity = opt_arity || fn.length;
    return function wrap() {
      var args = [];
      return (function inner() {
        return (args = args.concat(slice(arguments))).length < opt_arity
          ? inner
          : fn.apply(this, args);
      }).apply(this, arguments);
    };
  }
  
  function rcurry(fn, opt_arity) {
    opt_arity = opt_arity || fn.length;
    return function wrap() {
      var args = [];
      return (function inner() {
        return (args = slice(arguments).concat(args)).length < opt_arity
          ? inner
          : fn.apply(this, args);
      }).apply(this, arguments);
    };
  }

  // isNumeric() - Check If A String Can Be A Number - http://yourjs.com/snippets/103
  function isNumeric(value) {
    return  typeOf(value, 'String') && !value != isFinite(Number(value));
  }

  // count() - http://yourjs.com/snippets/105
  function count(subject, opt_fnFilter) {
    opt_fnFilter = getSimpleCallback(opt_fnFilter);
    var count = 0, noFilter = arguments.length < 2, isStr = typeOf(subject, 'String');
    if (noFilter && isStr) {
      return subject.length;
    }
    walk(isStr ? subject.split('') : subject, function() {
      count += noFilter || !!opt_fnFilter.apply(this, arguments);
    });
    return count;
  }

  // mod() - Python Style Modulo - http://yourjs.com/snippets/106
  function mod(dividend, divisor) {
    return (dividend % divisor + divisor) % divisor;
  }

  // apply() & call() - http://yourjs.com/snippets/107
  function apply(subject, fn, opt_args) {
    return (typeOf(fn, 'String') ? subject[fn] : fn).apply(subject, opt_args);
  }
  function call(subject, fn) {
    return apply(subject, fn, slice(arguments, 2));
  }

  // startsWith() & endsWith() - http://yourjs.com/snippets/111
  function startsWith(subject, target, opt_startAt) {
    var subjectType = typeOf(subject), subjectIsArray = subjectType == 'Array';
    if (subjectIsArray || subjectType == 'String') {
      subject = subject.slice(opt_startAt);
      if (subjectIsArray) {
        target = toArray(target);
        for (
          var tLen = target.length, i = tLen > subject.length ? -2 : tLen;
          i-- > 0 && subject[i] === target[i];
        );
        return i == -1;
      }
      return subject.indexOf(target) == 0;
    }
  }
  
  function endsWith(subject, target, opt_endAt) {
    var tLen, i, subjectType = typeOf(subject), subjectIsArray = subjectType == 'Array';
    if (subjectIsArray || subjectType == 'String') {
      subject = subject.slice(0, opt_endAt);
      if (subjectIsArray) {
        for (
          target = toArray(target), tLen = target.length,
            subject = subject.slice(-tLen), i = tLen > subject.length ? -2 : tLen;
          i-- > 0 && subject[i] === target[i];
        );
        return i == -1;
      }
      target += '';
      return !target || subject.slice(-target.length) == target;
    }
  }

  // deburr() - Remove Diacritics from Characters - http://yourjs.com/snippets/112
  var deburr;
  (function(RGX_DEBURR, ARR_DEBURR, RGX_NON_SPACE) {
    function replaceDeburrChar() {
      return ARR_DEBURR[slice(arguments, 1).join(' ').search(RGX_NON_SPACE, '')];
    }
    deburr = function(str) {
      return str.replace(RGX_DEBURR, replaceDeburrChar);
    };
  })(
    /([\xc0-\xc5\u0100])|([\xe0-\xe5\u0101])|([\xc7\u0106\u010c])|([\xe7\u0107\u010d])|(\xd0\u0110)|(\xf0\u0111)|([\xc8-\xcb\u0112\u0116\u0118])|([\xe8-\xeb\u0113\u0117\u0119])|([\xcc-\xcf\u012a\u012e])|([\xec-\xef\u012b\u012f])|([\xd1\u0143])|([\xf1\u0144])|([\xd2-\xd6\xd8\u014c])|([\xf2-\xf6\xf8\u014d])|([\xd9-\xdc\u016a])|([\xf9-\xfc\u016b])|([\xdd\u0178])|([\xfd\xff])|(\xc6)|(\xe6)|(\xde)|(\xfe)|(\xdf)|(\u0152)|(\u0153)|(\u0141)|(\u0142)|([\u02B9-\u036F])/g,
    'A,a,C,c,D,d,E,e,I,i,N,n,O,o,U,u,Y,y,Ae,ae,Th,th,ss,Oe,oe,L,l,'.split(','),
    /\S/
  );

  // isError() - http://yourjs.com/snippets/113
  function isError(obj, opt_testForAnyError) {
    return typeOf(obj).slice(opt_testForAnyError ? -5 : 0) == 'Error';
  }

  // isNil() - http://yourjs.com/snippets/114
  function isNil(value) {
    return value == undefined;
  }

  // Case Checking - http://yourjs.com/snippets/115
  'Mix---Lower-Upper-No'.replace(/\w+/g, function(name, i) {
    YourJS['is' + name + 'Case'] = Function('s', 'n', 's=0 in arguments?s+"":"";return(s=(s==s.toLowerCase()?6:0)+(s==s.toUpperCase()?12:0))==' + i + '||(!!n&&s>12);');
  });

  // indexOfDiff() - Start of the Difference - http://yourjs.com/snippets/116
  function indexOfDiff(str1, str2) {
    var splitLen = Math.ceil(Math.min(str1.length, str2.length) / 2),
        s1_1 = str1.slice(0, splitLen), s2_1 = str2.slice(0, splitLen);
    return str1 != str2
      ? splitLen
        ? s1_1 != s2_1
          ? splitLen - 1 && indexOfDiff(s1_1, s2_1)
          : (indexOfDiff(str1.slice(splitLen), str2.slice(splitLen)) + splitLen)
        : 0
      : -1;
  }

  // Substrings Around A Target - http://yourjs.com/snippets/117
  'around before after'.replace(/\w+/g, function(name, i) {
    YourJS[name] = function(subject, target, opt_occurrence) {
      var ret, args, indices = [];
      opt_occurrence = parseInt(opt_occurrence || 1, 10);
      target = (typeOf(target, 'RegExp') ? flagRegExp : quoteRegExp)(target, 'g');
      subject.replace(target, function(match, i) {
        args = arguments;
        indices.push([i = args[args.length - 2], match.length + i]);
      });
      ret = (indices = indices[opt_occurrence + (opt_occurrence > 0 ? -1 : indices.length)])
        ? [subject.slice(0, indices[0]), subject.slice(indices[1])]
        : [null, null];
      return i ? ret[i / 7 - 1] : ret;
    };
  });

  // Wrap & Unwrap Strings - http://yourjs.com/snippets/118
  function wrap(str, opt_wrapper, opt_escape) {
    opt_wrapper = toArray(opt_wrapper);
    opt_escape = toArray(opt_escape);
    var opt_lWrap = (opt_wrapper[0] || '"') + '',
        opt_rWrap = opt_wrapper[1] || opt_lWrap,
        opt_lEscape = v1(opt_escape[0], '') + '',
        opt_rEscape = v1(opt_escape[1], opt_lEscape) + '';
    return opt_lWrap
      + (str + '').replace(
          RegExp(quoteRegExp(opt_lWrap) + '|' + quoteRegExp(opt_rWrap), 'g'),
          function(m) { return m == opt_lWrap ? opt_lEscape : opt_rEscape; }
        )
      + opt_rWrap;
  }
  
  function unwrap(str, opt_wrapper, opt_escape) {
    opt_wrapper = toArray(opt_wrapper);
    opt_escape = toArray(opt_escape);
    var opt_lWrap = (opt_wrapper[0] || '"') + '',
        opt_rWrap = (opt_wrapper[1] || opt_lWrap) + '',
        opt_lEscape = v1(opt_escape[0], '') + '',
        opt_rEscape = v1(opt_escape[1], opt_lEscape) + '',
        strRgx = '^' + quoteRegExp(opt_lWrap) + '|(' + quoteRegExp(opt_rWrap) 
               + '$)|(' + quoteRegExp(opt_lEscape) + ')|'
               + quoteRegExp(opt_rEscape);
    return (str + '').replace(RegExp(strRgx, 'g'), function(m, r, l, i) {
      return i && !r && m ? l ? opt_lWrap : opt_rWrap : '';
    });
  }

  // and() & or() & xor() - http://yourjs.com/snippets/119
  'xor ^ &&a)&&(b|| ! and & &&  or | ||  '
    .replace(/(.+?) (.) (.+?) (.?) /g, function(m, name, op, ops, op2) {
      YourJS[name] = Function(
        'c,g',
        'for(var e=1,f=c.length,a=c[0],b=a;e<f;a=c[e++],b=g?b@a:@(b@a));return b'
          .replace('@', op)
          .replace('@', op2)
          .replace('@', ops)
      );
    });

  // construct() - Apply Arguments To A Constructor - http://yourjs.com/snippets/121
  function construct(constructor, argList) {
    for (var argNames = '', i = argList.length; i--;) {
      argNames += (argNames ? ',a' : 'a') + i;
    }
    return Function(argNames, 'return new this(' + argNames + ')').apply(constructor, argList);
  }

  // func() - Create A Function with Context - http://yourjs.com/snippets/122
  function func(arrArgs, strBody, opt_objContext, opt_name) {
    var k, fn, arrContextVars = [], arrContextArgs = [];
    for (k in opt_objContext || {}) {
      if (has(opt_objContext, k) && isValidVarName(k)) {
        arrContextVars.push(k);
        arrContextArgs.push(opt_objContext[k]);
      }
    }
    return eval('(function(f,a){return function ' + ((opt_name != undefined && isValidVarName(opt_name)) ? opt_name : '') + '(){return f.apply(this,a.concat([arguments]))}})')(
      Function(
        arrContextVars.join(','),
        'return(function(' + arrArgs.join(',') + '){' + strBody + '}).apply(this,arguments[arguments.length-1])'
      ),
      arrContextArgs
    );
  }

  // isSpace() & isWhitespace() - http://yourjs.com/snippets/124
  var isSpace = isRegExpMatch(/[ \xA0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/),
      isWhitespace = isRegExpMatch(/[\t-\r\x1C- \u1680\u180E\u2000-\u200A\u2028\u2029\u205F\u3000]/);

  // factorial() - http://yourjs.com/snippets/125
  function factorial(x) {
    if (isNaN(x = Math.floor(x, 10)) || x < 0) {
      throw new Error('Factorial can only be found for values greater than 0');
    }
    return x < 171 ? x > 1 ? factorial(x - 1) * x : x : (1 / 0);
  }

  // compare() & sort() - http://yourjs.com/snippets/126
  function compare(a, b) {
    return a !== b ? a > b ? 1 : -1 : 0;
  }
  
  function sort(arr, opt_comparer, opt_valueProcessor) {
    opt_comparer = opt_comparer || compare;
    var arrPre = slice(arr);
    if (opt_valueProcessor) {
      for (var arr2 = [], l = arrPre.length, i = l; i--; ) {
        arrPre[i] = { i: i, v: opt_valueProcessor(arrPre[i]) };
      }
      arrPre.sort(function(a, b) {
        return opt_comparer.call(this, a.v, b.v);
      });
      ;
      for (i = 0; i < l; i++) {
        arr2[i] = arr[arrPre[i].i];
      }
      return arr2;
    }
    return slice(arr).sort(opt_comparer);
  }

  // on0() - Determine When Multiple Asynchronous Calls Are Done - http://yourjs.com/snippets/128
  function on0(callback, opt_initial) {
    var positiveCallCount = 0, value = opt_initial || 0;
    return function(increment) {
      increment = ('boolean' == typeof increment || increment === undefined) ? increment ? 1 : -1 : +increment || 0;
      value += increment;
      if (increment > 0) {
        positiveCallCount++;
      }
      if (!value) {
        callback(positiveCallCount);
      }
      return value;
    };
  }
  
  (function(__prototype__, __k__) {
    for (__k__ in YourJS) {
      (function(k, v) {
        if (has(YourJS, k) && typeOf(v, 'Function') && k != 'JS') {
          __prototype__[k] = function() {
            return new YourJS(v.apply(this, [this.$].concat(slice(arguments))));
          };
        }
      })(__k__, YourJS[__k__]);
    }
    __prototype__._ = function() {
      return new YourJS(slice(arguments).concat([this.$], this.$$), 1);
    };
  })(extend(YourJS, {
    typeOf: typeOf,
    alias: alias,
    has: has,
    slice: slice,
    extend: extend,
    identity: identity,
    isArrayLike: isArrayLike,
    toArray: toArray,
    pull: pull,
    walk: walk,
    getSimpleCallback: getSimpleCallback,
    quoteRegExp: quoteRegExp,
    flagRegExp: flagRegExp,
    reduce: reduce,
    indexOf: indexOf,
    filter: filter,
    parseQS: parseQS,
    isEmpty: isEmpty,
    isFalsy: isFalsy,
    v1: v1,
    isValidVarName: isValidVarName,
    isRegExpMatch: isRegExpMatch,
    isClass: isClass,
    sub: sub,
    getCookie: getCookie,
    removeCookie: removeCookie,
    setCookie: setCookie,
    limit: limit,
    css: css,
    random: random,
    includes: includes,
    htmlify: htmlify,
    partial: partial,
    setArgs: setArgs,
    rearg: rearg,
    get: get,
    set: set,
    cap: cap,
    restParam: restParam,
    entries: entries,
    keys: keys,
    values: values,
    put: put,
    param: param,
    titleCase: titleCase,
    intersect: intersect,
    subtract: subtract,
    union: union,
    uniquify: uniquify,
    jsonp: jsonp,
    escape: escape,
    unescape: unescape,
    replace: replace,
    nthRoot: nthRoot,
    isoDate: isoDate,
    isPrimitive: isPrimitive,
    isFloat: isFloat,
    isInt: isInt,
    swapCase: swapCase,
    getTimeAgo: getTimeAgo,
    frac: frac,
    trunc: trunc,
    isSafeInt: isSafeInt,
    isNaN: isNaN,
    isFinite: isFinite,
    dice: dice,
    join: join,
    debounce: debounce,
    randomize: randomize,
    dom: dom,
    reParam: reParam,
    postURL: postURL,
    doEvery: doEvery,
    fuse: fuse,
    check: check,
    map: map,
    findIndex: findIndex,
    flatten: flatten,
    copyArray: copyArray,
    nth: nth,
    setDefaults: setDefaults,
    range: range,
    gcd: gcd,
    lcm: lcm,
    matchAll: matchAll,
    padEnd: padEnd,
    padStart: padStart,
    trim: trim,
    trimLeft: trimLeft,
    trimRight: trimRight,
    splitLines: splitLines,
    formatDate: formatDate,
    now: now,
    create: create,
    is: is,
    log: log,
    pop: pop,
    push: push,
    spread: spread,
    isComposite: isComposite,
    isPrime: isPrime,
    offsetDate: offsetDate,
    fill: fill,
    time: time,
    indexBy: indexBy,
    compact: compact,
    ordinalize: ordinalize,
    getViewportSize: getViewportSize,
    toggle: toggle,
    nthIndexOf: nthIndexOf,
    addTypeOf: addTypeOf,
    inherit: inherit,
    parseURL: parseURL,
    frexp: frexp,
    ldexp: ldexp,
    max: max,
    min: min,
    sum: sum,
    splice: splice,
    degrees: degrees,
    radians: radians,
    clamp: clamp,
    throttle: throttle,
    callReturn: callReturn,
    unnest: unnest,
    ids: ids,
    curry: curry,
    rcurry: rcurry,
    isNumeric: isNumeric,
    count: count,
    mod: mod,
    apply: apply,
    call: call,
    endsWith: endsWith,
    startsWith: startsWith,
    deburr: deburr,
    isError: isError,
    isNil: isNil,
    indexOfDiff: indexOfDiff,
    unwrap: unwrap,
    wrap: wrap,
    construct: construct,
    func: func,
    isSpace: isSpace,
    isWhitespace: isWhitespace,
    factorial: factorial,
    compare: compare,
    sort: sort,
    on0: on0,
    JS: __global.JS
  }).prototype);
  
  // Add to browser/node environment correctly.
  if(typeof exports !== 'undefined') {
    if(typeof module !== 'undefined' && module.exports) {
      exports = module.exports = YourJS;
    }
    (exports.JS = YourJS).JS = undefined;
  } 
  else {
    __global.JS = YourJS;
  }
})('undefined' == typeof window ? this : window, {}, []);