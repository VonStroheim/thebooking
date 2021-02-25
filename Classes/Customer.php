<?php

namespace TheBooking\Classes;

defined('ABSPATH') || exit;

/**
 * Class Customer
 *
 * @package TheBooking
 * @author  VonStroheim
 */
class Customer extends Resource
{
    /**
     * DB ID
     *
     * @var int
     */
    protected $id;

    /**
     * WordPress user ID of the customer, if available
     *
     * @var int
     */
    protected $wp_user = 0;

    /**
     * @var string
     */
    protected $name = '';

    /**
     * @var string
     */
    protected $phone = '';

    /**
     * @var string
     */
    protected $email = '';

    /**
     * @var string
     */
    protected $birthday = '';

    public function __construct()
    {
    }

    /**
     * @param int $id
     *
     * @return int
     */
    public function id($id = NULL)
    {
        return $this->_get_or_set_int(__FUNCTION__, $id);
    }

    /**
     * @param int $wpUserId
     *
     * @return int
     */
    public function wp_user($wpUserId = NULL)
    {
        return $this->_get_or_set_int(__FUNCTION__, $wpUserId);
    }

    /**
     * @param string $email
     *
     * @return string
     */
    public function email($email = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $email);
    }

    /**
     * @param string $name
     *
     * @return string
     */
    public function name($name = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $name);
    }

    /**
     * @param string $phone
     *
     * @return string
     */
    public function phone($phone = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $phone);
    }

    /**
     * @param string $birthday
     *
     * @return string
     */
    public function birthday($birthday = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $birthday);
    }

    /**
     * @return array
     */
    public function as_array()
    {
        return [
            'wpUserId' => $this->wp_user,
            'email'    => $this->email,
            'phone'    => $this->phone,
            'birthday' => $this->birthday,
            'name'     => $this->name,
            'created'  => $this->created,
            'updated'  => $this->updated,
            'id'       => $this->id
        ];
    }
}