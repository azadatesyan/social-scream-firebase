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
};

module.exports = { getAllScreams, getOneScream, postOneScream };
