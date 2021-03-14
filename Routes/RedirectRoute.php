<?php

namespace TheBooking\Routes;

use TheBooking\Classes\ValueTypes\FormField;
use VSHM_Framework\Classes\REST_Error_404;
use VSHM_Framework\Classes\REST_Error_Unauthorized;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class RedirectRoute
 *
 * @package TheBooking\Routes
 */
final class RedirectRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/redirect/(?P<to>[\w\-]+)';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => [\WP_REST_Server::READABLE],
                'callback' => function (\WP_REST_Request $request) {
                    switch ($request->get_param('to')) {
                        case 'reservationStatusPage':
                            $pageLink = get_page_link(tbkg()->settings->order_status_page());
                            wp_redirect(add_query_arg('tbkg_view', 'reservations', $pageLink));
                            exit;
                        default:
                            return new REST_Error_404();
                    }

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