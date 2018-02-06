console.log(JSON.stringify({ t: 'editor' }))

const Koa = require('koa');
const KoaRouter = require('koa-router');

const app = new Koa();
const router = new KoaRouter();

app.use(require('koa-static')('./public', {}));

router.get('/', ctx => { ctx.body = { t: 'editor' } })

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);