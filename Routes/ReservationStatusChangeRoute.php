<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\ChangeReservationStatus;
use TheBooking\Classes\Reservation;
use TheBooking\Reservations;
use VSHM_Framework\db;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class ReservationStatusChangeRoute
 *
 * @package TheBooking\Routes
 */
final class ReservationStatusChangeRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/reservation/status/change/';

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
                        $status      = $request->get_param('status');
                        $reservation = tbkg()->reservations->all()[ $request->get_param('id') ];

                        $command = new ChangeReservationStatus($reservation->id(), $status);
                        tbkg()->bus->dispatch($command);

                        db::update(Reservations::$table_name, [
                            'service_id'  => $reservation->service_id(),
                            'r_status'    => $reservation->status()->getValue(),
                            'customer_id' => $reservation->customer_id(),
                            'r_start'     => $reservation->start(),
                            'r_end'       => $reservation->end(),
                        ], ['reservation_uid' => $reservation->id()]);

                        /**
                         * Allowing actions
                         */
                        do_action('tbk_reservation_status_change_actions', $command);

                        $response = [
                            'status'       => 'OK',
                            'reservations' => array_values(array_map(static function (Reservation $reservation) {
                                return $reservation->as_array();
                            }, tbkg()->reservations->all()))
                        ];
                    }

                    return apply_filters('tbk_backend_reservation_status_change_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'status' => [
                        'required' => TRUE
                    ],
                    'id'     => [
                        'required' => TRUE
                    ],
                ]
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}