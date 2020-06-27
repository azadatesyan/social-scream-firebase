const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const firebase = require('firebase');
const localCredentials = require('/home/olivier/Documents/socialape-6b91a-bde472c15d65.json');

const firebaseConfig = {
	apiKey: 'AIzaSyAC6Y--Yc_E_FzjdVFfFSwsbGLvfR3tJJ8',
	authDomain: 'socialape-6b91a.firebaseapp.com',
	databaseURL: 'https://socialape-6b91a.firebaseio.com',
	projectId: 'socialape-6b91a',
	storageBucket: 'socialape-6b91a.appspot.com',
	messagingSenderId: '868359346037',
	appId: '1:868359346037:web:cc911e8124cb895cbf253c',
	measurementId: 'G-Z6Y66WDFBR'
};

admin.initializeApp({
	credential: admin.credential.cert(localCredentials),
	databaseURL: firebaseConfig.databaseURL
});
firebase.initializeApp(firebaseConfig);
const db = admin.firestore();

app.get('/screams', async (req, res) => {
	try {
		let screams = [];
		let screamsQuery = await db.collection('screams').get();
		screamsQuery.forEach(scream => {
			screams.push({
				screamId: scream.id,
				...scream.data()
			});
		});
		return res.json(screams);
	} catch (err) {
		console.log(err);
	}
});

app.post('/screams/new', async (req, res) => {
	try {
		let screamToPush = {
			text: req.body.text,
			username: req.body.username,
			createdAt: admin.firestore.Timestamp.fromDate(new Date())
		};
		let createdScream = await admin
			.firestore()
			.collection('screams')
			.orderBy('createdAt', 'desc')
			.add(screamToPush);
		res.status(200).json({
			message: `Scream ${createdScream.id} created successfully`
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: 'Something went wrong',
			errorCode: err
		});
	}
});

app.post('/signup', async (req, res) => {
	const newUser = req.body;
	const userExistsSnapshot = await db.collection('users').doc(newUser.username).get();
	const userExists = userExistsSnapshot.exists;

	if (userExists) {
		res.status(400).json({
			username: 'This username is already taken'
		});
	} else {
		try {
			const signupResponse = await firebase
				.auth()
				.createUserWithEmailAndPassword(newUser.email, newUser.password);
			const token = await signupResponse.user.getIdToken();
			const createdUser = {
				email: newUser.email,
				userId: signupResponse.user.uid,
				createdAt: admin.firestore.Timestamp.fromDate(new Date())
			};
			db.doc(`/users/${newUser.username}`).set(createdUser);
			res.status(201).json({ token });
		} catch (err) {
			console.log(err);
			if (err.code === 'auth/email-already-in-use') {
				res.status(400).json({
					email: 'This email is already in use'
				});
			} else {
				res.status(500).json({
					error: err.code
				});
			}
		}
	}
});

exports.api = functions.region('europe-west1').https.onRequest(app);
