<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * ChangeReservationStatus
 *
 * @package TheBooking\Classes
 */
class ChangeReservationStatus implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var string
     */
    private $status;

    public function __construct($uid, $status)
    {
        $this->uid    = $uid;
        $this->status = $status;
    }

    /**
     * @return string
     */
    public function getUid()
    {
        return $this->uid;
    }

    /**
     * @return string
     */
    public function getStatus()
    {
        return $this->status;
    }
}