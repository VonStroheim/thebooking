<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * EditLocation
 *
 * @package TheBooking\Classes
 */
class EditLocation implements Command
{
    /**
     * @var string
     */
    private $name;

    /**
     * @var string
     */
    private $address;

    /**
     * @var string
     */
    private $uid;

    public function __construct($name, $address, $uid)
    {
        $this->name    = $name;
        $this->address = $address;
        $this->uid     = $uid;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return string
     */
    public function getAddress()
    {
        return $this->address;
    }

    /**
     * @return string
     */
    public function getUid()
    {
        return $this->uid;
    }

    public function getValue()
    {
        return [
            'name'    => $this->name,
            'address' => $this->address,
            'uid'     => $this->uid,
        ];
    }
}