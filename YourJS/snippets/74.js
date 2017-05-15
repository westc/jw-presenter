storeSnippet({"id":74,"name":"Pushing & Popping from Arrays","description":"Allows pushing and popping on arrays at specific indices.","js":"function push(array, value, opt_index) {\r\n  opt_index == undefined ? array.push(value) : array.splice(opt_index, 0, value);\r\n  return array;\r\n}\r\n\r\nfunction pop(array, opt_index) {\r\n  return array.splice(opt_index == undefined ? -1 : opt_index, 1)[0];\r\n}","post":"<h2><code>push(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px\">\r\n  <div>Adds a value to an array while returning the array afterwards.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>array<\/code> {Array}:<\/b><br \/>\r\n      Array to add the value to.\r\n    <\/li>\r\n    <li>\r\n      <b><code>value<\/code> {*}:<\/b><br \/>\r\n      The value to be added to <code>array<\/code>.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_index<\/code> {number=}:<\/b><br \/>\r\n      Optional.  Defaults to <code class=\"language-javascript\">array.length<\/code>.  The index at which <code>value<\/code> should be inserted into <code>array<\/code>.  If it is less than 0 the index will be determined by counting from the end of <code>array<\/code>.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns <code>array<\/code> after adding <code>value<\/code> to it.<\/div>\r\n<\/div>\r\n\r\n<h2><code>pop(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px\">\r\n  <div>Removes a value from an array while returning the array afterwards.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>array<\/code> {Array}:<\/b><br \/>\r\n      Array to remove a value from.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_index<\/code> {number=}:<\/b><br \/>\r\n      Optional.  Defaults to <code class=\"language-javascript\">array.length - 1<\/code>.  The index of the value in <code>array<\/code> that is to be removed.  If it is less than 0 the index will be determined by counting from the end of <code>array<\/code>.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns <code>array<\/code> after removing a value from it.<\/div>\r\n<\/div>","required_ids":{},"tags":["Array"],"variables":["pop","push"]});