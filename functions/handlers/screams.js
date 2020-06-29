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

module.exports = { getAllScreams, postOneScream };
