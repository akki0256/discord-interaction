function createEnum(keys) {
	return Object.fromEntries(keys.map((key) => [key, key]));
}

module.exports = { createEnum };
