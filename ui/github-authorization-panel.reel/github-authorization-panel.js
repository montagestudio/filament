var AuthorizationPanel = require("montage/ui/authorization-panel.reel").AuthorizationPanel,
    Promise = require('montage/core/promise').Promise;

/**
 * @class GithubAuthorizationPanel
 * @extends AuthorizationPanel
 */
exports.GithubAuthorizationPanel = AuthorizationPanel.specialize({

    isAuthenticated: {
        value: false
    },

    needsTutorial: {
        value: true
    },

    credentials: {
        get: function () {
            var credentials = localStorage.getItem("github-credentials");
            return credentials ? JSON.parse(credentials) : null;
        },
        set: function (credentials) {
            if (credentials) {
                localStorage.setItem("github-credentials", JSON.stringify(credentials));
            } else {
                localStorage.removeItem("github-credentials");
            }
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var self = this;
            if (firstTime) {
                var needsTutorial = JSON.parse(localStorage.getItem("needsTutorial"));

                if (null === needsTutorial) {
                    localStorage.setItem("needsTutorial", true);
                    needsTutorial = true;
                }

                this.needsTutorial = needsTutorial;
            }
            var credentials = this.credentials;
            if (credentials) {
                this.authorization = credentials;
                this.service.authorize(credentials)
                    .then(function (authorization) {
                        self.authorizationManagerPanel.approveAuthorization(authorization, self);
                    })
                    .done();
            }
        }
    },

    handleLoginButtonAction: {
        value: function(event) {
            var self = this;
            Promise.resolve(this.credentials)
                .then(function (credentials) {
                    if (credentials) {
                        return credentials;
                    } else {
                        var popup = self._openPopup("/auth/github");
                        return self._pollForCredentials(popup)
                            .then(function (credentials) {
                                self.credentials = credentials;
                                return credentials;
                            }).finally(function () {
                                if (typeof popup.close === 'function') {
                                    popup.close();
                                }
                            });
                    }
                })
                .then(function (credentials) {
                    self.authorization = credentials;
                    return self.service.authorize(credentials);
                })
                .then(function (authorization) {
                    self.authorizationManagerPanel.approveAuthorization(authorization, self);
                })
                .catch(function (error) {
                    console.error(error);
                    self.authorizationManagerPanel.cancelAuthorization();
                })
                .done();
        }
    },

    logout: {
        value: function() {
            this.credentials = null;
            this.authorizationManagerPanel.cancelAuthorization();
        }
    },

    _pollForCredentials: {
        value: function (popup) {
            var self = this,
                pollingInterval = 100,
                polling;

            return new Promise(function (resolve, reject) {
                if (!popup) {
                    reject('Authorization Failed (POPUP_BLOCKED)');
                } else {
                    polling = setTimeout(function tryPollPopup() {
                        try {
                            var documentOrigin = window.location.host,
                                popupWindowLocation = popup.location,
                                popupWindowOrigin = popupWindowLocation.host;

                            if (popupWindowOrigin === documentOrigin) {
                                if (popup.document.readyState === "complete") {
                                    resolve(new URL(popupWindowLocation));
                                }
                            }
                        } catch (err) {
                            console.error(err);
                            // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
                        } finally {
                            // we're here when the child window has been navigated away or closed
                            if (!popup || popup.closed || popup.closed === undefined) {
                                reject('Authorization Failed (LOAD_CANCEL)');
                            } else if (popup) {
                                // we're here when the child window returned to our domain
                                setTimeout(tryPollPopup, pollingInterval);
                            }
                        }
                    }, pollingInterval);
                }
            }).then(function (popupWindowLocation) {
                return new Promise(function (resolve, reject) {
                    var token = self._getHashParam(popupWindowLocation, 'result'),
                        error = self._getHashParam(popupWindowLocation, 'error');

                    if (error) {
                        return reject(error);
                    } else if (!token) {
                        return reject("No token");
                    } else {
                       return resolve(token);
                    }
                });
            });
        }
    },

    _openPopup: {
        value: function (url, options) {
            var popupOptions = this._stringifyOptions(this._prepareOptions(options)),
                popupName = 'authorization-panel',
                popupWindow = window.open(url, popupName, popupOptions);

            if (popupWindow) {
                return popupWindow;
            } else {
                throw new Error('Unable to open popup');
            }
        }
    },

    _prepareOptions: {
        value: function (options) {
            options = options || {};

            var width = options.width || 500,
                height = options.height || 500,
                preparedOptions = {
                    width: width,
                    height: height,
                    left: parseInt(window.screenX + ((window.outerWidth - width) / 2)),
                    top: parseInt(window.screenY + ((window.outerHeight - height) / 2.5)),
                    toolbar: "no",
                    location: "no",
                    directories: "no",
                    status: "no",
                    menubar: "no",
                    scrollbars: "yes",
                    resizable: "no",
                    copyhistory: "no"
                };

            Object.keys(options).forEach(function(key) {
                preparedOptions[key] = options[key];
            });

            return preparedOptions;
        }
    },

    _stringifyOptions: {
        value: function (options) {
            var parts = [];
            Object.keys(options).forEach(function(key) {
                parts.push(key + '=' + options[key]);
            });

            return parts.join(',');
        }
    },

    _getHashParam: {
        value: function (url, name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[#&?]' + name + '=([^;]*)'),
                results = regex.exec(url.search || url.hash);

            return results === null ? '' : JSON.parse(decodeURIComponent(results[1].replace(/\+/g, ' ')));
        }
    }
});
