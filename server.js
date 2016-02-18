var express = require('express');
var config = require('./config');

var app = express();

app.get('/exchange/github', function (req, res) {
  res.send('Hello World!');
});

app.listen(config.server.port, function () {
  console.log('Example app listening on port %d!', config.server.port);
});
