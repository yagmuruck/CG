var Robot = function() {

    this.root = new THREE.Object3D;
};


Robot.prototype.buildRobot = function() {


    window.console.log("am here");


    var geometry = new THREE.BoxGeometry(0.25, 0.3, 0.2);                        //creating the robot geometry
    var headgeometry = new THREE.SphereGeometry(0.1, 0.1, 0.1);
    var armgeometry = new THREE.BoxGeometry(0.15, 0.05, 0.05);
    var legsgeometry = new THREE.BoxGeometry(0.05, 0.30, 0.05);
    var feetgeometry = new THREE.BoxGeometry(0.05, 0.01, 0.1);

    // https://threejs.org/docs/#api/materials/MeshLambertMaterial
    var material = new THREE.MeshLambertMaterial({
        color: "blue",  // CSS color names can be used!
    });

    //a mesh consists of geometry and a material; added to the scene

    var torso = new THREE.Mesh(geometry, material);

    var headPivot = new THREE.Object3D();                                         //creating joint parts of the robot
    headPivot.position.set(0, 0.17, 0);

    var rightLegPivot = new THREE.Object3D();
    rightLegPivot.position.set(-0.05, -0.18, 0);

    var leftLegPivot = new THREE.Object3D();
    leftLegPivot.position.set(0.05, -0.18, 0);

    var rightArmPivot = new THREE.Object3D();
    rightArmPivot.position.set(-0.15, 0, 0);

    var leftArmPivot = new THREE.Object3D();
    leftArmPivot.position.set(0.15, 0, 0);

    var leftFootPivot = new THREE.Object3D();
    leftFootPivot.position.set(0, -0.16, 0);

    var rightFootPivot = new THREE.Object3D();
    rightFootPivot.position.set(0, -0.16, 0);

    window.console.log("am here1,5");

    var head = new THREE.Mesh(headgeometry, material);

    headPivot.add(head);                                                      //adding body parts to the joints

    head.position.set(0, 0.12, 0);

    var leftleg = new THREE.Mesh(legsgeometry, material);
    var rightleg = new THREE.Mesh(legsgeometry, material);

    leftLegPivot.add(leftleg);
    rightLegPivot.add(rightleg);

    leftleg.position.set(0, -0.17, 0);
    rightleg.position.set(0, -0.17, 0);

    var leftarm = new THREE.Mesh(armgeometry, material);
    var rightarm = new THREE.Mesh(armgeometry, material);

    leftArmPivot.add(leftarm);
    rightArmPivot.add(rightarm);

    leftarm.position.set(0.1, 0, 0);
    rightarm.position.set(-0.1, 0, 0);


    var rightfoot = new THREE.Mesh(feetgeometry, material);
    var leftfoot = new THREE.Mesh(feetgeometry, material);

    rightFootPivot.add(rightfoot);
    leftFootPivot.add(leftfoot);

    leftfoot.position.set(0, -0.02, 0);
    rightfoot.position.set(0, -0.02, 0);

    torso.add(headPivot);
    torso.add(rightArmPivot);
    torso.add(rightLegPivot);
    torso.add(leftLegPivot);
    torso.add(leftArmPivot);
    leftleg.add(leftFootPivot);
    rightleg.add(rightFootPivot);

    this.root.add(torso);

    window.console.log(" 2" + head.position);


    var parent;
    var index = 0;                                              //index to go through the children array
    var chosen;                                                 //chosen object
    var tempPivot;                                              //temporary pivot to keep the joint parts
    var exists;                                                 //exists to check if the axis already exists


    var materialSelected = new THREE.MeshLambertMaterial({      //selected material red
        color: "red",
    });

    var materialDefault = new THREE.MeshLambertMaterial({        //default material blue
        color: "blue",
    });


    var axesHelperTorso = new THREE.AxisHelper(0.4);                      //creating axis
    var axesHelperMTorso = new THREE.AxisHelper(-0.4);
    var axesHelperHead = new THREE.AxisHelper(0.1);
    var axesHelperMHead = new THREE.AxisHelper(-0.1);
    var axesHelperLeftArm = new THREE.AxisHelper(0.1);
    var axesHelperLeftMArm = new THREE.AxisHelper(-0.1);
    var axesHelperRightArm = new THREE.AxisHelper(0.1);
    var axesHelperRightMArm = new THREE.AxisHelper(-0.1);
    var axesHelperLeftLeg = new THREE.AxisHelper(0.1);
    var axesHelperLeftMLeg = new THREE.AxisHelper(-0.1);
    var axesHelperRightLeg = new THREE.AxisHelper(0.1);
    var axesHelperRightMLeg = new THREE.AxisHelper(-0.1);
    var axesHelperLeftFoot = new THREE.AxisHelper(0.1);
    var axesHelperLeftMFoot = new THREE.AxisHelper(-0.1);
    var axesHelperRightFoot = new THREE.AxisHelper(0.1);
    var axesHelperRightMFoot = new THREE.AxisHelper(-0.1);

    var objects = [];                                            // creating objects array for intersection later on for mouse event
    objects.push(this.root);
    objects.push(torso);
    objects.push(head);
    objects.push(leftleg);
    objects.push(rightfoot);
    objects.push(leftfoot);
    objects.push(rightleg);
    objects.push(leftarm);
    objects.push(rightarm);



    togkey= false;                                                     //for the toggle selection

    document.addEventListener("keydown", onDocumentKeyDown, false);

    function onDocumentKeyDown(event) {
        var keyCode = event.keyCode;



        if (keyCode == 69 && togkey == false) {                         // if we press e and togkey is true make it false for mouse event
                togkey = true;
        }
        else if (keyCode == 69 && togkey == true) {                     //if we press e and togkey is false make it true for key event
                togkey = false;
        }
        if (togkey = true) {

            if (chosen == null && keyCode == 87) {                           // at the beginning assign torso as parent
                    parent = torso;
                }

                if (keyCode == 87 && chosen != undefined) {                   // if its the first time we press w
                    chosen.material = materialDefault;
                    chosen = parent;
                    // if we press w chosen one is the parent
                    parent.material = materialSelected;

                }


                if (keyCode == 87 && chosen == undefined) {                                     // if we press w and we already have a chosen object
                    parent.material = materialDefault;                                          //back to default
                    chosen = parent;
                    // if we press w chosen one is the parent
                    parent.material = materialSelected;

                }


                if (keyCode == 83) {                                           //if s than first child of chosen one
                    chosen.material = materialDefault;
                    parent = chosen;
                    index = 0;
                    tempPivot = chosen.children[index];
                    tempPivot.children[0].material = materialSelected;
                    chosen = tempPivot.children[0];

                    window.console.log(chosen.object);
                }


                if (keyCode == 68 && chosen != parent) {            // if d: next sibling should be selected and chosen is not the parent
                    chosen.material = materialDefault;
                    window.console.log("index" + index);
                    index += 1;
                    window.console.log("index2" + index);
                    tempPivot = parent.children[index];
                    tempPivot.children[0].material = materialSelected;
                    chosen = tempPivot.children[0];
                    window.console.log(chosen.object);

                }

                if (keyCode == 65 && chosen != parent) {          // if a: previous  sibling should be selected and chosen is not the parent
                    // cause if chosen parent then no sibling?
                    chosen.material = materialDefault;
                    index -= 1;
                    tempPivot = parent.children[index];
                    tempPivot.children[0].material = materialSelected;
                    chosen = tempPivot.children[0];
                    window.console.log(chosen.object);

                }

                if (chosen == torso) {                               //rotation of torso

                    if (keyCode == 40) {
                        chosen.rotation.x += 0.1;
                        // down
                    } else if (keyCode == 37) {
                        chosen.rotation.y -= 0.1;
                        // left
                    } else if (keyCode == 39) {
                        chosen.rotation.y += 0.1;
                        // right
                    } else if (keyCode == 38) {
                        chosen.rotation.x -= 0.1;
                        // up

                    }
                }

                if (chosen == head) {                                  //rotation of head from the joint part

                    if (keyCode == 40) {
                        headPivot.rotation.x += 0.1;
                        // down
                    } else if (keyCode == 37) {
                        headPivot.rotation.z += 0.1;
                        // left
                    } else if (keyCode == 39) {
                        headPivot.rotation.z -= 0.1;
                        // right
                    } else if (keyCode == 38) {
                        headPivot.rotation.x -= 0.1;
                        // up
                    }
                }

                if (chosen == leftleg || chosen == rightleg) {

                    if (keyCode == 40) {
                        chosen.parent.rotation.x += 0.1;
                        // down
                    } else if (keyCode == 37) {
                        chosen.parent.rotation.z -= 0.1;
                        // left
                    } else if (keyCode == 39) {
                        chosen.parent.rotation.z += 0.1;
                        // right
                    } else if (keyCode == 38) {
                        chosen.parent.rotation.x -= 0.1;
                        // up
                    }
                }


                if (chosen == leftarm || chosen == rightarm) {                //different cases for arms for up and down

                    if (keyCode == 40) {
                        if (chosen == rightarm) {
                            chosen.parent.rotation.z += 0.1;
                        } else {
                            chosen.parent.rotation.z -= 0.1;
                        }
                        // down
                    } else if (keyCode == 37) {
                        chosen.parent.rotation.x -= 0.1;
                        // left
                    } else if (keyCode == 39) {
                        chosen.parent.rotation.x += 0.1;
                        // right
                    } else if (keyCode == 38) {
                        if (chosen == rightarm) {
                            chosen.parent.rotation.z -= 0.1;
                        } else {
                            chosen.parent.rotation.z += 0.1;
                        }

                    }

                }
                if (chosen == leftfoot || chosen == rightfoot) {

                    if (keyCode == 40) {
                        chosen.parent.rotation.x += 0.1;
                        // down
                    } else if (keyCode == 37) {
                        chosen.parent.rotation.y -= 0.1;
                        // left
                    } else if (keyCode == 39) {
                        chosen.parent.rotation.y += 0.1;
                        // right
                    } else if (keyCode == 38) {
                        chosen.parent.rotation.x -= 0.1;
                        // up
                    }

                }

                if (keyCode == 67 && exists == null) {                //if axis doesnt exist then add them


                    torso.add(axesHelperTorso);
                    torso.add(axesHelperMTorso);

                    headPivot.add(axesHelperHead);
                    headPivot.add(axesHelperMHead);

                    leftArmPivot.add(axesHelperLeftArm);
                    leftArmPivot.add(axesHelperLeftMArm);

                    rightArmPivot.add(axesHelperRightArm);
                    rightArmPivot.add(axesHelperRightMArm);

                    leftLegPivot.add(axesHelperLeftLeg);
                    leftLegPivot.add(axesHelperLeftMLeg);

                    rightLegPivot.add(axesHelperRightLeg);
                    rightLegPivot.add(axesHelperRightMLeg);

                    leftFootPivot.add(axesHelperLeftFoot);
                    leftFootPivot.add(axesHelperLeftMFoot);

                    rightFootPivot.add(axesHelperRightFoot);
                    rightFootPivot.add(axesHelperRightMFoot);

                    exists = 1;

                }

                else if (keyCode == 67 && exists == 1) {                    //if it exists and pressed c then remove them

                    headPivot.remove(axesHelperHead);
                    headPivot.remove(axesHelperMHead);

                    torso.remove(axesHelperTorso);
                    torso.remove(axesHelperMTorso);

                    leftArmPivot.remove(axesHelperLeftArm);
                    leftArmPivot.remove(axesHelperLeftMArm);

                    rightArmPivot.remove(axesHelperRightArm);
                    rightArmPivot.remove(axesHelperRightMArm);

                    leftLegPivot.remove(axesHelperLeftLeg);
                    leftLegPivot.remove(axesHelperLeftMLeg);

                    rightLegPivot.remove(axesHelperRightLeg);
                    rightLegPivot.remove(axesHelperRightMLeg);

                    leftFootPivot.remove(axesHelperLeftFoot);
                    leftFootPivot.remove(axesHelperLeftMFoot);

                    rightFootPivot.remove(axesHelperRightFoot);
                    rightFootPivot.remove(axesHelperRightMFoot);

                    exists = null;
                }

                if (keyCode == 82) {

                    if (chosen.material == materialSelected) {                  //reset the chosen ones material/ assign torso as parent
                        chosen.material = materialDefault;
                        parent = torso;
                        chosen = torso;
                    }

                    torso.rotation.set(0, 0, 0,);                               //reset the rotation of the joint parts
                    headPivot.rotation.set(0, 0, 0);
                    leftLegPivot.rotation.set(0, 0, 0);
                    rightLegPivot.rotation.set(0, 0, 0);
                    rightFootPivot.rotation.set(0, 0, 0);
                    leftFootPivot.rotation.set(0, 0, 0);
                    leftLegPivot.rotation.set(0, 0, 0);
                    leftArmPivot.rotation.set(0, 0, 0);
                    rightArmPivot.rotation.set(0, 0, 0);
                }

            }

        }


        document.addEventListener("click", onDocumentClick, false);                       //on click

        var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
        camera.positionZ = 1;

        var rayCast = new THREE.Raycaster();
        var mouse = new THREE.Vector2();



        function onDocumentClick(event) {                         // if togkey false then do the raycasting & intersecting

            if (togkey = false) {

                event.preventDefault();

                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                mouse.z = 1;

                rayCast.setFromCamera(mouse, camera);

                var intersects = rayCast.intersectObjects(objects);

                if (intersects.length > 0) {
                    intersects[0].object.material.color = materialSelected;

                }
            }
        }
    return this.root;

};







