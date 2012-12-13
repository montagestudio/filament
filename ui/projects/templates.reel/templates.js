var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Templates = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var thumbs = document.getElementsByClassName('Templates-thumb');
            var overviewButton = document.getElementById('overviewButton');
            var editorButton = document.getElementById('editorButton');
            
            for(var i = 0; i < thumbs.length; i++) {
                var thumb = thumbs[i];
                thumb.onclick = function() {
                    overviewButton.classList.remove('active');
                    editorButton.classList.add('active');
                    
                    var main = document.getElementById('main');
                    main.classList.remove('isFirstrun');
                    main.classList.remove('isOverview');
                    main.classList.add('isEditor');
                }
            }
            
        }
    }

});
