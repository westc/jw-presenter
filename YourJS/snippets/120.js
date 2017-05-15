storeSnippet({"id":120,"name":"isValidVarName()","description":"Determine if the specified variable name is a valid one.","js":"function isValidVarName(varName) {\r\n  try {\r\n    Function((varName + '').replace(\/[\\s\\xA0,\\\/]|^$\/g, '.'), '');\r\n    return true;\r\n  }\r\n  catch (e) {\r\n    return false;\r\n  }\r\n}","post":"<h2><code>isValidVarName(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines if a string can be used as a variable name in JavaScript.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li><code>varName<\/code> {string}:<br \/>The string to be tested to see if it is a valid variable name.<\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns <code class=\"language-javascript\">true<\/code> if <code>varName<\/code> is a valid variable name, otherwise <code class=\"language-javascript\">false<\/code> is returned.<\/div>\r\n  \r\n  <h3>Example<\/h3>\r\n  <pre class=\"language-javascript\"><code>console.log(YourJS.isValidVarName(''));          \/\/ -> false\r\nconsole.log(YourJS.isValidVarName('i'));         \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('alpha'));     \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('get2'));      \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('undefined')); \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('null'));      \/\/ -> false\r\nconsole.log(YourJS.isValidVarName('NaN'));       \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('3d'));        \/\/ -> false\r\nconsole.log(YourJS.isValidVarName('_3d'));       \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('_3d\u00e6'));      \/\/ -> true\r\nconsole.log(YourJS.isValidVarName('d,a'));       \/\/ -> false\r\nconsole.log(YourJS.isValidVarName('d a'));       \/\/ -> false<\/code><\/pre>\r\n<\/div>","required_ids":{},"tags":["Boolean"],"variables":["isValidVarName"]});