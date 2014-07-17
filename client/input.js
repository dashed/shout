/**
 * input.js
 */

var bus = require('./bus');


var input = $("#input")
    .history()
    .tab(bus.emit.bind(bus, 'input:tabComplete'), {hint: false});



var form = $("#form").on("submit", function(e) {
    e.preventDefault();
    var text = input.val();
    input.val("");

    bus.emit('input:handleText', text);

});
