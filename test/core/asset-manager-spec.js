/*global describe,beforeEach,it,expect,waitsFor,runs*/

var environmentBridgeMock = require("test/mocks/environment-bridge-mocks").environmentBridgeMock,
    FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    AssetsManager = require("core/assets-management/assets-manager").AssetsManager,
    AssetTools = require("core/assets-management/asset-tools").AssetTools,
    AssetCategories = AssetsManager.create().assetCategories,
    Promise = require("montage/core/promise").Promise;

describe("asset-manager-spec", function () {

    describe("asset-manager", function () {

        var assetsManager = null;

        beforeEach(function () {
            var fileDescriptors = [],

                projectController = {
                    environmentBridge: environmentBridgeMock({
                        detectMimeTypeAtUrl: function (url) {
                            return Promise.fcall(function () {
                                var fileData = AssetTools.defineFileDataWithUrl(url),
                                    mimeType = null;

                                switch (fileData.extension) {
                                case 'png':
                                    mimeType = "image/png";
                                    break;
                                case 'jpg':
                                    mimeType = "image/jpeg";
                                    break;
                                }

                                return mimeType;
                            });
                        }
                    })
                },

                fakeFiles = [

                    // Valid
                    {
                        url: "/a/b/c/duck.dae",
                        mimeType: "model/vnd.collada+xml"
                    },
                    {
                        url: "/a/b/c/wine.dae",
                        mimeType: "model/vnd.collada+xml"
                    },
                    {
                        url: "/a/b/c/fall.png",
                        mimeType: "image/png"
                    },
                    {
                        url: "/a/b/c/winter.jpg",
                        mimeType: "image/jpeg"
                    },
                    {
                        url: "/a/b/c/beach.aac",
                        mimeType: "audio/aac"
                    },
                    {
                        url: "/a/b/c/city.mp3",
                        mimeType: "audio/mpeg"
                    },
                    {
                        url: "/a/b/c/mountain.mp4",
                        mimeType: "audio/aac"
                    },
                    {
                        url: "/a/b/c/holiday.mp4",
                        mimeType: "video/mp4"
                    },

                    // Not valid
                    {
                        url: "/a/b/c/file.zip",
                        mimeType: "application/zip"
                    },
                    {
                        url: "/a/b/c/file.json",
                        mimeType: "application/json"
                    },

                    {
                        url: "/a/b/c/file.au",
                        mimeType: "audio/basic"
                    }
                ];

            fakeFiles.forEach(function (file) {
                fileDescriptors.push(new FileDescriptor().init(file.url, {mode: 0, size:1024}, file.mimeType));
            });



            assetsManager = AssetsManager.create().init(projectController);
            assetsManager.addAssetsWithFileDescriptors(fileDescriptors);

        });


        it("must has been correctly initialized", function () {
            var assets = assetsManager.assets;
            expect(assetsManager.assetsCount).toEqual(8); // do no include not asset files.
            expect(assets.MODEL.length).toEqual(2);
            expect(assets.IMAGE.length).toEqual(2);
            expect(assets.AUDIO.length).toEqual(3);
            expect(assets.VIDEO.length).toEqual(1);
        });


        it("should be able to get assets by type", function () {
            expect(assetsManager.getAssetsByAssetCategory(AssetCategories.IMAGE).length).toEqual(2);
        });


        it("should be able to get assets by mime-type", function () {
            expect(assetsManager.getAssetsByMimeType("audio/mpeg").length).toEqual(1);
            expect(assetsManager.getAssetsByMimeType("model/vnd.collada+xml").length).toEqual(2);

            var mimeTypeNoSupported = function () {
                assetsManager.getAssetsByMimeType("application/xml");
            };

            expect(mimeTypeNoSupported).toThrow();
        });


        it("should be able to get add an asset", function () {
            var fileDescriptor = new FileDescriptor().init("/assets/apple.png", {mode: 0}, "image/png"),
                createdAsset = assetsManager.createAssetWithFileDescriptor(fileDescriptor);

            assetsManager.addAsset(createdAsset);

            expect(assetsManager.assetsCount).toEqual(9);
            expect(assetsManager.assets.IMAGE.length).toEqual(3);
        });


        it("should be able to remove an asset", function () {
            assetsManager.removeAssetWithFileUrl("/assets/apple.png");

            expect(assetsManager.assetsCount).toEqual(8);
            expect(assetsManager.assets.IMAGE.length).toEqual(2);
        });

        it("should be able to add an asset when a file has been added to the project", function () {
            var event = {
                detail: {
                    change: "create",
                    mimeType: "image/jpeg",
                    currentStat: {
                        size: 1024
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

        it("should be able to delete an asset when a file has been removed", function () {
            var event = {
                detail: {
                    change: "delete",
                    mimeType: "image/jpeg",
                    currentStat: {
                        size: 1024
                    },
                    fileUrl: "/a/b/c/chocolate.jpg"
                }
            };

            assetsManager.handleFileSystemChange(event);

            expect(assetsManager.assetsCount).toEqual(8);
            expect(assetsManager.assets.IMAGE.length).toEqual(2);
            expect(assetsManager.assets.IMAGE[1].name).not.toEqual("chocolate");
        });

        it("should be able to update an asset when a file has been modified", function () {
            var asset = assetsManager.getAssetByFileUrl("/a/b/c/winter.jpg"),
                event = {
                    detail: {
                        change: "update",
                        mimeType: asset.mimeType,
                        currentStat: {
                            size: 2048
                        },
                        fileUrl: asset.fileUrl
                    }
                },

                size = asset.size,
                flag = false;

            runs(function() {
                assetsManager.handleFileSystemChange(event);

                setTimeout(function () { // Wait for the modification be applied
                    flag = true;
                }, 150);
            });

            waitsFor(function() {
                return flag;
            }, "the asset should has been modified", 250);

            runs(function() {
                expect(assetsManager.assetsCount).toEqual(8);
                var assetModified = assetsManager.getAssetByFileUrl("/a/b/c/winter.jpg");
                expect(assetModified.size).not.toEqual(size);
            });
        });

    });

    describe("asset-tools", function () {

        it("should be able to get some information from a fileUrl such as filename, name, extension", function () {
            var fileData = AssetTools.defineFileDataWithUrl("/a/b/c/winter.png");
            expect(fileData.fileName).toBe("winter.png");
            expect(fileData.name).toBe("winter");
            expect(fileData.extension).toBe("png");

            fileData = AssetTools.defineFileDataWithUrl("/a/b/c/winter.2003.jpg");
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


        it("should be able to find an 'asset type' from a supported mimeType", function () {
            var assetType = AssetTools.findAssetCategoryFromMimeType("audio/aac");
            expect(assetType).toBe(AssetCategories.AUDIO);

            assetType = AssetTools.findAssetCategoryFromMimeType("video/mp4");
            expect(assetType).toBe(AssetCategories.VIDEO);

            assetType = AssetTools.findAssetCategoryFromMimeType("application/mp4");
            expect(assetType).not.toBeDefined();
        });


        it("should be able to define if a mimeType is supported or not", function () {
            expect(AssetTools.isMimeTypeSupported("audio/aac")).toBe(true);
            expect(AssetTools.isMimeTypeSupported("model/vnd.collada+xml")).toBe(true);
            expect(AssetTools.isMimeTypeSupported("audio/wma")).toBe(false);
            expect(AssetTools.isMimeTypeSupported(0)).toBe(false);
        });


        it("should be able to define if a AssetType is supported or not", function () {
            expect(AssetTools.isAssetCategoryValid(AssetCategories.AUDIO)).toBe(true);
            expect(AssetTools.isAssetCategoryValid(AssetCategories.MODEL)).toBe(true);
            expect(AssetTools.isAssetCategoryValid("APPLICATION")).toBe(false);
            expect(AssetTools.isAssetCategoryValid(0)).toBe(false);
        });


        it("should be able to define if a fileUrl is valid", function () {
            expect(AssetTools.isAFile('/a/b/d.js')).toBe(true);
            expect(AssetTools.isAFile('rrr.a/b/d.js')).toBe(true);
            expect(AssetTools.isAFile('rrr.a/b/d.js/')).toBe(false);
        });

    });

});
