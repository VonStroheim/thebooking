<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * SaveAvailability
 *
 * @package TheBooking\Classes
 */
class SaveAvailability implements Command
{
    /**
     * @var string
     */
    private $uid;

    /**
     * @var array[]
     */
    private $rules;

    public function __construct($uid, $rules)
    {
        $this->uid   = $uid;
        $this->rules = $rules;
    }

    /**
     * @return string
     */
    public function getUid()
    {
        return $this->uid;
    }


    /**
     * @return array[]
     */
    public function getRules()
    {
        return $this->rules;
    }

    public function getValue()
    {
        return [
            'uid'   => $this->uid,
            'rules' => $this->rules,
        ];
    }
}