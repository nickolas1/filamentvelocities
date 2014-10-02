window._skel_config = {
    prefix: "css/style",
    resetCSS: true,
    boxModel: "border",
    grid: { gutters: 0 },
    breakpoints: {
        'normal': { range: "1317-", containers: 1317 }, //makes 768 image
        'narrow': { range: "641-1316", containers: 879 }, //makes 512 image
        'mobile': { range: "-640", containers: 'fluid', lockViewport: true, grid: { collapse: true } }
    }
};