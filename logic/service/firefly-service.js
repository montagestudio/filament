var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService,
    Promise = require("montage/core/promise").Promise,
    Workspace = require("logic/model/workspace").Workspace,
    WorkspaceDescriptor = require("data/model/workspace.mjson").montageObject;

/**
 * @class
 * @extends external:DataService
 */
exports.FireflyService = HttpService.specialize(/** @lends FireflyService.prototype */ {

    authorizationPolicy: {
        value: DataService.AuthorizationPolicy.UP_FRONT
    },

    providesAuthorization: {
        value: false
    },

    apiUrl: {
        get: function () {
            return window.location.protocol + "//api." + window.location.host;
        }
    },

    authorizationServices: {
        value: ["./firefly-authorization-service"]
    },

    authorizationManagerWillAuthorizeWithService: {
        value: function (authorizationManager, authorizationService) {
            authorizationService.connectionDescriptor = this.authorizationDescriptor;
        }
    },

    setHeadersForQuery: {
        value: function (headers, query) {
            var authorization = this.authorization;

            if (authorization && authorization.length) {
                headers["x-access-token"] = authorization[0];
            }
        }
    },

    fetchRawData: {
        value: function (stream) {
            var self = this,
                type = stream.query.type,
                rawDataPromise;
            switch (type) {
                case WorkspaceDescriptor:
                    rawDataPromise = this._fetchWorkspacesRawData(stream);
                    break;
            }
            return rawDataPromise
                .then(function (data) {
                    self.addRawData(stream, Array.isArray(data) ? data : [data]);
                    self.rawDataDone(stream);
                });
        }
    },

    _fetchWorkspacesRawData: {
        value: function (stream) {
            var parameters = stream.query.criteria.parameters,
                owner = parameters && parameters.owner,
                repo = parameters && parameters.repo,
                apiUrl;
            if (owner && repo) {
                apiUrl = this.apiUrl + "/" + owner + "/" + repo + "/workspace";
            } else {
                apiUrl = this.apiUrl + "/workspaces";
            }
            return this.fetchHttpRawData(apiUrl);
        }
    },

    deleteRawData: {
        value: function (data, context) {
            switch (context.constructor) {
                case Workspace:
                    return this._deleteWorkspace(data, context);
            }
        }
    },

    _deleteWorkspace: {
        value: function (data, context) {
            var self = this,
                xhr = new XMLHttpRequest();
            return new Promise(function (resolve, reject) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        resolve(xhr);
                    }
                };
                xhr.onerror = function () {
                    reject(xhr.error);
                };
                xhr.open("DELETE", self.apiUrl + "/workspaces");
                xhr.setRequestHeader("x-access-token", self.authorization[0]);
                xhr.send();
            });
        }
    }
});
