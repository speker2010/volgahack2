"use strict"

import b4w from "blend4web";

// import modules used by the app
var m_app       = b4w.app;
var m_cfg       = b4w.config;
var m_data      = b4w.data;
var m_preloader = b4w.preloader;
var m_ver       = b4w.version;
var m_anim      = b4w.animation;
var m_scenes    = b4w.scenes;
var m_main = b4w.main;
var m_cam = b4w.camera;
var m_physics = b4w.physics;
var m_constraints = b4w.constraints;
var m_ctl = b4w.controls;
var m_objects = b4w.objects;

var ROT_SPEED = 1.5;
var CAMERA_OFFSET = new Float32Array([0, 10, 3]);

var _character = null;
var _character_rig = null;
var _fake_doors = null;
var _data_id = null;

// detect application mode
var DEBUG = (m_ver.type() == "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = m_cfg.get_assets_path();
var FIRST_SCENE = APP_ASSETS_PATH + 'first_scene.json';
var SECOND_SCENE = APP_ASSETS_PATH + 'second_scene.json';

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
    _data_id = m_data.load(FIRST_SCENE, load_cb, preloader_cb);
}

function load2() {
    _data_id = m_data.load(SECOND_SCENE, load_cb, preloader_cb);
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

    //m_app.enable_camera_controls();
    _character = m_scenes.get_first_character();
    _character_rig = m_scenes.get_object_by_name('CharacterRig');

    var camera = m_scenes.get_active_camera();
    m_constraints.append_semi_soft(camera, _character, CAMERA_OFFSET);

    let sensor_collision_door = m_ctl.create_collision_sensor(_character, 'DOOR');
    let sensor_collision_exit = m_ctl.create_collision_sensor(_character, 'EXIT');
    let sensor_collision_death = m_ctl.create_collision_sensor(_character, 'DEATH');
    let collission_sens_array = [
        sensor_collision_door,
        sensor_collision_exit,
        sensor_collision_death
    ];
    let colision_door_logic = (s) => {
        return s[0];
    };
    let colision_exit_logic = (s) => {
        return s[1];
    }
    let colision_death_logic = (s) => {
        return s[2];
    }
    let collision_cb = (obj, manifold_id, pulse) => {
        if (m_ctl.get_sensor_value(obj, manifold_id, 0) == 1) {
            let door = m_ctl.get_sensor_payload(obj,manifold_id, 0).coll_obj;
            m_scenes.remove_object(door);
            let selectables = m_objects.get_selectable_objects();
            if (selectables.length === 0) {
                hide_doors();
            }
            console.log(m_objects.get_selectable_objects());
        }
        if (m_ctl.get_sensor_value(obj, manifold_id, 1) == 1) {
            let selectables = m_objects.get_selectable_objects();
            if (selectables.length === 0) {
                loadSecondScene();
            }
        }
        console.log('sd');
        if (m_ctl.get_sensor_value(obj, manifold_id, 2) == 1) {
            console.log('sdfasd');
            m_main.reset();
        }
    };

    m_ctl.create_sensor_manifold(_character, 'DOOR_COLISION',m_ctl.CT_CONTINUOUS, 
        collission_sens_array, colision_door_logic, collision_cb);

    m_ctl.create_sensor_manifold(_character, 'EXIT_COLISION', m_ctl.CT_CONTINUOUS,
        collission_sens_array, colision_exit_logic, collision_cb);
    m_ctl.create_sensor_manifold(_character, 'DEATH_COLISION', m_ctl.CT_CONTINUOUS,
        collission_sens_array, colision_death_logic, collision_cb);



    //adsm_constraints.append_semi_soft(camera, _character, CAMERA_OFFSET);

    // m_anim.stop(_character_rig);
    // m_anim.apply(_character_rig, 'Run');
    // m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC, m_anim.SLOT_0);
    // m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC, m_anim.SLOT_1);
    // m_anim.play(_character_rig, undefined, m_anim.SLOT_0);

    init_movement();
    init_rotation();
    init_jump();
    // disable_doors();

    // daw asdawdasdinit_animation();
}

function hide_doors() {
    for (var i = 1; i < 4; i++) {
        let door = m_scenes.get_object_by_name('Door' + i);
        m_scenes.remove_object(door);
    }
    let door = m_scenes.get_object_by_name('Door');
    m_physics.enable_simulation(door);
}

function disable_doors() {
    let door = m_scenes.get_object_by_name('Door');
    m_physics.disable_simulation(door);
    for (var i = 1; i < 4; i++) {
        let door = m_scenes.get_object_by_name('Door' + i);
        m_physics.disable_simulation(door);
    }
}

function loadSecondScene() {
    m_data.unload(_data_id);
    m_preloader.create_preloader();
    load2();
}

function init_movement() {
    let key_w = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
    let key_s = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
    let key_up = m_ctl.create_keyboard_sensor(m_ctl.KEY_UP);
    let key_down = m_ctl.create_keyboard_sensor(m_ctl.KEY_DOWN);

    let move_array = [
        key_w, key_up,
        key_s, key_down
    ];

    let forward_logic = function(s){return (s[0] || s[1])};
    let backward_logic = function(s){return (s[2] || s[3])};

    function move_cb(obj, id, pulse) {
        if (pulse == 1) {
            switch(id) {
                case "FORWARD":
                    var move_dir = 1;
                    m_anim.apply(_character_rig, 'Run');
                    break;
                case "BACKWARD":
                    var move_dir = -1;
                    m_anim.apply(_character_rig, "RunBack");
                    break;
            }
        } else {
            var move_dir = 0;
            m_anim.apply(_character_rig, 'Idle');
        }

        m_physics.set_character_move_dir(obj, move_dir, 0);
        m_anim.play(_character_rig);
        m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
    }

    m_ctl.create_sensor_manifold(_character, "FORWARD", m_ctl.CT_TRIGGER,
        move_array, forward_logic, move_cb);
    m_ctl.create_sensor_manifold(_character, "BACKWARD", m_ctl.CT_TRIGGER,
        move_array, backward_logic, move_cb);
}

function init_jump() {
    let key_space = m_ctl.create_keyboard_sensor(m_ctl.KEY_SPACE);

    let jump_array = [
        key_space
    ];

    let jump_logic = (s) => s[0];
    function jump_cb(obj, id, pulse) {
        if (pulse == 1) {
            m_physics.character_jump(_character);
            m_anim.apply(_character_rig, 'Jump');
            m_anim.play(_character_rig, () => {
                m_anim.apply(_character_rig, 'Run');
                m_anim.play(_character_rig);
                m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
            });
            m_anim.set_behavior(_character_rig, m_anim.AB_STOP)
        }
    }

    m_ctl.create_sensor_manifold(_character, "JUMP", m_ctl.CT_TRIGGER,
        jump_array, jump_logic, jump_cb);
}

function init_animation() {
    
    
    let animation_toggler = false;

    document.addEventListener('keydown', function(e) {
        if (e.keyCode === 32) {
            m_physics.character_jump(_character);
        }
    });

    function toggle_animation() {
        m_anim.stop(_character_rig);
        if (animation_toggler === false) {
            m_anim.apply(_character_rig, 'Run');
        } else {
            m_anim.apply(_character_rig, 'Idle');
        }
        m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
        m_anim.play(_character_rig);

        animation_toggler = !animation_toggler;
    }
    
    document.addEventListener('click', function() {
        m_anim.stop(_character_rig);
        if (animation_toggler === false) {
            m_anim.apply(_character_rig, 'Run');
        } else {
            m_anim.apply(_character_rig, 'Idle');
        }
        m_anim.set_behavior(_character_rig, m_anim.AB_CYCLIC);
        m_anim.play(_character_rig);

        animation_toggler = !animation_toggler;
    });
}

function init_rotation() {
    var key_a     = m_ctl.create_keyboard_sensor(m_ctl.KEY_A);
    var key_d     = m_ctl.create_keyboard_sensor(m_ctl.KEY_D);
    var key_left  = m_ctl.create_keyboard_sensor(m_ctl.KEY_LEFT);
    var key_right = m_ctl.create_keyboard_sensor(m_ctl.KEY_RIGHT);

    var elapsed_sensor = m_ctl.create_elapsed_sensor();

    var rotate_array = [
        key_a, key_left,
        key_d, key_right,
        elapsed_sensor
    ];

    var left_logic  = function(s){return (s[0] || s[1])};
    var right_logic = function(s){return (s[2] || s[3])};

    function rotate_cb(obj, id, pulse) {

        var elapsed = m_ctl.get_sensor_value(obj, "LEFT", 4);

        if (pulse == 1) {
            switch(id) {
            case "LEFT":
                m_physics.character_rotation_inc(obj, elapsed * ROT_SPEED, 0);
                break;
            case "RIGHT":
                m_physics.character_rotation_inc(obj, -elapsed * ROT_SPEED, 0);
                break;
            }
        }
    }

    m_ctl.create_sensor_manifold(_character, "LEFT", m_ctl.CT_CONTINUOUS,
        rotate_array, left_logic, rotate_cb);
    m_ctl.create_sensor_manifold(_character, "RIGHT", m_ctl.CT_CONTINUOUS,
        rotate_array, right_logic, rotate_cb);
}

init();
