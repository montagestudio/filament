var RawDataService = require("montage/data/service/raw-data-service").RawDataService,
    GithubAuthorization = require("logic/model/github-authorization").GithubAuthorization,
    Promise = require("montage/core/promise").Promise;

exports.GithubAuthorizationService = RawDataService.specialize({

    providesAuthorization: {
        value: true
    },

    authorizationPanel: {
        value: "ui/github-authorization-panel.reel"
    },

    authorize: {
        value: function (panelResult) {
            var self = this;
            return new Promise(function (resolve, reject) {
                if (panelResult) {
                    self.authorization = self._mapRawDataToGithubAuthorization(panelResult);
                    resolve(self.authorization);
                } else {
                    resolve(null);
                }
            });
        }
     },

     _mapRawDataToGithubAuthorization: {
        value: function (rawData) {
            var authorization = new GithubAuthorization();
            authorization.profile = rawData.profile;
            authorization.token = rawData.token;
            return authorization;
        }
     }
});
