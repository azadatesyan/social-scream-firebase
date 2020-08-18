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
	{
		login,
		signup,
		uploadImage,
		updateCurrentUserDetails,
		getCurrentUserDetails,
		getUserDetails
	} = require('./handlers/users'),
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
app.get('/user', isAuth, getCurrentUserDetails);
app.get('/user', getUserDetails);
app.post('/user', isAuth, updateCurrentUserDetails);
app.post('/user/image', isAuth, uploadImage);

exports.api = functions.region('europe-west1').https.onRequest(app);

// Notifications for comments & likes
exports.createNotificationOnLike = functions
	.region('europe-west1')
	.firestore.document('likes/{likeId}')
	.onCreate(async (snapshot) => {
		try {
			const screamDoc = await db.doc(`screams/${snapshot.data().screamId}`).get();
			db.doc(`notifications/${snapshot.id}`).set({
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

exports.deleteNotificationOnUnlike = functions
	.region('europe-west1')
	.firestore.document('likes/{likeId}')
	.onDelete(async (snapshot) => {
		try {
			db.doc(`notifications/${snapshot.id}`).delete();
			return;
		} catch (err) {
			console.error(err);
			return;
		}
	});

exports.createNotificationOnComment = functions
	.region('europe-west1')
	.firestore.document('comments/{commentId}')
	.onCreate(async (snapshot) => {
		try {
			const screamDoc = await db.doc(`screams/${snapshot.data().screamId}`).get();
			db.doc(`notifications/${snapshot.id}`).set({
				createdAt: new Date().toISOString(),
				recipient: screamDoc.data().username,
				sender: snapshot.data().username,
				type: 'comment',
				read: false,
				screamId: screamDoc.id
			});
			return;
		} catch (err) {
			console.error(err);
			return;
		}
	});

exports.deleteNotificationOnUncomment = functions
	.region('europe-west1')
	.firestore.document('comments/{commentId}')
	.onDelete(async (snapshot) => {
		try {
			db.doc(`notifications/${snapshot.id}`).delete();
			return;
		} catch (err) {
			console.error(err);
			return;
		}
	});
