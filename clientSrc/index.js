var views = require('./views')
const page = require('page.js')


var fileView = views.file();
fileView.appendTo(document.body)
fileView.load('/')

fileView.on('fileclicked', ({ dir, file }) => {
    var filePath = dir + file.name;
    console.log('fileClicked', dir, file)
    page(filePath);
    editorView.loadFile(filePath);
});

window.fileView = fileView;


var editorView = views.editor();
editorView.appendTo(document.body)
window.editorView = editorView
    //document.body.appendChild(editorView.$el[0])

var menueView = views.menue();
menueView.appendTo(document.body);
menueView.on('save', editorView.save);

page('*', function({ path }) {
    //console.log('path', path)
    var dir = path.substr(0, path.lastIndexOf('/') + 1);
    var fileName = path.substr(path.lastIndexOf('/') + 1);
    console.log('path,filename', dir, fileName)
    var filePath = dir + fileName;
    editorView.loadFile(filePath);

})
page()