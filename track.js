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
