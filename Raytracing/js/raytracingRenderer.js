function dataSetColor(self, x, y, color, alpha=1) {
    let index = x + y * self.width;
    self.data[index * 4] = color.r * 255;
    self.data[index * 4 + 1] = color.g * 255.0;
    self.data[index * 4 + 2] = color.b * 255.0;
    self.data[index * 4 + 3] = alpha * 255;
}

ImageData.prototype.setColor = function(x, y, color, alpha=1) {
    dataSetColor(this, x, y, color, alpha);
}

function dataReadColor(self, x, y, color) {
    let index = x + y * self.width;
    color.r = self.data[index * 4] / 255;
    color.g = self.data[index * 4 + 1] / 255.0;
    color.b = self.data[index * 4 + 2] / 255.0;
    return self.data[index * 4 + 3] / 255.0;
}

ImageData.prototype.readColor = function(x, y, color) {
    return dataReadColor(this, x, y, color);
}

function createImageData(width, height) {
    let data = [];
    for(var i = 0; i < width*height; i += 1) {
        data.push(0);
        data.push(0);
        data.push(0);
        data.push(0);
    }
    let obj = {
        width: width,
        height: height,
        data: data
    };
    Object.defineProperty(obj, 'setColor', {
        value: ImageData.prototype.setColor
    });
    Object.defineProperty(obj, 'readColor', {
        value: ImageData.prototype.readColor
    });
    return obj;
}

/**
 * RaytracingRenderer interpretation of http://github.com/zz85
 */

var RaytracingRenderer =function(scene, camera, workerObject)
{
    this.scene = scene;
    this.camera = camera;

    this.rendering = false;
    this.superSamplingRate = 0;
    this.maxRecursionDepth = 2;

    this.allLights = true;
    this.calcDiffuse = true;
    this.calcPhong = true;
    this.phongMagnitude = 10;
    this.useMirrors = true;

    this.workerObject = workerObject;
    this.isWorker = (workerObject != undefined);

    if (!this.isWorker) {
        this.canvas = document.createElement('canvas');
        window.canvas = this.canvas;
        this.context = this.canvas.getContext('2d', {
            alpha: false
        });

        this.createImageData = this.context.createImageData.bind(this.context);
    } else {
        this.createImageData = createImageData;
    }
    this.workerCount = 4;
    this.sectionWidth = 6;
    this.sectionSize = {x: 64, y: 64};

    this.overwriteSize = false;
    this.sizeOverwrite = {x: 320, y: 240};

    this.clearColor = new THREE.Color(0x000000);
    this.domElement = this.canvas;
    this.autoClear = true;

    this.raycaster = new THREE.Raycaster();
    this.imageData = null;
    if (typeof Image != 'undefined') {
        this.image = new Image();
        this.image.onload = this.render.bind(this);
    }

    if (!this.isWorker) {
        this.clock = new THREE.Clock();
        this.workers = [];
        this.tmpColor = new THREE.Color(0, 0, 0);

        setInterval(this.updateWorkers.bind(this), 1000)
    }

    this.lights = [];
    for(var c = 0; c < this.scene.children.length; c++)
    {
        if(this.scene.children[c].isPointLight)
            this.lights.push(this.scene.children[c]);
    }
}

RaytracingRenderer.prototype.setClearColor = function ( color, alpha )
{
    clearColor.set( color );
};

RaytracingRenderer.prototype.clear = function () {  };

RaytracingRenderer.prototype.spawnWorker = function () {
    var worker = new Worker('js/worker.js');
    worker.addEventListener('message', this.workerMessageHandler.bind(this), false);
    this.workers.push(worker);
}

RaytracingRenderer.prototype.workerMessageHandler = function (e) {
    switch(e.data.message) {
        case 'raytraceResult':
            let sectionWidth = e.data.data.width;
            let sectionHeight = e.data.data.height;
            for(let y = 0; y < sectionHeight; y += 1) {
                for(let x = 0; x < sectionWidth; x += 1) {
                    dataReadColor(e.data.data,x, y, this.tmpColor);
                    this.imageData.setColor(x, y, this.tmpColor);
                }
            }
            this.context.putImageData(this.imageData, e.data.startX, e.data.startY);
            this.render();
            this.sectionCount.calculated += 1;
            if(this.sectionCount.calculated == this.sectionCount.total) {
                this.rendering = false;
                this.clock.stop();
                console.log("Finished rendering in " + this.clock.elapsedTime + " seconds. Image " + this.canvas.width + " w / " + this.canvas.height + " h");
            }
            break;
    }
}

RaytracingRenderer.prototype.render = function() {
    if(this.imageData != null) {
        let imageAspect = this.canvas.width/this.canvas.height;
        if(imageAspect < window.innerWidth/window.innerHeight) {
            let width = (window.innerHeight * imageAspect); ///(this.superSamplingRate+1);
            this.canvas.style.width = width + "px";
            this.canvas.style.height = '100%';
            this.canvas.style.left = (window.innerWidth - width) / 2 + 'px';
            this.canvas.style.top = '0px';
        } else {
            let height = (window.innerWidth / imageAspect); ///(this.superSamplingRate+1);
            this.canvas.style.width = '100%';
            this.canvas.style.height = height + "px";
            this.canvas.style.left = '0px';
            this.canvas.style.top = (window.innerHeight - height) / 2 + 'px';
        }
    }
}

RaytracingRenderer.prototype.saveImage = function(){
    this.canvas.toBlob(function(blob) {
        saveAs(blob, "img.png");
    }, "./");
};

RaytracingRenderer.prototype.updateWorkers = function () {
    this.workerCount = Math.max(Math.floor(this.workerCount), 1);
    while(this.workers.length < this.workerCount) {
        this.spawnWorker();
    }
    if(this.workers.length > this.workerCount) {
        for(let i = this.workerCount; i < this.workers.length; i += 1) {
            this.workers[i].postMessage({command: 'close'});
        }
        this.workers.splice(this.workerCount, this.workers.length - this.workerCount);
    }
}

RaytracingRenderer.prototype.raytrace = function () {


    if(!this.rendering) {
        let width;
        let height;
        if(this.isWorker || this.overwriteSize) {
            width = this.sizeOverwrite.x;
            height = this.sizeOverwrite.y;
        } else {
            width = window.innerWidth;
            height = window.innerHeight;

        }
        this.sectionCount = {};
        if(!this.isWorker) {
            this.sectionSize = {x:Math.pow(2,this.sectionWidth)};
            this.sectionSize.y = this.sectionSize.x;
            console.log(this.sectionSize);
        }
        this.sectionCount.x = Math.ceil(width / this.sectionSize.x);
        this.sectionCount.y = Math.ceil(width / this.sectionSize.y);
        this.sectionCount.total = this.sectionCount.x * this.sectionCount.y;
        this.sectionCount.calculated = 0;
        if(!this.isWorker) {
            this.imageData = this.createImageData(this.sectionSize.x , this.sectionSize.y );
            console.log(this.imageData);
            this.updateWorkers();
            this.clock.start();
            this.rendering = true;
            if(this.superSamplingRate === 0) {
                this.canvas.width = width;
                this.canvas.height = height;
            } else {
                this.canvas.width = width * 1.8;//(this.superSamplingRate+1);
                this.canvas.height = height * 1.8; //(this.superSamplingRate+1);
            }
            this.workerProgress = [];
            this.context.clearRect(0, 0, this.canvas.width , this.canvas.height );
            for(let i = 0; i < this.workers.length; i += 1) {
                this.workerProgress.push(0);
                let worker = this.workers[i];
                worker.postMessage({
                    command:'raytrace',
                    size: {x: width, y: height},
                    superSamplingRate: this.superSamplingRate,
                    maxRecursionDepth: this.maxRecursionDepth,
                    phongMagnitude: this.phongMagnitude,
                    allLights: this.allLights,
                    calcDiffuse: this.calcDiffuse,
                    calcPhong: this.calcPhong,
                    useMirrors: this.useMirrors,
                    sectionSize: this.sectionSize,
                    workerIndex: i,
                    workerCount: this.workers.length
                });
            }
        }
        else {

            // update scene graph
            if (this.scene.autoUpdate === true) {
                this.scene.updateMatrixWorld();
            }

            // update camera matrices
            if (this.camera.parent === null) {
                this.camera.updateMatrixWorld();
            }

            this.camera.aspect = width/height;
            this.camera.updateProjectionMatrix();

            for(let i = this.workerIndex; i < this.sectionCount.total; i += this.workerCount) {
                let x = (i % this.sectionCount.x) * this.sectionSize.x;
                let y = Math.floor(i / this.sectionCount.x) * this.sectionSize.y;
                //this.fillImageWithNoisyStripes(x,y,this.sectionSize.x, this.sectionSize.y, width, height);
                this.raytraceSection(x,y,this.sectionSize.x, this.sectionSize.y, width, height);
            }

            this.rendering = false;


        }
    }
}

RaytracingRenderer.prototype.fillImageWithNoisyStripes = function(startX, startY, width, height, totalWidth, totalHeight) {
    //fill image with noise
    this.imageData = this.createImageData(width, height);


    for(let y = startY; y < startY + height; y += 1) {
        let c = new THREE.Color(Math.random(),Math.random(),Math.random());
        for(let x = startX; x < startX + width; x += 1) {
            this.imageData.setColor(x - startX, y - startY, c);
        }
    }

    if(!this.isWorker) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context.putImageData(this.imageData, 0, 0);
        this.image.src = this.canvas.toDataURL();
    } else {
        this.workerObject.postMessage({
            message: 'raytraceResult',
            data: this.imageData,
            startX: startX,
            startY: startY,
        });
    }
};

RaytracingRenderer.prototype.raytraceSection = function (startX, startY, width, height, totalWidth, totalHeight) {
    this.imageData = this.createImageData(width, height);


    let defaultColor = new THREE.Color(0, 0, 0);
    let screenPos = new THREE.Vector2(0, 0);
    let pixelColor = new THREE.Color(0, 0, 0);



    for(let y = startY; y < (startY + height)*(this.superSamplingRate+1) ; y += 1) {
        for(let x = startX; x < (startX + width)*(this.superSamplingRate+1) ; x += 1) {
            pixelColor.setRGB(0,0,0);

            if(this.superSamplingRate+1 < 2)
            {
                let castX = x  / totalWidth * 2 - 1;
                let castY = y / totalHeight * 2 - 1;
                this.renderPixel(pixelColor, screenPos.set(castX, -castY), defaultColor);
            }
            else {
                // Todo: super-sampling

                let castX =  (x  / totalWidth * 2 - 1)/(this.superSamplingRate+1);
                let castY = (y  / totalHeight * 2 - 1)/(this.superSamplingRate+1);


                this.renderPixel(pixelColor, screenPos.set(castX, -castY), defaultColor);

            }
            this.imageData.setColor(x - startX, y - startY, pixelColor);

        }
        //this.imageData.width

    }

    if(!this.isWorker) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.context.putImageData(this.imageData, 0, 0);
        this.image.src = this.canvas.toDataURL();
    } else {
        this.workerObject.postMessage({
            message: 'raytraceResult',
            data: this.imageData,
            startX: startX,
            startY: startY,
        });
    }
}

RaytracingRenderer.prototype.renderPixel = function(pixelColor, pixPos, defaultColor) {
    // Todo: compute çamera position and ray direction

    //ME
    let cameraPos = new THREE.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z );
    let direction = new THREE.Vector3();

    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pixPos, this.camera);
    var ray = raycaster.ray;
    direction = ray.direction;
    direction.normalize();
    return this.spawnRay(pixelColor, cameraPos, direction, this.maxRecursionDepth, Infinity, defaultColor);


}

RaytracingRenderer.prototype.getIntersection = function(origin, direction, farPlane) {

    // ToDo: return intersected object

    //intersection ray
    var raycaster = new THREE.Raycaster( origin, direction );
    var intersects = raycaster.intersectObjects( this.scene.children , true );
    //get the first intersected object
    var intersect = intersects[0];

    //if it hits
    if (intersects.length !== 0) {
        return intersect;
    }

}

//this method has most of the stuff of this exercise.
//good coding style will ease this exercise significantly.
RaytracingRenderer.prototype.spawnRay = function (pixelColor, origin, direction, recursionDepth, farPlane, defaultColor) {

    // calculate objects intersecting the picking ray
    let intersection = this.getIntersection(origin, direction, farPlane);

    if (intersection != null) {
        // ToDo: compute color, if material is mirror, spawnRay again

        this.calculateLightColor(pixelColor, origin, intersection, recursionDepth);

        if(this.useMirrors === true) {

            var object = intersection.object;
            var material = object.material;
            var geometry = intersection.object.geometry;
            var point = intersection.point;

            var reflectionVector = new THREE.Vector3();
            var normalVector = new THREE.Vector3();


            var viewingDirection = new THREE.Vector3();
            viewingDirection.subVectors(origin, point).normalize();

            //calculate the normal on the intersection face
            if (geometry.type === "BoxGeometry") {
                geometry.computeFaceNormals();
                normalVector = intersection.face.normal;
                normalVector.applyQuaternion(object.quaternion);


            } else {
                normalVector.subVectors(point, object.position).normalize();

            }

            var reflectivity = material.reflectivity;

            if (material.mirror === true && reflectivity > 0 && 0 < recursionDepth) {

                reflectionVector.copy(direction);    //could me minus direction
                reflectionVector.reflect(normalVector);


                var reflectionColor= new THREE.Color();

                this.spawnRay(reflectionColor, point, reflectionVector, recursionDepth-1, farPlane, defaultColor);

                pixelColor.add(reflectionColor);

                pixelColor.multiply(material.specular);

                pixelColor.add(reflectionColor);
                //pixelColor.add(pixelColor);    // for a less brighter reflection
            }
        }

        return true;
    } else {
        pixelColor.set(defaultColor);
        return false;
    }

}



RaytracingRenderer.prototype.calculateLightColor = function(pixelColor, origin, intersection, recursionDepth) {

    pixelColor.setRGB(0,0,0);


    // ToDo: compute pixel color
    if (this.calcDiffuse === true || this.calcPhong === true) {



        var point = intersection.point;
        var geometry = intersection.object.geometry;
        var object = intersection.object;
        var material = object.material;

        var diffuseColor = new THREE.Color();
        var specularColor = new THREE.Color();
        var schlick = new THREE.Color();

        var outputLight = new THREE.Color();

        var lightDirection = new THREE.Vector3();
        var viewingDirection = new THREE.Vector3();
        var midVec = new THREE.Vector3();
        var normalVector = new THREE.Vector3();


        viewingDirection.subVectors(origin, point).normalize();


        //new origin for the light ray is the intersection point
        origin = point;


        var lenghthLight = null;

        if (this.allLights === true) {
            lenghthLight = this.lights.length;
        } else {
            lenghthLight = 1;
        }

        for (var i = 0; i < lenghthLight; i++) {

            var light = this.lights[i];
            var lightColor = light.color;
            var lightRaycaster = new THREE.Raycaster();
            var lightRay = lightRaycaster.ray;

            lightRay.origin.copy(origin);
            lightDirection.setFromMatrixPosition(light.matrixWorld);
            lightDirection.sub(point);

            //To check if in the shadow
            lightRay.direction.copy(lightDirection).normalize();
            var intersects = lightRaycaster.intersectObjects(this.scene.children, true);

            if (light.physicalAttenuation === true) {
                attenuation = 1.0 / (lightDirection.length() * lightDirection.length());
            }

            lightDirection.normalize();
            diffuseColor.copyGammaToLinear(material.color);

            //if not in the shadow
            if (intersects.length === 0) {

                //calculate the normal on the intersection face
                if (geometry.type === "BoxGeometry") {
                    geometry.computeFaceNormals();
                    geometry.elementsNeedUpdate = true;
                    normalVector = intersection.face.normal;
                    normalVector.applyQuaternion(object.quaternion);

                } else {
                    normalVector.subVectors(point, object.position).normalize();

                }

                if (this.calcDiffuse === true) {

                    //calculating diffuse
                    var dotProduct = Math.max(normalVector.dot(lightDirection), 0.0);
                    var diffuseIntensity = dotProduct * light.intensity;

                    outputLight.copy(diffuseColor);
                    outputLight.multiply(lightColor);
                    outputLight.multiplyScalar(diffuseIntensity * attenuation);

                    pixelColor.add(outputLight);

                    if (this.calcPhong === false) {
                        break;
                    }

                    if (this.calcPhong === true && this.calcDiffuse === true || this.calcPhong === true && this.calcDiffuse === false) {


                        //calculate the  specular Intensity & specular Normalization
                        midVec.addVectors(lightDirection, viewingDirection).normalize();
                        var factor = Math.pow(1.0 - lightDirection.dot(midVec), 5.0);

                        var dotNormalHalf = normalVector.dot(midVec);
                        var intensitySpec = Math.pow(dotNormalHalf, material.shininess) * diffuseIntensity;
                        var specularParam = (material.shininess + 2.0) / 8.0;

                        specularColor.copyGammaToLinear(material.specular);

                        //calculating schlick

                        schlick.r = specularColor.r + (1.0 - specularColor.r) * factor;
                        schlick.g = specularColor.g + (1.0 - specularColor.g) * factor;
                        schlick.b = specularColor.b + (1.0 - specularColor.b) * factor;

                        outputLight.copy(schlick);
                        outputLight.multiplyScalar(specularParam  * intensitySpec* attenuation);
                        outputLight.multiply(lightColor);

                        pixelColor.add(outputLight);
                    }
                }

            }
        }

    } else {
        pixelColor.set(intersection.object.material.color);
    }
}
