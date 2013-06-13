var Button = require("matte/ui/button.reel").Button,
    MimeTypes = require("core/mime-types");

exports.InsertionButton = Button.specialize({

    hasTemplate: {
        value: false
    },

    enterDocument: {
        value: function (firstTime) {

            this.super.apply(this, arguments);

            if (!firstTime) { return; }
            var element = this.element;
            element.addEventListener("dragover", this, false);
            element.addEventListener("dragenter", this, false);
            element.addEventListener("dragleave", this, false);
            element.addEventListener("drop", this, false);

            this.defineBinding("classList.has('NodeCell-InsertionButton--dropTarget')", {"<-": "isDropTarget"});
        }
    },

    isDropTarget: {
        value: false
    },

    acceptsDrop: {
        value: function (event) {
            return event.dataTransfer.types &&
                event.dataTransfer.types.indexOf(MimeTypes.PROTOTYPE_OBJECT) !== -1;
        }
    },

    handleDragover: {
        enumerable: false,
        value: function (event) {
            if (this.acceptsDrop(event)) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            } else {
                event.dataTransfer.dropEffect = "none";
            }
        }
    },

    handleDragenter: {
        enumerable: false,
        value: function (evt) {
            if (this.acceptsDrop(evt) && this.element === evt.target) {
                this.isDropTarget = true;
            }
        }
    },

    handleDragleave: {
        value: function (evt) {
            if (this.acceptsDrop(evt) && this.element === evt.target) {
                this.isDropTarget = false;
            }
        }
    },

    handleDrop: {
        enumerable: false,
        value: function (event) {

            event.stop();

            // TODO: security issues?
            var data = event.dataTransfer.getData(MimeTypes.PROTOTYPE_OBJECT),
                transferObject = JSON.parse(data);

            this.dispatchEventNamed("insertTemplateAction", true, true, {
                transferObject: transferObject
            });

            this.isDropTarget = false;
        }
    }
});
