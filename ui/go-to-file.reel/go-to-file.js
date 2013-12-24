/**
 * @module ./go-to-file.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class GoToFile
 * @extends Component
 */
exports.GoToFile = Component.specialize(/** @lends GoToFile# */ {
    constructor: {
        value: function GoToFile() {
            this.super();
            this.addOwnPropertyChangeListener("searchText", this, false);
            this.defineBindings({
                "files": {"<-": "filesMap.values()"}
            });
        }
    },

    searchText: {
        value: ""
    },

    filesMap: {
        value: null
    },

    _files: {
        value: null
    },

    files: {
        set: function(value) {
            if (value !== this._files) {
                this._files = value;
                if (this.templateObjects) {
                    this._updateMatchList();
                }
            }
        },
        get: function() {
            return this._files;
        }
    },

    matchFilesMax: {
        value: 15
    },

    show: {
        value: function() {
            var templateObjects = this.templateObjects;

            templateObjects.overlay.show();
            setTimeout(function() {
                templateObjects.searchField.element.focus();
            }, 150);
        }
    },

    _updateMatchList: {
        value: function() {
            var searchText = this.searchText,
                files = this.files,
                content = [];

            //var startTime = window.performance.now();
            if (searchText) {
                for (var i = 0, file; (file = files[i]); i++) {
                    file.score = this._scoreFile(file, searchText);
                    if (file.score !== null) {
                        content.push(file);
                    }
                }
            }

            content.sort(function(file1, file2) {
                return file1.score - file2.score;
            });
            if (content.length > this.matchFilesMax) {
                content = content.slice(0, this.matchFilesMax);
            }

            //console.log(window.performance.now() - startTime, content.length);
            this.templateObjects.matchList.content = content;
            this.templateObjects.matchList.selection = [content[0]];
            this._selectedFileIndex = 0;
        }
    },

    /**
     * Score the file based on the skipped characters of the filename when
     * matching the searchText. If the searchText is not matched at all null is
     * returned because a score is not possible.
     */
    _scoreFile: {
        value: function(file, searchText) {
            var j = 0,
                name = file.name,
                skipped = 0,
                i, ii;

            search:
            for (i = 0, ii = searchText.length; i < ii; i++, j++) {
                while (searchText[i] !== name[j]) {
                    if (j < name.length) {
                        j++;
                        skipped++;
                    } else {
                        break search;
                    }
                }
            }

            return ii === i ? skipped : null;
        }
    },

    handleSearchTextChange: {
        value: function() {
            if (this.files) {
                this._updateMatchList();
            }
        }
    },

    handleGoUpKeyPress: {
        value: function() {
            var matchList = this.templateObjects.matchList;

            if (this._selectedFileIndex === 0) {
                this._selectedFileIndex = matchList.content.length - 1;
            } else {
                this._selectedFileIndex--;
            }
            matchList.selection = [matchList.content[this._selectedFileIndex]];
        }
    },

    handleGoDownKeyPress: {
        value: function() {
            var matchList = this.templateObjects.matchList;

            this._selectedFileIndex = (this._selectedFileIndex+1) % matchList.content.length;
            matchList.selection = [matchList.content[this._selectedFileIndex]];
        }
    },

    handleSearchFieldAction: {
        value: function() {
            var file = this.templateObjects.matchList.selection[0];

            this.dispatchEventNamed("openUrl", true, true, file.fileUrl);
            this.templateObjects.overlay.hide();
        }
    },

    /// OVERLAY DELEGATE METHODS

    willPositionOverlay: {
        value: function() {
            var overlayWidth = this.templateObjects.overlay.element.offsetWidth;

            return {
                left: (window.innerWidth / 2) - (overlayWidth / 2),
                top: 50
            };
        }
    }
});
