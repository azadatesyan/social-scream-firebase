const functions = require('firebase-functions'),
	{
		getAllScreams,
		getOneScream,
		postOneScream,
		commentScream,
		likeScream,
		unlikeScream
	} = require('./handlers/screams'),
	{ login, signup, uploadImage, updateUserDetails, getUserDetails } = require('./handlers/users'),
	isAuth = require('./util/middlewares'),
	app = require('express')();

// Scream routes
app.get('/screams', getAllScreams);
app.get('/screams/:id', getOneScream);
app.post('/screams/new', isAuth, postOneScream);

//Comments & Likes Routes
app.post('/screams/:id/comment', isAuth, commentScream);
app.get('/screams/:id/like', isAuth, likeScream);
app.get('/screams/:id/unlike', isAuth, unlikeScream);

//Auth routes
app.post('/signup', signup);
app.post('/login', login);

// User routes
app.get('/user/details', isAuth, getUserDetails);
app.post('/user/details', isAuth, updateUserDetails);
app.post('/user/image', isAuth, uploadImage);

exports.api = functions.region('europe-west1').https.onRequest(app);
