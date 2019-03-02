var SceneController = function(document)
{

    this.scene = new THREE.Scene();
    this.texture = new THREE.TextureLoader().load('js/textures/indoor.jpg');
    this.scene.background = this.texture;
    this.scene.fog = new THREE.Fog( 0x000000, 1500, 4000 );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );


    this.effect = new THREE.AnaglyphEffect( this.renderer );
    this.effect.setSize(  window.innerWidth, window.innerHeight);
    this.anaEffect = true;

    //scene Cube
    this.sceneCube = new THREE.Scene();


    this.stats = new Stats();

    this.gui = new dat.GUI();
};


SceneController.prototype.setup = function()
{

    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth  , window.innerHeight);
    this.renderer.setFaceCulling( THREE.CullFaceNone );
    document.body.appendChild( this.renderer.domElement );
    this.renderer.autoClear = false;

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
};

SceneController.prototype.setupGUI = function()
{
    this.params = {
        screenController: this,
        texImg: 'indoor',
        model: 'quad',
        envMapping: true,
        effect: false,

    };



    this.gui.add(this.params, 'model', [ 'quad', 'box', 'sphere', 'torus'] ).name('3D Model').onChange(function(newValue){this.object.screenController.changeModel()});
    this.gui.add( this.params, "effect" ).name("Change Effect").onChange(function(newValue){this.object.screenController.changeEffect()});


};



SceneController.prototype.changeModel = function()
{


    if (this.params.model.localeCompare("quad") === 0)
        this.mesh.geometry = new THREE.PlaneBufferGeometry( 0.5, 0.5 );
    else if (this.params.model.localeCompare("box") === 0)
        this.mesh.geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    else if (this.params.model.localeCompare("sphere") === 0)
    this.mesh.geometry = new THREE.SphereGeometry(0.2, 30, 30);
    else if (this.params.model.localeCompare("torus") === 0)
        this.mesh.geometry = new THREE.TorusGeometry(0.1, 0.05, 8, 10);
    this.render();
};



SceneController.prototype.changeEffect = function()
{
if(this.anaEffect === true ) {
    this.effect = new THREE.StereoEffect( this.renderer );
    this.effect.setSize(  window.innerWidth, window.innerHeight);
    this.anaEffect = false;


} else {
    this.effect = new THREE.AnaglyphEffect( this.renderer );
    this.effect.setSize(  window.innerWidth, window.innerHeight);
    this.anaEffect = true;

}
    this.render();
};

SceneController.prototype.setupCamera = function()
{
    var VIEW_ANGLE = 35;
    var ASPECT_RATIO = window.innerWidth / window.innerHeight;
    var NEAR_PLANE = 0.01;
    var FAR_PLANE = 5000;



    this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT_RATIO, NEAR_PLANE, FAR_PLANE );
    this.camera.position.z = 2;
    this.camera.lookAt(this.scene.position);

    this.cubeCamera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT_RATIO, NEAR_PLANE, FAR_PLANE );
};

SceneController.prototype.setupControls = function()
{
    this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 3.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    this.controls.addEventListener( 'change', this.render.bind(this) );
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 10;
};





SceneController.prototype.setupGeometry = function()
{
    this.vertShader = document.getElementById('vertexShader').innerHTML;
    this.fragShader = document.getElementById('fragmentShader').innerHTML;


    this.texture = new THREE.TextureLoader().load('js/textures/' + this.params.texImg + '.jpg');
    var texMaterial = new THREE.MeshBasicMaterial({map: this.texture});
    var texGeometry = new THREE.PlaneBufferGeometry( 1, 1);
    this.image = new THREE.Mesh(texGeometry, texMaterial);



    var geometry = new THREE.PlaneBufferGeometry( 0.5, 0.5 );

    this.uniform = {
        texture: { type: "t", value: this.texture }
    };

    this.shaderMaterial = new THREE.ShaderMaterial( {
        uniforms : this.uniform ,
        vertexShader: this.vertShader,
        fragmentShader:  this.fragShader,
    });


   this.mesh =  new THREE.Mesh(geometry, this.shaderMaterial);
   this.scene.add(this.mesh );


};

SceneController.prototype.setupLight = function()
{
    var light = new THREE.PointLight( 0xffffcc, 1, 100 );
    light.position.set( 10, 30, 15 );
    this.scene.add(light);

    var light2 = new THREE.PointLight( 0xffffcc, 1, 100 );
    light2.position.set( 10, -30, -15 );
    this.scene.add(light2);

    this.scene.add( new THREE.AmbientLight(0x999999) );
};

SceneController.prototype.render = function()
{
    this.cubeCamera.rotation.copy(this.camera.rotation);
    this.renderer.render( this.sceneCube, this.cubeCamera );
    this.effect.render( this.scene, this.camera );
    this.stats.update();
};

SceneController.prototype.animate = function()
{
    this.camera.lookAt(this.scene.position);
    requestAnimationFrame( this.animate.bind(this) );
    this.stats.update();
    this.controls.update();
    this.render();
};
