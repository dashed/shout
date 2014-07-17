/**
 * settings.js
 */

var bus = require('./bus');

var settings = $("#settings");

// load any settings from memory
var options = $.extend({
    join: true,
    mode: true,
    nick: true,
    notification: true,
    part: true,
    quit: true,
}, $.cookie("settings"));


for (var i in options) {
    if (options[i]) {
        settings.find("input[name=" + i + "]").prop("checked", true);
    }
}

settings.on("change", "input", function() {
    var self = $(this);
    var name = self.attr("name");
    options[name] = self.prop("checked");
    $.cookie("settings", options);
    if ([
        "join",
        "nick",
        "part",
        "mode",
        "quit",
    ].indexOf(name) !== -1) {

        bus.emit('chat:toggleComponent', {
            component: name,
            value: !self.prop("checked")
        });
    }
}).find("input")
    .eq(0)
    .trigger("change");

// test audio
var pop = require('./audio');

$("#play").on("click", function() {
    pop.play();
});


