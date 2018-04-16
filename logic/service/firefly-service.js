var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService;

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
        value: ["./github-authorization-service"]
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
                headers["x-access-token"] = authorization[0].token;
            }
        }
    },

    fetchRawData: {
        value: function (stream) {
            var self = this;
            return this.fetchHttpRawData(this.apiUrl + "/workspaces")
                .then(function (workspaces) {
                    self.addRawData(stream, workspaces);
                    self.rawDataDone(stream);
                });
        }
    }
});
