<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\DeleteService;
use TheBooking\Classes\Service;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class DeleteServiceRoute
 *
 * @package TheBooking\Routes
 */
final class DeleteServiceRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/delete/service/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {

                    if (is_array($request->get_param('uids'))) {
                        foreach ($request->get_param('uids') as $uid) {
                            $command = new DeleteService($uid);
                            tbkg()->bus->dispatch($command);
                        }
                    }

                    $response = [
                        'status'   => 'OK',
                        'services' => array_map(function (Service $service) {
                            return $service->as_array();
                        }, tbkg()->services->all()),
                    ];

                    return apply_filters('tbk_backend_delete_service_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'uids' => [
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