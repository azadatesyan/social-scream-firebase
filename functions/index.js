const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const app = express();

admin.initializeApp();

app.get('/screams', (req, res) => {
	try {
		let screams = [];
		let screamsQuery = await admin.firestore().collection('screams').get();
		screamsQuery.forEach((scream) => {
			screams.push(scream.data());
		});
		return res.json(screams);
	} catch (err) {
		console.log(err);
	}
});

app.post('/screams/new', (req, res) => {
	try {
		let screamToPush = {
			body: req.body.content,
			userID: 'olivgueg',
			createdAt: Date.now()
		};
		let createdScream = await admin.firestore().collection('screams').add(screamToPush);
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

exports.api = functions.https.onRequest(app);