<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * ChangeReservationLocation
 *
 * @package TheBooking\Classes
 */
class ChangeReservationLocation implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var int
     */
    private $locationId;

    public function __construct($uid, $locationId)
    {
        $this->uid        = $uid;
        $this->locationId = $locationId;
    }

    /**
     * @return string
     */
    public function getUid()
    {
        return $this->uid;
    }

    /**
     * @return int
     */
    public function getLocationId()
    {
        return $this->locationId;
    }
}