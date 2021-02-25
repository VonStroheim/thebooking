<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * DeleteReservation
 *
 * @package TheBooking\Classes
 */
class DeleteReservation implements Command
{
    /**
     * @var string
     */
    private $uid;

    public function __construct($uid)
    {
        $this->uid = $uid;
    }

    /**
     * @return string
     */
    public function getUid()
    {
        return $this->uid;
    }
}