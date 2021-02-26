<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Classes\Reservation;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class DeleteReservationRoute
 *
 * @package TheBooking\Routes
 */
final class DeleteReservationRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/delete/reservation/';

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
                            $command = new DeleteReservation($uid);
                            tbkg()->bus->dispatch($command);
                        }
                        $response = [
                            'status'       => 'OK',
                            'reservations' => array_values(array_map(static function (Reservation $reservation) {
                                return $reservation->as_array();
                            }, tbkg()->reservations->all()))
                        ];
                    }

                    return apply_filters('tbk_backend_delete_reservation_response', new \WP_REST_Response($response, 200));
                }
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}