<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\CreateCustomer;
use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\ValueTypes\Status;
use TheBooking\Classes\ValueTypes\UserInput;
use VSHM_Framework\Classes\REST_Error_404;
use VSHM_Framework\Classes\REST_Error_Unauthorized;
use VSHM_Framework\REST_Controller;
use VSHM_Framework\Tools;

defined('ABSPATH') || exit;

/**
 * Class SubmitBookingRoute
 *
 * @package TheBooking\Routes
 */
final class SubmitBookingRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/frontend/booking/submit/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    /**
                     * Ensures that the endpoint is internal.
                     */
                    if (!wp_verify_nonce($request['tbk_nonce'], 'tbk_nonce')) {
                        return new REST_Error_Unauthorized();
                    }

                    $item    = $request->get_param('item');
                    $service = tbkg()->services->get($item['serviceId']);

                    if (!$service) {
                        return new REST_Error_404();
                    }

                    /**
                     * Server-side checks
                     */
                    if ($service->registered_only() && !get_current_user_id()) {
                        return new REST_Error_Unauthorized(__('This service can be booked by registered users only.', 'the-booking'));
                    }

                    /**
                     * Collecting meta
                     */
                    $meta = [
                        'availabilityId' => $item['availabilityId']
                    ];

                    if (isset($item['location'])) {
                        $meta['location'] = $item['location'];
                    }

                    if ($service->getMeta('saveIp') && !get_current_user_id()) {
                        $meta['user_ip'] = Tools::get_ip_address();
                    }

                    foreach ($request->get_param('bookingData') as $bookingDatumId => $bookingDatum) {
                        $input                   = new UserInput([
                            'value' => $bookingDatum['value'],
                            'type'  => $bookingDatum['type'],
                            'label' => $bookingDatum['label'],
                        ]);
                        $meta[ $bookingDatumId ] = $input;
                    }
                    $reservationId = Tools::generate_token();

                    // TODO: what identifies a customer??
                    $customers          = tbkg()->customers->all();
                    $customerId         = NULL;
                    $customerEmailField = $request->get_param('bookingData')[ $service->getMeta('formFieldContact') ];
                    $customerEmail      = strtolower(trim($customerEmailField['value']));
                    foreach ($customers as $customer) {
                        if ($customer->email() === $customerEmail) {
                            $customerId = $customer->id();
                        }
                    }

                    if (NULL === $customerId) {
                        /**
                         * Customer wasn't found, let's create a new one.
                         * If the user is logged-in, the customer will be automatically
                         * linked to the current WordPress profile.
                         */
                        $userId = get_current_user_id();

                        /**
                         * If there is a user with the same email address,
                         * let's take it as linked WordPress profile.
                         */
                        $user = get_user_by('email', $customerEmail);
                        if ($user instanceof \WP_User) {
                            $userId = $user->ID;
                        }

                        if ($userId) {
                            foreach ($customers as $customer) {
                                if ($customer->wp_user() === $userId) {
                                    // Current logged-in user is already mapped to a customer. TODO: decide if we map or discard
                                    #$customerId = $customer->id(); // THIS CHANGES THE CUSTOMER; FORCING THE RESERVATION TO BE LIKED TO LOGGED USER
                                    $userId = 0; // THIS DISCARDS THE CURRENT LOGGED USER AS IT'S MAPPED ALREADY TO ANOTHER EMAIL ADDRESS
                                }
                            }
                        }

                        if (NULL === $customerId) {

                            // TODO conditional: if $userID is still 0 and $customerId is still NULL, decide if we want to create a WP user here.

                            tbkg()->bus->dispatch(new CreateCustomer(
                                    NULL,
                                    $customerEmail,
                                    NULL,
                                    $userId,
                                    NULL)
                            );

                            tbkg()->customers->gather();

                            foreach (tbkg()->customers->all() as $customer) {
                                if ($customer->email() === $customerEmail) {
                                    $customerId = $customer->id();
                                }
                            }
                        }
                    }

                    $command = new CreateReservation(
                        $reservationId,
                        $service->id(),
                        $customerId,
                        $item['start'],
                        $item['end'],
                        $meta,
                        new Status(Status::CONFIRMED)
                    );

                    tbkg()->bus->dispatch($command);

                    $response['update']    = [
                        'reservations' => array_values(array_map(static function (Reservation $reservation) {
                            return tbkg()->reservations->mapToFrontend($reservation->id());
                        }, tbkg()->reservations->all())),
                    ];
                    $response['bookingId'] = $reservationId;
                    $response['response']  = [
                        'type'    => 'success',
                        'tagline' => 'Thanks for your reservation',
                        'message' => 'You will receive an email shortly.',
                        'actions' => []
                    ];

                    return apply_filters('tbk_frontend_booking_success', new \WP_REST_Response($response, 200), $reservationId);
                },
                'args'     => [
                    'tbk_nonce' => [
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