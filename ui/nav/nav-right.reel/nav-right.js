var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.NavRight = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var libraryIsCollapsed = false,
                library = document.getElementById('library'),
                libraryButton = document.getElementById('libraryButton');
            
            libraryButton.onclick = function() {
                libraryButton.classList.toggle('selected');
                library.classList.toggle('Panel--hidden');
            }
                        
        }
    }

});
