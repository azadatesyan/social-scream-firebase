const functions = require('firebase-functions'),
	{ getAllScreams, getOneScream, postOneScream } = require('./handlers/screams'),
	{ login, signup, uploadImage, updateUserDetails, getUserDetails } = require('./handlers/users'),
	isAuth = require('./util/middlewares'),
	app = require('express')();

// Scream routes
app.get('/screams', getAllScreams);
app.get('/screams/:id', getOneScream);
app.post('/screams/new', isAuth, postOneScream);

//AUTH ROUTES
app.post('/signup', signup);
app.post('/login', login);

// User routes
app.get('/user/details', isAuth, getUserDetails);
app.post('/user/details', isAuth, updateUserDetails);
app.post('/user/image', isAuth, uploadImage);

exports.api = functions.region('europe-west1').https.onRequest(app);
