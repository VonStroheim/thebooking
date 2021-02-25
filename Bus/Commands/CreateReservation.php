<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;
use TheBooking\Classes\ValueTypes\Status;

defined('ABSPATH') || exit;

/**
 * CreateReservation
 *
 * @package TheBooking\Classes
 */
class CreateReservation implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var string
     */
    private $serviceId;

    /**
     * @var string
     */
    private $start;

    /**
     * @var string
     */
    private $end;

    /**
     * @var int
     */
    private $userId;

    /**
     * @var array
     */
    private $meta;

    /**
     * @var Status
     */
    private $status;

    public function __construct($uid, $serviceId, $userId, $start, $end, $meta, $status)
    {
        $this->uid       = $uid;
        $this->serviceId = $serviceId;
        $this->userId    = $userId;
        $this->meta      = $meta;
        $this->status    = $status;
        $this->start     = $start;
        $this->end       = $end;
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
        return $this->serviceId;
    }

    /**
     * @return int
     */
    public function getUserId()
    {
        return $this->userId;
    }

    /**
     * @return array
     */
    public function getMeta()
    {
        return $this->meta;
    }

    /**
     * @return Status
     */
    public function getStatus()
    {
        return $this->status;
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