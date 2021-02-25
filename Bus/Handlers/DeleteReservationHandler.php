<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * DeleteReservationHandler
 *
 * @package TheBooking\Classes
 */
class DeleteReservationHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command DeleteReservation */
        tbk()->reservations->delete($command->getUid());
    }
}