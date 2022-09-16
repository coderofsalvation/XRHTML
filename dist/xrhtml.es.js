import * as THREE from 'three';
import { Vector3, Quaternion, Matrix4, Object3D, Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture, sRGBEncoding, LinearFilter } from 'three';

/**
 * Based on http://www.emagix.net/academic/mscs-project/item/camera-sync-with-css3-and-webgl-threejs
 */

const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3();

class CSS3DObject extends Object3D {

	constructor( element = document.createElement( 'div' ) ) {

		super();

		this.element = element;
		this.element.style.position = 'absolute';
		this.element.style.pointerEvents = 'auto';
		this.element.style.userSelect = 'none';

		this.element.setAttribute( 'draggable', false );

		this.addEventListener( 'removed', function () {

			this.traverse( function ( object ) {

				if ( object.element instanceof Element && object.element.parentNode !== null ) {

					object.element.parentNode.removeChild( object.element );

				}

			} );

		} );

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.element = source.element.cloneNode( true );

		return this;

	}

}

CSS3DObject.prototype.isCSS3DObject = true;

class CSS3DSprite extends CSS3DObject {

	constructor( element ) {

		super( element );

		this.rotation2D = 0;

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.rotation2D = source.rotation2D;

		return this;

	}

}

CSS3DSprite.prototype.isCSS3DSprite = true;

//

const _matrix = new Matrix4();
const _matrix2 = new Matrix4();

class CSS3DRenderer {

	constructor( parameters = {} ) {

		const _this = this;

		let _width, _height;
		let _widthHalf, _heightHalf;

		const cache = {
			camera: { fov: 0, style: '' },
			objects: new WeakMap()
		};

		const domElement = parameters.element !== undefined ? parameters.element : document.createElement( 'div' );

		domElement.style.overflow = 'hidden';

		this.domElement = domElement;

		const cameraElement = document.createElement( 'div' );

		cameraElement.style.transformStyle = 'preserve-3d';
		cameraElement.style.pointerEvents = 'none';

		domElement.appendChild( cameraElement );

		this.getSize = function () {

			return {
				width: _width,
				height: _height
			};

		};

		this.render = function ( scene, camera ) {

			const fov = camera.projectionMatrix.elements[ 5 ] * _heightHalf;

			if ( cache.camera.fov !== fov ) {

				domElement.style.perspective = camera.isPerspectiveCamera ? fov + 'px' : '';
				cache.camera.fov = fov;

			}

			if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
			if ( camera.parent === null ) camera.updateMatrixWorld();

			let tx, ty;

			if ( camera.isOrthographicCamera ) {

				tx = - ( camera.right + camera.left ) / 2;
				ty = ( camera.top + camera.bottom ) / 2;

			}

			const cameraCSSMatrix = camera.isOrthographicCamera ?
				'scale(' + fov + ')' + 'translate(' + epsilon( tx ) + 'px,' + epsilon( ty ) + 'px)' + getCameraCSSMatrix( camera.matrixWorldInverse ) :
				'translateZ(' + fov + 'px)' + getCameraCSSMatrix( camera.matrixWorldInverse );

			const style = cameraCSSMatrix +
				'translate(' + _widthHalf + 'px,' + _heightHalf + 'px)';

			if ( cache.camera.style !== style ) {

				cameraElement.style.transform = style;

				cache.camera.style = style;

			}

			renderObject( scene, scene, camera);

		};

		this.setSize = function ( width, height ) {

			_width = width;
			_height = height;
			_widthHalf = _width / 2;
			_heightHalf = _height / 2;

			domElement.style.width = width + 'px';
			domElement.style.height = height + 'px';

			cameraElement.style.width = width + 'px';
			cameraElement.style.height = height + 'px';

		};

		function epsilon( value ) {

			return Math.abs( value ) < 1e-10 ? 0 : value;

		}

		function getCameraCSSMatrix( matrix ) {

			const elements = matrix.elements;

			return 'matrix3d(' +
				epsilon( elements[ 0 ] ) + ',' +
				epsilon( - elements[ 1 ] ) + ',' +
				epsilon( elements[ 2 ] ) + ',' +
				epsilon( elements[ 3 ] ) + ',' +
				epsilon( elements[ 4 ] ) + ',' +
				epsilon( - elements[ 5 ] ) + ',' +
				epsilon( elements[ 6 ] ) + ',' +
				epsilon( elements[ 7 ] ) + ',' +
				epsilon( elements[ 8 ] ) + ',' +
				epsilon( - elements[ 9 ] ) + ',' +
				epsilon( elements[ 10 ] ) + ',' +
				epsilon( elements[ 11 ] ) + ',' +
				epsilon( elements[ 12 ] ) + ',' +
				epsilon( - elements[ 13 ] ) + ',' +
				epsilon( elements[ 14 ] ) + ',' +
				epsilon( elements[ 15 ] ) +
			')';

		}

		function getObjectCSSMatrix( matrix ) {

			const elements = matrix.elements;
			const matrix3d = 'matrix3d(' +
				epsilon( elements[ 0 ] ) + ',' +
				epsilon( elements[ 1 ] ) + ',' +
				epsilon( elements[ 2 ] ) + ',' +
				epsilon( elements[ 3 ] ) + ',' +
				epsilon( - elements[ 4 ] ) + ',' +
				epsilon( - elements[ 5 ] ) + ',' +
				epsilon( - elements[ 6 ] ) + ',' +
				epsilon( - elements[ 7 ] ) + ',' +
				epsilon( elements[ 8 ] ) + ',' +
				epsilon( elements[ 9 ] ) + ',' +
				epsilon( elements[ 10 ] ) + ',' +
				epsilon( elements[ 11 ] ) + ',' +
				epsilon( elements[ 12 ] ) + ',' +
				epsilon( elements[ 13 ] ) + ',' +
				epsilon( elements[ 14 ] ) + ',' +
				epsilon( elements[ 15 ] ) +
			')';

			return 'translate(-50%,-50%)' + matrix3d;

		}

		function renderObject( object, scene, camera, cameraCSSMatrix ) {

			if ( object.isCSS3DObject ) {

				const visible = ( object.visible === true ) && ( object.layers.test( camera.layers ) === true );
				object.element.style.display = ( visible === true ) ? '' : 'none';

				if ( visible === true ) {

					object.onBeforeRender( _this, scene, camera );

					let style;

					if ( object.isCSS3DSprite ) {

						// http://swiftcoder.wordpress.com/2008/11/25/constructing-a-billboard-matrix/

						_matrix.copy( camera.matrixWorldInverse );
						_matrix.transpose();

						if ( object.rotation2D !== 0 ) _matrix.multiply( _matrix2.makeRotationZ( object.rotation2D ) );

						object.matrixWorld.decompose( _position, _quaternion, _scale );
						_matrix.setPosition( _position );
						_matrix.scale( _scale );

						_matrix.elements[ 3 ] = 0;
						_matrix.elements[ 7 ] = 0;
						_matrix.elements[ 11 ] = 0;
						_matrix.elements[ 15 ] = 1;

						style = getObjectCSSMatrix( _matrix );

					} else {

						style = getObjectCSSMatrix( object.matrixWorld );

					}

					const element = object.element;
					const cachedObject = cache.objects.get( object );

					if ( cachedObject === undefined || cachedObject.style !== style ) {

						element.style.transform = style;

						const objectData = { style: style };
						cache.objects.set( object, objectData );

					}

					if ( element.parentNode !== cameraElement ) {

						cameraElement.appendChild( element );

					}

					object.onAfterRender( _this, scene, camera );

				}

			}

			for ( let i = 0, l = object.children.length; i < l; i ++ ) {

				renderObject( object.children[ i ], scene, camera);

			}

		}

	}

}

class HTMLMesh extends Mesh {

	constructor( dom,opts, canvas ) {
		const texture = new HTMLTexture( dom, opts, canvas );

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
    super( canvas );
    this.dom = dom;
    this.opts = opts;
    this.refreshInterval = 64; 
    if( typeof window != 'undefined' && XRHTML.refreshInterval )
      this.refreshInterval = XRHTML.refreshInterval; 
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
    XRHTML.update( this.dom );
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
    super();
    this.opts = opts;
    this.scene = this.opts.scene;
    this.dom = this.setupElement(opts);
    this.renderer = opts.renderer;
		if( !this.renderer && typeof window != undefined ){
			this.renderer = XRHTML.renderer;
			if( !this.renderer ) throw "XRHTML: please set 'XRHTML.renderer = renderer'"
		}
    if( !this.scene ) throw "XRHTML: please pass scene-property as option"
    this.renderer.xr.addEventListener( 'sessionstart', () => this.init() );
    this.renderer.xr.addEventListener( 'sessionend',   () => this.init() );
    this.init();
    return this
  }
  
  setupElement(opts){
    let dom;
    if( opts.dom ) dom = opts.dom;
    else if( opts.url ){
      dom = document.createElement("iframe");
      dom.src = opts.url;
      dom.setAttribute("frameborder", "0");
			dom.setAttribute("allowtransparency","true");
			dom.setAttribute("allowfullscreen","yes");
			dom.setAttribute("allowvr","yes");
      dom.addEventListener('load', (e) => {
        this.dispatchEvent({type:'urlchange',message:{event:e, obj:this}});
      });
    }else {
      dom = document.createElement("div");
      dom.innerHTML = opts.html;
      if( dom.children.length ) dom = dom.children[0];
    }
    dom.id = opts.name;
    dom.style.width = opts.size[0]+'px';
    dom.style.height = opts.size[1]+'px';
    dom.style.boxSizing = 'border-box';
    dom.style.pointerEvents = 'auto';
    dom.className = (dom.className||opts.class||"") + " hmesh";
    dom.app = this;
    if( !opts.overflow ) document.body.style.overflow = 'hidden';
    return dom
  }
	
	update(){
		let compensate = 0.001;
    if( this.CSS )
			this.CSS.scale.set( this.scale.x * compensate, this.scale.y * compensate, this.scale.z * compensate );
		if( this.mesh )
			this.mesh.scale.set( this.scale.x , this.scale.y , this.scale.z  );
	}

  init(){
    //this.dom.remove() // remove (wherever) from dom
    this.renderer.domElement.style.zIndex = -1; // always show css over canvas
		if( this.opts.css )
			for( let i in this.opts.css ) this.getRealDOM().style[i] = this.opts.css[i];
    setTimeout( () => {
			this.renderer.xr.isPresenting ? this.VR(true) : this.CSS3D(true);
			this.dispatchEvent("mode", this.renderer.xr.isPresenting);
      this.dispatchEvent({type:'created',message:{event:'created', obj:this}});
		},100 );
  }

  CSS3D(enable){
    if( !enable ){
			this.dom.style.visibility = 'hidden';
      return
    }

		this.dom.style.visibility = 'visible';
    this.VR(false);
    if( !this.renderer.CSS3D ){
      this.renderer.CSS3D = new CSS3DRenderer({});
      let dom = this.renderer.CSS3D.domElement;
      dom.setAttribute("id", "css3d");
      dom.style.position = this.renderer.domElement.style.position = 'absolute';
      dom.style.top      = this.renderer.domElement.style.top      = '0px';
      this.renderer.domElement.style.zIndex = 1; 
			dom.style.zIndex = 100;
			dom.style.pointerEvents = "none";
      document.body.appendChild( this.renderer.CSS3D.domElement );
      this.monkeyPatchRenderer();
    }
    this.CSS = new CSS3DObject(this.dom);
    this.CSS.scale.setScalar(0.001);
    this.CSS.name = this.opts.name;
		this.update();
    this.add(this.CSS);
    return this
  }

  VR(enable){
    if( !enable ){
      if( this.mesh ) this.remove(this.mesh);
      return
    }
    // now hide dom
    this.CSS3D(false);
    this.renderer.domElement.style.zIndex = 999; // always show canvas over css
   
    if( !this.domhide ){
      this.domhide = document.createElement("div");
      this.domhide.id = "domhide";
      this.domhide.style.position = 'absolute';
      this.domhide.style.top = '0px';
      this.domhide.style.left = '0px';
      this.domhide.style.visibility = 'hidden';
      document.body.appendChild(this.domhide);
    }
		if( this.mesh ) this.mesh.dispose();

    if( !XRHTML.parser ) throw 'XRHTML: {..., parser} parser-function was not passed as option' 
    XRHTML.parser( this.getRealDOM(), this.getRealOptions(), (object3D) => {
      if( !object3D ) return 
      console.log("adding mesh");
      this.mesh = object3D;
      this.mesh.name = this.opts.name;
      if( !this.opts.singleside ) this.mesh.material.side = THREE.DoubleSide;
      if( !this.opts.opaque ) this.mesh.material.transparent = true;
      this.add(this.mesh);
      this.update();
    });
    return this
  }

  getRealOptions(){
		return {
      scrollX: this.dom.tagName == "IFRAME" && this.dom.contentWindow ? this.dom.contentWindow.scrollX : 0, 
			scrollY: this.dom.tagName == "IFRAME" && this.dom.contentWindow ? this.dom.contentWindow.scrollY : 1
		}
  }

	getRealDOM(){
		return this.dom.tagName == "IFRAME" && this.dom.contentDocument ? this.dom.contentDocument.body : this.dom
	}

  monkeyPatchRenderer(){
    let size = new THREE.Vector2();
    let render  = this.renderer.render.bind(this.renderer);
    let setSize = this.renderer.setSize.bind(this.renderer);
    this.renderer.render = (scene,camera) => {
      render(scene,camera);
      if( !this.renderer.xr.isPresenting ) this.renderer.CSS3D.render(scene,camera);
    };
    this.renderer.setSize = (w,h) => {
      setSize(w,h);
      this.renderer.CSS3D.setSize(w,h);
    };
    this.renderer.getSize(size);
    this.renderer.setSize(size.x,size.y);
  }

	dispose(){
		if( this.dom  ) this.dom.remove();
		if( this.mesh ) this.mesh.dispose();
	}

}

// default html2canvas parser
XRHTML.parser = (dom, opts, addObject ) => {
  dom.mesh = new HTMLMesh( dom, opts, html2canvas(dom) );
  addObject(dom.mesh);
};
XRHTML.update = (dom) => {
  dom.mesh.image = html2canvas(dom);
  dom.mesh.needsUpdate = true;
  dom.mesh.scheduleUpdate = null;
};

function html2canvas( element ) {

	const range = document.createRange();
	const color = new THREE.Color();

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

			context.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily;
			context.textBaseline = 'top';
			context.fillStyle = style.color;
			context.fillText( string, x, y + parseFloat( style.fontSize ) * 0.1 );

		}

	}

	function buildRectPath( x, y, w, h, r ) {

		if ( w < 2 * r ) r = w / 2;
		if ( h < 2 * r ) r = h / 2;

		context.beginPath();
		context.moveTo( x + r, y );
		context.arcTo( x + w, y, x + w, y + h, r );
		context.arcTo( x + w, y + h, x, y + h, r );
		context.arcTo( x, y + h, x, y, r );
		context.arcTo( x, y, x + w, y, r );
		context.closePath();

	}

	function drawBorder( style, which, x, y, width, height ) {

		const borderWidth = style[ which + 'Width' ];
		const borderStyle = style[ which + 'Style' ];
		const borderColor = style[ which + 'Color' ];

		if ( borderWidth !== '0px' && borderStyle !== 'none' && borderColor !== 'transparent' && borderColor !== 'rgba(0, 0, 0, 0)' ) {

			context.strokeStyle = borderColor;
			context.lineWidth = parseFloat( borderWidth );
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

			x = rect.left - offset.left - 0.5;
			y = rect.top - offset.top - 0.5;
			width = rect.width;
			height = rect.height;

			drawText( style, x, y, element.nodeValue.trim() );

		} else if ( element.nodeType === Node.COMMENT_NODE ) {

			return;

		} else if ( element instanceof HTMLCanvasElement ) {

			// Canvas element
			if ( element.style.display === 'none' ) return;

			context.save();
			const dpr = window.devicePixelRatio;
			context.scale( 1 / dpr, 1 / dpr );
			context.drawImage( element, 0, 0 );
			context.restore();

		} else {

			if ( element.style.display === 'none' ) return;

			const rect = element.getBoundingClientRect();

			x = rect.left - offset.left - 0.5;
			y = rect.top - offset.top - 0.5;
			width = rect.width;
			height = rect.height;

			style = window.getComputedStyle( element );

			// Get the border of the element used for fill and border

			buildRectPath( x, y, width, height, parseFloat( style.borderRadius ) );

			const backgroundColor = style.backgroundColor;

			if ( backgroundColor !== 'transparent' && backgroundColor !== 'rgba(0, 0, 0, 0)' ) {

				context.fillStyle = backgroundColor;
				context.fill();

			}

			// If all the borders match then stroke the round rectangle

			const borders = [ 'borderTop', 'borderLeft', 'borderBottom', 'borderRight' ];

			let match = true;
			let prevBorder = null;

			for ( const border of borders ) {

				if ( prevBorder !== null ) {

					match = ( style[ border + 'Width' ] === style[ prevBorder + 'Width' ] ) &&
					( style[ border + 'Color' ] === style[ prevBorder + 'Color' ] ) &&
					( style[ border + 'Style' ] === style[ prevBorder + 'Style' ] );

				}

				if ( match === false ) break;

				prevBorder = border;

			}

			if ( match === true ) {

				// They all match so stroke the rectangle from before allows for border-radius

				const width = parseFloat( style.borderTopWidth );

				if ( style.borderTopWidth !== '0px' && style.borderTopStyle !== 'none' && style.borderTopColor !== 'transparent' && style.borderTopColor !== 'rgba(0, 0, 0, 0)' ) {

					context.strokeStyle = style.borderTopColor;
					context.lineWidth = width;
					context.stroke();

				}

			} else {

				// Otherwise draw individual borders

				drawBorder( style, 'borderTop', x, y, width, 0 );
				drawBorder( style, 'borderLeft', x, y, 0, height );
				drawBorder( style, 'borderBottom', x, y + height, width, 0 );
				drawBorder( style, 'borderRight', x + width, y, 0, height );

			}

			if ( element instanceof HTMLInputElement ) {

				let accentColor = style.accentColor;

				if ( accentColor === undefined || accentColor === 'auto' ) accentColor = style.color;

				color.set( accentColor );

				const luminance = Math.sqrt( 0.299 * ( color.r ** 2 ) + 0.587 * ( color.g ** 2 ) + 0.114 * ( color.b ** 2 ) );
				const accentTextColor = luminance < 0.5 ? 'white' : '#111111';

				if ( element.type === 'radio' ) {

					buildRectPath( x, y, width, height, height );

					context.fillStyle = 'white';
					context.strokeStyle = accentColor;
					context.lineWidth = 1;
					context.fill();
					context.stroke();

					if ( element.checked ) {

						buildRectPath( x + 2, y + 2, width - 4, height - 4, height );

						context.fillStyle = accentColor;
						context.strokeStyle = accentTextColor;
						context.lineWidth = 2;
						context.fill();
						context.stroke();

					}

				}

				if ( element.type === 'checkbox' ) {

					buildRectPath( x, y, width, height, 2 );

					context.fillStyle = element.checked ? accentColor : 'white';
					context.strokeStyle = element.checked ? accentTextColor : accentColor;
					context.lineWidth = 1;
					context.stroke();
					context.fill();

					if ( element.checked ) {

						const currentTextAlign = context.textAlign;

						context.textAlign = 'center';

						const properties = {
							color: accentTextColor,
							fontFamily: style.fontFamily,
							fontSize: height + 'px',
							fontWeight: 'bold'
						};

						drawText( properties, x + ( width / 2 ), y, '✔' );

						context.textAlign = currentTextAlign;

					}

				}

				if ( element.type === 'range' ) {

					const [ min, max, value ] = [ 'min', 'max', 'value' ].map( property => parseFloat( element[ property ] ) );
					const position = ( ( value - min ) / ( max - min ) ) * ( width - height );

					buildRectPath( x, y + ( height / 4 ), width, height / 2, height / 4 );
					context.fillStyle = accentTextColor;
					context.strokeStyle = accentColor;
					context.lineWidth = 1;
					context.fill();
					context.stroke();

					buildRectPath( x, y + ( height / 4 ), position + ( height / 2 ), height / 2, height / 4 );
					context.fillStyle = accentColor;
					context.fill();

					buildRectPath( x + position, y, height, height, height / 2 );
					context.fillStyle = accentColor;
					context.fill();

				}

				if ( element.type === 'color' || element.type === 'text' || element.type === 'number' ) {

					clipper.add( { x: x, y: y, width: width, height: height } );

					drawText( style, x + parseInt( style.paddingLeft ), y + parseInt( style.paddingTop ), element.value );

					clipper.remove();

				}

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

export { HTMLMesh, HTMLTexture, XRHTML, html2canvas };
