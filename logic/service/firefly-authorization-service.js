var HttpService = require("montage/data/service/http-service").HttpService,
    Promise = require("montage/core/promise").Promise;

exports.FireflyAuthorizationService = HttpService.specialize({

    providesAuthorization: {
        value: true
    },

    authorizationPanel: {
        value: "ui/firefly-authorization-panel.reel"
    },

    authorize: {
        value: function (githubAuthorization) {
            if (!githubAuthorization) {
                return Promise.resolve();
            }
            var self =  this,
                jwtUrl = window.location.protocol + "//jwt." + window.location.host + "/login",
                headers = { "Content-Type": "application/json" };
            return this.fetchHttpRawData(jwtUrl, headers, JSON.stringify(githubAuthorization), HttpService.DataType.TEXT, false)
                .then(function (jwt) {
                    self.authorization = jwt;
                    // We need to add the JWT token as a browser cookie for WS communications because:
                    // - Chrome does not send an "Authorization" header with a WS URL like
                    //   authtoken@montage.studio/user/repo
                    // - We can't leverage WebSocket subprotocols to pass the token because the
                    //   Project Daemon and Project services use subprotocols internally and there is
                    //   no way to "override" the chosen protocol (sec-websocket-protocol header) when
                    //   we pipe one WS connection into another
                    // - There is no way to send arbitrary response headers over a WS handshake
                    // So we resort to setting a local cookie, which does get sent with WS connections
                    document.cookie = "token=" + jwt + "; domain=." + window.location.hostname + "; path=/";
                    return self.authorization;
                });
        }
    }
});
