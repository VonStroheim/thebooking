<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\SaveSettings;
use VSHM_Framework\Classes\REST_Error_Unauthorized;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class SaveUserPrefsRoute
 *
 * @package TheBooking\Routes
 */
final class SaveUserPrefsRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/save/prefs/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    if (!get_current_user_id()) {
                        return new REST_Error_Unauthorized();
                    }

                    $prefs = get_user_option('tbkgUserPrefs');
                    if (!$prefs) {
                        $prefs = [];
                    }

                    $prefs[ $request->get_param('prefName') ] = $request->get_param('prefValue');

                    update_user_option(get_current_user_id(), 'tbkgUserPrefs', $prefs);

                    return new \WP_REST_Response(
                        [
                            'status' => 'OK'
                        ], 200);
                },
                'args'     => [
                    'prefName'  => [
                        'required' => TRUE
                    ],
                    'prefValue' => [
                        'required' => TRUE
                    ]
                ]
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}