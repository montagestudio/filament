var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService,
    User = require("data/model/github-user.mjson").montageObject,
    Organization = require("data/model/github-organization.mjson").montageObject,
    Repository = require("data/model/github-repository.mjson").montageObject,
    Branch = require("data/model/github-branch.mjson").montageObject,
    GithubBlob = require("data/model/github-blob.mjson").montageObject,
    Contents = require("data/model/github-contents.mjson").montageObject,
    Tree = require("data/model/github-tree.mjson").montageObject;

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
            headers["Authorization"] = "token " + this.authorization[0].githubAuthorization.token;
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
                case Branch:
                    return this._fetchBranches(stream);
                case GithubBlob:
                    return this._fetchBlob(stream);
                case Contents:
                    return this._fetchContents(stream);
                case Tree:
                    return this._fetchTree(stream);
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
                if (parameters.owner && parameters.repo) {
                    url = API_URL + "/repos/" + parameters.owner + "/" + parameters.repo;
                } else if (parameters.owner || parameters.repo) {
                    throw new Error("Need BOTH a 'owner' and 'repo' to fetch a specific repository.");
                } else {
                    url += "?";
                    url += this._createQueryString(parameters);
                }
            }
            return this.fetchHttpRawData(url)
                .then(function (repos) {
                    self.addRawData(stream, Array.isArray(repos) ? repos: [repos]);
                    self.rawDataDone(stream);
                });
        }
    },

    _fetchBranches: {
        value: function (stream) {
            var self = this,
                parameters = stream.query.criteria.parameters,
                owner = parameters && parameters.owner,
                repo = parameters && parameters.repo,
                branch = parameters && parameters.branch;
            if (!owner || !repo || !branch) {
                throw new Error("owner, repo, branch required");
            }
            return this.fetchHttpRawData(API_URL + "/repos/" + owner + "/" + repo + "/branches" + (branch ? "/" + branch : ""))
                .then(function (branches) {
                    self.addRawData(stream, Array.isArray(branches) ? branches : [branches]);
                    self.rawDataDone(stream);
                });
        }
    },

    _fetchBlob: {
        value: function (stream) {
            var self = this,
                parameters = stream.query.criteria.parameters,
                owner = parameters && parameters.owner,
                repo = parameters && parameters.repo,
                sha = parameters && parameters.sha;
            if (!owner || !repo || !sha) {
                throw new Error("owner, repo, sha required");
            }
            return this.fetchHttpRawData(API_URL + "/repos/" + owner + "/" + repo + "/git/blobs/" + sha)
                .then(function (blob) {
                    self.addRawData(stream, [blob]);
                    self.rawDataDone(stream);
                });
        }
    },

    _fetchContents: {
        value: function (stream) {
            var self = this,
                parameters = stream.query.criteria.parameters,
                owner = parameters && parameters.owner,
                repo = parameters && parameters.repo,
                path = parameters && parameters.path;
            if (!owner || !repo || !path) {
                throw new Error("owner, repo, path required");
            }
            return this.fetchHttpRawData(API_URL + "/repos/" + owner + "/" + repo + "/contents/" + path)
                .then(function (contents) {
                    self.addRawData(stream, [contents]);
                    self.rawDataDone(stream);
                });
        }
    },

    _fetchTree: {
        value: function (stream) {
            var self = this,
                parameters = stream.query.criteria.parameters,
                owner = parameters && parameters.owner,
                repo = parameters && parameters.repo,
                sha = parameters && parameters.sha,
                recursive = parameters && parameters.recursive;
            if (!owner || !repo || !sha) {
                throw new Error("owner, repo, sha required");
            }
            return this.fetchHttpRawData(API_URL + "/repos/" + owner + "/" + repo + "/git/trees/" + sha + (recursive ? "?recursive=1" : ""))
                .then(function (tree) {
                    self.addRawData(stream, [tree]);
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
