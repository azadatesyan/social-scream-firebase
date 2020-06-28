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
	return re.test(string.toLowerCase());
};

module.exports = { isEmail, isEmpty };
