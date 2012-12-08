var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Editor = Montage.create(Component, {

    templateDidLoad: {
        value: function() {
            //console.log("main templateDidLoad")
        }
    },

    prepareForDraw: {
        value: function() {
            //console.log("main prepareForDraw")
        }
    }

});
