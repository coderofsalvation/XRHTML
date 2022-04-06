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

class HTMLMesh extends Mesh {

	constructor( dom,opts ) {

		const texture = new HTMLTexture( dom, opts );

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

	constructor( dom,opts ) {

		super( html2canvas( dom, opts ) );

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

	update() {

		this.image = html2canvas( this.dom, this.opts );
		this.needsUpdate = true;

		this.scheduleUpdate = null;

	}

	dispose() {

		if ( this.observer ) {

			this.observer.disconnect();

		}

		this.scheduleUpdate = clearTimeout( this.scheduleUpdate );

		super.dispose();

	}

}


//

const canvases = new WeakMap();

function html2canvas( element, opts ) {
	opts = Object.assign({
		scrollX:0,
		scrollY:0 
	},opts || {})
	const range = document.createRange();

	function Clipper( context ) {

		const clips = [];
		let isClipping = false;

		function doClip() {

			if ( isClipping ) {

				isClipping = false;
				context.restore();

			}

			if ( clips.length === 0 ) return;

			let minX = - Infinity, minY = - Infinity;
			let maxX = Infinity, maxY = Infinity;

			for ( let i = 0; i < clips.length; i ++ ) {

				const clip = clips[ i ];

				minX = Math.max( minX, clip.x );
				minY = Math.max( minY, clip.y );
				maxX = Math.min( maxX, clip.x + clip.width );
				maxY = Math.min( maxY, clip.y + clip.height );

			}

			context.save();
			context.beginPath();
			context.rect( minX, minY, maxX - minX, maxY - minY );
			context.clip();

			isClipping = true;

		}

		return {

			add: function ( clip ) {

				clips.push( clip );
				doClip();

			},

			remove: function () {

				clips.pop();
				doClip();

			}

		};

	}

	function drawText( style, x, y, string ) {

		if ( string !== '' ) {

			if ( style.textTransform === 'uppercase' ) {

				string = string.toUpperCase();

			}

			context.font = style.fontSize + ' ' + style.fontFamily;
			context.textBaseline = 'top';
			context.fillStyle = style.color;
			context.fillText( string, x, y );

		}

	}

	function drawBorder( style, which, x, y, width, height ) {

		const borderWidth = style[ which + 'Width' ];
		const borderStyle = style[ which + 'Style' ];
		const borderColor = style[ which + 'Color' ];

		if ( borderWidth !== '0px' && borderStyle !== 'none' && borderColor !== 'transparent' && borderColor !== 'rgba(0, 0, 0, 0)' ) {

			context.strokeStyle = borderColor;
			context.beginPath();
			context.moveTo( x, y );
			context.lineTo( x + width, y + height );
			context.stroke();

		}

	}

	function drawElement( element, style ) {

		let x = 0, y = 0, width = 0, height = 0;

		if ( element.nodeType === Node.TEXT_NODE ) {

			// text

			range.selectNode( element );

			const rect = range.getBoundingClientRect();

			x = rect.left - offset.left - 0.5 - opts.scrollX;
			y = rect.top - offset.top - 0.5 - opts.scrollY;
			width = rect.width + opts.scrollX;
			height = rect.height + opts.scrollY;

			drawText( style, x, y, element.nodeValue.trim() );

		} else if ( element.nodeType === Node.COMMENT_NODE || element.tagName == "SCRIPT" ) {

			return;

		} else if ( element instanceof HTMLCanvasElement || element.tagName == "IMG") {

			// Canvas element
			if ( element.style.display === 'none' ) return;

			const rect = element.getBoundingClientRect();

			x = rect.left - offset.left - 0.5 - opts.scrollX;
			y = rect.top - offset.top - 0.5 - opts.scrollY;
			width = rect.width + opts.scrollX;
			height = rect.height + opts.scrollY;

			context.save();
			const dpr = window.devicePixelRatio;
			context.scale(1/dpr, 1/dpr);
			context.drawImage(element, x, y, width, height );
			context.restore();

		} else {

			if ( element.style.display === 'none' ) return;

			const rect = element.getBoundingClientRect();

			x = rect.left - offset.left - 0.5 - opts.scrollX;
			y = rect.top - offset.top - 0.5 - opts.scrollY;
			width = rect.width + opts.scrollX;
			height = rect.height + opts.scrollY;

			style = window.getComputedStyle( element );

			const backgroundColor = style.backgroundColor;

			if ( backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)' ) {

				context.fillStyle = backgroundColor;
				context.fillRect( x, y, width, height );

			}

			drawBorder( style, 'borderTop', x, y, width, 0 );
			drawBorder( style, 'borderLeft', x, y, 0, height );
			drawBorder( style, 'borderBottom', x, y + height, width, 0 );
			drawBorder( style, 'borderRight', x + width, y, 0, height );

			if ( element.type === 'color' || element.type === 'text' || element.type === 'number' ) {

				clipper.add( { x: x, y: y, width: width, height: height } );

				drawText( style, x + parseInt( style.paddingLeft ), y + parseInt( style.paddingTop ), element.value );

				clipper.remove();

			}

		}

		/*
		// debug
		context.strokeStyle = '#' + Math.random().toString( 16 ).slice( - 3 );
		context.strokeRect( x - 0.5, y - 0.5, width + 1, height + 1 );
		*/

		const isClipping = style.overflow === 'auto' || style.overflow === 'hidden';

		if ( isClipping ) clipper.add( { x: x, y: y, width: width, height: height } );

		for ( let i = 0; i < element.childNodes.length; i ++ ) {

			drawElement( element.childNodes[ i ], style );

		}

		if ( isClipping ) clipper.remove();

	}

	const offset = element.getBoundingClientRect();

	let canvas;

	if ( canvases.has( element ) ) {

		canvas = canvases.get( element );

	} else {

		canvas = document.createElement( 'canvas' );
		canvas.width = offset.width;
		canvas.height = offset.height;

	}

	const context = canvas.getContext( '2d'/*, { alpha: false }*/ );

	const clipper = new Clipper( context );

	// console.time( 'drawElement' );

	drawElement( element );

	// console.timeEnd( 'drawElement' );

	return canvas;

}

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
			dom.style.backgroundColor = 'transparent'
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
    dom.className = "hmesh"
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
      scrollX: this.dom.tagName == "IFRAME" ? this.dom.contentWindow.scrollX : 0, 
			scrollY: this.dom.tagName == "IFRAME" ? this.dom.contentWindow.scrollY : 0
		}
		if( this.mesh ) this.mesh.dispose()
		this.mesh = new HTMLMesh( this.capture(), opts )
		this.mesh.name = this.opts.name
		if( !this.opts.singleside ) this.mesh.material.side = THREE.DoubleSide
		if( !this.opts.opaque ) this.mesh.material.transparent = true
		this.update()
		this.add(this.mesh)
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
