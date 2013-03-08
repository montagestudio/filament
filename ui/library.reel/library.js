var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Library = Montage.create(Component, {
    
    prepareForDraw: {
        value: function() {
            
            var currentDisplay = "Library--grid";
            var LibraryGrid = document.getElementById('LibraryGrid');
            var LibraryGridButton = document.getElementById('LibraryGridButton');
            
            LibraryGridButton.onclick = function() {
                
                if(currentDisplay == 'Library--grid') {
                    LibraryGrid.classList.remove('Library--grid');
                    LibraryGrid.classList.add('Library--withDetails');
                    currentDisplay = 'Library--withDetails';
                
                } else if (currentDisplay == 'Library--withDetails') {
                    LibraryGrid.classList.remove('Library--withDetails');
                    LibraryGrid.classList.add('Library--labelOnly');
                    currentDisplay = 'Library--labelOnly';
                
                } else if (currentDisplay == 'Library--labelOnly') {
                    LibraryGrid.classList.remove('Library--labelOnly');
                    LibraryGrid.classList.add('Library--grid');
                    currentDisplay = 'Library--grid';
                }
            }
                        
        }
    }

});
