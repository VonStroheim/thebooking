<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * CreateService
 *
 * @package TheBooking\Classes
 */
class CreateService implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var string
     */
    private $name;

    public function __construct($uid, $name)
    {
        $this->uid  = $uid;
        $this->name = $name;
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
    public function getName()
    {
        return $this->name;
    }
}