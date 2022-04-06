## Usage

```js
import {XRHTML} from 'https://unpkg.com/xrhtml/dist/xrhtml'
window.XRHTMLRenderer        = renderer
window.XRHTMLRefreshInterval = 100 // lower is more cpu 

let html = new XRHTML({
    name: "foo",
    size: [500,200],
    html: `<div style="overflow:scroll">
        <a id="link" href="#" style="display:block;padding:10px;background:#FF0">foo</a>
        <a id="link2" href="https://aframe.io" target="_blank" style="display:block;padding:10px;background:#FF0">foo</a>
        <br>
        <h1>Hello world</h1>
        <button>foo</button>
    </div>`,
    scene
})
scene.add(html)
```

<center>
    <img src="https://raw.githubusercontent.com/coderofsalvation/XRHTML/master/.capture.gif"/>
</center>

WebXR compatible HTML-objects for THREE/AFRAME which auto-switch between CSS3D / WebGL based on xr-session events.
 
## options 

| prop | type | example value | info |
|-|-|-|-|
| `name` | string (unique) | `foo` | id of div and name of THREE object |
| `size`  | array | `[500,200]` | size of div/texture object |
| `html`  | string | `<h1>hello</h1>` | html to display |
| `url` | string | `/myiframe.html` | renders iframe (overrules html-prop |
| `css` | object | `{ 'overflow-y':'scroll' }` | pass css properties to container-div/iframe |

## Development

```sh
$ yarn add three rollup
$ watch rollup -c rollup.config.js 
```

## Credits

* NLNET
* NGI
* THREE.js
* W3C WebXR 
