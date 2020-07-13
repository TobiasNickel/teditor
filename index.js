
const path = require('path');
const express = require('express');
require('tasyncexpress');
const fs = require('fs-extra');

function opt(argv) {
    var opt = {}, arg, p; argv = Array.prototype.slice.call(argv || process.argv); for (var i = 2; i < argv.length; i++)if (argv[i].charAt(0) == '-')
        ((p = (arg = ("" + argv.splice(i--, 1)).replace(/^[\-]+/, '')).indexOf("=")) > 0 ? opt[arg.substring(0, p)] = arg.substring(p + 1) : opt[arg] = true);
    return { 'node': argv[0], 'script': argv[1], 'argv': argv.slice(2), 'opt': opt };
}
var options = opt();
const workspacePath = path.resolve(options.opt.dir || options.opt.directory || '.');
const port = options.opt.p || options.opt.port || process.env.PORT || 3000;
const host = options.opt.host || '127.0.0.1';
const editor = { t: 'editor', port: process.env.PORT || 3000, dir: workspacePath };

if(options.opt.h || options.opt.help){
    console.log('usage: teditor --dir=. --host=127.0.0.1 --port=3000');
    console.log('\tThen open the port shown in the browser');
    console.log('options:')
    console.log('\t--dir=. \tthe directory to edit in the ide, default is the current directory.')
    console.log('\t--host=0.0.0.0 \tset this to 0.0.0.0 to access from anywhere, or to the IP address of a specific interface on the host to serve from there, default is localhost');
    console.log('\t--port=3000 \tthe port to bind, default is 3000');
    console.log('')
    process.exit();
    return;
}

console.log(editor)



const app = express();

const indexRoute = async (req,res)=>{
    // console.log(req.headers);
    var index = (await fs.readFile(__dirname+'/index.html')).toString();
    if(req.headers.referer){
        index = index.split('localhost:3000').join(new URL(req.headers.referer).host)
    }
    res.send(index)
}
app.get('/', indexRoute)
app.get('/index.html', indexRoute)
app.get('/index.htm', indexRoute)

app.use(express.static(__dirname+'/public'));
app.use(express.json())


app.get('/fs/.vscode/settings.json', (req, res) => {
    res.json({})
});
app.get('/fs/.vscode/tasks.json', (req, res) => {
    res.json({})
});
app.get('/fs/.vscode/launch.json', (req, res) => {
    res.json({})
});

var count = 0;
app.use((req, res, next) => {
    console.log(count++, req.method, req.url);
    next();
});

app.get('/readdir/*', async (req, res) => {
    try {
        console.log('--',req.path,req.path.substr(8))
        const dirPath = pathToWorkspace(req.path.substr(8));
        console.log('readdir', dirPath)
        const dir = await fs.readdir(dirPath);

        var vsCodeDir = await Promise.all(dir.filter(e => !['.', '..'].includes(e)).map(async e => {
            const stat = await fs.stat(dirPath + '/' + e);
            return [
                e,
                stat.isDirectory() ? 2 : (stat.isFile() ? 1 : 0)
            ];
        }));

        res.json(vsCodeDir);
    } catch (err) {
        console.log(err)
        res.status(400).json(err);
    }
})
app.get('/fileStat/*', async (req, res) => {
    try {
        const stat = await fs.stat(pathToWorkspace(req.path.substr(9)))
        JSON.stringify(stat)
        stat.type = stat.isDirectory() ? 2 : (stat.isFile() ? 1 : 0)
        stat.atime = stat.atime.getTime();
        stat.mtime = stat.mtime.getTime();
        stat.ctime = stat.ctime.getTime();
        stat.uri = '/fs' + req.path.substr(12);
        res.json(stat)
    } catch (err) {
        if (err.code === 'ENOENT') {
            res.json(null)
            return;
        }
        console.log(err)

        res.status(400).json(err)
    }
})
app.use('/fs', express.static(workspacePath, {
    redirect: false
}));

app.delete('/deletefile', async (req, res) => {
    console.log(req.body)
    const path = req.body.resource.path
    await fs.unlink(pathToWorkspace(path));
    res.json(true);
})

app.post('/writefile', async (req, res) => {
    const filePath = pathToWorkspace(req.body.resource.path);
    const content = req.body.content;
    console.log('write:', { filePath, content })
    await fs.writeFile(filePath, content);
    res.json(true);
});

app.post('/rename', async (req, res) => {
    console.log('rename', req.body)
    const formPath = pathToWorkspace(req.body.from.path);
    const toPath = pathToWorkspace(req.body.to.path);
    await fs.move(formPath, toPath, { overwrite: true });
    res.json(true);
});
app.post('/mkdir', async (req, res) => {
    console.log(req.body);
    const newDirPath = pathToWorkspace(req.body.resource.path);
    await fs.mkdir(newDirPath);
    res.json(true)
})



app.listen(port, host, (err) => {
    if (err) {
        console.log(err);
    }
});

/**
 * 
 * @param {string} inPath 
 */
function pathToWorkspace(inPath) {
    if (!inPath.startsWith('/fs')) { throw new Error('not in fs'); }
    if (inPath.includes('..')) { throw new Error('stay in fs ! !'); }
    if (inPath.substr(4).startsWith('/')) { throw new Error('stay in fs ! !'); }

    return path.resolve(workspacePath, inPath.substr(4));
}

