var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

var Template = require("montage/core/template").Template;

var WAITSFOR_TIMEOUT = 2000;

TestPageLoader.queueTest("editing-frame/editing-frame", function (testPage) {

    describe("ui/editing-frame-spec", function () {
        var editingFrame;
        beforeEach(function() {
            editingFrame = testPage.test.editingFrame;
        });

        it("should load", function () {
            expect(testPage.loaded).toBeTruthy();
        });

        describe("the editing frame", function () {
            it("should have no default source loaded in the stage", function () {
                expect(editingFrame.element.src).toBeFalsy();
            });

            describe("once loaded", function () {

                var nextDraw;
                beforeEach(function () {
                    editingFrame.reset();
                    nextDraw = testPage.nextDraw();
                });

                it("should not load without a fileUrl specified", function() {
                    expect(function() {
                        editingFrame.load();
                    }).toThrow();
                });

                it("should load the specified fileUrl", function () {
                    return nextDraw.then(function () {
                        var componentUrl = require.location + "templates/component.reel";
                        return editingFrame.load(componentUrl, require.location).then(function (editingDocument) {
                            var stageUrl = require.location + "stage/index.html?reel-location=" + encodeURIComponent(componentUrl) +
                                "&package-location=" + encodeURIComponent(require.location);
                            expect(editingFrame.iframe.src).toBe(stageUrl);
                        }).timeout(WAITSFOR_TIMEOUT);
                    });
                });

                it("should fulfill an editing document for the loaded reel", function () {
                    return nextDraw.then(function () {
                        var componentUrl = require.location + "templates/component.reel";
                        return editingFrame.load(componentUrl, require.location).then(function (editingDocument) {
                            expect(editingDocument).toBeTruthy();
                            expect(editingDocument.owner).toBeTruthy();
                        }).timeout(WAITSFOR_TIMEOUT);
                    });
                });


            });

        });

        describe("loading a template", function () {
            var template;
            var noOwnerHtml = '<html><head><script type="text/montage-serialization">{'+
                '    "text": {'+
                '        "prototype": "montage/ui/text.reel",'+
                '        "properties": {'+
                '            "element": {"#": "text"},'+
                '            "value": "pass"'+
                '        }'+
                '    }'+
                '}</script>'+
                '</head>' +
                '<body>' +
                '    <span data-montage-id="text"></span>' +
                '</body>' +
                '</html>';

            var ownerHtml = '<html><head>'+
                '    <script type="text/montage-serialization">'+
                '    {'+
                '        "owner": {'+
                '            "properties": {'+
                '                "element": {"#": "test"},'+
                '                "value": "pass"'+
                '            }'+
                '        },'+
                '        "text": {'+
                '            "prototype": "montage/ui/text.reel",'+
                '            "properties": {'+
                '                "element": {"#": "text"},'+
                '                "value": "pass"'+
                '            }'+
                '        }'+
                '    }'+
                '    </script>'+
                '</head>'+
                '<body>'+
                '    <div data-montage-id="test">'+
                '        <span data-montage-id="text"></span>'+
                '    </div>'+
                '</body>'+
                '</html>';

            beforeEach(function () {
                editingFrame.reset();
                template = Template.create();
            });

            describe("", function () {
                var init;
                beforeEach(function () {
                    init = template.initWithHtml(noOwnerHtml, require);
                });

                it("can be reloaded twice without errors", function () {
                    return init.then(function () {
                        editingFrame.loadTemplate(template);
                    }).then(function () {
                        var a = editingFrame.refresh(template);
                        var b = editingFrame.refresh(template);

                        return a.then(function (aInfo) {
                            expect(aInfo.template).not.toBe(template);
                            expect(b.isPending()).toBe(true);

                            return b.then(function (bInfo) {
                                expect(bInfo.template).not.toBe(aInfo.template);
                            });
                        });
                    });
                });
            });

            it("can load template without an owner", function () {
                return template.initWithHtml(noOwnerHtml, require)
                .then(function () {
                    return editingFrame.loadTemplate(template);
                })
                .then(function (info) {
                    expect(info.template).toBeDefined();
                    expect(info.frame).toBeDefined();

                    expect(info.template._require).not.toBe(require);

                    expect(info.frame.iframe.contentDocument.querySelector("[data-montage-id=text]").textContent).toBe("pass");
                });
            });

            it("can load template with an owner", function () {
                return template.initWithHtml(ownerHtml, require)
                .then(function () {
                    return editingFrame.loadTemplate(template, "test/ui/editing-frame/test.reel", "Abc");
                })
                .then(function (info) {
                    expect(info.owner).toBeDefined();
                    expect(info.template).toBeDefined();
                    expect(info.frame).toBeDefined();

                    expect(info.owner.value).toBe("pass");

                    expect(info.template._require).not.toBe(require);

                    expect(info.frame.iframe.contentDocument.querySelector("[data-montage-id=text]").textContent).toBe("pass");
                });
            });

            it("reuses the same require when loading from the same package", function () {
                var packageRequire;

                return template.initWithHtml(noOwnerHtml, require)
                .then(function () {
                    return editingFrame.loadTemplate(template);
                })
                .then(function (info) {
                    packageRequire = info.template._require;

                    return editingFrame.loadTemplate(info.template);
                })
                .then(function (info) {
                    expect(info.template._require).toBe(packageRequire);
                });
            });
        });

    });
});
