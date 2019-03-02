var SceneController = function(document)
{
    this.scene = new THREE.Scene();
    this.stats = new Stats();
  	this.renderer = new THREE.WebGLRenderer( { antialias: true } );

    this.gui = new dat.GUI();
}

SceneController.prototype.setup = function()
{
    // https://threejs.org/docs/#api/renderers/WebGLRenderer
  	this.renderer.setSize( window.innerWidth, window.innerHeight);
  	document.body.appendChild( this.renderer.domElement );

    //add performance logging
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );

    this.setupGUI();
    this.setupCamera();
    this.setupControls();
    this.setupLight();
    this.setupGeometry();

    this.render();
    this.animate();
}

SceneController.prototype.setupGUI = function()
{
    //set default value here
    this.params = {
        screenController : this,
        magnitude : .75,
        shader : 'simple',
        lightx: .5,
        lighty: .5,
        lightz: .5,
    };

    this.gui.add(this.params, 'magnitude', 0.1, 1.0).name("Magnitude").onChange(function(newValue){this.object.screenController.updateModel()});
    this.gui.add(this.params, 'shader', [ 'simple', 'dynamic', 'flat', 'gouraud', 'phong', 'blinnphong', 'toon'] ).name('Shader').onChange(function(newValue){this.object.screenController.changeShader()});
    this.gui.add(this.params, 'lightx', -1.0, 1,0).name("Light X").onChange(function(newValue){this.object.screenController.updateLight()});
    this.gui.add(this.params, 'lighty', -1.0, 1.0).name("Light Y").onChange(function(newValue){this.object.screenController.updateLight()});
    this.gui.add(this.params, 'lightz', -1.0, 1.0).name("Light Z").onChange(function(newValue){this.object.screenController.updateLight()});

    this.gui.open();
}

SceneController.prototype.setupCamera = function()
{
  var VIEW_ANGLE = 70;
  var ASPECT_RATIO = window.innerWidth / window.innerHeight;
  var NEAR_PLANE = 0.01;
  var FAR_PLANE = 10;

  // https://threejs.org/docs/#api/cameras/PerspectiveCamera
	this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT_RATIO, NEAR_PLANE, FAR_PLANE );
	this.camera.position.z = 1;
    this.camera.lookAt(this.scene.position);
}

SceneController.prototype.setupControls = function()
{
    // https://github.com/mrdoob/three.js/tree/master/examples/js/controls

    // This tells the controls to only work when the mouse is over the renderer's domElement (the canvas).
    // This change fixed the problems I was having with dat.GUI while using TrackballControls.
    // From https://github.com/mrdoob/three.js/issues/828
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
				this.controls.rotateSpeed = 3.0;
				this.controls.zoomSpeed = 1.2;
				this.controls.panSpeed = 0.8;
				this.controls.enableZoom = true;
				this.controls.enablePan = true;
				this.controls.enableDamping = false;
				this.controls.dampingFactor = 0.3;
				this.controls.keys = [ 65, 83, 68 ];
        //bind? --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
				this.controls.addEventListener( 'change', this.render.bind(this) );
}

// check out this very simple shader example https://gist.github.com/kylemcdonald/9593057
SceneController.prototype.setupGeometry = function()
{
    //expand the uniforms array for passing more values to the shader
		this.uniforms = {
			magnitude: { type: "f", value: this.params.magnitude},
			lightPosition: { value: new THREE.Vector3(this.params.lightx, this.params.lighty, this.params.lightz)
            }
		};

    this.material = new THREE.ShaderMaterial( {
      uniforms : this.uniforms,
      vertexShader: document.getElementById( 'vertex-simple' ).textContent,
      fragmentShader: document.getElementById( 'fragment-simple' ).textContent
    });

    var boxGeometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    this.meshBox = new THREE.Mesh( boxGeometry, this.material );
    this.meshBox.position.set(0.3,0,0);
    this.scene.add( this.meshBox );

    var sphereGeometry = new THREE.SphereGeometry(0.1, 30, 30);
    this.meshSphere = new THREE.Mesh( sphereGeometry, this.material );
    this.scene.add( this.meshSphere );

    var knotGeometry = new THREE.TorusKnotGeometry( 0.1, 0.025, 100, 16 );
    this.meshKnot = new THREE.Mesh( knotGeometry, this.material );
    this.meshKnot.position.set(-0.35,0,0);
    this.scene.add( this.meshKnot );

    //creating the sphere to visualize the light

    var lightMaterial = new THREE.MeshLambertMaterial({
        color: "yellow",  // CSS color names can be used!
    });

    var lightGeometry = new THREE.SphereGeometry(0.05, 0.05, 0.05);
    this.meshLight = new THREE.Mesh( lightGeometry, lightMaterial  );
    this.meshLight.position.set(0.5, 0.5, 0.5);
    this.scene.add( this.meshLight );

  	this.mesh = new THREE.Mesh( this.geometry, this.material );
    this.scene.add( this.mesh );

}

//the light is only used for visualizing the light
//the shaders don't use it.
SceneController.prototype.setupLight = function()
{
  // https://threejs.org/docs/#api/lights/PointLight
  var light = new THREE.PointLight( 0xffffcc, 1, 100 );
  light.position.set( 10, 30, 15 );
  this.scene.add(light);

  var light2 = new THREE.PointLight( 0xffffcc, 1, 100 );
  light2.position.set( 10, -30, -15 );
  this.scene.add(light2);

  this.scene.add( new THREE.AmbientLight(0x999999) );


}

SceneController.prototype.render = function() {
  this.renderer.render( this.scene, this.camera );
  this.stats.update();
}

SceneController.prototype.animate = function()
{
  //bind? --> https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
	requestAnimationFrame( this.animate.bind(this) );
   this.stats.update();
	this.controls.update();
}

SceneController.prototype.updateModel = function()
{
  //shader values are set like this
  //pay attention to the .value at the end
  //for vec3 this works like this: this.uniforms.myVector3.value.x = newValueX
  this.uniforms.magnitude.value = this.params.magnitude;


  this.render();
}

SceneController.prototype.updateLight = function()
{
    //shader values are set like this
    //pay attention to the .value at the end
    //for vec3 this works like this: this.uniforms.myVector3.value.x = newValueX

    this.uniforms.lightPosition.value.x= this.params.lightx;
    this.uniforms.lightPosition.value.y= this.params.lighty;
    this.uniforms.lightPosition.value.z= this.params.lightz;


    this.meshLight.position.set(this.uniforms.lightPosition.value.x, this.uniforms.lightPosition.value.y, this.uniforms.lightPosition.value.z);

    this.render();
}


SceneController.prototype.changeShader = function()
{
  //the name of the shades in the dropdown correspond to the suffix of the shaders.
  this.material = new THREE.ShaderMaterial( {
    uniforms : this.uniforms,
    vertexShader: document.getElementById( 'vertex-' + this.params.shader ).textContent,
    fragmentShader: document.getElementById( 'fragment-' + this.params.shader ).textContent
  });


  //apply the new material to all meshes. Usually, this should be an array.
  this.meshBox.material = this.material;
  this.meshSphere.material = this.material;
  this.meshKnot.material = this.material;

  this.render();
}
