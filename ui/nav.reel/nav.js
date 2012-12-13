var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Nav = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var main = document.getElementById('main');
            var overviewButton = document.getElementById('overviewButton');
            var editorButton = document.getElementById('editorButton');
            
            
            overviewButton.onclick = function() {
                editorButton.classList.remove('active');
                this.classList.add('active');
                
                //console.log(overviewButton);
                
                main.classList.remove('isEditor');
                main.classList.add('isOverview');
            }
            
            
            editorButton.onclick = function() {
                overviewButton.classList.remove('active');
                this.classList.add('active');
                
                //console.log(editorButton);
                main.classList.remove('isOverview');
                main.classList.add('isEditor');
            }
                        
        }
    }

});
