const functions = require('firebase-functions'),
	{ getAllScreams, postOneScream } = require('./handlers/screams'),
	{ login, signup } = require('./handlers/users'),
	isAuth = require('./util/middlewares'),
	app = require('express')();

app.get('/screams', getAllScreams);

app.post('/screams/new', isAuth, postOneScream);

app.post('/signup', signup);

app.post('/login', login);

exports.api = functions.region('europe-west1').https.onRequest(app);
