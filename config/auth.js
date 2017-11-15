module.exports = {

	'facebookAuth' : {
		'clientID' 		: '134529233872728',
		'clientSecret' 	: '40f5633bfea8338cd5fa05e04f3ed0e4',
		'callbackURL' 	: 'http://localhost:8080/auth/facebook/callback',
        'profileFields'   : ['emails']
	},

	'twitterAuth' : {
		'consumerKey' 		: 'your-consumer-key-here',
		'consumerSecret' 	: 'your-client-secret-here',
		'callbackURL' 		: 'http://localhost:8080/auth/twitter/callback'
	},

	'googleAuth' : {
		'clientID' 		: 'your-secret-clientID-here',
		'clientSecret' 	: 'your-client-secret-here',
		'callbackURL' 	: 'http://localhost:8080/auth/google/callback'
	}

};