var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Nav = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var library = document.getElementById('library'),
                libraryButton = document.getElementById('libraryButton'),
                
                configurator = document.getElementById('configurator'),
                configuratorButton = document.getElementById('configuratorButton');
            
            libraryButton.onclick = function() {
                libraryButton.classList.toggle('selected');
                library.classList.toggle('Panel--hidden');
            }
            
            configuratorButton.onclick = function() {
                configuratorButton.classList.toggle('selected');
                configurator.classList.toggle('Panel--hidden');
            }
                        
        }
    }

});
