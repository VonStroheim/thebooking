<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\DeleteCustomer;
use TheBooking\Classes\Customer;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class DeleteCustomerRoute
 *
 * @package TheBooking\Routes
 */
final class DeleteCustomerRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/delete/customer/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {

                    $command = new DeleteCustomer($request->get_param('id'));
                    tbkg()->bus->dispatch($command);

                    $response = [
                        'status'    => 'OK',
                        'customers' => array_map(static function (Customer $customer) {
                            return $customer->as_array();
                        }, tbkg()->customers->all()),
                    ];

                    return apply_filters('tbk_backend_delete_customer_response', new \WP_REST_Response($response, 200));
                },
                'args'     => [
                    'id' => [
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