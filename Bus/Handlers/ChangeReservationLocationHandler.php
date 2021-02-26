<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\ChangeReservationLocation;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * ChangeReservationLocationHandler
 *
 * @package TheBooking\Classes
 */
class ChangeReservationLocationHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command ChangeReservationLocation */
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $reservation->addMeta('location', $command->getLocationId());
    }
}