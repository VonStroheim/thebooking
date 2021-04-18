<?php

namespace TheBooking;

defined('ABSPATH') || exit;

/**
 * Class Modules
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class Modules
{
    public static function load_modules()
    {
        Modules\NotificationsModule::bootstrap();
        Modules\Gcal2WaysModule::bootstrap();
    }
}

