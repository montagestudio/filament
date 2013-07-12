var FileDescriptor = require("core/file-descriptor").FileDescriptor;

var FileNode = {
    dev: 2114,
    ino: 48064969,
    mode: 33188,
    nlink: 1,
    uid: 85,
    gid: 100,
    rdev: 0,
    size: 527,
    blksize: 4096,
    blocks: 8,
    atime: new Date(),
    mtime: new Date(),
    ctime: new Date()
};

var DirNode = Object.create(FileNode, {
    mode: {
        value: FileNode | 16384
    }
});

var FileStat = {
    node: FileNode,
    size: 527
};

var DirStat = {
    node: DirNode,
    size: 527
};

describe("core/file-descriptor-spec", function () {
    var fd;
    beforeEach(function () {
        fd = new FileDescriptor();
    });

    it("throws an error when a directory URL does not have a trailing slash", function () {
        expect(function () {
            fd.initWithUrlAndStat("test://host/fail", DirStat);
        }).toThrow(new Error("URLs for directories must have a trailing '/'"));
    });

    describe("name", function () {
        it("is correct for files", function () {
            fd = fd.initWithUrlAndStat("test://host/pass", FileStat);
            expect(fd.name).toBe("pass");
        });

        it("is correct for directories", function () {
            fd = fd.initWithUrlAndStat("test://host/pass/", DirStat);
            expect(fd.name).toBe("pass");
        });
    });

    describe("isReel", function () {
        it("is true for directories that end in .reel", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.reel/", DirStat);
            expect(fd.isReel).toBe(true);
        });

        it("is false for files that end in .reel", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.reel", FileStat);
            expect(fd.isReel).toBe(false);
        });

        it("is false for directories that do not end in .reel", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.ree/", DirStat);
            expect(fd.isReel).toBe(false);
        });
    });

    describe("is{Json,Html,Css,Js} (same implementation)", function () {
        it("is true for files that end in .json", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.json", FileStat);
            expect(fd.isJson).toBe(true);
        });

        it("is false for directories that end in .json", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.json/", DirStat);
            expect(fd.isJson).toBe(false);
        });

        it("is false for files that do not end in .json", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.xjson", FileStat);
            expect(fd.isJson).toBe(false);
        });

        it("is false for files that contain, but do not end in, .json", function () {
            fd = fd.initWithUrlAndStat("test://host/pass.json.txt", FileStat);
            expect(fd.isJson).toBe(false);
        });
    });

    describe("isPackage", function () {
        it("is true for files called package.json", function () {
            fd = fd.initWithUrlAndStat("test://host/package.json", FileStat);
            expect(fd.isPackage).toBe(true);
        });

        it("is false for directories called package.json", function () {
            fd = fd.initWithUrlAndStat("test://host/package.json/", DirStat);
            expect(fd.isPackage).toBe(false);
        });

        it("is false for files not called package.json", function () {
            fd = fd.initWithUrlAndStat("test://host/xpackage.json", FileStat);
            expect(fd.isPackage).toBe(false);
        });
    });

    describe("isImage", function () {
        it("is true for files ending with .png", function () {
            fd = fd.initWithUrlAndStat("test://host/image.png", FileStat);
            expect(fd.isImage).toBe(true);
        });

        it("is true for files ending with .jpg", function () {
            fd = fd.initWithUrlAndStat("test://host/image.jpg", FileStat);
            expect(fd.isImage).toBe(true);
        });

        it("is true for files ending with .jpeg", function () {
            fd = fd.initWithUrlAndStat("test://host/image.jpeg", FileStat);
            expect(fd.isImage).toBe(true);
        });

        it("is false for directories ending with .png", function () {
            fd = fd.initWithUrlAndStat("test://host/image.png/", DirStat);
            expect(fd.isImage).toBe(false);
        });

        it("is false for files that contain, but do not end with, .png", function () {
            fd = fd.initWithUrlAndStat("test://host/text.png.txt", FileStat);
            expect(fd.isImage).toBe(false);
        });
    });

});
