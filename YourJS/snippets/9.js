storeSnippet({"id":9,"name":"includes()","description":"Determines if a target is found in the Array or string.","js":"function includes(obj, target, opt_fromIndex) {\r\n  var index = indexOf(obj, target, opt_fromIndex);\r\n  return index !== -1 && index != undefined;\r\n}","post":"In ECMAScript 6 `Array.prototype.includes()` and `String.prototype.includes()` have been added.  The functions are to be used to determine if a `target` is found in the `Array` or `string`.  As is evident, not all environments will have these functions defined.  Fortunately, since this is a snippet, now you can use a similar function in YourJS.  The main difference is that `YourJS.includes()` will also search object property values.\r\n\r\n<h2>Parameters<\/h2>\r\n<ol>\r\n    <li>\r\n        <b><code>obj<\/code> {Array|Object|string}:<\/b><br \/>\r\n        The array, object or string to be searched.\r\n    <\/li>\r\n    <li>\r\n        <b><code>target<\/code> {*}:<\/b><br \/>\r\n        The value to be searched for within <code>obj<\/code>.\r\n    <\/li>\r\n    <li>\r\n        <b><code>opt_fromIndex<\/code> {number}:<\/b><br \/>\r\n        Optional.  Defaults to <code>0<\/code>.  When searching an array or a string, this is indicates the starting index in the search.  When searching an array, a negative value will start that many positions from the end.\r\n    <\/li>\r\n<\/ol>\r\n\r\n<h3>Return<\/h3>\r\n<div>If <code>target<\/code> is found in <code>obj<\/code>, <code>true<\/code> will be returned.  Otherwise <code>false<\/code> is returned.<\/div>","required_ids":{"8":"indexOf()"},"tags":["Array","String"],"variables":["includes"]});