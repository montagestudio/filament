var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-file-spec", function () {

    var bridge, viewController, projectController, mockMenu, textUrl, reelUrl,
        editor;

    beforeEach(function () {
        mockMenu = menuMock({
            menuItems: {
                "newComponent": Montage.create(),
                "newModule": Montage.create()
            }
        });

        bridge = environmentBridgeMock({
            mainMenu: mockMenu
        });

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, []);

        textUrl = "foo.txt";
        reelUrl = "foo.reel";

        editor = Montage.create();
    });

    describe("opening a file", function () {

        it("must return a promise for a document", function () {
            var openPromise = projectController.openFileUrl(textUrl);
            expect(Promise.isPromiseAlike(openPromise));
            openPromise.timeout(WAITSFOR_TIMEOUT).done();
        });

        it("must open the current document if asked to open the same fileUrl", function () {
            var doc = {fileUrl: textUrl};
            projectController.currentDocument = doc;

            return projectController.openFileUrl(textUrl).then(function (loadedInfo) {
                expect(loadedInfo.document).toBe(doc);
            });
        });

    });


});
