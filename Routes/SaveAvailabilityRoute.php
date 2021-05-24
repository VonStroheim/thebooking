<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\SaveAvailability;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class SaveAvailabilityRoute
 *
 * @package TheBooking\Routes
 */
final class SaveAvailabilityRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/save/availability/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {

                    foreach ($request->get_param('settings') as $uid => $setting) {
                        $command = new SaveAvailability($uid, $setting);
                        tbkg()->bus->dispatch($command);
                    }

                    tbkg()->availability->gather();

                    $response = [
                        'status'       => 'OK',
                        'availability' => tbkg()->availability->all()
                    ];

                    return apply_filters('tbk_backend_save_availability_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'settings' => [
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