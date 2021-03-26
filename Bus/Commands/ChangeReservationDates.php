<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * ChangeReservationDates
 *
 * @package TheBooking\Classes
 */
class ChangeReservationDates implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var string
     */
    private $start;

    /**
     * @var string
     */
    private $end;

    public function __construct($uid, $start, $end)
    {
        $this->uid   = $uid;
        $this->start = $start;
        $this->end   = $end;
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
    public function getStart()
    {
        return $this->start;
    }

    /**
     * @return string
     */
    public function getEnd()
    {
        return $this->end;
    }
}