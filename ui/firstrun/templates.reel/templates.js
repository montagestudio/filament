var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.Templates = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var thumbs = document.getElementsByClassName('Templates-thumb');
            for(var i = 0; i < thumbs.length; i++) {
                var thumb = thumbs[i];
                thumb.onclick = function() {
                    var main = document.getElementById('main');
                    main.classList.remove('isFirstrun');
                    main.classList.add('isEditor');
                }
            }
            
        }
    }

});
