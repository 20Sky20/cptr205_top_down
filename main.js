window.addEventListener('DOMContentLoaded', DOMContentLoaded => {
    
    // CANVAS INIT, we have to resize the window to fit the screen based on the different screen sizes.
    const render = document.querySelector('canvas').getContext('2d');
    const U_SCALE = 128;
    let w, h, u;
    const resize = () => {
        w = render.canvas.width = render.canvas.clientWidth * window.devicePixelRatio;
        h = render.canvas.height = render.canvas.clientHeight * window.devicePixelRatio;
        u = h / U_SCALE;
    };
    resize();
    window.addEventListener('resize', resize);

    //Initialize Image
    const player_avatar = new Image();
    player_avatar.src = 'image/sprite_sheet_turtle1.png'
    //Animation
    const img_side = 16;
    const animation = timestamp => {
        render.clearRect(0, 0, w, h);
        render.fillRect(w/2, h/2, u, u);
        window.requestAnimationFrame(animation);

        //Render Player
        render.fillStyle = '#040';
        render.fillRect(0, 0, w, h);
        render.drawImage(player_avatar, 0, 0, img_side, img_side, 16*u, 16*u, img_side*u, img_side*u);
    };
    window.requestAnimationFrame(animation);
});