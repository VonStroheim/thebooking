<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\CreateCustomer;
use TheBooking\Bus\Commands\EditCustomer;
use TheBooking\Classes\Customer;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class EditCustomerRoute
 *
 * @package TheBooking\Routes
 */
final class EditCustomerRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/edit/customer/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    $customerId = $request->get_param('id');
                    $props      = $request->get_param('customer');
                    $wpId       = $props['wpUserId'];

                    if ($wpId < 0) {
                        /**
                         * if -1 we should create a new WordPress user
                         */
                        $newUserId = wp_insert_user([
                            'user_pass'    => wp_generate_password(),
                            'display_name' => $props['name'],
                            'user_email'   => $props['email'],
                            'user_login'   => explode('@', $props['email'])[0] . '_' . \VSHM_Framework\Tools::generate_token('numeric', 2)
                        ]);

                        if ($newUserId instanceof \WP_Error) {
                            $response = [
                                'status' => 'KO',
                                'error'  => $newUserId->get_error_message()
                            ];

                            return apply_filters('tbk_backend_create_customer_response', new \WP_REST_Response($response, 200));
                        }
                        $wpId = $newUserId;
                    }

                    $command = new EditCustomer($props['name'], $props['email'], $props['phone'], $wpId, $props['birthday'], $customerId);
                    tbkg()->bus->dispatch($command);
                    tbkg()->customers->gather();

                    $response = [
                        'status'    => 'OK',
                        'customers' => array_map(static function (Customer $customer) {
                            return $customer->as_array();
                        }, tbkg()->customers->all()),
                    ];

                    return apply_filters('tbk_backend_edit_customer_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'customer' => [
                        'required' => TRUE
                    ],
                    'id'       => [
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