<?php

namespace TheBooking\Admin;

use TheBooking\Admin;

defined('ABSPATH') || exit;

/**
 * Class UI_Availability
 *
 * @package TheBooking\Admin
 */
final class UI_Availability
{
    protected function __construct()
    {
    }

    public static function _settings_panels()
    {
        return [
            Admin\UI_Availability\Panel_WeeklyWorkingHours::get_panel(),
            Admin\UI_Availability\Panel_ClosingDates::get_panel(),
            Admin\UI_Availability\Panel_Locations::get_panel(),
        ];
    }
}