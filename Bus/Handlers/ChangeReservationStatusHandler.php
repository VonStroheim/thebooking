<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\ChangeReservationStatus;
use TheBooking\Bus\Handler;
use TheBooking\Classes\ValueTypes\Status;

defined('ABSPATH') || exit;

/**
 * ChangeReservationStatusHandler
 *
 * @package TheBooking\Classes
 */
class ChangeReservationStatusHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command ChangeReservationStatus */
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $reservation->status(new Status($command->getStatus()));
    }
}