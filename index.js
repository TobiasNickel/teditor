const editor = { t: 'editor', port: 3000 };
console.log(JSON.stringify(editor))

const Koa = require('koa');
var bodyParser = require('koa-bodyparser');
const KoaRouter = require('koa-router');
const koaMount = require('koa-mount')
const fs = require('fs-extra');

const app = new Koa();
const router = new KoaRouter();
const fsRouter = new KoaRouter();
app.use(bodyParser());

app.use(async(ctx, next) => {
    await next();
    if (ctx.body === undefined) {
        ctx.type = 'html'
        ctx.body = await fs.readFile(__dirname + '/public/index.html')
    }
});

app.use(require('koa-static')('./public', {}));

router.get('/', ctx => { ctx.body = { t: 'editor' } })


app.use(async(ctx, next) => {
    var path = ctx.path.substr(3);
    if (ctx.method == 'GET' && ctx.path.startsWith('/fs/') && ctx.path.endsWith('/')) {

        console.log(ctx.method, ctx.path);
        try {
            var contentStrings = await fs.readdir(process.cwd() + path);
            ctx.body = await Promise.all(contentStrings.map(name => {
                return fs.stat(process.cwd() + path + '/' + name).then(async info => {
                    return {
                        name,
                        isDir: await isDir(process.cwd() + path + '/' + name),
                        size: info.size,
                        ctime: info.ctime,
                        mtime: info.mtime,
                    };
                })
            }));
            return;
        } catch (err) {
            console.log(err)
        }
        return await next();
    }
    if (ctx.method == 'GET' && ctx.path.startsWith('/fs/')) {
        ctx.body = (await fs.readFile(process.cwd() + path)) + ''
    }
    console.log(ctx.method == 'POST', ctx.path.startsWith('/fs/'), ctx.request.body)
    if (ctx.method == 'POST' && ctx.path.startsWith('/fs/') && ctx.request.body.content) {
        console.log('write file to', process.cwd() + path)
        ctx.body = (await fs.writeFile(process.cwd() + path), ctx.request.body.content)
    }
});

app.use(koaMount('/fs', require('koa-static')(__dirname, {})));

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(editor.port || 3000);


function isDir(path) {
    return fs.readdir(path).then(() => true).catch(() => false);
}