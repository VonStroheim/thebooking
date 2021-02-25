<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * CreateCustomer
 *
 * @package TheBooking\Classes
 */
class CreateCustomer implements Command
{
    /**
     * @var string
     */
    private $name;

    /**
     * @var string
     */
    private $email;

    /**
     * @var string
     */
    private $phone;

    /**
     * @var int
     */
    private $wpUserId;

    /**
     * @var string
     */
    private $birthday;

    public function __construct($name, $email, $phone, $wpUserId, $birthday)
    {
        $this->name     = $name;
        $this->email    = $email;
        $this->phone    = $phone;
        $this->wpUserId = $wpUserId;
        $this->birthday = $birthday;
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
    public function getEmail()
    {
        return $this->email;
    }

    /**
     * @return string
     */
    public function getPhone()
    {
        return $this->phone;
    }

    /**
     * @return int
     */
    public function getWpUserId()
    {
        return $this->wpUserId;
    }

    /**
     * @return string
     */
    public function getBirthday()
    {
        return $this->birthday;
    }

    public function getValue()
    {
        return [
            'name'     => $this->name,
            'email'    => $this->email,
            'phone'    => $this->phone,
            'wpUserId' => $this->wpUserId,
            'birthday' => $this->birthday
        ];
    }
}