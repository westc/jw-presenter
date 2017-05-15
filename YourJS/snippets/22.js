storeSnippet({"id":22,"name":"titleCase() - Title Casing Strings","description":"Capitalizes the first letter of each word in a string.  Also commonly known as toProperCase().","js":"var titleCase;\r\n(function(RGX_WORD) {\r\n  titleCase = function (str, opt_fnFilter) {\r\n    return str.replace(RGX_WORD, function(word, start, rest, index) {\r\n      return (!opt_fnFilter || opt_fnFilter(word, index, str) ? start.toUpperCase() : start) + rest;\r\n    });\r\n  };\r\n})(\/(\\S)((?:\\B\\S)*)\/g);","post":"In some JavaScript libraries this function is known as `String.prototype.toProperCase()`, but seeing as how I am getting away from modifying native prototypes I decided to also change the number from <i>\"proper case\"<\/i> to <i>\"title case\"<\/i>.  In addition, this function does a little more because it gives you the ability to define a filtering function to filter out any words that you may not want to title case.\r\n\r\n<h2><code>titleCase(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Capitalizes the first letter of each word in a string.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>str<\/code> {String}:<\/b><br \/>\r\n      The string which will be title cased.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_fnFilter<\/code> {function(word, position, originalString) -> boolean}:<\/b><br \/>\r\n      Optional.  If specified, this function will be passed every word (along with the position and the originalString) and should return <code>true<\/code> if the word should be title cased, otherwise <code>false<\/code> should be returned.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns <code>str<\/code> with all of the 1st letter of each word capitalized (unless filtered out by <code>opt_fnFilter<\/code>).<\/div>\r\n  \r\n  <h3>Examples<\/h3>\r\n  <pre class=\"language-javascript\"><code>console.log(YourJS.titleCase('hello'));          \/\/ -> 'Hello'\r\nconsole.log(YourJS.titleCase('hello world!!!')); \/\/ -> 'Hello World!!!'\r\nconsole.log(YourJS.titleCase('u.s.a.'));         \/\/ -> 'U.S.A.'<\/code><\/pre>\r\n<\/div>","required_ids":{},"tags":["String"],"variables":["titleCase"]});