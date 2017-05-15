storeSnippet({"id":38,"name":"frac() - Fractional Part of a Number","description":"Gets the fractional part of a number, removing the integral part.","js":"var frac;\r\n(function(RGX) {\r\n  frac = function(num) {\r\n    return +(+num).toExponential().replace(RGX, function(m, neg, num, dot, offset) {\r\n      var zeroes = Array(Math.abs(offset) + 2).join('0');\r\n      num = (zeroes + num + (dot ? '' : '.') + zeroes).split('.');\r\n      return +(neg + '.' + num.join('').slice(+offset + num[0].length));\r\n    });\r\n  };\r\n})(\/(-?)(\\d+(\\.?)\\d*)e(.+)\/);","post":"This snippet gives us the ability to get the fractional part of a number.  In other words, it will give you the part of the number after the decimal point, keeping the sign of the number.\r\n\r\n<h2><code>frac(num)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>num<\/code> {number}:<\/b><br \/>\r\n      The number from which the fractional part will be pulled.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns <code>num<\/code> without the integral part while keeping the sign.<\/div>\r\n<\/div>","required_ids":{},"tags":["Number"],"variables":["frac"]});