var Backendless = require('backendless');
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

Backendless.initApp(config.baas.backendless.appId, config.baas.backendless.secretKey, config.baas.backendless.version);

Backendless.UserService.login('auth@dconstructing.com', 'nothing', true, new Backendless.Async(function(data) {
	console.log('logged in', data);
}, function(error) {
	console.error('error logging in', error);
}));

function Repositories(args) {
	args = args || {};
	this.name = args.name || 'Default name';
	this.description = args.description || 'No Description';
	this.url = args.url;
}
var dataStore = Backendless.Persistence.of(Repositories);

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

var determineOwnership = function(token, repo, callback) {
	request.get({
		url: 'https://api.github.com/user',
		method: 'GET',
		headers: {
			'Accept': 'application/vnd.github.v3+json',
			'Authorization': 'token ' + token,
			'User-Agent': 'losttime/Contribute'
		}
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var info = JSON.parse(body);
			var user = info.login;
			var url = 'https://api.github.com/repos/' + repo.fullName;
			request.get({
				url: url, //'https://api.github.com/repos/' + repo.full_name,
				method: 'GET',
				headers: {
					'Accept': 'application/vnd.github.v3+json',
					'Authorization': 'token ' + token,
					'User-Agent': 'losttime/Contribute'
				}
			}, function(error, response, body) {
				if (!error && response.statusCode === 200) {
					var info = JSON.parse(body);
					if (user === info.owner.login) {
						callback(true);
					} else {
						callback();
					}
				} else {
					console.error('add error2', error, body);
					callback();
				}
			});
		} else {
			console.log('add error', error, body);
			callback();
		}
	});
};

app.options('/data/repo', cors(corsOptions));
app.post('/data/repo', cors(corsOptions), function(req, res) {
	var authHeader = req.get('Authorization');
	if (authHeader) {
		var token = authHeader.split(' ')[1];
		determineOwnership(token, req.body, function(isOwner) {
			if (isOwner) {
				dataStore.save(new Repositories({
					name: req.body.name,
					description: req.body.description,
					url: req.body.htmlUrl
				}), new Backendless.Async(function(data) {
					res.status(200).send('OK');
				}, function(error) {
					console.error('error', error);
					res.status(500).send('Internal Server Error');
				}));
			} else {
				res.status(403).send('Forbidden');
			}
		});
	} else {
		res.status(401).send('Unauthorized');
	}
});

app.listen(config.server.port, function () {
	console.log('Example app listening on port %d!', config.server.port);
});
