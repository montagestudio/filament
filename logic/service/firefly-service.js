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
                headers['authorization-token'] = authorization[0].token;
                headers['authorization-secret'] = authorization[0].secret;
            }
        }
    },

    fetchRawData: {
        value: function (stream) {
            this.addRawData(stream, [{ foo: 'bar' }]);
            this.rawDataDone(stream);
        }
    }
});
