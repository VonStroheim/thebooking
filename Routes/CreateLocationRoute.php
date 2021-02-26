<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\CreateLocation;
use VSHM_Framework\REST_Controller;
use VSHM_Framework\Tools;

defined('ABSPATH') || exit;

/**
 * Class CreateCustomerRoute
 *
 * @package TheBooking\Routes
 */
final class CreateLocationRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/create/location/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {

                    $command = new CreateLocation($request->get_param('name'), $request->get_param('address'), Tools::generate_token());
                    tbkg()->bus->dispatch($command);
                    tbkg()->availability->gather_locations();

                    $response = [
                        'status'    => 'OK',
                        'locations' => tbkg()->availability->locations()
                    ];

                    return apply_filters('tbk_backend_create_location_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'name'    => [
                        'required' => TRUE
                    ],
                    'address' => [
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