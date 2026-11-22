function createNameSprite(nameText) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "bold 40px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
    ctx.strokeText(nameText, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(nameText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4.5, 1.125, 1);
    sprite.position.set(0, 5.95, 0);

    return sprite;
}

function buildCharacterMesh(username) {
    const charGroup = new THREE.Group();

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xf5cd30 });
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0xfffbd6 });
    const legsMat = new THREE.MeshLambertMaterial({ color: 0xfb974b });

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2, 1), legsMat);
    leftLeg.position.set(-0.5, 1, 0);
    charGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2, 1), legsMat);
    rightLeg.position.set(0.5, 1, 0);
    charGroup.add(rightLeg);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), torsoMat);
    torso.position.set(0, 3, 0);
    charGroup.add(torso);

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), skinMat);
    leftArm.position.set(-1.5, 3, 0);
    charGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), skinMat);
    rightArm.position.set(1.5, 3, 0);
    charGroup.add(rightArm);

    const headGeo = new THREE.SphereGeometry(0.68, 24, 24);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 4.65, 0);
    charGroup.add(head);

    const nameTag = createNameSprite(username || "Guest");
    charGroup.add(nameTag);

    return charGroup;
}

function createRemotePlayer(scene, username) {
    const mesh = buildCharacterMesh(username);
    mesh.position.set(0, 0, 0);
    scene.add(mesh);

    const targetPos = new THREE.Vector3(0, 0, 0);
    let targetRotY = 0;
    let initialized = false;

    return {
        mesh,
        setState(data) {
            targetPos.set(data.x, data.y, data.z);
            targetRotY = data.rotY;

            if (!initialized) {
                mesh.position.copy(targetPos);
                mesh.rotation.y = targetRotY;
                initialized = true;
            }
        },
        updateSmooth(alpha = 0.25) {
            mesh.position.lerp(targetPos, alpha);

            let diff = targetRotY - mesh.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            mesh.rotation.y += diff * alpha;
        },
        remove() {
            scene.remove(mesh);
        }
    };
}

function createPlayer(scene) {
    const savedUser = localStorage.getItem("tocrooms_anon_id") || "Guest";
    const player = buildCharacterMesh(savedUser);

    player.position.set(0, 0, 0);
    scene.add(player);

    const keys = {};
    window.addEventListener("keydown", (e) => {
        keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
        keys[e.code] = false;
    });

    let velocityY = 0;
    let isGrounded = true;
    const moveSpeed = 0.22;
    const gravity = -0.018;
    const jumpForce = 0.36;

    function update(cameraYaw) {
        const forward = new THREE.Vector3(
            -Math.sin(cameraYaw),
            0,
            -Math.cos(cameraYaw)
        );
        const right = new THREE.Vector3(
            Math.cos(cameraYaw),
            0,
            -Math.sin(cameraYaw)
        );

        const moveDir = new THREE.Vector3(0, 0, 0);

        if (keys["KeyW"] || keys["ArrowUp"]) moveDir.add(forward);
        if (keys["KeyS"] || keys["ArrowDown"]) moveDir.sub(forward);
        if (keys["KeyA"] || keys["ArrowLeft"]) moveDir.sub(right);
        if (keys["KeyD"] || keys["ArrowRight"]) moveDir.add(right);

        if (moveDir.lengthSq() > 0) {
            moveDir.normalize();
            player.position.addScaledVector(moveDir, moveSpeed);
            player.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        }

        player.position.x = Math.max(-98, Math.min(98, player.position.x));
        player.position.z = Math.max(-98, Math.min(98, player.position.z));

        if (keys["Space"] && isGrounded) {
            velocityY = jumpForce;
            isGrounded = false;
        }

        velocityY += gravity;
        player.position.y += velocityY;

        if (player.position.y <= 0) {
            player.position.y = 0;
            velocityY = 0;
            isGrounded = true;
        }
    }

    return { mesh: player, username: savedUser, update };
}