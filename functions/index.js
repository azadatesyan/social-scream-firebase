const functions = require('firebase-functions'),
	{ getAllScreams, postOneScream } = require('./handlers/screams'),
	{ login, signup, uploadImage } = require('./handlers/users'),
	isAuth = require('./util/middlewares'),
	app = require('express')();

// Scream routes
app.get('/screams', getAllScreams);
app.post('/screams/new', isAuth, postOneScream);

// User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', isAuth, uploadImage);

exports.api = functions.region('europe-west1').https.onRequest(app);
