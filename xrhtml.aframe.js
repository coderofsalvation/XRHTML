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
    const XRHTML = xrhtml.XRHTML
    if( !XRHTML.renderer )        XRHTML.renderer = scene.renderer
    if( !XRHTML.refreshInterval ) XRHTML.refreshInterval = 100 // lower is more cpu 
    let opts = {
      name: this.data.name || "xrhtml"+String(Math.random()).substr(3, 9), 
      size: this.data.size || [500, 200], 
      class: this.data.name || this.data.class || "xrhtml", 
      scene
    }
    if( this.data.url ) opts.url = this.data.url
    if( this.el.innerHTML ) opts.html = this.el.innerHTML;
    this.app = this.el.app = new XRHTML(opts);
    console.dir(this.app)
    scene.object3D.add(this.app)
    this.update()
  }, 

  update: function(){
    this.app.position.set( this.el.object3D.position.x, 
                           this.el.object3D.position.y, 
                           this.el.object3D.position.z )
    this.app.rotation.set( this.el.object3D.rotation.x, 
                           this.el.object3D.rotation.y, 
                           this.el.object3D.rotation.z )
    this.app.scale.set( this.el.object3D.scale.x, 
                           this.el.object3D.scale.y, 
                           this.el.object3D.scale.z )
  }

});
