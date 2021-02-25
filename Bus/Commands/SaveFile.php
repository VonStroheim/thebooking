<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * SaveFile
 *
 * @package TheBooking\Classes
 */
class SaveFile implements Command
{
    /**
     * @var array
     */
    private $file;

    public function __construct($file)
    {
        $this->file = $file;
    }

    /**
     * @return array
     */
    public function getData()
    {
        return $this->file;
    }
}