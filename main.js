window.addEventListener('DOMContentLoaded', DOMContentLoaded => {
    
    // CANVAS INIT, we have to resize the window to fit the screen based on the different screen sizes. So we
    // are rendering it to the clients computer size so it can reduce if the window is shrunk down or increase
    // if the window is made bigger.
    const render = document.querySelector('canvas').getContext('2d');
    const U_SCALE = 128;
    let w, h, u;
    const resize = () => {
        w = render.canvas.width = render.canvas.clientWidth * window.devicePixelRatio;
        h = render.canvas.height = render.canvas.clientHeight * window.devicePixelRatio;
        u = h / U_SCALE;
        render.imageSmoothingEnabled = false;
    };
    resize();
    window.addEventListener('resize', resize);

    //Initialize Image: how we implement our sprite sheet onto our canvas.
    const player_avatar = new Image();
    player_avatar.src = 'images/sprite_sheet_turtle.png'

    //Player Input: starting with the arrow keys on false and making them true with key downs to allow for 
    // whether or not pushing a certain key will move the sprite and letting go of said key will stop the sprite.
    const movement = {ArrowRight:false, ArrowLeft:false, ArrowDown:false, ArrowUp:false};
    document.addEventListener('keydown', keydown => {
        if(movement.hasOwnProperty(keydown.key)){
            movement[keydown.key] = true;
        }
    });
    document.addEventListener('keyup', keyup => {
        if(movement.hasOwnProperty(keyup.key)){
            movement[keyup.key] = false;
        }
    });

    // Rigid Body: outline for the solid object
    class Rigid_body {
        constructor(x, y, w, h){
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }
    }
    const rigid_bodies = [];
    rigid_bodies.push(new Rigid_body(64, 64, 32, 40));

    //Animation: going image by image to allow the sprite to look like it's moving.
    //We also have our background here and the translate which allows us to go off screen and get put onto a new one.
    let frame_number = false;
    let frame_count = 0;
    let player_direction = 0;
    const img_side = 16;
    let x = 16, y = 16;
    const animation = timestamp => {
        frame_count++;
        render.clearRect(0, 0, w, h);
        render.fillRect(w/2, h/2, u, u);
        render.fillStyle = '#540';
        render.fillRect(0, 0, w, h);
        render.save();
        render.translate(-Math.floor(x / U_SCALE) * w, -Math.floor(y / U_SCALE) * h);


        //Player Physics: I understood what the movement did but was unable to get the commented piece of code to
        // work. For some reason when I tried my sprite stopped changing directions and only would alternate between
        // image 0 looking to the right and image 1 looking to the right. 
        let left = movement.ArrowLeft, right = movement.ArrowRight, up = movement.ArrowUp, down = movement.ArrowDown;
        let vx = +right - +left;
        let vy = +down - +up;
        //if(right || up || left || down){
            let player_direction = left ? 1 : up ? 2 : down ? 3: 0;
            if(frame_count % 30 == 0) {
                frame_number = !frame_number;
            }
        //}

        // Colliders: it takes the invisible box around the sprite and the box around the square and doesn't allow
        //either to go through one another. When the sprite is right next to it, we make our sprite unable to move into
        // it by setting our velocity to 0 so it stops when it collides.
        rigid_bodies.forEach(rigid_body => {
            if(rigid_body.y <= y + img_side && y < rigid_body.y + rigid_body.h){
                if(x + img_side <= rigid_body.x && rigid_body.x < x + img_side + vx){
                    vx = 0;
                    x = rigid_body.x - img_side;
                }
                if(rigid_body.x + rigid_body.w <= x && x + vx < rigid_body.x + rigid_body.w){
                    vx = 0;
                    x = rigid_body.x + rigid_body.w;
                }
            }
            if(rigid_body.x <= x + img_side && x < rigid_body.x + rigid_body.w){
                if(y + img_side <= rigid_body.y && rigid_body.y < y + img_side + vy){
                    vy = 0;
                    y = rigid_body.y - img_side;
                }
                if(rigid_body.y + rigid_body.h <= y && y + vy < rigid_body.y + rigid_body.h){
                    vy = 0;
                    y = rigid_body.y + rigid_body.h;
                }
            }

        });
        x += vx;
        y += vy;


        //Render Dynamic Objects
        render.fillStyle = '#550';
        render.fillRect(0, 0, w, h);
        render.fillStyle = '#222';
        rigid_bodies.forEach(rigid_body => {
            render.fillRect(rigid_body.x * u, rigid_body.y * u, rigid_body.w * u, rigid_body.h * u);
        });

        render.drawImage(player_avatar, +frame_number * img_side, player_direction * img_side, img_side, img_side, x*u, y*u, img_side*u, img_side*u);
        render.restore();

        window.requestAnimationFrame(animation);
    };
    window.requestAnimationFrame(animation);
});