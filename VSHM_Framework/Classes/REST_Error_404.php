<?php

namespace VSHM_Framework\Classes;

defined('ABSPATH') || exit;

/**
 * Class REST_Error_404
 *
 * @package VSHM_Framework\Classes
 */
class REST_Error_404 extends \WP_REST_Response
{
    public function __construct($message = 'Not found')
    {
        parent::__construct([
            'status' => 'KO',
            'code'   => 404,
            'error'  => $message
        ], 404, []);
    }
}