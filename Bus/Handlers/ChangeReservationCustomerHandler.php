<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\ChangeReservationCustomer;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * ChangeReservationCustomerHandler
 *
 * @package TheBooking\Classes
 */
class ChangeReservationCustomerHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command ChangeReservationCustomer */
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $reservation->customer_id($command->getCustomerId());
    }
}