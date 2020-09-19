const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validations'),
	{ admin, firebase, db, firebaseConfig } = require('../config/config'),
	BusBoy = require('busboy'),
	path = require('path'),
	os = require('os'),
	fs = require('fs');

const signup = async (req, res) => {
	const newUser = {
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword
	};

	const defaultProfilePicture = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/no-face.png?alt=media`;

	const { valid, errors } = validateSignupData(newUser);
	if (!valid) return res.status(400).json(errors);

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
				profilePicture: defaultProfilePicture,
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
	const user = {
		email: req.body.email,
		password: req.body.password
	};

	const { valid, errors } = validateLoginData(user);
	if (!valid) return res.status(400).json(errors);

	try {
		const userCredentials = await firebase.auth().signInWithEmailAndPassword(user.email, user.password);
		const userToken = await userCredentials.user.getIdToken();
		res.json({ userToken });
	} catch (err) {
		console.log(err);
		switch (err.code) {
			case 'auth/wrong-password':
				return res.status(403).json({
					general: 'Wrong credentials, please try again'
				});
			case 'auth/too-many-requests':
				return res.status(403).json({
					general: 'Too many attempts, please try again later'
				});
			case 'auth/user-not-found':
				return res.status(403).json({
					general: 'This account does not exist'
				});
			default:
				return res.status(500).json({
					general: err.code
				});
		}
	}
};

const uploadImage = (req, res) => {
	const busboy = new BusBoy({ headers: req.headers });
	let imageToBeUploaded = {};
	let imageFileName;

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
			console.log(mimetype);
			return res.json({ error: 'File is not an image' });
		}
		console.log(mimetype);
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
		imageFileName = `${Math.round(Math.random() * 100000000000)}.${imageExtension}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filePath, mimetype };
		file.pipe(fs.createWriteStream(filePath));
	});

	busboy.on('finish', () => {
		admin
			.storage()
			.bucket()
			.upload(imageToBeUploaded.filePath, {
				resumable: false,
				metadata: {
					metadata: {
						contentType: imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const profilePicture = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/users/${req.user.username}`).update({ profilePicture });
			})
			.then(() => {
				return res.json({
					message: 'Image successfully uploaded'
				});
			})
			.catch((err) => {
				console.log(err);
				res.status(400).json({
					error: err.code
				});
			});
	});

	busboy.end(req.rawBody);
};

const updateCurrentUserDetails = async (req, res) => {
	let userDetails = reduceUserDetails(req.body);
	try {
		await db.doc(`/users/${req.user.username}`).update(userDetails);
		res.json({ message: 'Details updated successfully' });
	} catch (err) {
		console.log(err);
		res.status(400).json({
			error: err.code
		});
	}
};

const getCurrentUserDetails = (req, res) => {
	let userDetails = {};
	db.doc(`/users/${req.user.username}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				console.log(doc.data());
				userDetails.credentials = doc.data();
				return db.collection('likes').where('username', '==', req.user.username).get();
			}
		})
		.then((data) => {
			userDetails.likes = [];
			data.forEach((like) => {
				userDetails.likes.push(like.data());
			});
			return db
				.collection('notifications')
				.where('recipient', '==', req.user.username)
				.orderBy('createdAd', 'desc')
				.limit(10)
				.get();
		})
		.then((documents) => {
			userDetails.notifications = [];
			documents.forEach((document) => {
				let { recipient, sender, read, screamId, type, createdAt } = document.data();
				userDetails.notifications.push({
					recipient,
					sender,
					read,
					screamId,
					type,
					createdAt,
					notificationId: document.id
				});
			});
			return res.json(userDetails);
		})
		.catch((err) => {
			return res.json({ error: err.code });
		});
};

const getUserDetails = (req, res) => {
	let userDetails = {};
	db.doc(`/users/${req.params.id}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				console.log(doc.data());
				userDetails.credentials = doc.data();
				return db.collection('likes').where('username', '==', req.params.id).get();
			}
		})
		.then((data) => {
			userDetails.likes = [];
			data.forEach((like) => {
				userDetails.likes.push(like.data());
			});
			return db
				.collection('notifications')
				.where('recipient', '==', req.params.id)
				.orderBy('createdAd', 'desc')
				.limit(10)
				.get();
		})
		.then((documents) => {
			userDetails.notifications = [];
			documents.forEach((document) => {
				let { recipient, sender, read, screamId, type, createdAt } = document.data();
				userDetails.notifications.push({
					recipient,
					sender,
					read,
					screamId,
					type,
					createdAt,
					notificationId: document.id
				});
			});
			return res.json(userDetails);
		})
		.catch((err) => {
			return res.json({ error: err.code });
		});
};

const markNotificationsRead = async (req, res) => {
	const batch = db.batch();
	req.body.forEach((notificationId) => {
		console.log(notificationId);
		const notification = db.doc(`notifications/${notificationId}`);
		batch.update(notification, { read: true });
	});
	try {
		await batch.commit();
		return res.json({ message: 'Notifications have been marked read' });
	} catch (err) {
		console.log(err);
		return res.json({ error: err.code });
	}
};

module.exports = {
	login,
	signup,
	uploadImage,
	updateCurrentUserDetails,
	getCurrentUserDetails,
	getUserDetails,
	markNotificationsRead
};
