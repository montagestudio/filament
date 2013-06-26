// Originally from Firebug
// https://code.google.com/p/fbug/source/browse/branches/firebug1.6/content/firebug/lib.js?spec=svn12950&r=8828#1332
// Licenced under BSD license
// https://code.google.com/p/fbug/source/browse/branches/firebug1.6/license.txt

/**
 * Gets an XPath for an element which describes its hierarchical location.
 */
exports.getElementXPath = function (element)
{
    if (element && element.id)
        return '//*[@id="' + element.id + '"]';
    else
        return exports.getElementTreeXPath(element);
};

exports.getElementTreeXPath = function (element)
{
    var paths = [];

    // Use nodeName (instead of localName) so namespace prefix is included (if any).
    for (; element && element.nodeType == 1; element = element.parentNode)
    {
        var index = 0;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
        {
            // Ignore document type declaration.
            if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                continue;

            if (sibling.nodeName == element.nodeName)
                ++index;
        }

        var tagName = element.nodeName.toLowerCase();
        var pathIndex = (index ? "[" + (index+1) + "]" : "");
        paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
};
