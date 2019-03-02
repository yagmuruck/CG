class SceneController {
    constructor(document, workerObject) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xf0f0f0 );

        if(workerObject == undefined) {
            this.container = document.createElement( 'div' );
            document.body.appendChild( this.container );
            this.gui = new dat.GUI();
        }

        this.setupCamera();
        this.setupLight();
        this.setupGeometry();

        this.renderer = new RaytracingRenderer(this.scene, this.camera, workerObject);
        if(workerObject == undefined) {
            window.renderer = this.renderer;
            this.renderer.domElement.style.position = "absolute";
            this.renderer.domElement.style.top = "0px";
            this.renderer.domElement.style.left = "0px";
            this.renderer.domElement.style.width = "100%";
            this.renderer.domElement.style.height = "100%";
            this.container.appendChild(this.renderer.domElement);
            this.setupGUI();
        }

    }
}

SceneController.prototype.setupGUI = function() {
    //set default value here
    this.params = {
        screenController: this,
        superSamplingRate: this.renderer.superSamplingRate,
        maxRecursionDepth: this.renderer.maxRecursionDepth,
        render: function () {
            this.screenController.render();
        },
        saveImg: function() {
            this.screenController.saveImg();
        }
    };

    this.gui.add(this.params, 'superSamplingRate', 0, 3).step(1).name("Supersampling rate").onChange(function(newValue){this.object.screenController.updateModel()});
    this.gui.add(this.params, 'maxRecursionDepth', 0, 5).step(1).name("Max recursion").onChange(function(newValue){this.object.screenController.updateModel()});
    this.gui.add(this.renderer, 'allLights').listen();
    this.gui.add(this.renderer, 'calcDiffuse').listen();
    this.gui.add(this.renderer, 'calcPhong').listen();
    this.gui.add(this.renderer, 'phongMagnitude', 1, 100).step(1).listen();

    this.gui.add(this.renderer, 'useMirrors').name('Use Mirrors').listen();

    var overwriteSize = this.gui.addFolder('Render Size');
    overwriteSize.add(this.renderer, 'overwriteSize').name('As Specified below').listen();
    overwriteSize.add(this.renderer.sizeOverwrite, 'x').name('width');
    overwriteSize.add(this.renderer.sizeOverwrite, 'y').name('height');

    var webWorker = this.gui.addFolder('WebWorker');
    webWorker.add(this.renderer, 'workerCount', 1, 32).step(1).name('Worker Count');
    webWorker.add(this.renderer, 'sectionWidth', 1, 8).step(1).name('Size (2^n)');

    this.gui.add(this.params, "render");
    this.gui.add(this.params, 'saveImg');

    this.gui.open();
}

SceneController.prototype.setupCamera = function() {
    this.camera = new THREE.PerspectiveCamera( 60, 1, 1, 1000 );
    this.camera.position.z = 600;
    if(typeof window != 'undefined') {
        window.camera = this.camera;
    }
}

// check out this very simple shader example https://gist.github.com/kylemcdonald/9593057
SceneController.prototype.setupGeometry = function() {
    // materials
    var phongMaterial = new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        specular: 0x222222,
        shininess: 150,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );

    var phongMaterialRed = new THREE.MeshPhongMaterial( {
        color: 0xff0000,
        specular: 0x222222,
        shininess: 150,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );

    var phongMaterialGreen = new THREE.MeshPhongMaterial( {
        color: 0x00ff00,
        specular: 0x222222,
        shininess: 150,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );
    var phongMaterialBlue = new THREE.MeshPhongMaterial( {
        color: 0x0000ff,
        specular: 0x222222,
        shininess: 150,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );

    var phongMaterialYellow = new THREE.MeshPhongMaterial( {
        color: 0x880000,
        specular: 0x222222,
        shininess: 150,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );

    var phongMaterialBox = new THREE.MeshPhongMaterial( {
        color: 0xffffff,
        specular: 0x111111,
        shininess: 100,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );

    var phongMaterialBoxBottom = new THREE.MeshPhongMaterial( {
        color: 0x666666,
        specular: 0x111111,
        shininess: 100,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );

    var mirrorMaterialSmooth = new THREE.MeshPhongMaterial( {
        color: 0xffaa00,
        specular: 0x222222,
        shininess: 10000,
        vertexColors: THREE.NoColors,
        flatShading: false
    } );
    mirrorMaterialSmooth.mirror = true;
    mirrorMaterialSmooth.reflectivity = 0.3;

    var group = new THREE.Group();
    this.scene.add( group );

    var sphereGeometry = new THREE.SphereGeometry( 100, 16, 8 );
    var planeGeometry = new THREE.BoxGeometry( 600, 5, 600 );
    var boxGeometry = new THREE.BoxGeometry( 100, 100, 100 );

    var sphere = new THREE.Mesh( sphereGeometry, phongMaterialRed );
    sphere.scale.multiplyScalar( 0.5 );
    sphere.position.set( 0, 245 , - 50 );
    // group.add( sphere );
    this.scene.add(sphere);

    var sphere2 = new THREE.Mesh( sphereGeometry, phongMaterialGreen );
    sphere2.scale.multiplyScalar( 0.5 );
    sphere2.position.set( 175, - 250 + 5, - 150 );
    // group.add( sphere2 );
    this.scene.add(sphere2);

    var sphere3 = new THREE.Mesh( sphereGeometry, phongMaterialBlue );
    sphere3.scale.multiplyScalar( 0.5 );
    sphere3.position.set( 75, - 250 + 5, - 150 );
    sphere3.rotation.y = 0.5;
    this.scene.add( sphere3 );

    var sphere4 = new THREE.Mesh( sphereGeometry, phongMaterialRed);
    sphere4.scale.multiplyScalar( 0.5 );
    sphere4.position.set( 110, - 135, - 75 );
    sphere4.rotation.y = 0.5;
    this.scene.add( sphere4 );


    var box = new THREE.Mesh( boxGeometry, mirrorMaterialSmooth );
    box.position.set( - 175, - 250 + 2.5, - 150 );
    box.rotation.y = 0.5;
    // group.add( box );
    this.scene.add(box);

    // bottom
    var plane = new THREE.Mesh( planeGeometry, phongMaterialBoxBottom );
    plane.position.set( 0, - 300 + 2.5, - 300 );
    this.scene.add( plane );

    // top
    var plane = new THREE.Mesh( planeGeometry, phongMaterialBox );
    plane.position.set( 0, 300 - 2.5, - 300 );
    this.scene.add( plane );

    // back
    var plane = new THREE.Mesh( planeGeometry, mirrorMaterialSmooth );
    plane.rotation.x = 1.57;
    plane.position.set( 0, 0, - 300 );
    this.scene.add( plane );

    console.log(plane.material.mirror);

    // left
    var plane = new THREE.Mesh( planeGeometry, phongMaterialRed );
    plane.rotation.z = 1.57;
    plane.position.set( - 300, 0, - 300 );
    this.scene.add( plane );

    // right
    var plane = new THREE.Mesh( planeGeometry, phongMaterialBlue );
    plane.rotation.z = 1.57;
    plane.position.set( 300, 0, - 300 );
    this.scene.add( plane );
}

SceneController.prototype.setupLight = function() {
    var intensity = 70000;

    var light = new THREE.PointLight( 0xffffff, intensity * 2 );
    light.position.set( 0, 0, 300 );
    light.physicalAttenuation = true;
    this.scene.add(light);

    var light = new THREE.PointLight( 0xffaa55, intensity );
    light.position.set( - 200, 100, 100 );
    light.physicalAttenuation = true;
    this.scene.add(light);

    var light = new THREE.PointLight( 0x55aaff, intensity );
    light.position.set( 200, 100, 100 );
    light.physicalAttenuation = true;
    this.scene.add(light);

    if(typeof window != 'undefined') {
        window.lights = this.lights;
    }
}

SceneController.prototype.saveImg = function(){
    this.renderer.saveImage();
}

SceneController.prototype.render = function() {
    this.renderer.raytrace();
    this.renderer.render();
}

SceneController.prototype.updateModel = function() {
    this.renderer.maxRecursionDepth = this.params.maxRecursionDepth;
    this.renderer.superSamplingRate = this.params.superSamplingRate;
}
