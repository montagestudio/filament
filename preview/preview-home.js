/* global lumieres */
var Montage = require("montage").Montage;

exports.PreviewHome = Montage.create(Montage, {
    previewList: {
        value: []
    },

    didCreate: {
        value: function() {
            this.doRefresh();
            window.addEventListener("lumieresRefresh", this);
        }
    },

    doRefresh: {
        value: function() {
            // Let's figure out the node port by sending a request to the http port
            var thisRef = this,
                xhr = new XMLHttpRequest();

            xhr.open('GET', '/{$GLOBALS}', true);
            xhr.responseType = 'text';

            xhr.onload = function(event) {
                try {
                    if (this.status == 200) {
                        lumieres = JSON.parse(this.response);
                        thisRef.previewList = lumieres.previewList;
                    } else {
                        console.log("ERROR:", this.status, this.response);
                    }
                } catch(error) {};
            };

            xhr.send();
        }
    },

    handleLumieresRefresh: {
        value: function(event) {
            this.doRefresh();
            event.stopPropagation();
            event.preventDefault();
        }
    }
});
