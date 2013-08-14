/* global lumieres */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    PDF2HTML = require("plume/core/pdf2html.js").PDF2HTML,
    PDF2HTMLCache = require("plume/core/pdf2html-cache.js").PDF2HTMLCache;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");


exports.Main = Montage.create(Component, {

    params: {
        value: false
    },

    _document: {
        value: null
    },

    name: {
        value: null
    },

    pageNumber: {
        value: null
    },

    numberOfPages: {
        value: null
    },

    statusLabel: {
        value: "Importing…"
    },

    commonCSS: {
        value: ""
    },

    constructor: {
        value: function Main() {
            var self = this;

            this.super();

            if (IS_IN_LUMIERES) {
                this.params = {};
                window.location.search.substr(1).split("&").forEach(function(query) {
                    var param = query.split("=", 2);
                    self.params[param[0]] = param[1] !== undefined ? decodeURIComponent(param[1]) : null;
                });

                this.name = this.params.source.substr(this.params.source.lastIndexOf('/') + 1);

                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'assets/page-style.css', true);
                xhr.responseType = 'text';

                xhr.onload = function(e) {
                  if (this.status == 200) {
                      self.commonCSS = this.response;

                      require.async("core/lumieres-bridge").then(function (exported) {
                          self.environmentBridge = exported.LumiereBridge.create();

                          return PDF2HTML.getDocument(self.params.source, self.params.dest).then(function(pdf) {
                              if (pdf) {
                                  self._document = pdf;
                                  self.numberOfPages = pdf.pdfInfo.numPages;
                                  self.pageNumber = 1;
                                  // Create the PDF cache, share between the pages
                                  return Montage.create(PDF2HTMLCache).initialize(self.params.dest + "/assets/", pdf).then(function(cache) {
                                      PDFJS.objectsCache = cache;

                                      self.convertNextPage();
                                  });
                              }
                          });

                      });
                  }
                };

                xhr.send();
            } else {
                // Feature only supported in Lumières
                window.close();
            }
        }
    },

    //This would be a good case of the whole "custom loading scenario" idea
    environmentBridge: {
        value: null
    },

//    handleOpenDocument: {
//        value: function (evt) {
//            this.environmentBridge.open(evt.detail.url).then(function () {
//                window.close();
//            }).done();
//        }
//    },
//
//    handleOpenAppButtonAction: {
//        value: function () {
//            var self = this;
//            this.environmentBridge.promptForOpen({canChooseDirectories: true}).then(function (url) {
//                if (url) {
//                    return self.environmentBridge.open(url).then(function () {
//                        window.close();
//                    });
//                }
//            }).done();
//        }
//    }

    draw: {
        value: function () {
            var self = this;

            if (this._showPrompt) {
                this._showPrompt = false;

//                this.environmentBridge.promptForOpen({canChooseDirectories: false, displayAsSheet: false}).then(function (url) {
//                    if (url) {
//                        lumieres.document.show();
////                                return self.environmentBridge.open(url).then(function () {
////                                    window.close();
////                                });
//                    } else {
//                        lumieres.document.close();
//                    }
//                }, function() {
//                    lumieres.document.close();
//                }).done();

            }
        }
    },

    convertNextPage: {
        value: function() {
            var self = this,
                canvas = document.getElementById("canvas"),
                output = document.getElementById("output");

            // Updating the status
            this.statusLabel = "Importing page " + this.pageNumber + " of " + this.numberOfPages;

            // Loading the page
            PDF2HTML.getPage(this._document, this.pageNumber).then(function(page) {
                // Rendering the page
                PDF2HTML.rootDirectory = self.params.dest + "/ui/page" + self.pageNumber + ".reel";
                PDF2HTML.renderingMode = PDF2HTML.RENDERING_MODE.hybrid;
//                PDF2HTML.renderingMode = PDF2HTML.RENDERING_MODE.svg;

                PDF2HTML.renderPage(page, canvas, output, 1.0, true).then(function(output) {
                    console.log(output);

                    // Create the page component
                    self.environmentBridge.createComponent("page" + self.pageNumber, self.params.dest + "/ui").then(function(component) {
                        var fs = self.environmentBridge.backend.get("fs"),
                            componentPath = component + ".reel";
                        console.log("componentURL:",componentPath);

                        // Update the html
                        fs.invoke("read", componentPath + "/page" +  self.pageNumber + ".html").then(function(data) {
                            var pattern = '<div data-montage-id="Page' + self.pageNumber + '" class="Page' + self.pageNumber + '">',
                                insertPoint = data.indexOf(pattern),
                                newData = "";

                            // JFD TODO: convert absolute URL to relative

                            if (insertPoint !== -1) {
                                insertPoint += pattern.length;
                                newData = data.substring(0, insertPoint) + "\r" + output.data + data.substring(insertPoint);
                            }

                            // Add the common page class to the parent div
                            newData = newData.replace('class="Page' + self.pageNumber + '"', 'class="page Page' + self.pageNumber + '"');

                            fs.invoke("write", componentPath + "/page" +  self.pageNumber + ".html", newData).then(function() {
                                // Update the css
                                fs.invoke("append", componentPath + "/page" +  self.pageNumber + ".css", "\r" + output.style + "\r" + self.commonCSS).then(function(data) {
                                    self.pageNumber ++;
                                    if (self.pageNumber <= self.numberOfPages) {
                                        self.convertNextPage();
                                    } else {
                                        // TODO: generate table of Content
//                                          lumieres.document.close();
                                    }
                                });
                            });
                        });
                    });
                });
            });
        }
    }
});
