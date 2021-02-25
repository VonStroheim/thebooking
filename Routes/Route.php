<?php

namespace TheBooking\Routes;

defined('ABSPATH') || exit;

/**
 * Interface Route
 *
 * @package TheBooking\Routes
 */
interface Route
{
    /**
     * @return void
     */
    public static function register();

    /**
     * @return string
     */
    public static function getPath();
}