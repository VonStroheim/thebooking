<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CleanReservationPendingStatusUpdate;
use TheBooking\Bus\Handler;
use TheBooking\TheBookingClass;

defined('ABSPATH') || exit;

/**
 * CleanReservationPendingStatusUpdateHandler
 *
 * @package TheBooking\Classes
 */
class CleanReservationPendingStatusUpdateHandler implements Handler
{
    private $option_key = 'tbkl_reservations_status_updates';

    public function dispatch(Command $command)
    {
        /** @var $command CleanReservationPendingStatusUpdate */

        if (TheBookingClass::isAdministrator()) {

            if ($command->getData()) {
                /**
                 * Performing actions before cleaning updated statuses.
                 */
                do_action('tbk_reservation_status_updated_actions', get_option($this->option_key, []));
            }

            delete_option($this->option_key);
        }

    }
}