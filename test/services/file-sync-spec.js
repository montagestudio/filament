var FileSyncService = require("../../services/file-sync").FileSyncService,
    Q = require("q");

describe("core/file-sync-spec", function() {
    beforeEach(function() {
        documentMock = {
            url: 'foo',
            content: ''
        };
    });

    it("should periodically compare displayed and model files contents", function(done) {
        var service = new FileSyncService(documentMock);
        service.callCount = 0;
        service._documentHasChanged = function() {
            this.callCount += 1;
            return Q.resolve(false);
        };

        service.start(10);

        setTimeout(function() {
            expect(service.callCount).toEqual(3);
            service.stop();
            done();
        }, 29);
    });

    it("should stop comparing when service is stopped", function(done) {
        var service = new FileSyncService(documentMock);
        service.callCount = 0;
        service._documentHasChanged = function() {
            this.callCount += 1;
            return Q.resolve(false);
        };

        service.start(10);
        service.stop();

        setTimeout(function() {
            expect(service.callCount).toEqual(1);
            service.stop();
            done();
        }, 29);
    });

    it("should mark document as dirty if displayed and model contents do not match", function(done) {
        var document = {
            isDirty: false,
            content: 'FOO',
            codeMirrorDocument: {
                children: [
                    {
                        lines: [
                            {
                                text: 'BAR'
                            }
                        ]
                    }
                ]
            }
        };

        var service = new FileSyncService(document);

        service.start(10)
            .then(function() {
                return service.stop()
            })
            .then(function() {
                expect(document.isDirty).toBeTruthy();
                done();
            });

    });

    it("should not mark document as dirty if displayed and model contents match", function(done) {
        var document = {
            isDirty: false,
            content: 'FOO',
            codeMirrorDocument: {
                children: [
                    {
                        lines: [
                            {
                                text: 'FOO'
                            }
                        ]
                    }
                ]
            }
        };

        var service = new FileSyncService(document);

        service.start(10)
            .then(function() {
                return service.stop()
            })
            .then(function() {
                expect(document.isDirty).toBeFalsy();
                done();
            });

    });

    it("should not touch document dirtyness if document is already marked as dirty", function(done) {
        var document = {
            isDirty: true,
            content: 'FOO',
            codeMirrorDocument: {
                children: [
                    {
                        lines: [
                            {
                                text: 'FOO'
                            }
                        ]
                    }
                ]
            }
        };

        var service = new FileSyncService(document);

        service.start(10)
            .then(function() {
                return service.stop()
            })
            .then(function() {
                expect(document.isDirty).toBeTruthy();
                done();
            });

    });
});