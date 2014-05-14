var Component = require("montage/ui/component").Component,
    QRCode = require("qr-encode");


// https://github.com/cryptocoinjs/qr-encode#canvas
function createCanvas(text, sizeMultiplier) {
    if (typeof sizeMultiplier === "undefined") {
        sizeMultiplier = 2;
    }

    var typeNumber = getTypeNumber(text);
    var qrcode = new QRCode(typeNumber, QRCode.ErrorCorrectLevel.H);
    qrcode.addData(text);
    qrcode.make();
    var width = qrcode.getModuleCount() * sizeMultiplier;
    var height = qrcode.getModuleCount() * sizeMultiplier;

    var canvas = document.createElement("canvas");
    var scale = 10.0;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);

    var tileW = width / qrcode.getModuleCount();
    var tileH = height / qrcode.getModuleCount();

    for (var row = 0; row < qrcode.getModuleCount(); row++) {
        for (var col = 0; col < qrcode.getModuleCount(); col++) {
            ctx.fillStyle = qrcode.isDark(row, col) ? "#000000" : "#ffffff";
            ctx.fillRect(col * tileW, row * tileH, tileW, tileH);
        }
    }
    return canvas;
}


// https://github.com/cryptocoinjs/qr-encode#usage
function getTypeNumber(text) {
    /*jshint maxcomplexity:11 */
    var length = text.length * 8 + 12;
    if (length < 72)  { return 1; }
    if (length < 128) { return 2; }
    if (length < 208) { return 3; }
    if (length < 288) { return 4; }
    if (length < 368) { return 5; }
    if (length < 480) { return 6; }
    if (length < 528) { return 7; }
    if (length < 688) { return 8; }
    if (length < 800) { return 9; }
    if (length < 976) { return 10; }
    return null;
}


exports.QrCode = Component.specialize({

    constructor: {
        value: function PreviewControlPanel() {
            this.super();
        }
    },

    _value: {
        value: ""
    },

    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (this._value !== value) {
                this._value = value;
                this.needsDraw = true;
            }
        }
    },

    _canvas: {
        value: null
    },

    draw: {
        value: function() {
            if (this.value) {
                if (this._canvas) {
                    this.element.removeChild(this._canvas);
                }
                this._canvas = createCanvas(this.value, 2);
                this.element.appendChild(this._canvas);
            }
        }
    }

});
