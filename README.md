# teditor
npm install teditor &amp; have a web IDE

tEditor is supposed to become a WebEditor that you will install with a single command.

```sh
npm install -g teditor & teditor
```

I plan to:
 - use CodeMirror as the actural editor
 - find or build a limited API compatible to the nodeJS **fs** module to read and write files to the server.
 - have a very small footprint both, in client and server, to suite to be installed on singleboard computer such as RaspberryPi, Arduino, or [C.H.I.P](https://getchip.com/pages/chip)
 - use Koa, Webpack, [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), [page.js](http://visionmedia.github.io/page.js/), 
