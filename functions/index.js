const functions = require('firebase-functions');
const { admin, firebase, db } = require('./config');
const app = require('express')();
const { isEmpty, isEmail } = require('./validations');

const isAuth = async (req, res, next) => {
	let idToken;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		idToken = req.headers.authorization.split('Bearer ')[1];
	} else {
		console.log('Invalid auth token');
		return res.status(403).json({
			error: 'Unauthorized'
		});
	}
	try {
		const decodedToken = await admin.auth().verifyIdToken(idToken);
		req.user = decodedToken;
		const userSnapshot = await db.collection('users').where('userId', '==', req.user.uid).limit(1).get();
		req.user.username = await userSnapshot.docs[0].data().username;
		return next();
	} catch (err) {
		console.log('Error while verifying token', err);
		return res.status(403).json(err);
	}
};

app.get('/screams', async (req, res) => {
	try {
		let screams = [];
		let screamsQuery = await db.collection('screams').orderBy('createdAt', 'desc').get();
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

app.post('/screams/new', isAuth, async (req, res) => {
	try {
		let screamToPush = {
			text: req.body.text,
			username: req.user.username,
			createdAt: admin.firestore.Timestamp.fromDate(new Date())
		};
		const createdScream = await db.collection('screams').add(screamToPush);
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
				username: newUser.username,
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
	let errors = {};
	const user = {
		email: req.body.email,
		password: req.body.password
	};

	if (isEmpty(user.email)) errors.email = 'Email must not be empty';
	if (isEmpty(user.password)) errors.password = 'Password must not be empty';

	if (Object.keys(errors).length > 0) return res.status(400).json(errors);

	try {
		const userCredentials = await firebase.auth().signInWithEmailAndPassword(user.email, user.password);
		const userToken = await userCredentials.user.getIdToken();
		res.json({ userToken });
	} catch (err) {
		console.log(err);
		if (err.code === 'auth/wrong-password') {
			return res.status(403).json({
				general: 'Wrong credentials, please try again'
			});
		} else {
			return res.status(500).json({
				error: err.code
			});
		}
	}
});

exports.api = functions.region('europe-west1').https.onRequest(app);
