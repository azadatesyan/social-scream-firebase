const localCredentials = require('./FBkeys.json'),
	admin = require('firebase-admin'),
	firebase = require('firebase');

const firebaseConfig = {
	apiKey: 'AIzaSyAC6Y--Yc_E_FzjdVFfFSwsbGLvfR3tJJ8',
	authDomain: 'socialape-6b91a.firebaseapp.com',
	databaseURL: 'https://socialape-6b91a.firebaseio.com',
	projectId: 'socialape-6b91a',
	storageBucket: 'socialape-6b91a.appspot.com',
	messagingSenderId: '868359346037',
	appId: '1:868359346037:web:cc911e8124cb895cbf253c',
	measurementId: 'G-Z6Y66WDFBR'
};

admin.initializeApp({
	credential: admin.credential.cert(localCredentials),
	databaseURL: firebaseConfig.databaseURL,
	storageBucket: firebaseConfig.storageBucket
});

firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

module.exports = { admin, firebase, db, firebaseConfig };
