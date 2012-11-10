var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Connection = require("q-comm");

if (typeof globals != "undefined") {
    var backend = Connection(new WebSocket("ws://localhost:" + globals.nodePort));

    // so you can play on the console:
    global.backend = backend;

    // DEMO
    backend.get("fs").invoke("list", "/")
    .then(function (list) {
        console.log("File list from Node backend:", list);
    })
    .end();
}

exports.Main = Montage.create(Component, {

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
