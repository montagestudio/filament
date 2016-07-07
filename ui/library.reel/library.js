var panel = require("ui/panel.reel"),
    Panel = panel.Panel;

exports.Library = Panel.specialize({

    groups: {
        value: null
    },

    groupsController: {
        value: null
    },

    isList: {
        value: true
    },

    prepareForActivationEvents: {
        value: function () {
            this._element.addEventListener("dragstart", this, false);
        }
    },

    handleDragstart: {
        value: function (event) {
            if (this.state === panel.FLOATING_STATE) {
                this.state = panel.HIDDEN_STATE;
            }
        }
    },

    _filterTerm: {
        value: null
    },

    filterTerm: {
        get: function () {
            return this._filterTerm;
        },
        set: function (value) {
            if (value === this._filterTerm) {
                return;
            }

            this.dispatchBeforeOwnPropertyChange("filterPath", this.filterPath);
            this._filterPath = null;
            this._filterTerm = value;
            this.dispatchOwnPropertyChange("filterPath", this.filterPath);
        }
    },

    _filterPath : {
        value: null
    },

    filterPath: {
        get: function () {
            var term = this.filterTerm;
            if (!this._filterPath && term) {
                // TODO remove manual capitalization once we can specify case insensitivity
                var capitalizedTerm = term.toCapitalized();
                this._filterPath = "name.contains('" + term + "') || label.contains('" + term + "') || name.contains('" + capitalizedTerm + "') || label.contains('" + capitalizedTerm + "')";
            }

            return this._filterPath;
        }
    },

    assetsManager: {
        value: null
    },
    
    
    //TODO: Implement bellow in the "proper way"
    
    handleLibraryTabAction: {
        value: function(evt) {
            this.classList.remove("is-assets");
            this.classList.add("is-package");
        }
    },
    
    handleAssetsLibraryTabAction: {
        value: function(evt) {
            this.classList.remove("is-package");
            this.classList.add("is-assets");
        }
    }

});
