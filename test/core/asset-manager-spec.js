var FileDescriptor = require("adaptor/client/core/file-descriptor").FileDescriptor,
    AssetsManager = require("core/assets-management/assets-manager").AssetsManager,
    AssetTools = require("core/assets-management/asset-tools").AssetTools,
    AssetTypes = AssetsManager.create().assetTypes,
    SubAssetTypes = AssetsManager.create().subAssetTypes;

describe("asset-manager-spec", function () {

    describe("asset-manager", function () {

        var assetsManager = null;

        beforeEach(function () {
            var filesList = [],

                fakeFiles = [

                    // Valid
                    {
                        url: "/a/b/c/duck.dae",
                        mimeType: "model/vnd.collada+xml",
                        assetType: AssetTypes.MODEL
                    },
                    {
                        url: "/a/b/c/wine.dae",
                        mimeType: "model/vnd.collada+xml",
                        assetType: AssetTypes.MODEL
                    },
                    {
                        url: "/a/b/c/fall.png",
                        mimeType: "image/png",
                        assetType: AssetTypes.IMAGE
                    },
                    {
                        url: "/a/b/c/winter.jpg",
                        mimeType: "image/jpeg",
                        assetType: AssetTypes.IMAGE
                    },
                    {
                        url: "/a/b/c/beach.aac",
                        mimeType: "audio/aac",
                        assetType: AssetTypes.AUDIO
                    },
                    {
                        url: "/a/b/c/city.mp3",
                        mimeType: "audio/mpeg",
                        assetType: AssetTypes.AUDIO
                    },
                    {
                        url: "/a/b/c/mountain.mp4",
                        mimeType: "audio/x-aac",
                        assetType: AssetTypes.AUDIO
                    },
                    {
                        url: "/a/b/c/holiday.mp4",
                        mimeType: "video/aac",
                        assetType: AssetTypes.VIDEO
                    },

                    // Not valid
                    {
                        url: "/a/b/c/file.zip",
                        mimeType: "audio/aac",
                        assetType: null
                    },
                    {
                        url: "/a/b/c/file.json",
                        mimeType: "audio/aac",
                        assetType: null
                    }
                ];

            fakeFiles.forEach(function (file) {
                var fileDescriptor = new FileDescriptor().initWithUrlAndStat(file.url, {mode: 0});
                fileDescriptor.mimeType = file.mimeType;

                switch (file.assetType) {

                    case AssetTypes.MODEL:
                        fileDescriptor.isCollada = true;
                        break;
                    case AssetTypes.IMAGE:
                        fileDescriptor.isImage = true;
                        break;
                    case AssetTypes.AUDIO:
                        fileDescriptor.isAudio = true;
                        break;
                    case AssetTypes.VIDEO:
                        fileDescriptor.isVideo = true;
                        break;
                    default:
                        break;
                }

                filesList.push(fileDescriptor);
            });

            assetsManager = AssetsManager.create().init(filesList);

        });


        it("must has been correctly initialized", function () {
            var assets = assetsManager.assets;
            expect(assetsManager.assetsLength).toEqual(8); // do no include not asset files.
            expect(assets.MODEL.length).toEqual(2);
            expect(assets.IMAGE.length).toEqual(2);
            expect(assets.AUDIO.length).toEqual(3);
            expect(assets.VIDEO.length).toEqual(1);
        });


        it("should be able to get assets by type", function () {
            expect(assetsManager.getAssetsByAssetType(AssetTypes.IMAGE).length).toEqual(2);
        });


        it("should be able to get assets by sub asset type, ex: jpeg, aac", function () {
            expect(assetsManager.getAssetsBySubAssetType(SubAssetTypes.JPEG).length).toEqual(1);
            expect(assetsManager.getAssetsBySubAssetType(SubAssetTypes.AIFF).length).toEqual(0);
        });


        it("should be able to get assets by mime-type", function () {
            expect(assetsManager.getAssetsByMimeType("audio/mpeg").length).toEqual(1);
            expect(assetsManager.getAssetsByMimeType("model/vnd.collada+xml").length).toEqual(2);
            expect(assetsManager.getAssetsBySubAssetType("application/xml").length).toEqual(0);
        });


        it("should be able to get add an asset", function () {
            var fileDescriptor = new FileDescriptor().initWithUrlAndStat("/assets/apple.png", {mode: 0});

            fileDescriptor.isImage = true;
            fileDescriptor.mimeType = "image/png";

            assetsManager.addAsset(fileDescriptor);

            expect(assetsManager.assetsLength).toEqual(9);
            expect(assetsManager.assets.IMAGE.length).toEqual(3);
        });


        it("should be able to remove an asset", function () {
            assetsManager.removeAsset("/assets/apple.png");

            expect(assetsManager.assetsLength).toEqual(8);
            expect(assetsManager.assets.IMAGE.length).toEqual(2);
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
            var assetType = AssetTools.findAssetTypeFromMimeType("audio/aac");
            expect(assetType).toBe(AssetTypes.AUDIO);

            assetType = AssetTools.findAssetTypeFromMimeType("video/mp4");
            expect(assetType).toBe(AssetTypes.VIDEO);

            assetType = AssetTools.findAssetTypeFromMimeType("application/mp4");
            expect(assetType).not.toBeDefined();
        });


        it("should be able to find an 'asset type' from a subAssetType (AIFF, PNG)", function () {
            var assetType = AssetTools.findAssetTypeFromSubAssetType(SubAssetTypes.AIFF);
            expect(assetType).toBe(AssetTypes.AUDIO);

            assetType = AssetTools.findAssetTypeFromSubAssetType(SubAssetTypes.PNG);
            expect(assetType).toBe(AssetTypes.IMAGE);

            assetType = AssetTools.findAssetTypeFromSubAssetType("XML");
            expect(assetType).not.toBeDefined();
        });


        it("should be able to find a 'sub asset type' from a supported mimeType", function () {
            var subAssetType = AssetTools.findSubAssetTypeFromMimeType("audio/aac");
            expect(subAssetType).toBe(SubAssetTypes.AAC);

            subAssetType = AssetTools.findSubAssetTypeFromMimeType("model/vnd.collada+xml");
            expect(subAssetType).toBe(SubAssetTypes.COLLADA);

            subAssetType = AssetTools.findSubAssetTypeFromMimeType("audio/wma");
            expect(subAssetType).not.toBeDefined();
        });


        it("should be able to define if a mimeType is supported or not", function () {
            expect(AssetTools.isMimeTypeValid("audio/aac")).toBe(true);
            expect(AssetTools.isMimeTypeValid("model/vnd.collada+xml")).toBe(true);
            expect(AssetTools.isMimeTypeValid("audio/wma")).toBe(false);
            expect(AssetTools.isMimeTypeValid(0)).toBe(false);
        });

        it("should be able to define if a AssetType is supported or not", function () {
            expect(AssetTools.isAssetTypeValid(AssetTypes.AUDIO)).toBe(true);
            expect(AssetTools.isAssetTypeValid(AssetTypes.MODEL)).toBe(true);
            expect(AssetTools.isAssetTypeValid("APPLICATION")).toBe(false);
            expect(AssetTools.isAssetTypeValid(0)).toBe(false);
        });

        it("should be able to define if a subAssetType is supported or not", function () {
            expect(AssetTools.isSubAssetTypeValid(SubAssetTypes.PNG)).toBe(true);
            expect(AssetTools.isSubAssetTypeValid(SubAssetTypes.AAC)).toBe(true);
            expect(AssetTools.isSubAssetTypeValid("WMA")).toBe(false);
            expect(AssetTools.isSubAssetTypeValid(0)).toBe(false);
        });


        it("should be able to define if a fileUrl is valid", function () {
            expect(AssetTools.isFileUrlValid('/a/b/d.js')).toBe(true);
            expect(AssetTools.isFileUrlValid('rrr.a/b/d.js')).toBe(true);
            expect(AssetTools.isFileUrlValid('rrr.a/b/d.js/')).toBe(false);
        });

    });

});
