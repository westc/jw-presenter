storeSnippet({"id":77,"name":"Prime Numbers vs. Composite Numbers","description":"Determine whether a number is a prime integer or a composite integer or neither.","js":"function isPrime(num) {\r\n  if(!isSafeInt(num)) {\r\n    throw new TypeError(\"expected a finite integer\");\r\n  }\r\n  if(num < 2) {\r\n    return false;\r\n  }\r\n  if(num < 4) {\r\n    return true;\r\n  }\r\n  if(num % 2 == 0 || num % 3 == 0) {\r\n    return false;\r\n  }\r\n  for(var max = parseInt(Math.sqrt(num)) + 2, check = 6; check <= max; check += 6) {\r\n    if(num % (check - 1) == 0 || num % (check + 1) == 0) {\r\n      return false;\r\n    }\r\n  }\r\n  return true;\r\n}\r\n\r\nfunction isComposite(num) {\r\n  return num > 1 && !isPrime(num);\r\n}","post":" <h2><code>isPrime(...)<\/code> API Documentation<\/h2>\r\n <div style=\"margin: 0 30px 30px\">\r\n   <h3>Description<\/h3>\r\n   <div>Determines whether or not a number is a prime integer, meaning that it is an integer greater than 2 which is not evenly divisible by any number other than 1 and itself.<\/div>\r\n   \r\n   <h3>Parameters<\/h3>\r\n   <ol>\r\n     <li>\r\n       <b><code>num<\/code> {number}:<\/b><br \/>\r\n       The number to test for integer primality.\r\n     <\/li>\r\n   <\/ol>\r\n   \r\n   <h3>Returns<\/h3>\r\n   <div>Returns <code>true<\/code> if <code>num<\/code> is a positive integer which is not evenly divisible by any other numbers other than <code>1<\/code> and itself.  In all other cases <code>false<\/code> is returned.  NOTE:  <code>1<\/code> is neither considered prime nor composite.<\/div>\r\n <\/div>\r\n \r\n  <h2><code>isComposite(...)<\/code> API Documentation<\/h2>\r\n <div style=\"margin: 0 30px 30px\">\r\n   <h3>Description<\/h3>\r\n   <div>Determines whether or not a number is a positive integer which is not prime.<\/div>\r\n   \r\n   <h3>Parameters<\/h3>\r\n   <ol>\r\n     <li>\r\n       <b><code>num<\/code> {number}:<\/b><br \/>\r\n       The number to test to see if it is a composite integer.\r\n     <\/li>\r\n   <\/ol>\r\n   \r\n   <h3>Returns<\/h3>\r\n   <div>Returns <code>true<\/code> if <code>num<\/code> is a positive integer which is evenly divisible by a number besides <code>1<\/code> and itself.  In all other cases <code>false<\/code> is returned.  NOTE:  <code>1<\/code> is neither considered prime nor composite.<\/div>\r\n <\/div>","required_ids":{},"tags":["Boolean","Math","Number","Type Checking"],"variables":["isComposite","isPrime"]});