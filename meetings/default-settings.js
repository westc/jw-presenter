module.exports = {
  "properties": [
    {
      "id": "presenter-css",
      "name": "Display CSS",
      "value": ".body {\n  background: #000;\n  transition: 1s ease background;\n}\n\n.year-text-wrap {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  background-color: #FFF;\n}\n.year-text-wrap > div {\n  display: table;\n  height: 100%;\n  width: 100%;\n}\n.year-text-wrap > div > div {\n  display: table-cell;\n  vertical-align: middle;\n  text-align: center;\n}\n.year-text-wrap > div > div > div {\n  font-family: Serif;\n  font-size: 150px;\n  color: rgb(153,153,153);\n  box-shadow: 0 0 5px 2px rgba(153,153,153,0.7);\n  border-radius: 0.25em;\n  padding: 0.25em 1em;\n  display: inline-block;\n}\n.year-text-wrap .line1 {\n  font-size: 0.75em;\n  line-height: 0.825em;\n}\n.year-text-wrap .line2 {\n  font-size: 1em;\n  line-height: 1em;\n}\n.year-text-wrap .line3 {\n  font-size: 0.425em;\n  line-height: 1.375em;\n}\n\nhr {\n  border-style: dotted;\n  border-width: 2px;\n}\n.body.showing-lyrics {\n  background: linear-gradient(45deg, #2E6A97 0%, #73B7E5 50%, #5BA7B3 100%);\n  background-attachment: fixed;\n}\n\n.song-wrap {\n  font-family: \"Trebuchet MS\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  overflow: hidden;\n  transition: 0.1s linear top,\n              1s ease opacity;\n}\n.song-wrap > .heading-wrap {\n  margin: 2em 3em;\n  padding: 1em;\n  background-color: rgba(255,255,255,0.2);\n  border-radius: 1em;\n  box-shadow:\n    0 0 0.1em 0.05em #000,\n    inset 0.2em 0.2em 0.5em #FFF,\n    inset -0.1em -0.1em 0.5em #000;\n}\n.song-wrap > .heading-wrap > .song-number {\n  text-align: center;\n  font-size: 4vw;\n  font-weight: bold;\n  color: #032B41;\n  text-shadow:\n    0 0 0.2em,\n    0 0 0.1em #FFF,\n    0 0 0.1em #FFF,\n    0 0 0.1em #FFF;\n}\n.song-wrap > .heading-wrap > .title {\n  text-align: center;\n  font-size: 7vw;\n  font-weight: bold;\n  color: #8A3729;\n  text-shadow:\n    0 0 0.2em,\n    0 0 0.1em #FFF,\n    0 0 0.1em #FFF,\n    0 0 0.1em #FFF;\n}\n.song-wrap > .heading-wrap > .theme-text {\n  text-align: center;\n  font-size: 3vw;\n  color: #134561;\n}\n.song-wrap > .lyrics-table {\n  display: table;\n  padding: 0 1em;\n  line-height: 2em;\n  font-family: \"Trebuchet MS\";\n  box-sizing: border-box;\n}\n.song-wrap > .lyrics-table > .stanza {\n  display: table-row;\n}\n.song-wrap > .lyrics-table > .stanza > .number-cell {\n  display: table-cell;\n  vertical-align: top;\n  text-align: right;\n}\n.song-wrap > .lyrics-table > .stanza > .lines-cell {\n  display: table-cell;\n  vertical-align: top;\n  padding-left: 0.5em;\n  box-sizing: border-box;\n}\n.song-wrap > .lyrics-table > .stanza > .lines-cell > .line {\n  box-sizing: border-box;\n  white-space: nowrap;\n}\n\n.music-presenter-bg {\n  filter: blur(20px);\n  background-position: center;\n  background-size: cover;\n  transition: 1s ease all;\n}\n.music-presenter .image {\n  box-shadow: inset 0 0 10px #000, 0 0 10px #000;\n  transition: 1s ease all;\n  background-position: center;\n  background-repeat: no-repeat;\n}\n.music-presenter-details > .time {\n  position: absolute;\n  right: 1em;\n  top: 1em;\n  padding: 0.5em;\n  background: rgba(0,0,0,0.5);\n  color: rgba(255,255,255,0.5);\n  border-radius: 0.5em;\n  transition: 1s ease all;\n  font-size: 2em;\n}",
      "type": "css",
      "selectors": [
        {
          "selector": ".body",
          "text": "Entire page on which the media is being displayed."
        }
      ]
    },
    {
      "id": "get-jw-library-lyrics-page-url",
      "name": "Get Online JW Library Lyrics Page URL",
      "value": "// eg. https://wol.jw.org/en/wol/dsync/r1/lp-e/r4/lp-s/1102009094\nreturn `https://wol.jw.org/en/wol/dsync/r1/lp-e/${rsconf}/${lib}/${pubCode}`;",
      "type": "function",
      "arguments": [
        {
          "name": "songNumber",
          "type": "number",
          "text": "The number of the song in the song book."
        },
        {
          "name": "rsconf",
          "type": "string",
          "text": "A code found in the URL which is the letter \"r\" followed by an integer. (eg. \"r5\" which comes from the Portuguese URL at https://wol.jw.org/pt/wol/h/r5/lp-t)"
        },
        {
          "name": "lib",
          "type": "string",
          "text": "A code found in the URL which starts off with \"lp-\" followed by one or more leters representing the language. (eg. \"lp-t\" which comes from the Portuguese URL at https://wol.jw.org/pt/wol/h/r5/lp-t)"
        },
        {
          "name": "pubCode",
          "type": "string",
          "text": "A code representing the publication in the base language as found on the online JW Library."
        }
      ],
      "return": {
        "type": "string",
        "text": "The Online JW Library URL for the song."
      }
    },
    {
      "id": "jw-library-languages-page",
      "name": "JW Library Languages Page URL",
      "value": "https://wol.jw.org/es/wol/li/r5/lp-t",
      "type": "url"
    },
    {
      "id": "parse-bible-from-wol",
      "name": "Parse Bible From Watchtower Online Library",
      "value": "var bible = {};\n\nvar processor = {\n  active: false,\n  urls: [],\n  parsers: [],\n  extraArgs: [],\n  queue: function(url, parser) {\n    this.urls.push(url);\n    this.parsers.push(parser);\n    this.extraArgs.push([].slice.call(arguments, 2));\n    if (!this.active) {\n      this.process();\n    }\n  },\n  process: function() {\n    var me = this;\n    me.active = true;\n\n    var url = me.urls.shift();\n    var parser = me.parsers.shift();\n    var extraArgs = me.extraArgs.shift();\n\n    $.ajax({\n      url: url,\n      success: function(data) {\n        try {\n          parser.apply({url,data}, [$(data)].concat(extraArgs));\n          if (me.urls.length) {\n            me.process();\n          }\n          else {\n            onDone.call(url, true, bible);\n          }\n        }\n        catch (e) {\n          onDone.apply(url, [false, e].concat(extraArgs));\n          me.active = false;\n        }\n      }\n    });\n  }\n};\n\nfunction parseWOL(jHTML) {\n  var bibleHREF = jHTML.find('#menuBible a').attr('href');\n  if (bibleHREF) {\n    processor.queue(replaceDomain(bibleHREF, wolURL), parseBible);\n  }\n  else {\n    throw new Error('No Bible found for this library.');\n  }\n}\n\nfunction parseBible(jHTML) {\n  var jPubYear = jHTML.find('#pubYear');\n  if (jPubYear.length) {\n    bible.year = +jPubYear.text();\n  }\n  var jLocale = jHTML.find('#locale');\n  if (jLocale.length) {\n    bible.localw = jLocale.text();\n  }\n  var jEngSym = jHTML.find('#englishSym');\n  if (jEngSym.length) {\n    bible.engSym = jEngSym.text();\n  }\n  var jRsconf = jHTML.find('#rsconf');\n  if (jRsconf.length) {\n    bible.rsconf = jRsconf.text();\n  }\n  var jLibLang = jHTML.find('#libLang');\n  if (jLibLang.length) {\n    bible.lang = jLibLang.text();\n  }\n  var jHebrew = jHTML.find('.books.hebrew');\n  var books = [];\n  if (jHebrew.length) {\n    bible.hebrew = {\n      heading: jHebrew.find('.group').text(),\n      books: jHebrew.find('.book a').toArray().map(function(el) {\n        return {\n          url: replaceDomain($(el).attr('href'), wolURL),\n          name: $('.name', el).text(),\n          abbr: $('.abbreviation', el).text(),\n          id: $(el).data('bookid')\n        };\n      })\n    };\n    books = books.concat(bible.hebrew.books);\n  }\n  var jGreek = jHTML.find('.books.greek');\n  if (jGreek.length) {\n    bible.greek = {\n      heading: jGreek.find('.group').text(),\n      books: jGreek.find('.book a').toArray().map(function(el) {\n        return {\n          url: replaceDomain($(el).attr('href'), wolURL),\n          name: $('.name', el).text(),\n          abbr: $('.abbreviation', el).text(),\n          id: $(el).data('bookid')\n        };\n      })\n    };\n    books = books.concat(bible.greek.books);\n  }\n\n  if (books.length) {\n    for (var book; book = books.shift();) {\n      processor.queue(book.url, parseBook, book);\n    }\n  }\n  else {\n    throw new Error('Neither hebrew nor greek books found.');\n  }\n}\n\nfunction parseBook(jHTML, book) {\n  book.chapters = jHTML.find('.chapters .chapter a').toArray().map(function(el, i) {\n    var url = replaceDomain(el.href, wolURL);\n    var chapter = {\n      url: url,\n      num: $(el).text()\n    };\n    processor.queue(url, parseChapter, chapter, book, i);\n    return chapter;\n  });\n}\n\nfunction parseChapter(jHTML, chapter, book, chapterIndex) {\n  if (!jHTML[0].hasOwnProperty('nodeType') && jHTML[0].content) {\n    jHTML = $('<div>' + jHTML[0].content + '</div>');\n  }\n  var sel = 'v' + book.id + '-' + (chapterIndex + 1) + '-';\n  var pSel = 'p:has(>[id^=' + sel + '])';\n  var vSel = '[id^=' + sel + ']';\n  var verses = chapter.verses = [], currVerseIndex = -1, verse;\n  var j = jHTML.find(pSel).find('a').remove().end().each(function(pi, p) {\n    $(p).find(vSel).each(function(i, el) {\n      var verseIndex = (el.id.match(/v\\d+-\\d+-(\\d+)-\\d+/) || [])[1];\n      if (verseIndex != currVerseIndex) {\n        currVerseIndex = verseIndex;\n        verses.push(verse = {\n          t: ((pi && !i) ? '\\n' : '') + $(el).text().replace(/^[\\s\\xA0]*\\d+[\\s\\xA0]*/, '').trim()\n        });\n    if (verseIndex == '0') {\n      verse.heading = true;\n        }\n      }\n      else {\n        verse.t += '\\n' + $(el).text().trim();\n      }\n    });\n  });\n\n  if (!verses.length) {\n    console.error(this, jHTML);\n    throw new Error('No contents found for ' + book.name + ' ' + chapter.num + '.');\n  }\n\n  if (verses[0].heading) {\n    chapter.heading = verses.shift().t;\n  }\n\n  verses.forEach(function(verse, i) {\n    verses[i] = verse.t;\n  });\n}\n\nfunction replaceDomain(url, domainURL) {\n  return domainURL.replace(/(^\\w*:\\/+[^\\/]+)[\\s\\S]+$/, '$1') + url.replace(/^\\w*:\\/+[^\\/]+/, '');\n}\n\nprocessor.queue(wolURL, parseWOL);",
      "type": "function",
      "arguments": [
        {
          "name": "wolURL",
          "type": "string",
          "text": "URL of the Watchtower Online Library being used to parse the Bible."
        },
        {
          "name": "onDone",
          "type": "function(success: boolean, results: *)",
          "text": "Function called once all of the Bible has been parsed or when an error occurs.  The first parameter passed will indicate if the Bible was successfully parsed.  The second parameter will indicate the results."
        }
      ]
    },
    {
      "id": "parse-bible-books-page",
      "name": "Parse Online JW Library Bible Books Page",
      "value": "var result = {}, jMaster = jQuery(html);\n[\n  { sel: '.hebrew, .hebrewOnly', id: 'hebrew', count: 39 },\n  { sel: '.greek, .greekOnly', id: 'greek', count: 27 }\n].forEach(({ sel, id, count}) => {\n  jMaster.find(`.bible .books:not(:not(${sel}))`).each((i, elem) => {\n    var hebrewTitle = jQuery('.group:eq(0)', elem).text();\n    var anchors = jQuery('a[data-bookid]:not(:has(a[data-bookid]))', elem).toArray();\n    if (hebrewTitle && anchors.length == count) {\n      var lastURL = anchors[anchors.length - 1].href;\n      result[id] = {\n        title: hebrewTitle,\n        names: anchors.map(a => jQuery('.name', a).text()),\n        abbreviations: anchors.map(a => jQuery('.abbreviation', a).text()),\n        urls: anchors.map((a, i) => lastURL.replace(/\\b(39|66)\\b/, i + (count == 39 ? 1 : 40)))\n      };\n    }\n  });\n});\nreturn result;",
      "type": "function",
      "arguments": [
        {
          "name": "html",
          "type": "string",
          "text": "HTML of the Bible books page found on the online JW Library."
        }
      ],
      "return": {
        "type": "{greek: {title: string, urls: Array<string>, names: Array<string>, abbreviations: Array<string>}, hebrew: {title: string, urls: Array<string>, names: Array<string>, abbreviations: Array<string>}}",
        "text": "Object conditionally containing a `hebrew` property outlining the hebrew scriptures' books and a `greek` property outlining the greek scriptures' books."
      }
    },
    {
      "id": "parse-bible-book-page",
      "name": "Parse Online JW Library Bible Book Page",
      "value": "return jQuery(html).find('.bible .chapters .chapter a[href]:not(:has(a[href]))').toArray().map(a => a.href);",
      "type": "function",
      "arguments": [
        {
          "name": "html",
          "type": "string",
          "text": "HTML of the Bible book page found on the online JW Library."
        },
        {
          "name": "bookNumber",
          "type": "number",
          "text": "The number of the book (1 being Genesis, 66 being Revelation, etc.)."
        }
      ],
      "return": {
        "type": "Array<string>",
        "text": "Array of the URLs for all of the chapters in the specified Bible book."
      }
    },
    {
      "id": "parse-bible-chapter-page",
      "name": "Parse Online JW Library Bible Chapter Page",
      "value": "return jQuery(html).find(`.v[id^=v${bookNumber}-${chapterNumber}-]`).toArray().reduce(function(verses, elem) {\n  var text = $(elem).clone().find('*').remove().end().text().trim();\n  if (!/-0-\\d$/.test(elem.id)) {\n    if (/-1$/.test(elem.id)) {\n      verses.push(text);\n    }\n    else {\n      verses[verses.length - 1] += '\\n' + text;\n    }\n  }\n  return verses;\n}, []);",
      "type": "function",
      "arguments": [
        {
          "name": "html",
          "type": "string",
          "text": "HTML of the Bible chapter page found on the online JW Library."
        },
        {
          "name": "bookNumber",
          "type": "number",
          "text": "The number of the book (1 being Genesis, 66 being Revelation, etc.)."
        },
        {
          "name": "chapterNumber",
          "type": "number",
          "text": "The number of the chapter (starting at 1)."
        }
      ],
      "return": {
        "type": "Array<string>",
        "text": "Array of the URLs for all of the chapters in the specified Bible book."
      }
    },
    {
      "id": "parse-jw-library-languages-page",
      "name": "Parse Online JW Library Languages Page",
      "value": "return $(html).find('.completeList a[data-rsconf][data-lib]').map(function(i, e) {\n  var j = $(e), jLang = j.find('[lang]');\n  return {\n    rsconf: j.data('rsconf'),         // eg. \"r5\"\n    lib: j.data('lib'),               // eg. \"lp-t\"\n    name: jLang.eq(0).text().trim(),  // eg. \"Portuguese\"\n    lang: jLang.eq(1).text().trim(),  // eg. \"Português\"\n    locale: j.data('locale')          // eg. \"pt\"\n  };\n}).toArray();",
      "type": "function",
      "arguments": [
        {
          "name": "html",
          "type": "string",
          "text": "HTML of the languages page found on the online JW Library."
        },
        {
          "name": "rsconf",
          "type": "string",
          "text": "A code found in the URL which is the letter \"r\" followed by an integer. (eg. \"r5\" which comes from the Portuguese URL at https://wol.jw.org/pt/wol/h/r5/lp-t)"
        },
        {
          "name": "lib",
          "type": "string",
          "text": "A code found in the URL which starts off with \"lp-\" followed by one or more leters representing the language. (eg. \"lp-t\" which comes from the Portuguese URL at https://wol.jw.org/pt/wol/h/r5/lp-t)"
        }
      ],
      "return": {
        "type": "Array<{rsconf: string, lib: string, name: string, lang: string}>",
        "text": "Array of objects representing all of the languages found on the languages page that you would like to make available for the user to choose from."
      }
    },
    {
      "id": "parse-jw-library-lyrics-page",
      "name": "Parse Online JW Library Lyrics Page",
      "value": "var j = $(html).find('.pub-sn, .pub-snnw');\nvar heading = j.find('.contextTtl').text().trim().replace(/\\xA0/g, ' ');\nvar title = j.find('h1').text().trim().replace(/\\xA0/g, ' ');\nvar theme = j.find('.themeScrp').text().trim().replace(/\\xA0/g, ' ');\nvar stanzas = j.find('.bodyTxt [data-pid]:not(:has([data-pid]))').toArray().reduce(function(stanzas, e, i) {\n  var j = $(e);\n  if (j.hasClass('sl')) {\n    stanzas.push([]);\n  }\n  [...stanzas].pop().push(j.text().trim().replace(/^\\d\\.[\\xA0\\s]+/, '').replace(/\\xA0/g, ' '));\n  return stanzas;\n}, []);\nreturn j[0] && { heading, title, theme, stanzas };",
      "type": "function",
      "arguments": [
        {
          "name": "html",
          "type": "string",
          "text": "HTML of the lyrics page found on the online JW Library."
        }
      ],
      "return": {
        "type": "{heading:string, title:string, theme:string, stanzas:Array<Array<string>>}",
        "text": "An object representing the song.  The `heading` property will be something like \"Song 1\".  The `title` property refers to the title of the song.  The `theme` property refers to the theme text(s).  The `stanzas` property will be an array of arrays of all of the lines in the song."
      }
    },
    {
      "id": "song-randomizer",
      "name": "Song Randomizer",
      "value": "// Make it twice as likely to play a new song as it is to play an old song.\nvar playNewSong = JS.random([true, true, false]);\nvar index = JS.random(songs.reduce(function(carry, song, i) {\n    if (i !== lastSongIndex && (parseInt(song.title.match(/\\d+/)[0], 10) > 135) == playNewSong) {\n        carry.push(i);\n    }\n    return carry;\n}, []));\nreturn index;",
      "type": "function",
      "arguments": [
        {
          "name": "songs",
          "type": "Array",
          "text": "Array of all of the songs.  Each value in the array will be an object that contains the following properties:  title, duration, path."
        },
        {
          "name": "lastSongIndex",
          "type": "number",
          "text": "Index into `songs` indicating the the last song that was played.  This will be `undefined` if a song has not been played since the application was opened."
        }
      ],
      "return": {
        "type": "Object",
        "text": "The selected song object to play."
      }
    },
    {
      "id": "song-title-parser",
      "name": "Song Renamer",
      "value": "return title.replace(/^0*(\\d+)[_ ]/g, '$1 - ').replace(/_/g, ' ');",
      "type": "function",
      "arguments": [
        {
          "name": "path",
          "type": "string",
          "text": "Absolute path to the song file."
        },
        {
          "name": "title",
          "type": "string",
          "text": "Title as found in the metadata or in the file name."
        }
      ],
      "return": {
        "text": "Name of the song as it will appear in the song list.",
        "type": "string"
      }
    },
    {
      "id": "translations",
      "name": "Translations",
      "type": "properties-list",
      "value": [
        {
          "id": "music-tab",
          "label": "\"Music\" Tab",
          "value": "Music"
        },
        {
          "id": "bg-music-button",
          "label": "\"Background Music\" Button",
          "value": "Background Music"
        },
        {
          "id": "play-lyrics-button",
          "label": "\"Play Song with Lyrics\" Button",
          "value": "Play (with Lyrics)"
        },
        {
          "id": "play-song-button",
          "label": "\"Play Song\" Button (for song without lyrics)",
          "value": "Play"
        },
        {
          "id": "show-song-button",
          "label": "\"Show Song\" Button (show song without playing it)",
          "value": "Show"
        },
        {
          "id": "display-directory-button",
          "label": "\"Set Media Directory\" Button",
          "value": "Set Media Directory"
        },
        {
          "id": "dimensions-label",
          "label": "\"Dimensions\" Label",
          "value": "Dimensions"
        },
        {
          "id": "show-image-button",
          "label": "\"Show Image\" Button",
          "value": "Show Image"
        },
        {
          "id": "show-video-button",
          "label": "\"Show Video\" Button",
          "value": "Show Video"
        },
        {
          "id": "video-duration-label",
          "label": "\"Duration\" Label for Videos",
          "value": "Duration"
        },
        {
          "id": "play-video-button",
          "label": "\"Play Video\" Button",
          "value": "Play Video"
        },
        {
          "id": "display-images-tab",
          "label": "\"Images\" Tab",
          "value": "Images"
        },
        {
          "id": "display-videos-tab",
          "label": "\"Videos\" Tab",
          "value": "Videos"
        },
        {
          "id": "display-texts-tab",
          "label": "\"Texts\" Tab",
          "value": "Texts"
        },
        {
          "id": "display-bible-tab",
          "label": "\"Bible\" Tab",
          "value": "Bible"
        },
        {
          "id": "show-text-button",
          "label": "\"Show Text\" Button",
          "value": "Show Text"
        },
        {
          "id": "default-text-button",
          "label": "\"Set Default Text\" Button",
          "value": "Set Default Text"
        },
        {
          "id": "settings-tab",
          "label": "\"Settings\" Tab",
          "value": "Settings"
        },
        {
          "id": "directories-panel",
          "label": "\"Directories\" Panel",
          "value": "Directories"
        },
        {
          "id": "songs-directory-button",
          "label": "\"Set Songs Directory\" Button",
          "value": "Set Songs Directory"
        },
        {
          "id": "music-pics-directory-button",
          "label": "\"Set Music Picture Directory\" Button",
          "value": "Set Music Picture Directory"
        },
        {
          "id": "settings-texts-panel",
          "label": "\"Texts\" Panel (Under Settings Tab)",
          "value": "Texts"
        },
        {
          "id": "lyrics-panel",
          "label": "\"Lyrics\" Panel",
          "value": "Lyrics"
        },
        {
          "id": "properties-panel",
          "label": "\"Properties\" Panel",
          "value": "Properties"
        }
      ]
    }
  ],
  "texts": [
    {
      "text": "<div class=\"year-text-wrap\"><div><div><div>\n<div class=\"line1\">Confía en Jehová</div>\n<div class=\"line2\">y haz el bien</div>\n<div class=\"line3\"><b>&mdash;&mdash;&mdash;&nbsp;</b>(Salmo 37:3)<b>&nbsp;&mdash;&mdash;&mdash;</b></div>\n</div></div></div></div>",
      "name": "2017 Year Text"
    }
  ],
  "displayDir": "",
  "songs": [],
  "defaultTextIndex": 0,
  "collapsibles": {}
};
