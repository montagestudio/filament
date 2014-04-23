/*global Rollbar */

// These get replaced by the deployment script
var ENVIRONMENT = "development";
var GIT_HASH = "";

//jshint -W106
Rollbar.configure({payload: {
    environment: ENVIRONMENT,
    client: {code_version: GIT_HASH}
}});
//jshint +W106

exports.error = function(error) {
    Rollbar.error(error);
};

exports.message = function(message) {
    Rollbar.info(message);
};

exports.setUsername = function(username) {
    username = username.toLowerCase();
    Rollbar.configure({payload: {
        person: {
            id: username,
            username: username
        }
    }});
};
