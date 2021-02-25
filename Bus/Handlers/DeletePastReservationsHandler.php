<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\DeletePastReservations;
use TheBooking\Bus\Handler;
use TheBooking\Classes\DateTimeTbk;

defined('ABSPATH') || exit;

/**
 * DeletePastReservationsHandler
 *
 * @package TheBooking\Classes
 */
class DeletePastReservationsHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command DeletePastReservations */

        $now = new DateTimeTbk();
        foreach (tbk()->reservations->all() as $reservation) {
            $start = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start())->getTimestamp();
            if ($now->getTimestamp() - $start > $command->getData()) {
                tbk()->reservations->delete($reservation->id());
            }
        }
    }
}