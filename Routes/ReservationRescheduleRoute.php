<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\ChangeReservationDates;
use TheBooking\Classes\Reservation;
use TheBooking\Reservations;
use VSHM_Framework\db;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class ReservationRescheduleRoute
 *
 * @package TheBooking\Routes
 */
final class ReservationRescheduleRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/reservation/reschedule/';

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
                        $start = $request->get_param('start');
                        $end   = $request->get_param('end');

                        $reservation = tbkg()->reservations->all()[ $request->get_param('id') ];

                        $prev_start = $reservation->start();
                        $prev_end   = $reservation->end();

                        $command = new ChangeReservationDates($reservation->id(), $start, $end);
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
                        do_action('tbk_reservation_rescheduled_actions', $command, $prev_start, $prev_end);

                        $response = [
                            'status'       => 'OK',
                            'reservations' => array_values(array_map(static function (Reservation $reservation) {
                                return $reservation->as_array();
                            }, tbkg()->reservations->all()))
                        ];
                    }

                    return apply_filters('tbk_backend_reservation_rescheduled_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'start' => [
                        'required' => TRUE
                    ],
                    'end'   => [
                        'required' => TRUE
                    ],
                    'id'    => [
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