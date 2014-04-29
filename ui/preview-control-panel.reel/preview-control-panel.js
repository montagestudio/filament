var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

exports.PreviewControlPanel = Component.specialize({

    constructor: {
        value: function PreviewControlPanel () {
            this.super();
        }
    },

    _previewController: {
        value: null
    },

    previewController: {
        get: function() {
            return this._previewController;
        },
        set: function(previewController) {
            if (this._previewController === previewController) {
                return;
            }

            if (this._previewController) {
                application.removeEventListener("previewClientConnected", this, false);
                application.removeEventListener("previewClientDisconnected", this, false);
            }

            if (previewController) {
                var self = this;
                previewController.environmentBridge.getPreviewClients().then(function(data) {
                    // data = {
                    //     clientId: "2757b2e9-aab0-49b5-b6c0-57acaab351c2",
                    //     remoteAddress: "172.17.42.1",
                    //     userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.131 Safari/537.36",
                    //     xForwardedFor: "10.0.2.2"
                    // }
                    if (data) {
                        self.templateObjects.rangeController.content = data;
                    }
                }).done();

                application.addEventListener("previewClientConnected", self, false);
                application.addEventListener("previewClientDisconnected", self, false);
            }

            this._previewController = previewController;
        }
    },

    browserIconFor: {
        value: function(item) {
            var browser = item.browser.toLowerCase();
            switch (browser) {
                case 'chrome':
                case 'safari':
                case 'firefox':
                    return document.baseURI + 'assets/img/' + browser + '_32x32.png';
                default:
                    //TODO: Show some dummy icon, such as "?"
                    console.warn('No browser icon for', browser);
                    return '';
            }
        }
    },

    handlePreviewClientConnected: {
        value: function(event) {
            this.templateObjects.rangeController.add(event.detail);
        }
    },

    handlePreviewClientDisconnected: {
        value: function(event) {
            this.templateObjects.rangeController.delete(event.detail);
        }
    },

    enterDocument: {
        value: function() {
            var self = this;
            this.templateObjects.accessCode.element.addEventListener("focus", function() {
                self.needsDraw = self.needsSelectText = true;
            }, false);
        }
    },

    needsSelectText: {
        value: false
    },

    draw: {
        value: function() {
            if (this.needsSelectText) {
                this.templateObjects.accessCode.element.select();
            }
        }
    }

});
