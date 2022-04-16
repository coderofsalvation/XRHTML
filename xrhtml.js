import { toPng, toCanvas } from 'html-to-image';
import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from './node_modules/three/examples/jsm/renderers/CSS3DRenderer.js';
import {
	CanvasTexture,
	LinearFilter,
	Mesh,
	MeshBasicMaterial,
	PlaneGeometry,
	sRGBEncoding
} from 'three';

window.toPng = toPng

class HTMLMesh extends Mesh {

	constructor( dom,opts, canvas ) {
		const texture = new HTMLTexture( dom, opts, canvas )

		const geometry = new PlaneGeometry( texture.image.width * 0.001, texture.image.height * 0.001 );
		const material = new MeshBasicMaterial( { map: texture, toneMapped: false } );


		super( geometry, material );

		function onEvent( event ) {

			material.map.dispatchDOMEvent( event );

		}

		this.addEventListener( 'mousedown', onEvent );
		this.addEventListener( 'mousemove', onEvent );
		this.addEventListener( 'mouseup', onEvent );
		this.addEventListener( 'click', onEvent );

		this.dispose = function () {

			geometry.dispose();
			material.dispose();

			material.map.dispose();

			this.removeEventListener( 'mousedown', onEvent );
			this.removeEventListener( 'mousemove', onEvent );
			this.removeEventListener( 'mouseup', onEvent );
			this.removeEventListener( 'click', onEvent );

		};

	}

}

class HTMLTexture extends CanvasTexture {

	constructor( dom,opts, canvas ) {
    super( canvas )
    this.dom = dom;
    this.opts = opts;
    this.refreshInterval = 64 
    if( typeof window != 'undefined' && window.XRHTMLRefreshInterval )
      this.refreshInterval = window.XRHTMLRefreshInterval 
    this.anisotropy = 16;
    this.encoding = sRGBEncoding;
    this.minFilter = LinearFilter;
    this.magFilter = LinearFilter;

    // Create an observer on the DOM, and run html2canvas update in the next loop
    const observer = new MutationObserver( () => {

      if ( ! this.scheduleUpdate ) {

        // ideally should use xr.requestAnimationFrame, here setTimeout to avoid passing the renderer
        this.scheduleUpdate = setTimeout( () => this.update(), this.refreshInterval );

      }

    });

    const config = { attributes: true, childList: true, subtree: true, characterData: true };
    observer.observe( dom, config );

    this.observer = observer;

	}

	dispatchDOMEvent( event ) {

		if ( event.data ) {

			htmlevent( this.dom, event.type, event.data.x, event.data.y );

		}

	}

	async update() {
    toCanvas(this.dom)
    .then( (canvas) => {
      this.image = canvas 
      this.needsUpdate = true;
      this.scheduleUpdate = null;
    })
    .catch(console.error)

	}

	dispose() {

		if ( this.observer ) {

			this.observer.disconnect();

		}

		this.scheduleUpdate = clearTimeout( this.scheduleUpdate );

		super.dispose();

	}

}

const canvases = new WeakMap();

function htmlevent( element, event, x, y ) {

	const mouseEventInit = {
		clientX: ( x * element.offsetWidth ) + element.offsetLeft,
		clientY: ( y * element.offsetHeight ) + element.offsetTop,
		view: element.ownerDocument.defaultView
	};

	window.dispatchEvent( new MouseEvent( event, mouseEventInit ) );

	const rect = element.getBoundingClientRect();

	x = x * rect.width + rect.left;
	y = y * rect.height + rect.top;

	function traverse( element ) {

		if ( element.nodeType !== Node.TEXT_NODE && element.nodeType !== Node.COMMENT_NODE ) {

			const rect = element.getBoundingClientRect();

			if ( x > rect.left && x < rect.right && y > rect.top && y < rect.bottom ) {

				element.dispatchEvent( new MouseEvent( event, mouseEventInit ) );

			}

			for ( let i = 0; i < element.childNodes.length; i ++ ) {

				traverse( element.childNodes[ i ] );

			}

		}

	}

	traverse( element );

}

class XRHTML extends THREE.Group {

  constructor(opts){
    super()
    this.opts = opts
    this.scene = this.opts.scene
    this.dom = this.setupElement(opts)
    this.renderer = opts.renderer
		if( !this.renderer && typeof window != undefined ){
			this.renderer = window.XRHTMLRenderer
			if( !this.renderer ) throw "XRHTML: please set 'window.XRHTMLRenderer = renderer'"
		}
    if( !this.scene ) throw "XRHTML: please pass scene-property as option"
    this.renderer.xr.addEventListener( 'sessionstart', () => this.init() )
    this.renderer.xr.addEventListener( 'sessionend',   () => this.init() )
    this.init()
    return this
  }
  
  setupElement(opts){
    let dom
    if( opts.url ){
      dom = document.createElement("iframe")
      dom.src = opts.url
      dom.setAttribute("frameborder", "0")
			dom.setAttribute("allowtransparency","true")
			dom.setAttribute("allowfullscreen","yes")
			dom.setAttribute("allowvr","yes")
    }else{
      dom = document.createElement("div")
      dom.innerHTML = opts.html
      dom = dom.children[0]
    }
    dom.id = opts.name
    dom.style.width = opts.size[0]+'px'
    dom.style.height = opts.size[1]+'px'
    dom.style.boxSizing = 'border-box'
    dom.style.pointerEvents = 'auto'
    dom.className = (dom.className||"") + " hmesh"
    dom.app = this
    if( !opts.overflow ) document.body.style.overflow = 'hidden'
    return dom
  }
	
	update(){
		let compensate = 0.001
    if( this.CSS )
			this.CSS.scale.set( this.scale.x * compensate, this.scale.y * compensate, this.scale.z * compensate )
		if( this.mesh )
			this.mesh.scale.set( this.scale.x , this.scale.y , this.scale.z  )
	}

  init(){
    //this.dom.remove() // remove (wherever) from dom
    this.renderer.domElement.style.zIndex = -1 // always show css over canvas
		if( this.opts.css )
			for( let i in this.opts.css ) this.getrealDOM().style[i] = this.opts.css[i]
    setTimeout( () => {
			this.renderer.xr.isPresenting ? this.HTMLMesh(true) : this.CSS3D(true)
			this.dispatchEvent("mode", this.renderer.xr.isPresenting)
		},100 )
  }

  CSS3D(enable){
    if( !enable ){
			this.dom.style.visibility = 'hidden'
      return
    }

		this.dom.style.visibility = 'visible'
    this.HTMLMesh(false)
    if( !this.renderer.CSS3D ){
      this.renderer.CSS3D = new CSS3DRenderer({})
      let dom = this.renderer.CSS3D.domElement
      dom.setAttribute("id", "css3d")
      dom.style.position = this.renderer.domElement.style.position = 'absolute'
      dom.style.top      = this.renderer.domElement.style.top      = '0px'
      this.renderer.domElement.style.zIndex = 1 
			dom.style.zIndex = 100
			dom.style.pointerEvents = "none"
      document.body.appendChild( this.renderer.CSS3D.domElement )
      this.monkeyPatchRenderer()
    }
    this.CSS = new CSS3DObject(this.dom)
    this.CSS.scale.setScalar(0.001)
    this.CSS.name = this.opts.name
		this.update()
    this.add(this.CSS)
    return this
  }

  HTMLMesh(enable){
    if( !enable ){
      if( this.mesh ) this.remove(this.mesh)
      return
    }
   
    this.CSS3D(false)
    this.renderer.domElement.style.zIndex = 999 // always show canvas over css
    if( !this.domhide ){
      this.domhide = document.createElement("div")
      this.domhide.id = "domhide"
      this.domhide.style.position = 'absolute'
      this.domhide.style.top = '0px'
      this.domhide.style.left = '0px'
      this.domhide.style.visibility = 'hidden'
      document.body.appendChild(this.domhide)
    }
		let opts = {
      scrollX: this.dom.tagName == "IFRAME" && this.dom.contentWindow ? this.dom.contentWindow.scrollX : 0, 
			scrollY: this.dom.tagName == "IFRAME" && this.dom.contentWindow ? this.dom.contentWindow.scrollY : 0
		}
		if( this.mesh ) this.mesh.dispose()
    toCanvas(this.capture())
    .then( (canvas) => {
      this.mesh = new HTMLMesh( this.capture(), opts, canvas )
      this.mesh.name = this.opts.name
      if( !this.opts.singleside ) this.mesh.material.side = THREE.DoubleSide
      if( !this.opts.opaque ) this.mesh.material.transparent = true
      this.update()
      this.add(this.mesh)
    })
    .catch( console.error )
    return this
  }

	getrealDOM(){
		return this.dom.tagName == "IFRAME" && this.dom.contentDocument ? this.dom.contentDocument.body : this.dom 
	}

	capture(){
		let dom = this.getrealDOM()
		if( this.dom.tagName != "IFRAME" ) return dom
		// freeze viewport 
		dom.style.overflow = 'hidden'
		dom.style.height   = this.dom.style.height 
		dom.style.width   = this.dom.style.width 
		return dom
	}

  monkeyPatchRenderer(){
    let size = new THREE.Vector2()
    let render  = this.renderer.render.bind(this.renderer)
    let setSize = this.renderer.setSize.bind(this.renderer)
    this.renderer.render = (scene,camera) => {
      render(scene,camera)
      if( !this.renderer.xr.isPresenting ) this.renderer.CSS3D.render(scene,camera)
    }
    this.renderer.setSize = (w,h) => {
      setSize(w,h)
      this.renderer.CSS3D.setSize(w,h)
    }
    this.renderer.getSize(size)
    this.renderer.setSize(size.x,size.y)
  }

	dispose(){
		if( this.dom  ) this.dom.remove()
		if( this.mesh ) this.mesh.dispose()
	}

}

export { XRHTML }
