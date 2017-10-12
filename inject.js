"use strict";
(function(){
    const {ipcRenderer} = require('electron');
    
    
    ipcRenderer.on('page_load_start', function(){
        document.getElementsByClassName('dmm-ntgnavi').item(0).style.display = 'none';
        document.getElementsByClassName('area-naviapp').item(0).style.display = 'none';
        let d_body = document.getElementById('game_frame');
        d_body.style.position = 'fixed';
        d_body.style.top = '-35px';
        d_body.style.left = '-128px';
        d_body.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        ipcRenderer.sendToHost('page_load_end');
    });

}());