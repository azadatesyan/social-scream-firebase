const isEmpty = (string) => {
	if (string == undefined) {
		return true;
	} else if (string.trim() == '') {
		return true;
	} else {
		return false;
	}
};

const isEmail = (string) => {
	const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	try {
		return re.test(string.toLowerCase());
	} catch (err) {
		console.log(err);
		return false;
	}
};

const validateSignupData = (data) => {
	let errors = {};

	if (!isEmail(data.email)) errors.email = 'Email must be valid';
	if (data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords must match';

	Object.keys(data).forEach((key) => {
		console.log(`Currently checking ${key} and its value is: ${data[key]}`);
		if (isEmpty(data[key])) {
			errors = {
				...errors,
				[key]: `Must not be empty`
			};
		}
	});

	return {
		valid: Object.keys(errors).length === 0 ? true : false,
		errors
	};
};

const validateLoginData = (data) => {
	let errors = {};
	if (isEmpty(data.email) || !isEmail(data.email)) errors.email = 'Email must be valid';
	if (isEmpty(data.password)) errors.password = 'Must not be empty';

	return {
		valid: Object.keys(errors).length === 0 ? true : false,
		errors
	};
};

const reduceUserDetails = (data) => {
	let userDetails = {};
	if (data.bio && !isEmpty(data.bio.trim())) userDetails.bio = data.bio;
	if (data.website && !isEmpty(data.website.trim())) {
		if (data.website.trim().substring(0, 4) !== 'http') {
			userDetails.website = `http://${data.website.trim()}`;
		} else {
			userDetails.website = data.website.trim();
		}
	}
	return userDetails;
};

module.exports = { isEmail, isEmpty, validateSignupData, validateLoginData, reduceUserDetails };
