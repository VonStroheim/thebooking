<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * ChangeReservationService
 *
 * @package TheBooking\Classes
 */
class ChangeReservationService implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var string
     */
    private $service_id;

    public function __construct($uid, $service_id)
    {
        $this->uid        = $uid;
        $this->service_id = $service_id;
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
    public function getServiceId()
    {
        return $this->service_id;
    }
}