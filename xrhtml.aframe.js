AFRAME.registerComponent('xrhtml', {
  schema:{
    name:     {type:"string"},
    size:    {type:"array"}, 
    url:     {type:"string"},
    theme:   {type:"string"},
  },
  remove: function(){
    if( this.app ) this.app.dispose()
  }, 
  init: function() {
    let scene = document.querySelector("a-scene")
    if( !window.XRHTMLRenderer )        window.XRHTMLRenderer = scene.renderer
    if( !window.XRHTMLRefreshInterval ) window.XRHTMLRefreshInterval = 100 // lower is more cpu 
    let opts = {
      name: this.data.name || "xrhtml"+String(Math.random()).substr(3, 9), 
      size: this.data.size || [500, 200], 
      class: this.data.class || "xrhtml", 
      scene
    }
    if( this.data.url ) opts.url = this.data.url
    if( this.el.innerHTML ) opts.html = this.el.innerHTML;
    this.app = new XRHTML(opts);
    if( this.data.position ) this.app.position = this.el.object3D.position.clone()
    if( this.data.rotation ) this.app.rotation = this.el.object3D.rotation.clone()
    scene.object3D.add(this.app)
  }, 

});
