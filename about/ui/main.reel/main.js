/* global lumieres */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    version: {
        value: "X"
    },

    buildVersion: {
        value: "X"
    },

    constructor: {
        value: function () {
            if (IS_IN_LUMIERES) {
                this.version = lumieres.version;
                this.buildVersion = lumieres.buildVersion;
                this.buildNumber = lumieres.buildNumber;
            }
        }
    }

});
