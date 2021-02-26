<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\DeleteCustomer;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * DeleteCustomerHandler
 *
 * @package TheBooking\Classes
 */
class DeleteCustomerHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command DeleteCustomer */
        tbkg()->customers->delete($command->getId());
    }
}