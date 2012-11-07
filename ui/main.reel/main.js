var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Connection = require("q-comm"),
    AuthoringDocument = require("palette/core/authoring-document").AuthoringDocument;

if (typeof global !== "undefined") {
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

    prototypes:{
        value: require("palette/core/components.js").components
    },

    workbench: {
        value: null
    },

    prepareForDraw: {
        value: function () {
            var doc = AuthoringDocument.create();
            this.workbench.currentDocument = doc;
            this.addEventListener("action", this, false);

        }
    },

    handlePrototypeButtonAction:{
        value:function (evt) {
            var prototypeEntry = evt.target.prototypeObject;
            this.workbench.addComponent(prototypeEntry.serialization.prototype, prototypeEntry.name, prototypeEntry.html);
        }
    }

});
