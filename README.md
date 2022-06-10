## Usage THREE.js

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

WebXR compatible HTML-objects for THREE/AFRAME which auto-switch between CSS3D / WebGL based on xr-session events (entering/leaving VR).

## Usage AFRAME

```
<script src="xrhtml.js"></script>
<script src="xrhtml.aframe.js"></script>
<a-entity id="afoo" xrhtml="name: foo" style="display:none">       <!-- see properties -->
  <div style="overflow:scroll">
    <h1>Hello world</h1>
  </div>
</a-entity>
```

> NOTE: call `$("#afoo").components.xrhtml.update()` to sync a-entity data to HTML
 
## initialisation properties 

| prop | type | example value | info |
|-|-|-|-|
| `name` | string (unique) | `foo` | id of div and name of THREE object |
| `size`  | array | `[500,200]` | size of div/texture object |
| `html`  | string | `<h1>hello</h1>` | html to display |
| `url` | string | `/myiframe.html` | renders iframe (overrules html-prop |
| `css` | object | `{ 'overflow-y':'scroll' }` | pass css properties to container-div/iframe |
| `class` | string | classname to attach to dom-object | |

## functions / events

| function | info |
|-|-|
| `html.dispose()` | removes dom-object from dom and disposes canvas/texture etc |
| `html.addEventListener('urlchange', alert )` | responds to iframe navigation |
| `html.addEventListener('created', alert )` | responds to a created XRHTML object |

> NOTE: iframe content is fully supported, however you'll run into (same-origin) trouble when not served from same server (you don't want that anyways).

## Tips

AFRAME's look-controls mouse-focus can get when adding a-entity's interactively to `<a-scene>`:

```js 
let app = new XRHTML({...})
app.addEventListener('created',  () => {
  let lctl = $('[look-controls]').components['look-controls']
  $('a-scene').appendChild( $('canvas.a-grab-cursor') ) // make grab-cursor last child of parent again 
  $('canvas.a-grab-cursor').style.zIndex = 4 // bugfix: look-controls stops working (aframe sets it to -1?) 
                                             // when appending aframe entity to dom later on

  // while dragging, prevent overlaying dom-elements (iframe e.g.) stealing mouse focus
  if( !this.patchLookControls.patched ){
    lctl.showGrabbingCursor = ((showGrabbingCursor) => () => {
      showGrabbingCursor()
      let els = [...document.querySelectorAll('iframe')]
      els.map( (i) => i.style.pointerEvents = "none" )
    })( lctl.showGrabbingCursor.bind(lctl) )

    lctl.hideGrabbingCursor = ((hideGrabbingCursor) => () => {
      hideGrabbingCursor()
      let els = [...document.querySelectorAll('iframe')]
      els.map( (i) => i.style.pointerEvents = "auto" )
    })( lctl.hideGrabbingCursor.bind(lctl) )
    this.patchLookControls.patched = true
  }
})
```

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
