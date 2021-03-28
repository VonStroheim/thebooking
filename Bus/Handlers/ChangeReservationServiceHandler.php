<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\ChangeReservationService;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * ChangeReservationServiceHandler
 *
 * @package TheBooking\Classes
 */
class ChangeReservationServiceHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command ChangeReservationService */
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $reservation->service_id($command->getServiceId());
    }
}