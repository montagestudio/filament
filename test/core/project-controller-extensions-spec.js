var Montage = require("montage").Montage,
    environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    menuMock = require("test/mocks/menu-mocks").menuMock,
    editorMock = require("test/mocks/editor-mocks").editorMock,
    editorControllerMock = require("test/mocks/editor-controller-mocks").editorControllerMock,
    extensionControllerMock = require("test/mocks/extension-controller-mocks").extensionControllerMock,
    ViewController = require("core/view-controller").ViewController,
    ProjectController = require("core/project-controller").ProjectController,
    Promise = require("montage/core/promise").Promise,
    WAITSFOR_TIMEOUT = 2500;

describe("core/project-controller-extensions-spec", function () {

    var bridge, viewController, editorController, projectController, extensionController,
        mockMenu, textUrl, reelUrl, editor;

    beforeEach(function () {
        bridge = environmentBridgeMock({
            componentsInPackage: function () {
                return Promise(["packageUrl/ui/pass.reel"]);
            },
            getExtensionsAt: function () {
                return Promise([{url: "fs:///packageUrl/packageUrl.filament-extension"}]);
            }
        });

        editorController = editorControllerMock();

        extensionController = extensionControllerMock();

        viewController = ViewController.create();
        projectController = ProjectController.create().init(bridge, viewController, editorController, extensionController);
    });

    it("loads extensions in the package", function () {
        spyOn(extensionController, "loadExtension").andCallThrough();

        return projectController.loadProject("pacakgeUrl").then(function () {
            expect(extensionController.loadExtension).toHaveBeenCalled();
            expect(extensionController.loadExtension.mostRecentCall.args[0]).toBe("fs:///packageUrl/packageUrl.filament-extension");
        });
    });

});
