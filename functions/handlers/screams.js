const { db, admin } = require('../config/config');

const getAllScreams = async (req, res) => {
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
};

const getOneScream = async (req, res) => {
	const screamId = req.params.id;
	const screamRef = db.doc(`/screams/${screamId}`);
	const commentsRef = db.collection('comments').orderBy('createdAt', 'desc').where('screamId', '==', screamId);
	const scream = {};
	try {
		const screamDoc = await screamRef.get();
		if (screamDoc.exists) {
			scream.details = screamDoc.data();
			const commentsDoc = await commentsRef.get();
			if (!commentsDoc.empty) {
				scream.comments = [];
				commentsDoc.forEach((comment) => scream.comments.push(comment.data()));
			} else {
			}
			return res.json(scream);
		} else {
			return res.json({ scream: "scream doesn't exist" });
		}
	} catch (err) {
		console.log(err);
	}
};

const postOneScream = async (req, res) => {
	try {
		const screamToPush = {
			text: req.body.text,
			username: req.user.username,
			userImage: req.user.profilePicture,
			createdAt: new Date().toISOString(),
			likeCount: 0,
			commentCount: 0
		};
		const createdScream = await db.collection('screams').add(screamToPush);
		screamToPush.id = createdScream.id;
		res.status(200).json(screamToPush);
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: 'Something went wrong',
			errorCode: err
		});
	}
};

const commentScream = async (req, res) => {
	const screamId = req.params.id;
	const commentToPush = {
		screamId: screamId,
		username: req.user.username,
		createdAt: new Date().toISOString(),
		text: req.body.text,
		userImage: req.user.profilePicture
	};
	try {
		await db.collection('comments').add(commentToPush);
		await db.doc(`screams/${req.params.id}`).update({ commentCount: admin.firestore.FieldValue.increment(1) });
		return res.json(commentToPush);
	} catch (err) {
		return res.json({ error: err.code });
	}
};

const likeScream = async (req, res) => {
	const screamId = req.params.id;
	const username = req.user.username;
	const screamRef = db.doc(`screams/${screamId}`);
	let screamData = {};
	const likeRef = db.collection('likes').where('screamId', '==', screamId).where('username', '==', username).limit(1);

	try {
		const screamDoc = await screamRef.get();
		if (screamDoc.exists) {
			const likeDoc = await likeRef.get();
			screamData = screamDoc.data();
			screamData.screamId = screamRef.id;
			if (likeDoc.empty) {
				await db.collection('likes').add({ screamId, username });
				await screamRef.update({ likeCount: admin.firestore.FieldValue.increment(1) });
				screamData.likeCount++;
				return res.json(screamData);
			} else {
				return res.json({ error: "You've already liked this scream" });
			}
		} else {
			return res.json({ error: 'Scream not found' });
		}
	} catch (err) {
		return res.json({ error: err });
	}
};

const unlikeScream = async (req, res) => {
	const screamId = req.params.id;
	const username = req.user.username;
	const screamRef = db.doc(`screams/${screamId}`);
	const likeRef = db.collection('likes').where('username', '==', username).where('screamId', '==', screamId).limit(1);
	let screamData = {};

	try {
		const screamDoc = await screamRef.get();
		if (screamDoc.exists) {
			const likeQuery = await likeRef.get();
			if (!likeQuery.empty) {
				screamData = screamDoc.data();
				screamData.id = screamRef.id;
				await likeQuery.docs[0].ref.delete();
				await db.doc(`screams/${screamId}`).update({ likeCount: admin.firestore.FieldValue.increment(-1) });
				screamData.likeCount--;
				return res.json({ screamData });
			} else {
				res.json({ error: "You don't currently like this scream" });
			}
		} else {
			res.json({ error: 'Scream not found' });
		}
	} catch (err) {
		console.log(err);
		res.json({ error: err.code });
	}
};

const deleteOneScream = async (req, res) => {
	const screamId = req.params.id;
	const username = req.user.username;
	const screamRef = db.doc(`screams/${screamId}`);
	const likesRef = db.collection('likes').where('screamId', '==', screamId);
	const commentsRef = db.collection('comments').where('screamId', '==', screamId);

	try {
		const screamDoc = await screamRef.get();
		if (screamDoc.exists) {
			const screamData = screamDoc.data();
			if (screamData.username === username) {
				await screamRef.delete();
				return res.json({ msg: 'Successfully deleted post and all associated likes & comments' });
			} else {
				return res.json({ error: 'Unauthorized' });
			}
		} else {
			return res.json({ error: 'Scream not found' });
		}
	} catch (err) {
		console.log(err);
		return res.json({ error: err.code });
	}
};

module.exports = {
	getAllScreams,
	getOneScream,
	postOneScream,
	commentScream,
	likeScream,
	unlikeScream,
	deleteOneScream
};
