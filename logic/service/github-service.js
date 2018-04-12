var HttpService = require("montage/data/service/http-service").HttpService,
    DataService = require("montage/data/service/data-service").DataService;

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
            var self = this,
                apiUrl = API_URL + "/user";

            return this.fetchHttpRawData(apiUrl, undefined, undefined, undefined, false).then(function (user) {
                self.addRawData(stream, [user]);
                self.rawDataDone(stream);
            });
        }
    }
});
