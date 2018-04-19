var AuthorizationPanel = require("montage/ui/authorization-panel.reel").AuthorizationPanel;

/**
 * @class FireflyAuthorizationPanel
 * @extends AuthorizationPanel
 */
exports.FireflyAuthorizationPanel = AuthorizationPanel.specialize({

    isAuthenticated: {
        value: false
    },

    githubAuthorizationPanel: {
        get: function () {
            return this._githubAuthorizationPanel;
        },
        set: function (panel) {
            var self = this;
            this._githubAuthorizationPanel = panel;
            panel.addOwnPropertyChangeListener("authorization", function (githubAuthorization) {
                if (githubAuthorization) {
                    self.service.authorize(githubAuthorization)
                        .then(function (fireflyAuthorization) {
                            self.authorizationManagerPanel.approveAuthorization(fireflyAuthorization, self);
                        });
                }
            })
        }
    }
});
