const tmitter = require('tmitter');

module.exports = function createEditorView() {
    const view = {
        $el: $(`<div class="fileList"></div>`),
        appendTo: function(parent) {
            view.$parent = $(parent);
            view.$parent.append(view.$el);
        },
        currentPath: "",
        endpoint: '/fs',
        load: function(path) {
            if (path.endsWith('/')) {
                return view.loadDirectory(path)
            } else {
                return Promise.reject('this load is for reading direcories')
            }
        },
        loadDirectory(path) {
            return fetch(view.endpoint + path).then(r=>{
                var contentType = r.headers.get('content-type').split(';')[0]
                if (contentType === 'application/json') {
                    r.json().then(json=>{
                        //console.log(json)
                        view.currentPath = path;
                        view.$el.empty();
                        if (view.currentPath.length > 1) {
                            var $dotdot = $('<div class="file">..</div>');
                            view.$el.append($dotdot);
                            $dotdot.on('click', function() {
                                var pathParts = view.currentPath.split('/');
                                //console.log(pathParts)
                                pathParts.pop();
                                pathParts.pop();
                                view.load(pathParts.join('/')+'/');
                            });
                        }
                        json.forEach(file=>{
                            var $file = $('<div class="file">' + file.name + '</div>')
                            $file.on('click', function() {
                                //console.log(file)
                                if (file.isDir) {
                                    view.load(view.currentPath + file.name + '/');
                                }else{
                                    view.trigger('fileclicked',{dir:view.currentPath,file})
                                }
                            });
                            view.$el.append($file);
                        });
                    });
                } else {
                    throw new Error('not a directory')
                }
               // console.log(r, r.headers)

            }
            );
        },
    };
    tmitter(view)
    return view;
}
;
