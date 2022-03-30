<center>
    <img src="https://raw.githubusercontent.com/coderofsalvation/XRHTML/master/.capture.gif"/>
</center>

> THREE/AFRAME utility to automatically render HTML as CSS3D OR WebGL, making it friendly to VR headsets.

## Usage

```js
window.XRHTMLRenderer        = renderer
window.XRHTMLRefreshInterval = 100 // higher is more cpu 

let html = new XRHTML({
    id: "foo",
    size: [500,200],
    html: `<div style="overflow:scroll">
        <a id="link" href="#" style="display:block;padding:10px;background:#FF0">foo</a>
        <a id="link2" href="https://aframe.io" target="_blank" style="display:block;padding:10px;background:#FF0">foo</a>
        <br>
        <h1>Hello world</h1>
        <button>foo</button>
        Ipsum<br>
        Dolor<br>
        Site<br>
        Corpus<br>
        Delictis<br>
        Spiritus<br>
      Sanctus<br>
        Lorem<br>
        Ipsum<br>
        Dolor<br>
        Site<br>
        Corpus<br>
        Delictis<br>
        Spiritus<br>
      Sanctus<br>
    </div>`,
    scene
})
scene.add(html)
```
