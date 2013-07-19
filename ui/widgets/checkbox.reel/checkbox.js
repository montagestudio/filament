var AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox;

exports.Checkbox = AbstractCheckbox.specialize({
    
    hasTemplate: {value: true},
    
    constructor: {
        value: function Checkbox() {
            this.super();
            
            this.classList.add("filament-Checkbox");
        }
    }
});