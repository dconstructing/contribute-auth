var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var request = require('request');

var config = require('./config');

var app = express();
app.use(bodyParser.json()); // for parsing application/json

var corsOptions = {
	origin: true
}

app.options('/exchange/github', cors(corsOptions)); // enable pre-flight request for POST request
app.post('/exchange/github', cors(corsOptions), function (req, res) {
	if (req.body.code) {
		var url = 'https://github.com/login/oauth/access_token';
		url += '?client_id=' + config.auth.github.clientId;
		url += '&client_secret=' + config.auth.github.clientSecret;
		url += '&code=' + req.body.code;
		request.post({
			url: url,
			method: 'POST',
			headers: {
				'Accept': 'application/json'
			},
		}, function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var info = JSON.parse(body);
				res.json({
					token: info.access_token
				});
			} else {
				console.log('error', error, body);
				res.status(500).send('Internal Server Error');
			}
		});
	} else {
		res.status(400).send('Bad Request');
	}
});

app.listen(config.server.port, function () {
	console.log('Example app listening on port %d!', config.server.port);
});
