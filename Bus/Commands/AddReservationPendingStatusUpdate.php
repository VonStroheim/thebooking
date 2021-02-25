<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * AddReservationPendingStatusUpdate
 *
 * @package TheBooking\Classes
 */
class AddReservationPendingStatusUpdate implements Command
{
    /**
     * @var string
     */
    private $reservation_id;

    public function __construct($reservation_id)
    {
        $this->reservation_id = $reservation_id;
    }

    /**
     * @return int
     */
    public function getData()
    {
        return $this->reservation_id;
    }
}