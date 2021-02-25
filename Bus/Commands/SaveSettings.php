<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * SaveSettings
 *
 * @package TheBooking\Classes
 */
class SaveSettings implements Command
{
    /**
     * @var array
     */
    private $settings;

    /**
     * @var array
     */
    private $meta;

    public function __construct($settings, $meta)
    {
        $this->settings = $settings;
        $this->meta     = $meta;
    }

    /**
     * @return array
     */
    public function getSettings()
    {
        return $this->settings;
    }

    /**
     * @return array
     */
    public function getMeta()
    {
        return $this->meta;
    }
}