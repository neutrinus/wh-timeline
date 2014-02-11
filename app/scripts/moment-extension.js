moment.fn.next = function(period) {
    return this.endOf(period).add('seconds', 1);
};
