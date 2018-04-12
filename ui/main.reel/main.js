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
            DataService.authorizationManager.delegate = this;
            this._initializeServices();
        }
    },

    isAuthenticated: {
        value: false
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
        }
    }
});
