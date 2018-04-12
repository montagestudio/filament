var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService,
    User = require("data/model/github-user.mjson").montageObject,
    Organization = require("data/model/github-organization.mjson").montageObject;

var API_URL = "https://api.github.com";

/**
 * @class
 * @extends external:DataService
 */
exports.GithubService = HttpService.specialize(/** @lends GithubService.prototype */ {

    authorizationPolicy: {
        value: DataService.AuthorizationPolicy.UP_FRONT
    },

    providesAuthorization: {
        value: false
    },

    authorizationServices: {
        value: ["./github-authorization-service"]
    },

    authorizationManagerWillAuthorizeWithService: {
        value: function (authorizationManager, authorizationService) {
            authorizationService.connectionDescriptor = this.authorizationDescriptor;
        }
    },

    fetchHttpRawData: {
        value: function (url, body, type, headers, useCredentials) {
            return HttpService.prototype.fetchHttpRawData.call(this, url, body, type, headers, useCredentials || false);
        }
    },

    setHeadersForQuery: {
        value: function (headers, query) {
            var param = "";
            // jshint -W069
            headers["Accept"] = "application/vnd.github.v3" + param + "+json";
            headers["Authorization"] = "token " + this.authorization[0].token;
            // jshint +W069
        }
    },

    fetchRawData: {
        value: function (stream) {
            var type = stream.query.type;
            if (type === User) {
                return this._fetchUser(stream);
            } else if (type === Organization) {
                return this._fetchOrganizations(stream);
            }
        }
    },

    _fetchUser: {
        value: function (stream) {
            var self = this;
            return this.fetchHttpRawData(API_URL + "/user")
                .then(function (user) {
                    self.addRawData(stream, [user]);
                    self.rawDataDone(stream);
                });
        }
    },

    _fetchOrganizations: {
        value: function (stream) {
            var self = this;
            return this.fetchHttpRawData(API_URL + "/user/orgs")
                .then(function (orgs) {
                    self.addRawData(stream, orgs);
                    self.rawDataDone(stream);
                });
        }
    }
});
