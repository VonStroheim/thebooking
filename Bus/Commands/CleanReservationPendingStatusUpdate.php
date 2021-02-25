<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * CleanReservationPendingStatusUpdate
 *
 * @package TheBooking\Classes
 */
class CleanReservationPendingStatusUpdate implements Command
{
    /**
     * @var bool
     */
    private $perform_actions;

    public function __construct($perform_actions = FALSE)
    {
        $this->perform_actions = $perform_actions;
    }

    /**
     * @return bool
     */
    public function getData()
    {
        return $this->perform_actions;
    }
}