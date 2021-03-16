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

    //Animation
    const animation = timestamp => {
        render.fillRect(w/2, h/2, u, u);
    };
    window.requestAnimationFrame(animation);
});