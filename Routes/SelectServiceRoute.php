<?php

namespace TheBooking\Routes;

use VSHM_Framework\Classes\REST_Error_404;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class SelectServiceRoute
 *
 * @package TheBooking\Routes
 */
final class SelectServiceRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/frontend/select/service/(?P<id>[\w\-]+)';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => [\WP_REST_Server::READABLE, \WP_REST_Server::CREATABLE],
                'callback' => function (\WP_REST_Request $request) {
                    $service = tbkg()->services->get($request->get_param('id'));
                    if (!$service) {
                        return new REST_Error_404();
                    }

                    $response = apply_filters('tbk_frontend_select_service_response', ['status' => 'OK'], $request->get_param('id'), $request->get_params());

                    return new \WP_REST_Response($response, 200);
                }
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}