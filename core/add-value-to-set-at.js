module.exports = addValueToSetAt;
function addValueToSetAt(set, value, index) {
    var node = new set.order.Node(value);
    if (!set.store.has(node)) {
        if (set.dispatchesRangeChanges) {
            set.dispatchBeforeRangeChange([value], [], index);
        }
        set.order.splice(index, 0, value);
        node = set.order.scan(index);
        set.store.add(node);
        set.length++;
        if (set.dispatchesRangeChanges) {
            set.dispatchRangeChange([value], [], index);
        }
        return true;
    }
    return false;
}
