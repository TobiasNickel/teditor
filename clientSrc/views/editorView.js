const tmitter = require('tmitter');
module.exports = function createEditorView() {
    const view = {
        $el: $(`<div class="eV"></div>`),
        appendTo: function(parent) {
            view.$parent = $(parent);
            view.$parent.append(view.$el);
            editor.refresh()
        },

        endpoint: '/fs',
        loadFile: function(filePath) {
            //console.log(view.endpoint + filePath)
            fetch(view.endpoint + filePath).then(r => r.text()).then(content => {
                //console.log(content)
                view.currentFilePath = filePath;
                editor.setValue(content);
            });
        },
        save: function() {
            fetch(view.endpoint + view.currentFilePath, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: editor.getValue(),
                }),
            }).then(() => {
                alert('saved')
            }).catch(err => alert('could not save ' + err.message));
        }
    };
    tmitter(view);
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