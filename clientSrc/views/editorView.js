module.exports = function createEditorView() {
    const view = {
        $el: $(`<div class="eV"></div>`),
        appendTo: function(parent) {
            view.$parent = $(parent);
            view.$parent.append(view.$el);
            editor.refresh()
        },
    };
    const $textArea = $("<textarea>");
    view.$el.append($textArea);
    const editor = CodeMirror.fromTextArea($textArea[0], {
        lineNumbers: true
    });
    editor.setSize('100%', '100%')
    view.editor = editor;
    view.$textArea = $textArea;
    return view;
};