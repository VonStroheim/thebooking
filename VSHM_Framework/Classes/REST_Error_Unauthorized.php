<?php

namespace VSHM_Framework\Classes;

defined('ABSPATH') || exit;

/**
 * Class REST_Error_Unauthorized
 *
 * @package VSHM_Framework\Classes
 */
class REST_Error_Unauthorized extends \WP_REST_Response
{
    public function __construct($message = 'Unauthorized')
    {
        parent::__construct([
            'status' => 'KO',
            'code'   => 403,
            'error'  => $message
        ], 403, []);
    }
}