# teditor
npm install teditor &amp; have a web IDE

tEditor is supposed to become a WebEditor that you will install with a single command.

```sh
npm install -g teditor & teditor
```

I plan to:
 - use [CodeMirror](http://codemirror.net/) as the actural editor
 - find or build a limited API compatible to the nodeJS [fs](https://nodejs.org/dist/latest-v9.x/docs/api/fs.html) module to read and write files to the server.
 - have a very small footprint both, in client and server, to suite to be installed on singleboard computer such as [RaspberryPi](https://www.raspberrypi.org/), [Arduino](https://www.arduino.cc/en/Main/Products), or [C.H.I.P](https://getchip.com/pages/chip)
 - use [Koa](https://www.npmjs.com/package/koa), [Webpack](https://www.npmjs.com/package/webpack), [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), [page.js](http://visionmedia.github.io/page.js/), [jstree](https://www.jstree.com/), [a smaller version of jquery](https://tutorialzine.com/2012/04/5-lightweight-jquery-alternatives), 
 - the view architecture similar to [backbone.js](http://backbonejs.org/#View), with components, that can trigger events and have a single $el property with a domElement as root.
 - events are propably propagated using my tiny [tmitter](https://www.npmjs.com/package/tmitter)
 - the focus will be to run good on desktop browser, still having it at least work on mobile devides will be a plus.
 - I want to keep the scope for this project limited, by making it possible to develop plugins, that can hook to frontend and backend and provide functionality such as authentication, compression, multiuser, terminal, linting, ...
 - I will make heavy use of global available events, to keep the components independent of eachother.
