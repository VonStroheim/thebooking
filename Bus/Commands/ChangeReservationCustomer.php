<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * ChangeReservationCustomer
 *
 * @package TheBooking\Classes
 */
class ChangeReservationCustomer implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var int
     */
    private $customerId;

    public function __construct($uid, $customerId)
    {
        $this->uid        = $uid;
        $this->customerId = $customerId;
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
    public function getCustomerId()
    {
        return $this->customerId;
    }
}