<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Bus\Handler;
use TheBooking\Classes\ValueTypes\Status;

defined('ABSPATH') || exit;

/**
 * CreateReservationHandler
 *
 * @package TheBooking\Classes
 */
class CreateReservationHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command CreateReservation */

        $reservation = tbkg()->reservations->get_new();
        $reservation->id($command->getUid());
        $reservation->service_id($command->getServiceId());
        $reservation->customer_id($command->getUserId());
        $reservation->metadata($command->getMeta());
        $reservation->status($command->getStatus());
        $reservation->start($command->getStart());
        $reservation->end($command->getEnd());
        tbkg()->reservations->insert($reservation);
    }
}