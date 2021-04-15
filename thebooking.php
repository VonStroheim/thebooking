<?php

/*
Plugin Name:        TheBooking
Plugin URI:         https://github.com/VonStroheim/thebooking
Description:        A WordPress booking plugin.
Version:            1.2
Requires PHP:       5.6
Requires at least:  5.0
Author:             VonStroheim
License:            GPL v2 or later
License URI:        https://www.gnu.org/licenses/gpl-2.0.html
Text Domain:        thebooking
*/

defined('ABSPATH') || exit;

// Set the right include path (temporary)...
$prev_include_path = set_include_path(__DIR__);

const TBKG_FILE__  = __FILE__;
const TBKG_DIR__   = __DIR__;
const TBKG_VERSION = '1.2';
define('TBKG_PATH__', plugin_dir_path(TBKG_FILE__));
define('TBKG_URL__', plugin_dir_url(TBKG_FILE__));

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/VSHM_Framework/Autoloader.php';
require __DIR__ . '/Functions.php';

\VSHM_Framework\Autoloader::TheBooking(__DIR__);
\VSHM_Framework\Autoloader::VSHM_Framework(__DIR__ . DIRECTORY_SEPARATOR . 'VSHM_Framework');
\VSHM_Framework\Autoloader::run();

register_activation_hook(TBKG_FILE__, 'TheBooking\plugin_install');
register_deactivation_hook(TBKG_FILE__, 'TheBooking\plugin_deactivate');
register_uninstall_hook(TBKG_FILE__, 'TheBooking\plugin_uninstall');

/**
 * Main instance of TheBooking.
 *
 * @return \TheBooking\TheBookingClass
 */
function tbkg()
{
    return \TheBooking\TheBookingClass::instance();
}

/**
 * Hooking the main instance call only when
 * the plugins are loaded to let other plugins
 * to use TheBooking actions/filters in time.
 */
add_action('plugins_loaded', function () {
    tbkg()->init();
});

// ...restore previous include_path
set_include_path($prev_include_path);