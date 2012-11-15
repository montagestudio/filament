var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Connection = require("q-comm"),
    AuthoringDocument = require("palette/core/authoring-document").AuthoringDocument;

var isInLumieres = (typeof lumieres !== "undefined");

if (isInLumieres) {
    var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));

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

    prototypes: {
        value: require("palette/core/components.js").components
    },

    didCreate: {
        value: function () {

            console.log("didLoad", isInLumieres);

            if (isInLumieres) {
                // var req = new XMLHttpRequest();
                // req.open("GET", "document://Users/mike/Projects/montage/ui/slot.reel/slot.html");
                // req.identifier = "loadRequest";
                // req.addEventListener("load", this, false);
                // req.addEventListener("error", this, false);
                // req.send();
            }
        }
    },

    handleLoadRequestLoad: {
        value: function (evt) {
            console.log("load", evt);
        }
    },

    handleLoadRequestError: {
        value: function (evt) {
            console.log("fail", evt);
        }
    },

    workbench: {
        value: null
    },

    // TODO support multiple select
    selectedObject: {
        value: null
    },

    prepareForDraw: {
        value: function () {
            this.workbench.currentDocument = AuthoringDocument.create();
            this.addEventListener("action", this, false);

        }
    },

    handlePrototypeButtonAction: {
        value: function (evt) {
            var prototypeEntry = evt.target.prototypeObject;
            this.workbench.addComponent(
                prototypeEntry.serialization.prototype,
                prototypeEntry.name,
                prototypeEntry.html,
                prototypeEntry.properties,
                prototypeEntry.postProcess
            );
        }
    }

});
