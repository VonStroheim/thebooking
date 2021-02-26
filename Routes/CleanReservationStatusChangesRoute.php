<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\CleanReservationPendingStatusUpdate;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class CleanReservationStatusChangesRoute
 *
 * @package TheBooking\Routes
 */
final class CleanReservationStatusChangesRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/clean/reservation/status/changes/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    $actionsToPerform = $request->get_param('doActions');

                    $command = new CleanReservationPendingStatusUpdate((bool)$actionsToPerform);
                    tbkg()->bus->dispatch($command);

                    $response = [
                        'status' => 'OK'
                    ];

                    return apply_filters('tbk_backend_cleaned_reservation_status_changes_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'doActions' => [
                        'required' => FALSE
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