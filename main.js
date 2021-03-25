window.addEventListener('DOMContentLoaded', DOMContentLoaded => {

    //Initialize Websocket
    const socket = new WebSocket('wss://southwestern.media/game_dev');
    socket.addEventListener('open', open => {
        console.log('WEBSOCKET STARTED');
    });
    
    // CANVAS INIT
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

    //Initialize Sprite Image
    const player_avatar = new Image();
    player_avatar.src = 'images/sprite_sheet_watermelon.png';

    //Player Input
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

    //AI Input
    const aimovement = {ArrowRight:false, ArrowLeft:false, ArrowDown:false, ArrowUp:false};
    const enemies = {};
    const enemy_turtle1 = new Image();
    enemy_turtle1.src = 'images/sprite_sheet_turtle2.png';

    //Other Players
    const GAME = 'skyler_top_down';
    const NAME = Math.random().toString();
    const oplayers = {};
    const send = message => {
        socket.send(JSON.stringify({Game: GAME, Name: NAME, Message: message}));
    };
    socket.addEventListener('message', message => {
        const parsed = JSON.parse(message.data);
        if(parsed.Game != GAME ||parsed.Name === NAME){
            return;
        }
        if(parsed.Message === 'goodbye') {
            delete oplayer[parsed.Name];
            return;
        }
        oplayers[parsed.Name] = JSON.parse(parsed.Message);
    });
    const oplayer_avatar = new Image();
    oplayer_avatar.src = 'images/sprite_sheet_orange.png';
    socket.addEventListener('beforeunload', beforeunload => {
        send('goodbye');
        beforeunload['returnValue'] = null;
    });

    // Patterns
    const patterns = {};
    const melon = new Image();
    melon.src = 'wallpapers/watermelonwall.png';
    melon.addEventListener('load', load => {
        patterns.melon = render.createPattern(melon, 'repeat');
    });
    const star = new Image();
    star.src = 'wallpapers/galaxyfloor.png';
    star.addEventListener('load', load => {
        patterns.star = render.createPattern(star, 'repeat');
    });
    const plow = new Image();
    plow.src = 'wallpapers/plowed.png';
    plow.addEventListener('load', load => {
        patterns.plow = render.createPattern(plow, 'repeat');
    });
    const grass1 = new Image();
    grass1.src = 'wallpapers/grass1.png';
    grass1.addEventListener('load', load => {
        patterns.grass1 = render.createPattern(grass1, 'repeat');
    });
    const token_donut = new Image();
    token_donut.src = 'wallpapers/token_donut.png';
    token_donut.addEventListener('load', load => {
        patterns.token_donut = render.createPattern(token_donut, 'repeat');
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

    //InnerWalls
    rigid_bodies.push(new Rigid_body(-10, -10, 20, 148));
    rigid_bodies.push(new Rigid_body(0, -10, 128, 20));
    rigid_bodies.push(new Rigid_body(118, -10, 20, 148));
    rigid_bodies.push(new Rigid_body(0, 118, 100, 20));

    //HayBales
    rigid_bodies.push(new Rigid_body(70, 158, 20, 20));
    rigid_bodies.push(new Rigid_body(25, 220, 20, 20));
    rigid_bodies.push(new Rigid_body(-10, 183, 20, 20));
    rigid_bodies.push(new Rigid_body(-100, 143, 20, 20));
    rigid_bodies.push(new Rigid_body(-138, 203, 20, 20));
    rigid_bodies.push(new Rigid_body(-62, 165, 20, 20));
    rigid_bodies.push(new Rigid_body(144, 168, 20, 20));
    rigid_bodies.push(new Rigid_body(204, 208, 20, 20));
    rigid_bodies.push(new Rigid_body(213, 149, 20, 20));
    rigid_bodies.push(new Rigid_body(233, 64, 20, 20));
    rigid_bodies.push(new Rigid_body(160, 32, 20, 20));
    rigid_bodies.push(new Rigid_body(-118, 64, 20, 20));
    rigid_bodies.push(new Rigid_body(-160, 88, 20, 20));
    rigid_bodies.push(new Rigid_body(-200, 40, 20, 20));

    //OuterBorder
    rigid_bodies.push(new Rigid_body(-384, -256, 20, 640));
    rigid_bodies.push(new Rigid_body(-384, -256, 768, 20));
    rigid_bodies.push(new Rigid_body(364, -256, 20, 640));
    rigid_bodies.push(new Rigid_body(-384, 364, 768, 20));

    //Hearts(Health)
    let heart = 100;

    // Pods(Collect)
    class Pod {
        constructor(x, y) {
            this.x = x; 
            this.y = y; 
            this.w = 5; 
            this.h = 5;
        }
    }
    const pods = [];

    pods.push(new Pod(32, 88));
    pods.push(new Pod(-192, 184));
    pods.push(new Pod(-344, -48));
    pods.push(new Pod(40, -24));
    pods.push(new Pod(232, 272));

    let pod = 0;

    //Animation
    let frame_number = false;
    let frame_count = 0;
    let aframe_number = false;
    let aframe_count = 0;
    let player_direction = 0;
    let ai_direction = 0;
    const img_side = 16;
    let x = 16, y = 16, r = 16;
    let ax = -56, ay = 123;
    const animation = timestamp => {
        frame_count++;
        aframe_count++;
        render.clearRect(0, 0, w, h);
        render.fillRect(w/2, h/2, u, u);
        render.save();
        render.scale(u, u);
        //render.fillStyle = '#000';
        //render.fillRect(-128, -128, 384, 384);
        //render.fillStyle = '#020';
        //render.fillRect(0, 0, 100, 100);
        render.translate(-Math.floor(x / U_SCALE) * U_SCALE, -Math.floor(y / U_SCALE) * U_SCALE);


        //Player Physics
        let left = movement.ArrowLeft, right = movement.ArrowRight, up = movement.ArrowUp, down = movement.ArrowDown;
        let vx = +right - +left;
        let vy = +down - +up;
        if(right || up || left || down){
            player_direction = right ? 1 : up ? 2 : down ? 3: 0;
            if(frame_count % 10 == 0) {
                frame_number = !frame_number;
            }
        }
        //AI Physics
        for (var key in aimovement) {
            if (aimovement.hasOwnProperty(key)) {     
                if(Math.random() <= .01){
                    aimovement[key] = !aimovement[key]
                }   
            }
        }

        let aleft = aimovement.ArrowLeft, aright = aimovement.ArrowRight, aup = aimovement.ArrowUp, adown = aimovement.ArrowDown;
        let avx = +aright - +aleft;
        let avy = +adown - +aup;
        if(aright || aup || aleft || adown){
            ai_direction = aright ? 1 : aup ? 2 : adown ? 3: 0;
            if(aframe_count % 10 == 0) {
                aframe_number = !aframe_number;
            }
        }

        

        // Colliders
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

            if(rigid_body.y <= ay + img_side && ay < rigid_body.y + rigid_body.h){
                if(ax + img_side <= rigid_body.x && rigid_body.x < ax + img_side + avx){
                    avx = 0;
                    ax = rigid_body.x - img_side;
                    aimovement.right = false
                }
                if(rigid_body.x + rigid_body.w <= ax && ax + avx < rigid_body.x + rigid_body.w){
                    avx = 0;
                    ax = rigid_body.x + rigid_body.w;
                    aimovement.left = false
                }
            }
            if(rigid_body.x <= ax + img_side && ax < rigid_body.x + rigid_body.w){
                if(ay + img_side <= rigid_body.y && rigid_body.y < ay + img_side + avy){
                    avy = 0;
                    ay = rigid_body.y - img_side;
                    aimovement.down = false
                }
                if(rigid_body.y + rigid_body.h <= ay && ay + avy < rigid_body.y + rigid_body.h){
                    avy = 0;
                    ay = rigid_body.y + rigid_body.h;
                    aimovement.up = false
                }
            }

        });
        x += vx;
        y += vy;
        ax += avx;
        ay += avy;
        if(vx || vy){
            send(JSON.stringify({x: x, y: y}));
        }


        //Render Dynamic Objects
        render.fillStyle = patterns.grass1;
        render.fillRect(-384, -256, 768, 640);
        render.fillStyle = patterns.plow;
        render.fillRect(-256, -128, 512, 384);
        
        render.fillStyle = patterns.star;
        render.fillRect(0, 0, 128, 128);
        render.fillStyle = patterns.melon;
        rigid_bodies.forEach(rigid_body => {
            render.fillRect(rigid_body.x, rigid_body.y, rigid_body.w, rigid_body.h);
        });

         //Pod Collision
         render.fillStyle = patterns.token_donut;
         pods.forEach((pod, i) => {
             const bx = pod.x + pod.w / 2, by = pod.y - pod.h / 2;
             const px = x + r / 2, py = y + r / 2;
             render.fillRect(pod.x, pod.y, 8, 8)
             if(Math.sqrt(Math.pow(px - bx, 2) + Math.pow(py - by, 2)) < r / 2) {
                 pods.splice(i, 1);
                 heart = 100;
                 pod++;
                 return;
             }
         });


        Object.values(oplayers).forEach(oplayer => {
            render.drawImage(oplayer_avatar, 0, 0, img_side, img_side, oplayer.x, oplayer.y, img_side, img_side);
            if(oplayer.x < x + img_side && x < oplayer.x + img_side && oplayer.y < y + img_side && y < oplayer.y + img_side) {
                heart--;
                return;
            }
        });
        render.drawImage(enemy_turtle1, +aframe_number * img_side, ai_direction * img_side, img_side, img_side, ax, ay, img_side, img_side);
        render.drawImage(player_avatar, +frame_number * img_side, player_direction * img_side, img_side, img_side, x, y, img_side, img_side);
        render.restore();


        //Pod Text Box
        render.fillStyle = '#fff';
        render.font = 'bold 70px arial';
        render.fillText(`PODS: ${pod}`, 1200, 100);

        //Health Text Box
        render.fillStyle = '#fff';
        render.font = 'bold 70px arial';
        render.fillText(`HEALTH: ${heart}`, 50, 100);
        if(heart == 0){
            console.log("GAME OVER");
            x = 16;
            y = 16;
            pods.splice(0,pods.length)
            heart = 100;
            pod = 0;
            pods.push(new Pod(32, 88));
            pods.push(new Pod(-192, 184));
            pods.push(new Pod(-344, -48));
            pods.push(new Pod(40, -24));
            pods.push(new Pod(232, 272));
            render.fillStyle ='#f00'
            render.fillRect(0, 0, w, h)
            render.fillStyle = '#000';
            render.fillText('GAME OVER', w , h );
            
        }

        window.requestAnimationFrame(animation);
    };
    window.requestAnimationFrame(animation);
});