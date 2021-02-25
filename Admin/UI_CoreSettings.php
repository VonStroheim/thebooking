<?php

namespace TheBooking\Admin;

use TheBooking\Admin;

defined('ABSPATH') || exit;

/**
 * Class UI_CoreSettings
 *
 * @package TheBooking\Admin
 */
final class UI_CoreSettings
{
    public static function _settings_panels()
    {
        return apply_filters('tbk_backend_core_settings_panels', [
            Admin\UI_CoreSettings\Panel_Roles::get_panel(),
            Admin\UI_CoreSettings\Panel_Frontend::get_panel(),
            Admin\UI_CoreSettings\Panel_Maps::get_panel(),
            Admin\UI_CoreSettings\Panel_Redirects::get_panel(),
            Admin\UI_CoreSettings\Panel_Database::get_panel(),

            /**
             * TODO
             */

            #Admin\UI_CoreSettings\Panel_Cart::get_panel(),
        ]);
    }
}