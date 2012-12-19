var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Stage = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var main = document.getElementById('main');
            var device = document.getElementById('device');
            var libraryButton = document.getElementById('libraryButton');
            var explorerButton = document.getElementById('explorerButton');
            
            device.onclick = function() {
                libraryButton.classList.remove('active');
                explorerButton.classList.add('active');
                main.classList.remove('isLibrary');
                main.classList.add('isExplorer');
            }
                        
        }
    }

});
