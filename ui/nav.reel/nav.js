var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Nav = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var main = document.getElementById('main');
            var libraryButton = document.getElementById('libraryButton');
            var explorerButton = document.getElementById('explorerButton');
            
            
            libraryButton.onclick = function() {
                explorerButton.classList.remove('active');
                this.classList.add('active');
                
                //console.log(overviewButton);
                
                main.classList.remove('isExplorer');
                main.classList.add('isLibrary');
            }
            
            
            explorerButton.onclick = function() {
                libraryButton.classList.remove('active');
                this.classList.add('active');
                
                //console.log(editorButton);
                main.classList.remove('isLibrary');
                main.classList.add('isExplorer');
            }
                        
        }
    }

});
