const functions = require('firebase-functions');
const { admin, firebase, db } = require('./config');
const app = require('express')();
const { isEmpty, isEmail } = require('./validations');

app.get('/screams', async (req, res) => {
	try {
		let screams = [];
		let screamsQuery = await db.collection('screams').get();
		screamsQuery.forEach((scream) => {
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
	let errors = {};
	const newUser = {
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword
	};

	if (!isEmail(newUser.email)) errors.email = 'Email must be valid';

	Object.keys(newUser).forEach((key) => {
		console.log(`Currently checking ${key} and its value is: ${newUser[key]}`);
		if (isEmpty(newUser[key])) {
			errors = {
				...errors,
				[key]: `${key} must not be empty`
			};
		}
	});

	if (newUser.confirmPassword !== newUser.password) errors.confirmPassword = 'Passwords must match';

	if (Object.keys(errors).length > 0) {
		return res.status(400).json(errors);
	}

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

app.post('/login', async (req, res) => {
	const userCredentials = await firebase.auth().signInWithEmailAndPassword(req.email, req.password);
	const userToken = await userCredentials.user.getIdToken();
});

exports.api = functions.region('europe-west1').https.onRequest(app);
