<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\AddReservationPendingStatusUpdate;
use TheBooking\Bus\Handler;
use TheBooking\TheBookingClass;

defined('ABSPATH') || exit;

/**
 * AddReservationPendingStatusUpdateHandler
 *
 * @package TheBooking\Classes
 */
class AddReservationPendingStatusUpdateHandler implements Handler
{
    private $option_key = 'tbkl_reservations_status_updates';

    public function dispatch(Command $command)
    {
        /** @var $command AddReservationPendingStatusUpdate */

        if (TheBookingClass::isAdministrator()) {
            $stored = get_option($this->option_key, []);

            if (!in_array($command->getData(), $stored, TRUE)) {
                $stored[] = $command->getData();
                update_option($this->option_key, $stored);
            }
        }

    }
}