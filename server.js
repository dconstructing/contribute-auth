var express = require('express');
var app = express();

app.get('/exchange/github', function (req, res) {
  res.send('Hello World!');
});

app.listen(3080, function () {
  console.log('Example app listening on port 3000!');
});
