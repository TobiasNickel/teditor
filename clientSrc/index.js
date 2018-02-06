var views = require('./views')

var editorView = views.editor();
editorView.appendTo(document.body)
    //document.body.appendChild(editorView.$el[0])