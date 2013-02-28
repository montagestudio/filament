var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Ghosts = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            this._element.addEventListener("click", function(event) {
                this.classList.toggle("Panel--collapsed");
            }, false); 
        }
    }

});
