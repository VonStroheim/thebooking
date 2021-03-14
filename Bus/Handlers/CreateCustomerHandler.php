<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CreateCustomer;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;
use VSHM_Framework\Tools;

defined('ABSPATH') || exit;

/**
 * CreateCustomerHandler
 *
 * @package TheBooking\Classes
 */
class CreateCustomerHandler implements Handler
{
    private $table_name = 'tbkl_customers';

    public function dispatch(Command $command)
    {
        /** @var $command CreateCustomer */

        db::insert($this->table_name, [
            'customer_name' => $command->getName(),
            'email'         => $command->getEmail(),
            'phone'         => $command->getPhone(),
            'wp_user'       => $command->getWpUserId(),
            'birthday'      => $command->getBirthday(),
            'access_token'  => Tools::generate_token(),
            'created'       => time()
        ]);
    }
}
