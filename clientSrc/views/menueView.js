const tmitter = require('tmitter');

module.exports = function createEditorView() {
    const view = {
        $el: $(`<div class="menueView"><h1>menue</h1></div>`),
        appendTo: function(parent) {
            view.$parent = $(parent);
            view.$parent.append(view.$el);
        },
    };

    const $save = $('<div class="entry">save</div>');
    $save.on('click', function() {
        view.trigger('save');
    });

    view.$el.append($save);

    tmitter(view);
    return view;
};