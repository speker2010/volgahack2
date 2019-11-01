"use strict"

import b4w from "blend4web";

// import modules used by the app
var m_app       = b4w.app;
var m_cfg       = b4w.config;
var m_data      = b4w.data;
var m_preloader = b4w.preloader;
var m_ver       = b4w.version;
var m_anim      = b4w.animation;
var m_cont      = b4w.container;
var m_mouse     = b4w.mouse;
var m_scenes    = b4w.scenes;
var m_cam = b4w.camera;
var m_translate = b4w.transform;
var m_physics = b4w.physics;
var m_fps = b4w.fps;
var m_screen = b4w.screen;

var _previous_selected_obj = null;

// detect application mode
var DEBUG = (m_ver.type() == "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = m_cfg.get_assets_path();

/**
 * export the method to initialize the app (called at the bottom of this file)
 */
function init() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: DEBUG,
        console_verbose: DEBUG,
        autoresize: true,
        physics_uranium_path: '/node_modules/blend4web/dist/uranium/'
    });
}

/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    m_preloader.create_preloader();

    // ignore right-click on the canvas element
    canvas_elem.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    load();
}

/**
 * load the scene data
 */
function load() {
    m_data.load(APP_ASSETS_PATH + "animations.json", load_cb, preloader_cb);
}

/**
 * update the app's preloader
 */
function preloader_cb(percentage) {
    m_preloader.update_preloader(percentage);
}

/**
 * callback executed when the scene data is loaded
 */
function load_cb(data_id, success) {

    if (!success) {
        console.log("b4w load failure");
        return;
    }

    m_app.enable_camera_controls();

    let human = m_scenes.get_object_by_name('Character');
    m_anim.stop(human);
    //m_anim.apply(human, 'idle_B4W_BAKED', m_anim.SLOT_0);
    m_anim.apply(human, 'Run');
    m_anim.set_behavior(human, m_anim.AB_CYCLIC, m_anim.SLOT_0);
    m_anim.set_behavior(human, m_anim.AB_CYCLIC, m_anim.SLOT_1);
    m_anim.play(human, undefined, m_anim.SLOT_0);
    
    let animation_toggler = false;

    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 32) {
            toggle_animation();
        }
    });
    function toggle_animation() {
        m_anim.stop(human);
        if (animation_toggler === false) {
            m_anim.apply(human, 'Run');
        } else {
            m_anim.apply(human, 'Idle');
        }
        m_anim.set_behavior(human, m_anim.AB_CYCLIC);
        m_anim.play(human);

        animation_toggler = !animation_toggler;
    }
    
    document.addEventListener('click', function() {
        m_anim.stop(human);
        if (animation_toggler === false) {
            m_anim.apply(human, 'Run');
        } else {
            m_anim.apply(human, 'Idle');
        }
        m_anim.set_behavior(human, m_anim.AB_CYCLIC);
        m_anim.play(human);

        animation_toggler = !animation_toggler;
    });
}

init();
