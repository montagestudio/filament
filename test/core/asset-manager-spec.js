/*global describe,beforeEach,it,expect,waitsFor,runs*/

var environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    AssetsManager = require("core/assets-management/assets-manager").AssetsManager,
    AssetTools = require("core/assets-management/asset-tools").AssetTools,
    ReelDocument = require("core/reel-document").ReelDocument,
    AssetCategories = AssetsManager.create().assetCategories,
    Promise = require("montage/core/promise").Promise;

describe("asset-manager-spec", function () {

    describe("asset-manager", function () {

        var assetsManager = null;

        beforeEach(function () {
            var fileDescriptors = [],

                reelDocument = ReelDocument.create(),

                projectController = {
                    environmentBridge: new environmentBridgeMock({
                        detectMimeTypeAtUrl: function (url) {
                            return Promise.fcall(function () {
                                var fileData = AssetTools.defineFileDataWithUrl(url),
                                    mimeType = null;

                                if (fileData) {
                                    switch (fileData.extension) {
                                    case 'png':
                                        mimeType = "image/png";
                                        break;
                                    case 'jpg':
                                        mimeType = "image/jpeg";
                                        break;
                                    }
                                }

                                return mimeType;
                            });
                        }
                    }),
                    currentDocument: reelDocument
                },

                fakeFiles = [

                    // Valid
                    {
                        url: "http://a/b/c/duck.dae",
                        mimeType: "model/vnd.collada+xml",

                        ino: 1
                    },
                    {
                        url: "http://a/b/c/wine.dae",
                        mimeType: "model/vnd.collada+xml",
                        ino: 2
                    },
                    {
                        url: "http://a/b/c/fall.png",
                        mimeType: "image/png",
                        ino: 3
                    },
                    {
                        url: "http://a/b/c/winter.jpg",
                        mimeType: "image/jpeg",
                        ino: 4
                    },
                    {
                        url: "http://a/b/c/beach.aac",
                        mimeType: "audio/aac",
                        ino: 5
                    },
                    {
                        url: "http://a/b/c/city.mp3",
                        mimeType: "audio/mpeg",
                        ino: 6
                    },
                    {
                        url: "http://a/b/c/mountain.mp4",
                        mimeType: "audio/aac",
                        ino: 7
                    },
                    {
                        url: "http://a/b/c/holiday.mp4",
                        mimeType: "video/mp4",
                        ino: 8
                    },

                    // Not valid
                    {
                        url: "http://a/b/c/file.zip",
                        mimeType: "application/zip",
                        ino: 9
                    },
                    {
                        url: "http://a/b/c/file.json",
                        mimeType: "application/json",
                        ino: 10
                    },

                    {
                        url: "http://a/b/c/file.au",
                        mimeType: "audio/basic",
                        ino: 11
                    }
                ];

            fakeFiles.forEach(function (file) {
                var fileDescriptorTmp = new FileDescriptor().initWithUrlAndStat(file.url, {ino: file.ino});
                fileDescriptorTmp.mimeType = file.mimeType;
                fileDescriptors.push(fileDescriptorTmp);
            });

            assetsManager = AssetsManager.create();
            assetsManager.projectController = projectController;
            assetsManager.addAssetsWithFileDescriptors(fileDescriptors);

        });


        it("must has been correctly initialized", function () {
            var assets = assetsManager.assets;
            expect(assetsManager.assetsCount).toEqual(8); // Should not include files which are not asset files.
            expect(assets.MODEL.length).toEqual(2);
            expect(assets.IMAGE.length).toEqual(2);
            expect(assets.AUDIO.length).toEqual(3);
            expect(assets.VIDEO.length).toEqual(1);
        });


        it("should be able to get assets by type", function () {
            expect(assetsManager.getAssetsByAssetCategory(AssetCategories.IMAGE).length).toEqual(2);
            expect(assetsManager.getAssetsByAssetCategory(AssetCategories.AUDIO).length).toEqual(3);
        });


        it("should be able to get assets by mime-type", function () {
            expect(assetsManager.getAssetsByMimeType("audio/mpeg").length).toEqual(1);
            expect(assetsManager.getAssetsByMimeType("model/vnd.collada+xml").length).toEqual(2);

            var mimeTypeNotSupported = function () {
                assetsManager.getAssetsByMimeType("application/xml");
            };

            expect(mimeTypeNotSupported).toThrow();
        });


        it("should be able to create and add an asset with a FileDescriptor", function () {
            var fileDescriptor = new FileDescriptor().initWithUrlAndStat("http://assets/apple.png", {ino: 1024});
            fileDescriptor.mimeType = "image/png";

            var createdAsset = assetsManager.createAssetWithFileDescriptor(fileDescriptor);

            expect(assetsManager.addAsset(createdAsset)).toBe(true);
            expect(assetsManager.assetsCount).toEqual(9);
            expect(assetsManager.assets.IMAGE.length).toEqual(3);

            // Mime-Type not supported case:
            var fileDescriptorWrong = new FileDescriptor().initWithUrlAndStat("http://assets/apple.png", {ino: 1025});
            fileDescriptorWrong.mimeType = "image/not_supported";

            var createdAssetWrong = assetsManager.createAssetWithFileDescriptor(fileDescriptorWrong);

            expect(createdAssetWrong).toBeUndefined();
        });

        it("should be not able to add an asset when a fileUrl is already used", function () {
            var fileDescriptor = new FileDescriptor().initWithUrlAndStat("http://a/b/c/winter.jpg", {ino: 4});
            fileDescriptor.mimeType = "image/jpeg";

            var createdAsset = assetsManager.createAssetWithFileDescriptor(fileDescriptor);

            expect(assetsManager.addAsset(createdAsset)).toBe(false);
        });


        it("should be able to remove an asset", function () {
            assetsManager.removeAssetWithFileUrl("http://assets/apple.png");

            expect(assetsManager.assetsCount).toEqual(8);
            expect(assetsManager.assets.IMAGE.length).toEqual(2);
        });

        it("should be able to add an asset when a file has been added to the project", function () {
            var event = {
                detail: {
                    change: "create",
                    mimeType: "image/jpeg",
                    currentStat: {
                        ino: 12
                    },
                    fileUrl: "/a/b/c/chocolate.jpg"
                }
            },
                oldCount = assetsManager.assetsCount;

            runs(function() {
                assetsManager.handleFileSystemChange(event);
            });

            waitsFor(function() {
                return assetsManager.assetsCount > oldCount;
            }, "the asset should has been added", 250);

            runs(function() {
                expect(assetsManager.assetsCount).toEqual(9);
                expect(assetsManager.assets.IMAGE.length).toEqual(3);
                expect(assetsManager.assets.IMAGE[2].name).toEqual("chocolate");
            });

        });

        it("should be able to find an asset with a fileUrl or a index node", function () {
            var asset = assetsManager.getAssetByFileUrl("http://a/b/c/beach.aac");

            expect(asset.name).toEqual("beach");
            expect(asset.exist).toEqual(true);

            asset = assetsManager._findAssetWithInode(6);
            expect(asset.name).toEqual("city");
        });

        it("should be able to detect when an asset file has been removed and to set it as not existing anymore", function () {
            var event = {
                detail: {
                    change: "delete",
                    mimeType: "image/jpeg",
                    currentStat: {
                        ino: 4
                    },
                    fileUrl: "http://a/b/c/winter.jpg"
                }
            };

            assetsManager.handleFileSystemChange(event);
            var asset = assetsManager.getAssetByFileUrl("http://a/b/c/winter.jpg");

            expect(assetsManager.assetsCount).toEqual(8);
            expect(asset.exist).toEqual(false);
        });

        it("should be able to 'revive' an Asset Object when it's file is back within a project", function () {
            var event = {
                detail: {
                    change: "delete",
                    mimeType: "image/jpeg",
                    currentStat: {
                        ino: 4
                    },
                    fileUrl: "http://a/b/c/winter.jpg"
                }
            };

            assetsManager.handleFileSystemChange(event);

            var asset = assetsManager.getAssetByFileUrl("http://a/b/c/winter.jpg"),
                flag = false;

            expect(assetsManager.assetsCount).toEqual(8);
            expect(asset.exist).toEqual(false);

            var backEvent = {
                detail: {
                    change: "create",
                    mimeType: "image/jpeg",
                    currentStat: {
                        ino: 4
                    },
                    fileUrl: "http://a/b/c/winter.jpg"
                }
            };

            runs(function() {
                assetsManager.handleFileSystemChange(backEvent);

                setTimeout(function() {
                    flag = true;
                }, 200);
            });

            waitsFor(function() {
                return asset.exist === true;
            }, "the asset should has been added", 400);

            runs(function() {
                expect(asset.exist).toEqual(true);
            });

        });

        it("should be able to update an asset when a file has been modified", function () {
            var asset = assetsManager.getAssetByFileUrl("http://a/b/c/winter.jpg"),
                event = {
                    detail: {
                        change: "update",
                        mimeType: asset.mimeType,
                        currentStat: {
                            ino: 23
                        },
                        fileUrl: asset.fileUrl
                    }
                },

                inode = asset.inode,
                flag = false;

            runs(function() {
                assetsManager.handleFileSystemChange(event);

                setTimeout(function () { // Wait for the modification be applied.
                    flag = true;
                }, 150);
            });

            waitsFor(function() {
                return flag;
            }, "the asset should has been modified", 250);

            runs(function() {
                expect(assetsManager.assetsCount).toEqual(8);
                var assetModified = assetsManager.getAssetByFileUrl("http://a/b/c/winter.jpg");
                expect(assetModified.inode).not.toEqual(inode);
            });
        });

        it("should be able to get a relative path for an asset from the current reel document", function () {
            var fileDescriptor = new FileDescriptor().initWithUrlAndStat("http://a/b/c/d/e/f.png", {ino: 2048});
            fileDescriptor.mimeType = "image/png";

            var asset = assetsManager.createAssetWithFileDescriptor(fileDescriptor),
                assetRoot = assetsManager.getAssetByFileUrl("http://a/b/c/winter.jpg");

            assetsManager.addAsset(asset);
            assetsManager.projectUrl = 'http://a/b/c/';
            assetsManager.projectController.currentDocument._url = 'http://a/b/c/d/';

            expect(assetsManager.getRelativePathWithAssetFromCurrentReelDocument(assetRoot)).toEqual('../winter.jpg');
            expect(assetsManager.getRelativePathWithAssetFromCurrentReelDocument(asset)).toEqual('e/f.png');

            assetsManager.projectController.currentDocument._url = 'http://a/b/c/w/x/y';
            expect(assetsManager.getRelativePathWithAssetFromCurrentReelDocument(asset)).toEqual('../../../d/e/f.png');

            assetsManager.projectController.currentDocument._url = 'http://a/b/c/d/z/g/';
            expect(assetsManager.getRelativePathWithAssetFromCurrentReelDocument(asset)).toEqual('../../e/f.png');

        });

        it("should be able to find an asset with a relative path in terms of the current reel document", function () {
            var fileDescriptor = new FileDescriptor().initWithUrlAndStat("http://a/b/c/d/e/f.png", {ino: 2065});
            fileDescriptor.mimeType = "image/png";
            var asset = assetsManager.createAssetWithFileDescriptor(fileDescriptor);

            var fileDescriptor2 = new FileDescriptor().initWithUrlAndStat("http://a/b/c/e/f.png", {ino: 2066});
            fileDescriptor2.mimeType = "image/png";
            var asset2 = assetsManager.createAssetWithFileDescriptor(fileDescriptor2);

            var documentUrl = 'http://a/b/c/d/';

            assetsManager.addAsset(asset);
            assetsManager.addAsset(asset2);
            assetsManager.projectUrl = 'http://a/b/c/';
            assetsManager.projectController.currentDocument._url = documentUrl;

            // Absolute cases
            expect(assetsManager.getAssetByRelativePath("e/f.png").fileUrl).toEqual(assetsManager.projectUrl + "e/f.png");
            expect(assetsManager.getAssetByRelativePath("/e/f.png").fileUrl).toEqual(assetsManager.projectUrl + "e/f.png");

            // relative cases
            expect(assetsManager.getAssetByRelativePath("../e/f.png").fileUrl).toEqual(asset2.fileUrl);
            expect(assetsManager.getAssetByRelativePath("./e/f.png").fileUrl).toEqual(documentUrl + 'e/f.png');
            expect(assetsManager.getAssetByRelativePath("../../e/f.png")).toBe(null);

            // Some tests about the private _resolvePaths & _decomposePath functions.
            expect(assetsManager._resolvePaths('/root/', 'file.zip')).toEqual('/root/file.zip');
            expect(assetsManager._resolvePaths('/root/', '/file.zip')).toEqual('/root/file.zip');
            expect(assetsManager._resolvePaths('root/', '/file.zip')).toEqual('/root/file.zip');
            expect(assetsManager._resolvePaths('root', 'file.zip')).toEqual('/root/file.zip');
            expect(assetsManager._resolvePaths('/root/media/', '../file.zip')).toEqual('/root/file.zip');
            expect(assetsManager._resolvePaths('/root/home/project', '../../file.zip')).toEqual('/root/file.zip');
            expect(assetsManager._resolvePaths('  root/home/project  ', '../../file.zip')).toEqual('/root/file.zip');

            expect(assetsManager._decomposePath('root/home/project').length).toEqual(3);
            expect(assetsManager._decomposePath('/root/home/project').length).toEqual(3);
            expect(assetsManager._decomposePath('/root/home/project/test').length).toEqual(4);
            expect(assetsManager._decomposePath('   root/home/project/test').length).toEqual(4);
        });

    });

    describe("asset-tools", function () {

        it("should be able to get some information from a fileUrl such as its filename, name or extension", function () {
            var fileData = AssetTools.defineFileDataWithUrl("http://a/b/c/winter.png");
            expect(fileData.fileName).toBe("winter.png");
            expect(fileData.name).toBe("winter");
            expect(fileData.extension).toBe("png");

            fileData = AssetTools.defineFileDataWithUrl("http://a/b/c/winter.2003.jpg");
            expect(fileData.fileName).toBe("winter.2003.jpg");
            expect(fileData.name).toBe("winter.2003");
            expect(fileData.extension).toBe("jpg");

            fileData = AssetTools.defineFileDataWithUrl("file_no_extension");
            expect(fileData.fileName).toBe("file_no_extension");
            expect(fileData.name).toBe("file_no_extension");
            expect(fileData.extension).not.toBeDefined();

            fileData = AssetTools.defineFileDataWithUrl(0);
            expect(fileData).toBeNull();
        });


        it("should be able to find an 'asset type/category' from a supported mimeType", function () {
            var assetType = AssetTools.findAssetCategoryFromMimeType("audio/aac");
            expect(assetType).toBe(AssetCategories.AUDIO);

            assetType = AssetTools.findAssetCategoryFromMimeType("video/mp4");
            expect(assetType).toBe(AssetCategories.VIDEO);

            assetType = AssetTools.findAssetCategoryFromMimeType("application/xml+not+supported");
            expect(assetType).not.toBeDefined();
        });


        it("should be able to define if a mimeType is supported or not", function () {
            expect(AssetTools.isMimeTypeSupported("audio/aac")).toBe(true);
            expect(AssetTools.isMimeTypeSupported("model/vnd.collada+xml")).toBe(true);
            expect(AssetTools.isMimeTypeSupported("audio/wma+not+supported")).toBe(false);
            expect(AssetTools.isMimeTypeSupported(0)).toBe(false);
        });


        it("should be able to define if a AssetType is supported or not", function () {
            expect(AssetTools.isAssetCategoryValid(AssetCategories.AUDIO)).toBe(true);
            expect(AssetTools.isAssetCategoryValid(AssetCategories.MODEL)).toBe(true);
            expect(AssetTools.isAssetCategoryValid("APPLICATION")).toBe(false);
            expect(AssetTools.isAssetCategoryValid(0)).toBe(false);
        });


        it("should be able to define if a url is a valid fileUrl", function () {
            expect(AssetTools.isAFile('http://a/b/d.js')).toBe(true);
            expect(AssetTools.isAFile('rrr.a/b/d.js')).toBe(true);
            expect(AssetTools.isAFile('rrr.a/b/d.js')).toBe(true);
            expect(AssetTools.isAFile('rrr.a/b/d.js/')).toBe(false);
            expect(AssetTools.isAFile(4)).toBe(false);
        });

    });

});
