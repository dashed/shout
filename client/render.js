/**
 * render.js
 */

var tpl = [];
function render(name, data) {
    tpl[name] = tpl[name] || Handlebars.compile($("#templates ." + name).html());
    return tpl[name](data);
}

Handlebars.registerHelper(
    "partial", function(id) {
        return new Handlebars.SafeString(render(id, this));
    }
);

module.exports = render;
