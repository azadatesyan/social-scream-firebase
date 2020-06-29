const { admin, db } = require('../config/config');

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
		if (err.code === 'auth/id-token-expired') {
			return res.status(403).json({
				authentication: 'Your session has expired. Please login again.'
			});
		}
		console.log('Error while verifying token', err);
		return res.status(403).json(err);
	}
};

module.exports = isAuth;
