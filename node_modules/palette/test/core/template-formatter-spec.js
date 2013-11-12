var Template = require("montage/core/template").Template,
    TemplateFormatter = require("core/template-formatter").TemplateFormatter;

describe("core/template-formatter-spec", function () {
    var formatter,
        template;

    beforeEach(function() {
        template = Template.create();
        formatter = TemplateFormatter.create().init(template);
    });

    describe("indentation", function() {
        it("should create an empty string for depth 0", function() {
            expect(formatter.getIndentSpace(0)).toBe("");
        });

        it("should create an empty string for depth 1", function() {
            expect(formatter.getIndentSpace(0)).toBe("");
        });

        it("should create indentation for depth 2", function() {
            expect(formatter.getIndentSpace(2)).toBe("    ");
        });

        it("should create indentation for depth >2", function() {
            expect(formatter.getIndentSpace(4)).toBe("            ");
        });

        it("should create correct indentation after changing indent", function() {
            formatter.indent = 2;
            expect(formatter.getIndentSpace(2)).toBe("  ");
        });
    });

    describe("doctype", function() {
        it("should detect html5 doctype", function() {
            template.document = template.createHtmlDocumentWithHtml("");
            expect(formatter.getDoctypeString()).toBe("<!DOCTYPE html>");
        });

        it("should detect xhtml doctype", function() {
            var doctype = document.implementation.createDocumentType(
                'html',
                '-//W3C//DTD XHTML 1.0 Strict//EN',
                'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'
            );

            template.document = document.implementation.createDocument
                ('http://www.w3.org/1999/xhtml', 'html', doctype);

            expect(formatter.getDoctypeString()).toBe('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
        });
    });

    describe("attributes", function() {
        it("should format a single attribute", function() {
            var node = document.createElement("div"),
                html;

            node.setAttribute("class", "header");

            html = formatter.getAttributesHtml(node.attributes);
            expect(html).toBe('class="header"');
        });

        it("should format a multiple attributes", function() {
            var node = document.createElement("div"),
                html;

            node.setAttribute("class", "header");
            node.setAttribute("tabindex", "-1");

            html = formatter.getAttributesHtml(node.attributes);
            expect(html).toBe('class="header" tabindex="-1"');
        });

        it("should escape quotes", function() {
            var node = document.createElement("input"),
                html;

            node.type = "checkbox";
            node.setAttribute("checked", "a\"b");

            html = formatter.getAttributesHtml(node.attributes);
            expect(html).toBe('type="checkbox" checked="a&quot;b"');
        });

        it("should format a valueless attributes", function() {
            var node = document.createElement("input"),
                html;

            node.type = "checkbox";
            node.setAttribute("checked", "");

            html = formatter.getAttributesHtml(node.attributes);
            expect(html).toBe('type="checkbox" checked=""');
        });
    });

    describe("text nodes", function() {
        it("should ignore empty text nodes", function() {
            var textNode = document.createTextNode(""),
                html;

            html = formatter.getTextHtml(textNode);
            expect(html).toBe('');
        });

        it("should format a text node with indentation", function() {
            var textNode = document.createTextNode("hello world"),
                html;

            html = formatter.getTextHtml(textNode, 2);
            expect(html).toBe(formatter.getIndentSpace(2) + 'hello world');
        });

        it("should format a text node with indentation", function() {
            var textNode = document.createTextNode("hello world"),
                html;

            html = formatter.getTextHtml(textNode, 2);
            expect(html).toBe(formatter.getIndentSpace(2) + 'hello world');
        });
    });

    describe("open tag", function() {
        it("should format a attributeless tag", function() {
            var node = document.createElement("div"),
                html;

            html = formatter.getOpenTagHtml(node);
            expect(html).toBe('<div>');
        });

        it("should format a tag with attributes", function() {
            var node = document.createElement("div"),
                html;

            node.setAttribute("class", "main");

            html = formatter.getOpenTagHtml(node);
            expect(html).toBe('<div class="main">');
        });
    });

    it("should format a close tag", function() {
        var node = document.createElement("div"),
            html;

        html = formatter.getCloseTagHtml(node);
        expect(html).toBe('</div>');
    });

    describe("elements", function() {
        it("should format a childless element", function() {
            var node = document.createElement("div"),
                html;

            html = formatter.getElementHtml(node);
            expect(html).toBe('<div></div>');
        });

        it("should format an element with a child", function() {
            var node = document.createElement("div"),
                html;

            node.innerHTML = "<span></span>";

            formatter.indent = 0;
            html = formatter.getElementHtml(node);

            expect(html).toBe('<div>\n<span></span>\n</div>');
        });

        it("should format an element with proper indentation", function() {
            var node = document.createElement("div"),
                html;

            formatter.indent = 1;
            html = formatter.getElementHtml(node, 2);
            expect(html).toBe(' <div></div>');
        });

        it("should format an element with a child with proper indentation on the element", function() {
            var node = document.createElement("div"),
                html;

            node.innerHTML = "<span></span>";

            formatter.indent = 1;
            html = formatter.getElementHtml(node, 2);
            expect(html).toBe(' <div>\n  <span></span>\n </div>');
        });

        it("should format an element with a child with proper indentation on the child", function() {
            var node = document.createElement("div"),
                html;

            node.innerHTML = "<span></span>";

            formatter.indent = 1;
            html = formatter.getElementHtml(node, 1);

            expect(html).toBe('<div>\n <span></span>\n</div>');
        });

        it("should not format an element in NO_FORMATTING", function() {
            var node = document.createElement("pre"),
                html;

            node.innerHTML = "This is a pre <span>block</span> of code";

            html = formatter.getElementHtml(node, 1);

            expect(html).toBe('This is a pre <span>block</span> of code');
        });

        it("should format a childless head element", function() {
            var node = document.createElement("head"),
                html;

            html = formatter.getElementHtml(node, 1);

            expect(html).toBe('<head></head>');
        });

        it("should format a childless head element with the serialization", function() {
            var node = document.createElement("head"),
                html;

            template.objectsString = "{}";
            formatter.indent = 1;
            html = formatter.getElementHtml(node, 1);

            expect(html).toBe('<head> <script type="text/montage-serialization">\n {}\n </script>\n</head>');
        });
    });

    describe("node list", function() {
        it("should format a node list with one element", function() {
            var node = document.createElement("div"),
                html;

            node.innerHTML = "<span></span>";

            html = formatter.getNodeListHtml(node.childNodes);

            expect(html).toBe('<span></span>');
        });

        it("should format a node list with multiple elements", function() {
            var node = document.createElement("div"),
                html;

            node.innerHTML = "<span></span><div></div>";

            html = formatter.getNodeListHtml(node.childNodes);

            expect(html).toBe('<span></span>\n<div></div>');
        });

        it("should ignore empty child nodes", function() {
            var node = document.createElement("div"),
                html;

            node.innerHTML = "\n    <span></span>\n";
            formatter.indent = 1;
            html = formatter.getNodeListHtml(node.childNodes, 2);

            expect(html).toBe('  <span></span>');
        });
    });

    it("should format a comment", function() {
        var node = document.createComment("a comment"),
            html;

        html = formatter.getCommentHtml(node);

        expect(html).toBe('<!--a comment-->');
    });

    describe("serialization", function() {
        it("should format the serialization", function() {
            var html;

            template.objectsString = JSON.stringify({});
            html = formatter.getSerializationHtml();

            expect(html).toBe('<script type="text/montage-serialization">\n{}\n</script>');
        });

        it("should format the serialization with proper indentation", function() {
            var html;

            template.objectsString = JSON.stringify({});
            formatter.indent = 1;
            html = formatter.getSerializationHtml(2);

            expect(html).toBe(' <script type="text/montage-serialization">\n {}\n </script>');
        });

        it("should format object references", function() {
            var serialization,
                text;

            serialization = JSON.stringify({
                "object": {
                    "value": {
                        "@": "object"
                    }
                }
            }, null, 1);
            text = formatter.formatSerialization(serialization);

            expect(text).toBe('{\n "object": {\n  "value": {"@": "object"}\n }\n}');
        });

        it("should format element references", function() {
            var serialization,
                text;

            serialization = JSON.stringify({
                "object": {
                    "value": {
                        "#": "element"
                    }
                }
            }, null, 1);
            text = formatter.formatSerialization(serialization);

            expect(text).toBe('{\n "object": {\n  "value": {"#": "element"}\n }\n}');
        });

        it("should format bindings", function() {
            var serialization,
                text;

            serialization = JSON.stringify({
                "object": {
                    "bindings": {
                        "value": {
                            "<-": "@object.path"
                        }
                    }
                }
            }, null, 1);
            text = formatter.formatSerialization(serialization);

            expect(text).toBe('{\n "object": {\n  "bindings": {\n   "value": {"<-": "@object.path"}\n  }\n }\n}');
        });
    });

    describe("template", function() {
        it("should format a template", function() {
            var html;

            template.document = template.createHtmlDocumentWithHtml("<!doctype html><html><head></head><body></body></html>");

            html = formatter.getHtml();

            expect(html).toBe('<!DOCTYPE html>\n<html>\n<head></head>\n<body></body>\n</html>');
        });
    });
});
