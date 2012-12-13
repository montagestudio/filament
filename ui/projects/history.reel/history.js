var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.History = Montage.create(Component, {

    prepareForDraw: {
        value: function() {
            
            var items = document.getElementsByClassName('History-list-item');
            var overviewButton = document.getElementById('overviewButton');
            var editorButton = document.getElementById('editorButton');
            
            for(var i = 0; i < items.length; i++) {
                var item = items[i];
                item.onclick = function() {
                    overviewButton.classList.remove('active');
                    editorButton.classList.add('active');
                    
                    var main = document.getElementById('main');
                    main.classList.remove('isFirstrun');
                    main.classList.remove('isOverview');
                    main.classList.add('isEditor');
                    
                    var app = document.getElementById('app');
                    app.setAttribute("src", this.dataset.src);
                }
            }
            
        }
    }




});
