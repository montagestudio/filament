var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService,
    User = require("data/model/github-user.mjson").montageObject,
    Organization = require("data/model/github-organization.mjson").montageObject,
    Repository = require("logic/model/github-repository").GithubRepository;

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
        value: function (url, headers, body, type, useCredentials) {
            return HttpService.prototype.fetchHttpRawData.call(this, url, headers, body, type, useCredentials || false);
        }
    },

    _createQueryString: {
        value: function (query) {
            return Object.keys(query).map(function(name) {
                return encodeURIComponent(name) + "=" + encodeURIComponent(query[name]);
            }).join("&");
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
            switch (type) {
                case User:
                    return this._fetchUser(stream);
                case Organization:
                    return this._fetchOrganizations(stream);
                case Repository:
                    return this._fetchRepositories(stream);
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
    },

    _fetchRepositories: {
        value: function (stream) {
            var self = this,
                parameters = stream.query.criteria.parameters,
                url = API_URL + "/user/repos";
            if (parameters) {
                url += "?";
                url += this._createQueryString(parameters);
            }
            return this.fetchHttpRawData(url)
                .then(function (repos) {
                    self.addRawData(stream, repos);
                    self.rawDataDone(stream);
                });
        }
    },

    saveRawData: {
        value: function (record, context) {
            switch (context.constructor) {
                case Repository:
                    return this._saveRepository(record, context);
            }
        }
    },

    _saveRepository: {
        value: function (record, context) {
            return this.fetchHttpRawData(API_URL + "/user/repos", undefined, JSON.stringify(record));
        }
    }
});
