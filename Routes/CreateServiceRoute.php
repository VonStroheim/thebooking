<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\CreateService;
use TheBooking\Classes\Service;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class CreateServiceRoute
 *
 * @package TheBooking\Routes
 */
final class CreateServiceRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/create/service/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    $props   = $request->get_param('service');
                    $command = new CreateService(uniqid(), $props['name']);
                    tbk()->bus->dispatch($command);

                    $response = [
                        'status'   => 'OK',
                        'services' => array_map(static function (Service $service) {
                            return $service->as_array();
                        }, tbk()->services->all()),
                    ];

                    return apply_filters('tbk-backend-create-service-response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'service' => [
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