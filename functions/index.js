const functions = require('firebase-functions'),
	{
		getAllScreams,
		getOneScream,
		postOneScream,
		commentScream,
		likeScream,
		unlikeScream,
		deleteOneScream
	} = require('./handlers/screams'),
	{ login, signup, uploadImage, updateUserDetails, getUserDetails } = require('./handlers/users'),
	isAuth = require('./util/middlewares'),
	{ db } = require('./config/config'),
	app = require('express')();

// Scream routes
app.get('/screams', getAllScreams);
app.get('/screams/:id', getOneScream);
app.post('/screams/new', isAuth, postOneScream);
app.delete('/screams/:id', isAuth, deleteOneScream);

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

// Notifications for comments & likes
exports.createNotificationOnLike = functions
	.region('europe-west1')
	.firestore.document('likes/{likeId}')
	.onCreate(async (snapshot) => {
		try {
			const screamDoc = await db.doc(`screams/${snapshot.data().screamId}`).get();
			db.collection('notifications').add({
				createdAt: new Date().toISOString(),
				recipient: screamDoc.data().username,
				sender: snapshot.data().username,
				type: 'like',
				read: false,
				screamId: screamDoc.id
			});
			return;
		} catch (err) {
			console.error(err);
			return;
		}
	});
