var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);

var configAuth = require('./auth');

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM " + dbconfig.users_table + " WHERE `id` = "+ id, function(err, rows){
            done(err, rows[0]);
        });
    });

    passport.use(
        'local-signup',
        new LocalStrategy(
            {
                usernameField : 'username',
                passwordField : 'password',
                passReqToCallback : true
            },
            function(req, username, password, done) {
                connection.query("SELECT * FROM " + dbconfig.users_table + " WHERE `username` = '" + username + "'", function(err, rows) {
                    if (err)
                        return done(err);
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                    } else {
                        var newUser = {};
                        newUser.username = username;
                        newUser.password = bcrypt.hashSync(password, null, null);  // use the generateHash function in our user model

                        var insertQuery = "INSERT INTO " + dbconfig.users_table + " " +
                            "( `username`, `password` ) " +
                            "values ('" + newUser.username + "','" + newUser.password + "')";

                        connection.query(insertQuery, function(err, rows) {
                            newUser.id = rows.insertId;

                            return done(null, newUser);
                        });
                    }
                });
            }
        )
    );
    passport.use(
        'local-login',
        new LocalStrategy(
            {
                usernameField : 'username',
                passwordField : 'password',
                passReqToCallback : true
            },
            function(req, username, password, done) {
                connection.query("SELECT * FROM " + dbconfig.users_table + " WHERE `username` = '" + username + "'", function(err, rows){
                    if (err)
                        return done(err);
                    if (!rows.length) {
                        return done(null, false, req.flash('loginMessage', 'No user found.'));
                    }

                    if (!bcrypt.compareSync(password, rows[0].password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                    return done(null, rows[0]);
                });
            }
        )
    );
    passport.use(new FacebookStrategy({
        clientID : configAuth.facebookAuth.clientID,
        clientSecret : configAuth.facebookAuth.clientSecret,
        callbackURL : configAuth.facebookAuth.callbackURL,
        profileFields : ['emails'],
        passReqToCallback : true
    },
    function(req, token, refreshToken, profile, done) {
        process.nextTick(function() {
            if (!req.user) {

                connection.query("SELECT * FROM " + dbconfig.users_table + " WHERE facebook_id = '" + profile.id + "'", function(err, rows){
                    if (err)
                        return done(err);

                    if (rows.length > 0) {
                        user = rows[0];

                        if (!user.facebook_token) {
                            user.facebook_token = token;
                            user.facebook_name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook_email = (profile.emails[0].value || '').toLowerCase();

                            var updateQuery = "UPDATE " + dbconfig.users_table + " SET " +
                                "`facebook_token` = '" + user.facebook_token + "', " +
                                "`facebook_name` = '" + user.facebook_name + "', " +
                                "`facebook_email` = '" + user.facebook_email + "' " +
                                "WHERE `facebook_id` = " + user.facebook_id + " LIMIT 1";

                            connection.query(updateQuery, function(err, rows) {
                                if (err)
                                    return done(err);

                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser            = {};

                        newUser.facebook_id = profile.id;
                        //console.log("_____FB ID______");
                        //console.log(newUser.facebook_id);
                        newUser.facebook_token = token;
                        newUser.facebook_name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook_email = (profile.emails[0].value || '').toLowerCase();

                        var insertQuery = "INSERT INTO " + dbconfig.users_table + " " +
                            "( `facebook_id`, `facebook_token`, `facebook_name`, `facebook_email` ) " +
                            "values ('" +  newUser.facebook_id + "','" + newUser.facebook_token + "', '" + newUser.facebook_name + "', '" + newUser.facebook_email + "')";

                        connection.query(insertQuery, function(err, rows) {
                            if(err)
                            {
                                console.log("____ERROR_____");
                                console.log(err);
                            } 
                            else
                            {
                                newUser.id = rows.insertId;
                            }

                            return done(null, newUser);
                        });
                    }
                });
            } else {
                var user = req.user;

                user.facebook_id = profile.id;
                user.facebook_token = token;
                user.facebook_name  = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook_email = (profile.emails[0].value || '').toLowerCase();

                var updateQuery = "UPDATE " + dbconfig.users_table + " SET " +
                    "`facebook_id` = " + user.facebook_id + ", " +
                    "`facebook_token` = '" + user.facebook_token + "', " +
                    "`facebook_name` = '" + user.facebook_name + "', " +
                    "`facebook_email` = '" + user.facebook_email + "' " +
                    "WHERE `id` = " + user.id + " LIMIT 1";

                connection.query(updateQuery, function(err, rows) {
                    if (err)
                        return done(err);
                    return done(null, user);
                });
            }
        });
    }));
};
