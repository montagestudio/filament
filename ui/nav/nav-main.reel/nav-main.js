var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.NavMain = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var packageExplorerIsCollapsed = false,
                packageExplorer = document.getElementById('packageExplorer'),
                packageExplorerButton = document.getElementById('packageExplorerButton');
            
            packageExplorerButton.onclick = function() {
                packageExplorerButton.classList.toggle('selected');
                packageExplorer.classList.toggle('Panel--hidden');
            }
                        
        }
    }


});
