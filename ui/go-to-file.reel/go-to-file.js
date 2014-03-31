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

    /**
     * HACK: This property supports the hackish way we learn about someone
     * clicking on an item of the repetition.
     * When a repetition item is clicked on it is also selected, we listen for
     * this selection change and open the file.
     * However, we also set the selection when navigating the list with the key
     * and do not wish to open the file on that case. This property is a flag
     * that indicates to the selection change listener if the selection was
     * initiated by us or by the internal repetition mechanism.
     */
    _updatingSelection: {
        value: false
    },

    searchText: {
        value: ""
    },

    lastSearchText: {
        value: ""
    },

    filesMap: {
        value: null
    },

    files: {
        value: null
    },

    recentUrls: {
        value: null
    },

    matchFilesMax: {
        value: 15
    },

    templateDidLoad: {
        value: function() {
            this.addPathChangeListener("files", this, "_updateMatchList");
            this.addPathChangeListener("filesMap", this, "_updateMatchList");
            this.addPathChangeListener("recentUrls", this, "_updateMatchList");

            this._updatingSelection = true;
            this.templateObjects.matchList.addRangeAtPathChangeListener("contentController.selection", this, "handleSelectionChange");
            this._updatingSelection = false;
        }
    },

    didDraw: {
        value: function() {
            var templateObjects = this.templateObjects;
            var searchFieldElement = templateObjects.searchField.element;

            if (searchFieldElement) {
                searchFieldElement.focus();
                searchFieldElement.select();
                if (templateObjects.overlay._isShown
                    && document.activeElement !== searchFieldElement) {
                    // The overlay uses a more-than-1-draw scheme to draw itself.
                    // It needs to adopt this strategy because we lack a draw
                    // manager that can add elements to the document.
                    // This is why .focus / .select might not work, because the
                    // target element needs to be drawn on the screen. Since we
                    // don't have the ability to know for sure when the overlay
                    // is visible on the screen we draw again until we are
                    // able to select the search field.
                    this.needsDraw = true;
                }
            }
        }
    },

    show: {
        value: function(preserveSearchText) {
            var templateObjects = this.templateObjects;

            if (preserveSearchText) {
                this.searchText = this.lastSearchText;
            } else {
                this.searchText = "";
            }
            this._updateMatchList();

            templateObjects.overlay.show();
            // Make sure the Overlay was shown before trying to focus the
            // search field.
            if (templateObjects.overlay._isShown) {
                this.needsDraw = true;
            }
        }
    },

    _updateMatchList: {
        value: function() {
            var searchText = this.searchText,
                files = this.files,
                filesMap = this.filesMap,
                recentUrls = this.recentUrls,
                content,
                selectedMatchIndex,
                selectedContent;

            //var startTime = window.performance.now();
            if (searchText) {

                content = [];

                for (var i = 0, file; (file = files[i]); i++) {
                    file.score = this._scoreFile(file, searchText);
                    if (file.score !== null) {
                        content.push(file);
                    }
                }

                content.sort(function(file1, file2) {
                    return file1.score - file2.score;
                });

                selectedMatchIndex = 0;

            } else if (recentUrls && filesMap) {
                // No search text show list of recently visited files
                content = recentUrls.map(function (url) {
                    return filesMap.get(url);
                });

                selectedMatchIndex = Math.min(1, content.length);
            }

            if (content && content.length > this.matchFilesMax) {
                content = content.slice(0, this.matchFilesMax);
            }

            //console.log(window.performance.now() - startTime, content.length);
            if (content) {
                this._updatingSelection = true;
                this.templateObjects.matchList.content = content;
                selectedContent = content[selectedMatchIndex];
                if (selectedContent) {
                    this.templateObjects.matchList.selection = [content[selectedMatchIndex]];
                    this._selectedFileIndex = selectedMatchIndex;
                }
                this._updatingSelection = false;

            }
        }
    },

    _openSelectedFile: {
        value: function() {
            if (this.searchText) {
                this.lastSearchText = this.searchText;
            }

            var file = this.templateObjects.matchList.contentController.selection[0];

            if (file) {
                this.dispatchEventNamed("openUrl", true, true, file.fileUrl);
                this.templateObjects.overlay.hide();
            }
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
                name = file.name.toLowerCase(),
                skipped = 0,
                i, ii;

            searchText = searchText.toLowerCase();

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
            var matchList = this.templateObjects.matchList,
                selectedFile;

            if (this._selectedFileIndex === 0) {
                this._selectedFileIndex = matchList.content.length - 1;
            } else {
                this._selectedFileIndex--;
            }
            this._updatingSelection = true;
            selectedFile = matchList.content[this._selectedFileIndex];
            if (selectedFile) {
                matchList.selection = [selectedFile];
            }
            this._updatingSelection = false;
        }
    },

    handleGoDownKeyPress: {
        value: function() {
            var matchList = this.templateObjects.matchList,
                selectedFile;

            this._selectedFileIndex = (this._selectedFileIndex+1) % matchList.content.length;
            this._updatingSelection = true;
            selectedFile = matchList.content[this._selectedFileIndex];
            if (selectedFile) {
                matchList.selection = [selectedFile];
            }
            this._updatingSelection = false;
        }
    },

    handleSearchFieldAction: {
        value: function() {
            this._openSelectedFile();
        }
    },

    handleSelectionChange: {
        value: function() {
            if (!this._updatingSelection) {
                this._openSelectedFile();
            }
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
