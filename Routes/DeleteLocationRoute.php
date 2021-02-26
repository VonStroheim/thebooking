<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\DeleteLocation;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Classes\Reservation;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class DeleteReservationRoute
 *
 * @package TheBooking\Routes
 */
final class DeleteLocationRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/delete/location/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    if (!tbkg()::isAdministrator()) {
                        $response = [
                            'status'  => 'KO',
                            'message' => 'Forbidden.'
                        ];
                    } else {
                        foreach ($request->get_param('uids') as $uid) {
                            $command = new DeleteLocation($uid);
                            tbkg()->bus->dispatch($command);
                        }
                        tbkg()->availability->gather_locations();
                        $response = [
                            'status'    => 'OK',
                            'locations' => tbkg()->availability->locations()
                        ];
                    }

                    return apply_filters('tbk_backend_delete_location_response', new \WP_REST_Response($response, 200));
                }
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}