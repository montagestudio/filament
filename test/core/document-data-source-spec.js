var DocumentDataSource = require("filament/core/document-data-source").DocumentDataSource,
    Promise = require("montage/core/promise").Promise,
    environmentBridgeMock = require("mocks/environment-bridge-mocks").environmentBridgeMock;

function DataModifier(file) {
    var data = file.content;
    return {
        data: data,
        _hasModifiedData: false,
        hasModifiedData: function() {
            return this._hasModifiedData;
        },
        acceptModifiedData: function() {
            return Promise.resolve(this.data);
        },
        rejectModifiedData: function() {

        }
    };
}

describe("core/document-data-source-spec", function () {
    var dataSource, files;
    beforeEach(function () {
        files = {
            "file1": {
                url: "file1",
                content: "file1 content"
            }
        };
        var environmentBridge = environmentBridgeMock({
            read: function(fileUrl) {
                return Promise.resolve(files[fileUrl].content);
            },
            saveFile: function(content, fileUrl) {
                files[fileUrl].content = content;
                return Promise.resolve();
            }
        });

        dataSource = new DocumentDataSource(environmentBridge);
    });

    describe("read", function () {
        it("should be able to read a file", function () {
            return dataSource.read(files.file1.url).then(function(content) {
                expect(content).toBe(files.file1.content);
            });
        });
    });

    describe("write", function () {
        it("should be able to write to a file", function () {
            var content = "new content";

            return dataSource.write(files.file1.url, content).then(function() {
                expect(files.file1.content).toBe(content);
            });
        });

        it("should read the data that was written", function() {
            var content = "new content";

            return dataSource.write(files.file1.url, content).then(function() {
                return dataSource.read(files.file1.url).then(function(contentRead) {
                    expect(contentRead).toBe(content);
                });
            });
        });
    });

    describe("modifications", function() {
        it("should not consider data modified when a data modifier hasn't changed it", function() {
            var dataModifier = DataModifier(files.file1);
            dataSource.registerDataModifier(dataModifier);
            expect(dataSource.isModified()).toBe(false);
        });

        it("should consider data modified when a data modifier changed it", function() {
            var dataModifier = DataModifier(files.file1);
            dataSource.registerDataModifier(dataModifier);
            dataModifier._hasModifiedData = true;
            expect(dataSource.isModified()).toBe(true);
        });

        it("should accept changes when data is read", function() {
            var dataModifier1 = DataModifier(files.file1);
            var dataModifier2 = DataModifier(files.file1);

            return dataSource.read(files.file1.url)
            .then(function() {
                dataSource.registerDataModifier(dataModifier1);
                dataSource.registerDataModifier(dataModifier2);

                dataModifier1._hasModifiedData = true;
                spyOn(dataModifier1, "acceptModifiedData").andCallThrough();

                return dataSource.read(files.file1.url)
                .then(function() {
                    expect(dataModifier1.acceptModifiedData).toHaveBeenCalled();
                });
            });
        });

        it("should get the new content when read if the data was modified", function() {
            var dataModifier1 = DataModifier(files.file1);
            var dataModifier2 = DataModifier(files.file1);

            return dataSource.read(files.file1.url)
            .then(function() {
                dataSource.registerDataModifier(dataModifier1);
                dataSource.registerDataModifier(dataModifier2);

                dataModifier1.data = "new file1";
                dataModifier1._hasModifiedData = true;

                return dataSource.read(files.file1.url)
                .then(function(content) {
                    expect(content).toBe(dataModifier1.data);
                });
            });
        });

        it("should reject changes when data is accepted from a different data modifier", function() {
            var dataModifier1 = DataModifier(files.file1);
            var dataModifier2 = DataModifier(files.file1);

            return dataSource.read(files.file1.url)
            .then(function() {
                dataSource.registerDataModifier(dataModifier1);
                dataSource.registerDataModifier(dataModifier2);

                dataModifier1._hasModifiedData = true;
                dataModifier2._hasModifiedData = true;
                spyOn(dataModifier2, "rejectModifiedData").andCallThrough();

                return dataSource.read(files.file1.url)
                .then(function() {
                    expect(dataModifier2.rejectModifiedData).toHaveBeenCalled();
                });
            });
        });
    });

    describe("dataChange event", function() {
        it("should fire dataChange event when write is called", function() {
            var listener = jasmine.createSpy("listener");

            dataSource.addEventListener("dataChange", listener, false);
            return dataSource.read(files.file1.url)
            .then(function(content) {
                return dataSource.write(files.file1.url, content + " change")
                .then(function() {
                    expect(listener).toHaveBeenCalled();
                });
            });
        });

        it("should not fire dataChange event when write is called with the same content", function() {
            var listener = jasmine.createSpy("listener");

            dataSource.addEventListener("dataChange", listener, false);
            return dataSource.read(files.file1.url)
            .then(function(content) {
                return dataSource.write(files.file1.url, content)
                .then(function() {
                    expect(listener).not.toHaveBeenCalled();
                });
            });
        });
    });
});
