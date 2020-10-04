const { db, admin } = require('../config/config');
const {isEmpty} = require('../util/validations');

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
		return res.status(200).json(screams);
	} catch (err) {
		console.log(err);
		return res.status(404).json({error: err}); 
	}
};

const getOneScream = async (req, res) => {
	const screamId = req.params.id;
	const screamRef = db.doc(`/screams/${screamId}`);
	const commentsRef = db.collection('comments').orderBy('createdAt', 'desc').where('screamId', '==', screamId);
	let scream = {};
	try {
		const screamDoc = await screamRef.get();
		if (screamDoc.exists) {
			scream = screamDoc.data();
			scream.screamId = screamDoc.id;
			scream.comments = [];
			const commentsDoc = await commentsRef.get();
			if (!commentsDoc.empty) {
				commentsDoc.forEach((comment) => scream.comments.push(comment.data()));
			}
			return res.status(200).json(scream);
		} else {
			return res.status(404).json({ scream: "scream doesn't exist" });
		}
	} catch (err) {
		console.log(err);
		return res.status(404).json({error: err});
	}
};

const postOneScream = async (req, res) => {
	if (isEmpty(req.body.text)) {
		return res.status(400).json({scream: 'Scream cannot be empty'});
	}
	try {
		const screamToPush = {
			text: req.body.text,
			username: req.user.username,
			userImage: req.user.profilePicture,
			createdAt: new Date().toISOString(),
			likeCount: 0,
			commentCount: 0
		};
		console.log(screamToPush);
		const createdScream = await db.collection('screams').add(screamToPush);
		screamToPush.screamId = createdScream.id;
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
		return res.status(200).json(commentToPush);
	} catch (err) {
		return res.status(500).json({ error: err.code });
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
				return res.status(200).json(screamData);
			} else {
				return res.status(409).json({ error: "You've already liked this scream" });
			}
		} else {
			return res.status(404).json({ error: 'Scream not found' });
		}
	} catch (err) {
		return res.status(500).json({ error: err });
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
				screamData.screamId = screamRef.id;
				await likeQuery.docs[0].ref.delete();
				await db.doc(`screams/${screamId}`).update({ likeCount: admin.firestore.FieldValue.increment(-1) });
				screamData.likeCount--;
				return res.status(200).json({ screamData });
			} else {
				return res.status(409).json({ error: "You don't currently like this scream" });
			}
		} else {
			return res.status(404).json({ error: 'Scream not found' });
		}
	} catch (err) {
		console.log(err);
		res.status(500).json({ error: err.code });
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
				const likesDocs = await likesRef.get();
				const commentsDocs = await commentsRef.get();
				!likesDocs.empty && await likesRef.delete();
				!commentsDocs.empty && await commentsRef.delete();
				return res.status(200).json({ msg: 'Successfully deleted post and all associated likes & comments' });
			} else {
				return res.status(401).json({ error: 'Unauthorized' });
			}
		} else {
			return res.status(404).json({ error: 'Scream not found' });
		}
	} catch (err) {
		console.log(err);
		return res.status(500).json({ error: err.code });
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
