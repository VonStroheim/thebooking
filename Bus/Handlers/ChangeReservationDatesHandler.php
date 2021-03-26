<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\ChangeReservationDates;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * ChangeReservationDatesHandler
 *
 * @package TheBooking\Classes
 */
class ChangeReservationDatesHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command ChangeReservationDates */
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $reservation->start($command->getStart());
        $reservation->end($command->getEnd());
    }
}