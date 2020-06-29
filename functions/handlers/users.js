const { isEmpty, isEmail } = require('../util/validations'),
	{ admin, firebase, db } = require('../config/config');

const signup = async (req, res) => {
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
};

const login = async (req, res) => {
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
};

module.exports = { login, signup };
