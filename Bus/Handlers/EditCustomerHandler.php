<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\EditCustomer;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * EditCustomerHandler
 *
 * @package TheBooking\Classes
 */
class EditCustomerHandler implements Handler
{
    private $table_name = 'tbkl_customers';

    public function dispatch(Command $command)
    {
        /** @var $command EditCustomer */

        db::update($this->table_name, [
            'customer_name' => $command->getName(),
            'email'         => $command->getEmail(),
            'phone'         => $command->getPhone(),
            'wp_user'       => $command->getWpUserId(),
            'birthday'      => $command->getBirthday(),
            'timezone'      => $command->getTimezone(),
        ], ['id' => $command->getId()]);
    }
}
