<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * DeleteCustomer
 *
 * @package TheBooking\Classes
 */
class DeleteCustomer implements Command
{
    /**
     * @var int
     */
    private $id;

    public function __construct($id)
    {
        $this->id = $id;
    }

    /**
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }
}