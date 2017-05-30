storeSnippet({"id":36,"name":"Simple Trigonometric Functions","description":"Simple trigonometric functions with the option to specify the value in degrees or radians:  cosine, sine, tangent, cosecant, contangent, and secant.","js":"'seccos;cscsin;cottan;'.replace(\/(...)(?=(...)?;)\/g, function(m, name, base, fn) {\r\n  YourJS[name] = Function('a','b',fn = 'return ' + (base ? '1\/' : '') + 'Math.' + (base || name) + '(b?a*'+Math.PI\/180+':a);');\r\n});","post":"In JavaScript we already have `Math.cos()`, `Math.sin()` and `Math.tan()`.  What we don't have is `Math.sec()`, `Math.csc()` and `Math.cot()`.  I'm guessing the reason those reciprocal functions are not included is because all that is required is to literally find the reciprocal of their identical functions.  Still, it would be nice to have them, right?  Also, it would be nice to specify for all of these functions whether or not to interpret the passed in argument as degrees or radians.  Having all those in mind, I wrote this snippet which defines:\r\n\r\n* `YourJS.cos(angle, opt_usingDegrees)`\r\n* `YourJS.sin(angle, opt_usingDegrees)`\r\n* `YourJS.tan(angle, opt_usingDegrees)`\r\n* `YourJS.sec(angle, opt_usingDegrees)`\r\n* `YourJS.csc(angle, opt_usingDegrees)`\r\n* `YourJS.cot(angle, opt_usingDegrees)`\r\n\r\n<h2><code>cos(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines the cosine of a given number either in radians or in degrees.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>angle<\/code> {number}:<\/b><br \/>\r\n      The angle whose cosine value should be returned.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_usingDegrees<\/code> {boolean}:<\/b><br \/>\r\n      Optional.  Defaults to <code>false<\/code>.  If <code>true<\/code> then <code>angle<\/code> will be interpreted in degrees, otherwise <code>angle<\/code> will be interpreted in radians.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns the cosine of <code>angle<\/code> in radians by default, but if <code>opt_usingDegrees<\/code> is a <code>true<\/code>-ish value then the cosine of <code>angle<\/code> in degrees will be returned.<\/div>\r\n<\/div>\r\n\r\n<h2><code>sin(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines the sine of a given number either in radians or in degrees.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>angle<\/code> {number}:<\/b><br \/>\r\n      The angle whose sine value should be returned.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_usingDegrees<\/code> {boolean}:<\/b><br \/>\r\n      Optional.  Defaults to <code>false<\/code>.  If <code>true<\/code> then <code>angle<\/code> will be interpreted in degrees, otherwise <code>angle<\/code> will be interpreted in radians.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns the sine of <code>angle<\/code> in radians by default, but if <code>opt_usingDegrees<\/code> is a <code>true<\/code>-ish value then the sine of <code>angle<\/code> in degrees will be returned.<\/div>\r\n<\/div>\r\n\r\n<h2><code>tan(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines the tangent of a given number either in radians or in degrees.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>angle<\/code> {number}:<\/b><br \/>\r\n      The angle whose tangent value should be returned.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_usingDegrees<\/code> {boolean}:<\/b><br \/>\r\n      Optional.  Defaults to <code>false<\/code>.  If <code>true<\/code> then <code>angle<\/code> will be interpreted in degrees, otherwise <code>angle<\/code> will be interpreted in radians.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns the tangent of <code>angle<\/code> in radians by default, but if <code>opt_usingDegrees<\/code> is a <code>true<\/code>-ish value then the tangent of <code>angle<\/code> in degrees will be returned.<\/div>\r\n<\/div>\r\n\r\n<h2><code>sec(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines the secant of a given number either in radians or in degrees.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>angle<\/code> {number}:<\/b><br \/>\r\n      The angle whose secant value should be returned.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_usingDegrees<\/code> {boolean}:<\/b><br \/>\r\n      Optional.  Defaults to <code>false<\/code>.  If <code>true<\/code> then <code>angle<\/code> will be interpreted in degrees, otherwise <code>angle<\/code> will be interpreted in radians.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns the secant of <code>angle<\/code> in radians by default, but if <code>opt_usingDegrees<\/code> is a <code>true<\/code>-ish value then the secant of <code>angle<\/code> in degrees will be returned.<\/div>\r\n<\/div>\r\n\r\n<h2><code>csc(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines the cosecant of a given number either in radians or in degrees.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>angle<\/code> {number}:<\/b><br \/>\r\n      The angle whose cosecant value should be returned.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_usingDegrees<\/code> {boolean}:<\/b><br \/>\r\n      Optional.  Defaults to <code>false<\/code>.  If <code>true<\/code> then <code>angle<\/code> will be interpreted in degrees, otherwise <code>angle<\/code> will be interpreted in radians.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns the cosecant of <code>angle<\/code> in radians by default, but if <code>opt_usingDegrees<\/code> is a <code>true<\/code>-ish value then the cosecant of <code>angle<\/code> in degrees will be returned.<\/div>\r\n<\/div>\r\n\r\n<h2><code>cot(...)<\/code> API Documentation<\/h2>\r\n<div style=\"margin: 0 30px 30px;\">\r\n  <h3>Description<\/h3>\r\n  <div>Determines the cotangent of a given number either in radians or in degrees.<\/div>\r\n  \r\n  <h3>Parameters<\/h3>\r\n  <ol>\r\n    <li>\r\n      <b><code>angle<\/code> {number}:<\/b><br \/>\r\n      The angle whose cotangent value should be returned.\r\n    <\/li>\r\n    <li>\r\n      <b><code>opt_usingDegrees<\/code> {boolean}:<\/b><br \/>\r\n      Optional.  Defaults to <code>false<\/code>.  If <code>true<\/code> then <code>angle<\/code> will be interpreted in degrees, otherwise <code>angle<\/code> will be interpreted in radians.\r\n    <\/li>\r\n  <\/ol>\r\n  \r\n  <h3>Returns<\/h3>\r\n  <div>Returns the cotangent of <code>angle<\/code> in radians by default, but if <code>opt_usingDegrees<\/code> is a <code>true<\/code>-ish value then the cotangent of <code>angle<\/code> in degrees will be returned.<\/div>\r\n<\/div>","required_ids":{},"tags":["Math","Number"],"variables":["cos","cot","csc","sec","sin","tan"]});