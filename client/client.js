/**
 * Module dependencies
 */
// node.js

// 3rd-party
var io = require("socket.io-client");
var Favico = require("favico");

// jquery plugins
require('jquery-plugins/cookie');
require('jquery-plugins/inputhistory');
require('jquery-plugins/stickyscroll');
require('jquery-plugins/tabcomplete');

// handlebar plugins
require('./handlebars-plugins/uri');

// app utilities
require('string.contains');

// client-side app
var bus = require('./bus');
require('./settings');
var render = require('./render');
var input = require('./input');

// misc start
//
// put these somewhere. bootstrap.js??
var sidebar = $("#sidebar");
var chat = $("#chat");

var favico = new Favico({
    animation: "none"
});

$.cookie.json = true;

bus.on('chat:toggleComponent', function(event) {
    chat.toggleClass("hide-" + event.name, event.value);
});



// misc end

// sockets
var socket = io();

var commands = [
    "/close",
    "/connect",
    "/deop",
    "/devoice",
    "/disconnect",
    "/invite",
    "/join",
    "/kick",
    "/leave",
    "/mode",
    "/msg",
    "/nick",
    "/notice",
    "/op",
    "/part",
    "/query",
    "/quit",
    "/raw",
    "/say",
    "/send",
    "/server",
    "/slap",
    "/topic",
    "/voice",
    "/whois"
];

socket.on("auth", function(data) {
    console.log("auth", data);
});

socket.on("init", function(data) {
    if (data.networks.length === 0) {
        $("#footer").find(".connect").trigger("click");
        return;
    }

    sidebar.find(".networks").append(
        render("networks", {
            networks: data.networks
        })
    );
    var channels = $.map(data.networks, function(n) {
        return n.channels;
    });
    chat.html(
        render("chat", {
            channels: channels
        })
    );

    var id = $.cookie("target");
    var target = sidebar.find("[data-target=" + id + "]").trigger("click");
    if (target.length === 0) {
        var first = sidebar.find(".chan")
            .eq(0)
            .trigger("click");
        if (first.length === 0) {
            $("#footer").find(".connect").trigger("click");
        }
    }
});

socket.on("join", function(data) {
    var id = data.network;
    var network = sidebar.find("#network-" + id);
    network.append(
        render("channels", {
            channels: [data.chan]
        })
    );
    chat.append(
        render("chat", {
            channels: [data.chan]
        })
    );
    sidebar.find(".chan")
        .last()
        .trigger("click");
});

socket.on("msg", function(data) {
    var target = data.chan;
    if (data.msg.type == "error") {
        target = chat.find(".active").data("id");
    }
    target = "#chan-" + target;
    chat.find(target)
        .find(".messages")
        .append(render("messages", {messages: [data.msg]}))
        .trigger("msg", [
            target,
            data.msg
        ]);
});

socket.on("network", function(data) {
    sidebar.find(".empty").hide();
    sidebar.find(".networks").append(
        render("networks", {
            networks: [data.network]
        })
    );
    chat.append(
        render("chat", {
            channels: data.network.channels
        })
    );
    sidebar.find(".chan")
        .last()
        .trigger("click");
    connect.find(".btn")
        .prop("disabled", false)
        .end()
        .find("input")
        .val("");
});

socket.on("nick", function(data) {
    console.log(data);
});

socket.on("part", function(data) {
    var id = data.chan;
    sidebar.find("[data-target=#chan-" + id + "]")
        .remove()
        .end()
        .find(".chan")
        .eq(0)
        .trigger("click");
});

socket.on("quit", function(data) {
    var id = data.network;
    sidebar.find("#network-" + id)
        .remove()
        .end()
        .find(".chan")
        .eq(0)
        .trigger("click");
});

socket.on("users", function(data) {
    chat.find("#chan-" + data.chan)
        .find(".users")
        .html(render("users", data));
});

// handle input events
bus.on('input:handleText', function(text) {

    socket.emit("input", {
        target: chat.data("id"),
        text: text
    });
});

bus.on('input:tabComplete', function(word) {

    var words = commands.slice();
    var users = chat.find(".active")
        .find(".names")
        .children()
        .each(function() {
            words.push($(this).text().replace(/[+%@~]/, ""));
        });
    var channels = sidebar.find(".channel")
        .each(function() {
            var chan = $(this).clone().remove("span").text().trim();
            words.push(chan);
        });
    return $.grep(
        words,
        function(w) {
            return !w.toLowerCase().indexOf(word.toLowerCase());
        }
    );
});


var viewport = $("#viewport");

$("#rt, #lt").on("click", function(e) {
    var self = $(this);
    viewport.toggleClass(self.attr("id"));
    if (viewport.is(".lt, .rt")) {
        e.stopPropagation();
        chat.find(".chat").one("click", function() {
            viewport.removeClass("lt rt");
        });
    }
});

// sidebar
var top = 1;
sidebar.on("click", "button:not(.active)", function() {
    var self = $(this);
    var target = self.data("target");
    if (!target) {
        return;
    }

    $.cookie("target", target);
    chat.data(
        "id",
        self.data("id")
    );

    sidebar.find(".active").removeClass("active");
    self.addClass("active")
        .find(".badge")
        .removeClass("highlight")
        .empty();

    if (sidebar.find(".highlight").length === 0) {
        favico.badge("");
    }

    $("#rt").toggle(self.hasClass("chan"));
    $("#header").find("h1").html(self.data("title"));
    viewport.removeClass();

    $("#windows .active").removeClass("active");
    var chan = $(target)
        .css("z-index", top++)
        .addClass("active")
        .find(".chat")
        .sticky();
});

sidebar.on("click", ".close", function() {
    var cmd = "/close";
    var chan = $(this).closest(".chan");
    if (chan.hasClass("lobby")) {
        cmd = "/quit";
        var server = chan
            .clone()
            .remove("span")
            .text()
            .trim();
        if (!confirm("Disconnect from " + server + "?")) {
            return false;
        }
    }
    socket.emit("input", {
        target: chan.data("id"),
        text: cmd
    });
    chan.css({
        transition: "none",
        opacity: ".4"
    });
    return false;
});

// chat UI events
chat.on("input", ".search", function() {
    var value = $(this).val();
    var names = $(this).closest(".users").find(".names");
    names.find("button").each(function() {
        var btn = $(this);
        var name = btn.text().toLowerCase().replace(/[+%@~]/, "");
        if (name.indexOf(value) === 0) {
            btn.show();
        } else {
            btn.hide();
        }
    });
});

chat.on("click", ".user", function() {
    var user = $(this).html().trim().replace(/[+%@~]/, "");
    if (user.indexOf("#") !== -1) {
        return;
    }
    var text = "/whois " + user;
    socket.emit("input", {
        target: chat.data("id"),
        text: text
    });
});

chat.on("msg", ".messages", function(e, target, msg) {
    var type = msg.type;
    var highlight = type.contains("highlight");
    if (highlight) {
        pop.play();
        if (document.hidden || !$(target).hasClass("active")) {
            favico.badge("!");
        }
    }

    var btn = sidebar.find(".chan[data-target=" + target + "]:not(.active)");
    if (btn.length === 0) {
        return;
    }

    var ignore = [
        "join",
        "part",
        "quit",
        "nick"
    ];
    if ($.inArray(type, ignore) !== -1){
        return;
    }

    var badge = btn.find(".badge");
    if (badge.length !== 0) {
        var i = (parseInt(badge.html()) || 0) + 1;
        badge.html(i);
        if (highlight) {
            badge.addClass("highlight");
        }
    }
});

// connect
var connect = $("#connect");
connect.on("submit", "form", function(e) {
    e.preventDefault();
    var form = $(this)
        .find(".btn")
        .attr("disabled", true)
        .end();

    var post = {};

    var values = form.serializeArray();

    $.each(values, function(i, obj) {
        if (obj.value !== "") {
            post[obj.name] = obj.value;
        }
    });

    socket.emit("conn", post);
});


document.addEventListener(
    "visibilitychange",
    function() {
        if (sidebar.find(".highlight").length === 0) {
            favico.badge("");
        }
    }
);

