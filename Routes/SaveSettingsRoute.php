<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\SaveSettings;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class SaveSettingsRoute
 *
 * @package TheBooking\Routes
 */
final class SaveSettingsRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/save/settings/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {

                    $command = new SaveSettings($request->get_param('settings'), $request->get_param('meta'));
                    tbk()->bus->dispatch($command);

                    return new \WP_REST_Response(apply_filters('tbk-backend-settings-save-response',
                        [
                            'settings' => $request->get_param('settings'),
                            'meta'     => $request->get_param('meta'),
                            'status'   => 'OK'
                        ], 200));
                },
                'args'     => [
                    'settings' => [
                        'type'     => 'Array',
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