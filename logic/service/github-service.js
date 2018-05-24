var GithubHttpService = require("./github-http-service").GithubHttpService,
    DataService = require("montage/data/service/data-service").DataService,
    User = require("logic/model/github-user").GithubUser,
    UserDescriptor = require("data/model/github-user.mjson").montageObject,
    Organization = require("logic/model/github-organization").GithubOrganization,
    OrganizationDescriptor = require("data/model/github-organization.mjson").montageObject,
    Repository = require("logic/model/github-repository").GithubRepository,
    RepositoryDescriptor = require("data/model/github-repository.mjson").montageObject,
    Branch = require("data/model/github-branch.mjson").montageObject,
    GithubBlob = require("data/model/github-blob.mjson").montageObject,
    Contents = require("logic/model/github-contents").GithubContents,
    ContentsDescriptor = require("data/model/github-contents.mjson").montageObject,
    Tree = require("data/model/github-tree.mjson").montageObject;

var API_URL = "https://api.github.com";

/**
 * @class
 * @extends external:DataService
 */
exports.GithubService = GithubHttpService.specialize(/** @lends GithubService.prototype */ {

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
            return GithubHttpService.prototype.fetchHttpRawData.call(this, url, headers, body, type, useCredentials || false);
        }
    },

    _createQueryString: {
        value: function (query) {
            return Object.keys(query).filter(function (name) {
                return typeof query[name] !== "undefined";
            }).map(function(name) {
                return encodeURIComponent(name) + "=" + encodeURIComponent(query[name]);
            }).join("&");
        }
    },

    setHeadersForQuery: {
        value: function (headers, query) {
            var param = "";
            // jshint -W069
            headers["Accept"] = headers["Accept"] || "application/vnd.github.v3" + param + "+json";
            headers["Authorization"] = "token " + this.authorization[0].token;
            // jshint +W069
        }
    },

    fetchRawData: {
        value: function (stream) {
            var type = stream.query.type;
            switch (type) {
                case UserDescriptor:
                    return this._fetchUser(stream);
                case OrganizationDescriptor:
                    return this._fetchOrganizations(stream);
                case RepositoryDescriptor:
                    return this._fetchRepositories(stream);
                case Branch:
                    return this._fetchBranches(stream);
                case GithubBlob:
                    return this._fetchBlob(stream);
                case ContentsDescriptor:
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
                owner = parameters && parameters.owner,
                repo = parameters && parameters.repo,
                org = parameters && parameters.org,
                affiliation = parameters && parameters.affiliation,
                url;
            if (owner) {
                url = API_URL + "/repos/" + owner + (repo ? "/" + repo : "");
            } else if (org) {
                url = API_URL + "/orgs/" + org + "/repos" + (repo ? "/" + repo : "");
            } else {
                url = API_URL + "/user/repos" + (repo ? "/" + repo : "");
            }
            url += "?";
            url += this._createQueryString({
                affiliation: affiliation
            });
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
            if (!owner || !repo) {
                return stream.dataError(new Error("owner, repo required"));
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
                return stream.dataError(new Error("owner, repo, sha required"));
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
                path = parameters && parameters.path,
                url;
            if (!owner || !repo || !path) {
                return stream.dataError(new Error("owner, repo, path required"));
            }
            url = API_URL + ("/repos/" + owner + "/" + repo + "/contents/" + path).replace("//", "/");
            return this.fetchHttpRawData(url, { "Accept": "application/vnd.github.v3.raw+json" }, undefined, [GithubHttpService.DataType.TEXT])
                .then(function (contents) {
                    self.addRawData(stream, [contents]);
                }, Function.noop)
                .then(function () {
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
                return stream.dataError(new Error("owner, repo, sha required"));
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
            var self = this,
                postPromise;
            switch (context.owner && context.owner.constructor) {
                case User:
                    postPromise = this.fetchHttpRawData(API_URL + "/user/repos", undefined, JSON.stringify(record));
                    break;
                case Organization:
                    postPromise = this.fetchHttpRawData(API_URL + "/orgs/" + context.owner.login + "/repos", undefined, JSON.stringify(record));
                    break;
                default:
                    throw new Error("Owner must be provided and must be either a User or Organization");
            }
            return postPromise
                .then(function (data) {
                    // TODO: I want to map this data back onto the data object, how?
                });
        }
    },

    mapRawDataToObject: {
        value: function (rawData, object) {
            if (object.constructor === Contents) {
                object.body = rawData;
            }
        }
    }
});
