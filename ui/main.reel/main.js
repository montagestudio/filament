/**
 * @module ui/main.reel
 */
var Component = require("montage/ui/component").Component,
    DataService = require("montage/data/service/data-service").DataService,
    applicationService = require("data/montage-data.mjson").montageObject;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();

            // Montage Data
            DataService.authorizationManager.delegate = this;
            this._initializeServices();

            // Routing
            this.application.router = this;
            window.addEventListener("popstate", this.handleLocationChange.bind(this));
            this.location = window.location.href;
        }
    },

    isAuthenticated: {
        value: false
    },

    isProjectOpen: {
        value: undefined
    },

    location: {
        set: function (location) {
            window.history.pushState({}, location, location);
            this.handleLocationChange();
        }
    },

    _initializeServices: {
        value: function () {
            this.application.service = applicationService;
        }
    },

    authorizationManagerWillInstantiateAuthorizationPanelForService: {
        value: function(authorizationManager, authorizationPanel, authorizationService) {
            this.authorizationPanel = new authorizationPanel();
            this.isAuthenticationLoading = true;
            return this.authorizationPanel;
        }
    },

    authorizationManagerDidAuthorizeService: {
        value: function(authorizationManager, dataService) {
            this.isAuthenticated = true;
            this.isAuthenticationLoading = false;

            // TODO: Weird way to get the authentication
            var authorization = dataService.rootService.childServices.map(function (service) {
                return service.authorization && service.authorization[0];
            }).filter(function (authorization) {
                return authorization;
            })[0];

            // We need to add the JWT token as a browser cookie for WS communications because:
            // - Chrome does not send an "Authorization" header with a WS URL like
            //   authtoken@montage.studio/user/repo
            // - We can't leverage WebSocket subprotocols to pass the token because the
            //   Project Daemon and Project services use subprotocols internally and there is
            //   no way to "override" the chosen protocol (sec-websocket-protocol header) when
            //   we pipe one WS connection into another
            // - There is no way to send arbitrary response headers over a WS handshake
            // So we resort to setting a local cookie, which does get sent with WS connections
            document.cookie = "token=" + authorization.token + "; domain=." + window.location.hostname + ";";
        }
    },

    handleLocationChange: {
        value: function () {
            var pathname = window.location.pathname;
            if (pathname.split("/").length === 3) {
                // --> /owner/repo
                this.isProjectOpen = true;
            } else {
                // --> /
                this.isProjectOpen = false;
            }
        }
    }
});
