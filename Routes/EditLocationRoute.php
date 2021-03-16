<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\EditLocation;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class EditLocationRoute
 *
 * @package TheBooking\Routes
 */
final class EditLocationRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/edit/location/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {

                    $command = new EditLocation($request->get_param('name'), $request->get_param('address'), $request->get_param('uid'));
                    tbkg()->bus->dispatch($command);
                    tbkg()->availability->gather_locations();

                    $response = [
                        'status'    => 'OK',
                        'locations' => tbkg()->availability->locations()
                    ];

                    return apply_filters('tbk_backend_edit_location_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'name'    => [
                        'required' => FALSE
                    ],
                    'address' => [
                        'required' => FALSE
                    ],
                    'uid'     => [
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