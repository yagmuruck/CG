var SceneController = function(document)
{
    this.texScene = new THREE.Scene();
    this.texScene.background = new THREE.Color(0xf0f0f0);
    this.texScene.fog = new THREE.Fog( 0x000000, 1500, 4000 );
    this.texRenderer = new THREE.WebGLRenderer( { antialias: true } );

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0x000000 );
    this.scene.fog = new THREE.Fog( 0x000000, 1500, 4000 );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );

    //scene Cube
    this.sceneCube = new THREE.Scene();


    this.stats = new Stats();

    this.gui = new dat.GUI();
};


SceneController.prototype.setup = function()
{
    this.texRenderer.setPixelRatio( window.devicePixelRatio );
    this.texRenderer.setSize( window.innerWidth / 2 - 20, window.innerHeight);
    document.body.appendChild( this.texRenderer.domElement );
    this.texRenderer.autoClear = false;

    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth / 2 - 20, window.innerHeight);
    this.renderer.setFaceCulling( THREE.CullFaceNone );
    document.body.appendChild( this.renderer.domElement );
    this.renderer.autoClear = false;

    //add performance logging
    this.stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild( this.stats.dom );

    this.textureCanvas = document.getElementsByTagName('canvas')[0];

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
        texImg: 'earth',
        model: 'quad',
        texStyle: 'Nearest',
        sMapping: false,
        envMapping: false,
        drawSilhouette: false,
        bumpMap: false,
        fixSMapping: false,
        pen: false
    };

    var texNames = [ 'earth', 'indoor', 'wood', 'checker', 'checkerl', 'egyptian_friz'];

    this.gui.add(this.params, 'texImg', texNames ).name('Texture Images').onChange(function(newValue){this.object.screenController.changeTexture()});
    this.gui.add(this.params, 'model', [ 'quad', 'box', 'sphere', 'torus'] ).name('3D Model').onChange(function(newValue){this.object.screenController.changeModel()});
    this.gui.add(this.params, 'texStyle', [ 'Nearest', 'Linear', 'MipMap Nearest', 'MipMap Linear'] ).name('Texture Style').onChange(function(newValue){this.object.screenController.changeTextureStyle()});

    this.gui.add( this.params, "sMapping" ).name("Spherical mapping").onChange(function(newValue){this.object.screenController.sphericalMap()});
    this.gui.add( this.params, "envMapping" ).name("Environment mapping").onChange(function(newValue){this.object.screenController.envMap()});
    this.gui.add( this.params, "drawSilhouette" ).name("Draw silhouette").onChange(function(newValue){this.object.screenController.silhouetteShaders()});
    this.gui.add( this.params, "bumpMap" ).name("Bump map").onChange(function(newValue){this.object.screenController.bumpMap()});
    this.gui.add(this.params, "fixSMapping").name("Fixed spherical mapping").onChange(function(newValue){this.object.screenController.fixSphericalMap()});
    this.gui.add( this.params, "pen" ).name("Pen drawing").onChange(function(newValue){this.object.screenController.penDrawing()});

    this.gui.open()
};

SceneController.prototype.changeTexture = function()
{

    this.scene.remove(this.mesh);

    this.texImg= this.params.texImg;

    this.texture = new THREE.TextureLoader().load('js/textures/' + this.texImg + '.jpg');
    var texMaterial = new THREE.MeshBasicMaterial({map: this.texture});
    var texGeometry = new THREE.PlaneBufferGeometry( 1, 1);
    this.image = new THREE.Mesh(texGeometry, texMaterial);
    this.texScene.add(this.image);

    this.uniform = {
        texture: { type: "t", value: this.texture }
    };

    this.shaderMaterial = new THREE.ShaderMaterial( {
        uniforms : this.uniform ,
        vertexShader: this.vertShader,
        fragmentShader:  this.fragShader,
    });


    this.mesh =  new THREE.Mesh(this.mesh.geometry, this.shaderMaterial);
    this.scene.add(this.mesh );

    this.render();

    if(this.params.envMapping === true) {
        this.envMap();
    }


};

SceneController.prototype.changeTextureStyle = function()
{

    this.texStyle = this.params.texStyle;

    if(this.texStyle === "Nearest")
        (this.texture.magFilter = THREE.NearestFilter);
    else if(this.texStyle === "Linear")
        (this.texture.magFilter =  THREE.LinearFilter);
    else if(this.texStyle === "MipMap Nearest")
        (this.texture.minFilter =  THREE.NearestMipMapNearestFilter);
    else if(this.texStyle === "MipMap Linear")
        (this.texture.minFilter = THREE.LinearMipMapLinearFilter);

    this.texture.needsUpdate = true;
    this.shaderMaterial.needsUpdate = true;

    this.render();

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
    this.changeTexture();
    this.render();
};

SceneController.prototype.setupCamera = function()
{
    var VIEW_ANGLE = 35;
    var ASPECT_RATIO = window.innerWidth/2 / window.innerHeight;
    var NEAR_PLANE = 0.01;
    var FAR_PLANE = 5000;

    this.texCamera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT_RATIO, NEAR_PLANE, FAR_PLANE );
    this.texCamera.position.z = 2;
    this.texCamera.lookAt(this.texScene.position);


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

SceneController.prototype.sphericalMap = function()
{
    if( this.params.sMapping === true) {
        this.vertShader = document.getElementById('vertexSphShader').innerHTML;
        this.fragShader = document.getElementById('fragmentSphShader').innerHTML;
        window.console.log("true");
    } else {
    this.vertShader = document.getElementById('vertexShader').innerHTML;
    this.fragShader = document.getElementById('fragmentShader').innerHTML;
    }
    this.changeTexture();
    this.render();
    };

SceneController.prototype.silhouetteShaders = function()
{

    if( this.params.drawSilhouette === true) {
        window.console.log("sil");
        window.console.log(this.mesh);
        this.vertShader = document.getElementById('vertexSilShader').innerHTML;
        this.fragShader = document.getElementById('fragmentSilShader').innerHTML;
        window.console.log(this.mesh);
    } else {
        this.vertShader = document.getElementById('vertexShader').innerHTML;
        this.fragShader = document.getElementById('fragmentShader').innerHTML;
    }
    this.changeTexture();
    this.render();
};

SceneController.prototype.envMap = function()
{

    if (this.params.envMapping === true) {


        //texture equirec
        this.textureEquirec = new THREE.TextureLoader().load('js/textures/' + this.params.texImg + '.jpg');
        this.textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
        this.textureEquirec.magFilter = THREE.LinearFilter;
        this.textureEquirec.minFilter = THREE.LinearMipMapLinearFilter;
        this.textureEquirec.encoding = THREE.sRGBEncoding;


        //materials

        var equirectShader = THREE.ShaderLib[ "equirect" ];

        var equirectMaterial = new THREE.ShaderMaterial( {
            fragmentShader: equirectShader.fragmentShader,
            vertexShader: equirectShader.vertexShader,
            uniforms: equirectShader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });

        equirectMaterial.uniforms[ "tEquirect" ].value = this.textureEquirec;
        // enable code injection for non-built-in material
        Object.defineProperty( equirectMaterial, 'map', {

            get: function () {

                return this.uniforms.tEquirect.value;
            }
        });


        this.cubeMesh = new THREE.Mesh( new THREE.BoxBufferGeometry( 10, 10, 10 ), equirectMaterial );
        this.cubeMesh.visible = true;
        this.cubeMesh.material.needsUpdate = true;
        this.sceneCube.add( this.cubeMesh );



        var sphereGeometry = new THREE.SphereBufferGeometry( 400.0, 48, 24 );
        this.sphereMaterial = new THREE.MeshLambertMaterial( { map: this.textureEquirec } );

        this.sphereMesh = new THREE.Mesh( sphereGeometry , this.sphereMaterial );
        this.sphereMesh.material.needsUpdate = true;
        this.scene.add( this.sphereMesh );


    } else {
        this.sceneCube.remove(this.cubeMesh);

        this.changeTexture();
    }
    this.render();

};

SceneController.prototype.bumpMap = function(){


    if(this.params.bumpMap === true) {

        this.mesh.material = new THREE.MeshPhongMaterial();
        this.mesh.material.map = this.texture;
        var bump = new THREE.TextureLoader().load('js/textures/' + this.texImg + '_bump.jpg');
        this.mesh.material.bumpMap = bump;
        this.mesh.material.needsUpdate = true;
        this.render();

    } else {
        this.changeTexture();
        this.render();
    }
};

SceneController.prototype.fixSphericalMap = function ()
{

    if( this.params.fixSMapping === true) {
        this.vertShader = document.getElementById('vertexFixSphShader').innerHTML;
        this.fragShader = document.getElementById('fragmentFixSphShader').innerHTML;
    } else {
        this.vertShader = document.getElementById('vertexShader').innerHTML;
        this.fragShader = document.getElementById('fragmentShader').innerHTML;
    }
    this.changeTexture();
    this.render();
};

SceneController.prototype.penDrawing = function(){

    if (this.params.pen) {
        this.drawingCanvas = document.createElement('canvas');
        // might need to uncomment the multiplication
        // if you know what's happening here, please let me know
        this.drawingCanvas.height = this.textureCanvas.height;//0.5;
        this.drawingCanvas.width = this.textureCanvas.width;//0.5;

        this.drawingCanvas.setAttribute("style","position: absolute; top: 0; left: 0;");
        document.body.appendChild(this.drawingCanvas);

        this.drawingCanvasContext = this.drawingCanvas.getContext('2d');

        this.drawingCanvas.addEventListener("mousemove", function (e){
            e.preventDefault();
            this.draw('move', e);
        }.bind(this), false);

        this.drawingCanvas.addEventListener("mousedown", function (e){
            this.draw('down', e);
        }.bind(this), false);

        this.drawingCanvas.addEventListener("mouseup", function (e){
            this.draw('up', e);
        }.bind(this), false);

        this.drawingCanvas.addEventListener("mouseout", function (e){
            this.draw('out', e);
        }.bind(this), false);

    } else {
        document.body.removeChild(this.drawingCanvas);
        this.changeTexture();

    }
};

SceneController.prototype.draw = function(res, e){
    // https://stackoverflow.com/questions/2368784/draw-on-html5-canvas-using-a-mouse
    if (res == 'down') {
        this.prevX = this.currX;
        this.prevY = this.currY;
        this.currX = e.clientX - this.drawingCanvas.offsetLeft;
        this.currY = e.clientY - this.drawingCanvas.offsetTop;

        this.flag = true;
        this.dot_flag = true;

        if (this.dot_flag) {
            this.drawingCanvasContext.beginPath();
            this.drawingCanvasContext.fillStyle = "white";
            this.drawingCanvasContext.fillRect(this.currX, this.currY, 2, 2);
            this.drawingCanvasContext.closePath();
            this.dot_flag = false;
        }
    }

    if (res == 'up' || res == "out") {
        this.flag = false;
    }
    if (res == 'move') {
        if (this.flag) {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = e.clientX - this.drawingCanvas.offsetLeft;
            this.currY = e.clientY - this.drawingCanvas.offsetTop;
            this.makeStroke();
        }
    }
};



    SceneController.prototype.makeStroke = function(){

        this.drawingCanvasContext.beginPath();
        this.drawingCanvasContext.moveTo(this.prevX, this.prevY);
        this.drawingCanvasContext.lineTo(this.currX, this.currY);
        this.drawingCanvasContext.strokeStyle = "orange";
        this.drawingCanvasContext.lineWidth = 2;
        this.drawingCanvasContext.stroke();
        this.drawingCanvasContext.closePath();

        // Todo: use THREE.CanvasTexture(this.drawingCanvas);
        var canvasMap = new THREE.CanvasTexture(this.drawingCanvas);



        var canMaterial = new THREE.MeshBasicMaterial({
            map: canvasMap
        });

        var canvasMesh = new THREE.Mesh(this.mesh.geometry, canMaterial);
        this.scene.add(canvasMesh);

        this.render();


        /*
        var material = new THREE.MeshLambertMaterial({
            uniforms : this.uniform ,
            vertexShader: this.vertShader,
            fragmentShader:  this.fragShader,
            map: canvasMap
        });*/
/*
        this.canvasMesh =  new THREE.Mesh(this.mesh.geometry, material);
        this.scene.add(this.canvasMesh );
*/



       /* this.shaderMaterial.map = canvasMap;
        //this.mesh.material.map = canvasMap;

        this.shaderMaterial.map.needsUpdate = true;
       // this.mesh.material.map.needsUpdate = true;
       // this.mesh.needsUpdate = true;
        this.shaderMaterial.needsUpdate = true;


*/
};

SceneController.prototype.setupGeometry = function()
{
    this.vertShader = document.getElementById('vertexShader').innerHTML;
    this.fragShader = document.getElementById('fragmentShader').innerHTML;


    this.texture = new THREE.TextureLoader().load('js/textures/' + this.params.texImg + '.jpg');
    var texMaterial = new THREE.MeshBasicMaterial({map: this.texture});
    var texGeometry = new THREE.PlaneBufferGeometry( 1, 1);
    this.image = new THREE.Mesh(texGeometry, texMaterial);
    this.texScene.add(this.image);



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
    this.texScene.add(light);
    this.scene.add(light);

    var light2 = new THREE.PointLight( 0xffffcc, 1, 100 );
    light2.position.set( 10, -30, -15 );
    this.texScene.add(light2);
    this.scene.add(light2);

    this.texScene.add( new THREE.AmbientLight(0x999999) );
    this.scene.add( new THREE.AmbientLight(0x999999) );
};

SceneController.prototype.render = function()
{
    this.cubeCamera.rotation.copy(this.camera.rotation);
    this.texRenderer.render(this.texScene, this.texCamera);
    this.renderer.render( this.scene, this.camera );
    this.renderer.render( this.sceneCube, this.cubeCamera );
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
