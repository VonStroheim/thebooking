<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\SaveSettings;
use TheBooking\Bus\Handler;
use TheBooking\TheBooking;
use function TheBooking\_tbk_settings;

defined('ABSPATH') || exit;

/**
 * SaveSettingsHandler
 *
 * @package TheBooking\Classes
 */
class SaveSettingsHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command SaveSettings */

        do_action('tbk-backend-settings-save', $command->getSettings(), $command->getMeta());

        if ($command->getMeta()['type'] === 'core') {
            foreach ($command->getSettings() as $settingId => $value) {
                switch ($settingId) {
                    case 'frontend_days_in_week':
                        if (filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                            tbkg()->settings->frontend_days_in_week(5);
                        } else {
                            tbkg()->settings->frontend_days_in_week(7);
                        }
                        break;
                    case 'load_calendar_at_closest_slot':
                        tbkg()->settings->load_calendar_at_closest_slot(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'admin_roles':
                        foreach ($value as $role => $allowed) {
                            if ($role === 'administrator') {
                                /**
                                 * $role === 'administrator' shouldn't be possible.
                                 * Safety check here to avoid exploits.
                                 */
                                continue;
                            }
                            if (filter_var($allowed, FILTER_VALIDATE_BOOLEAN)) {
                                wp_roles()->add_cap($role, TheBooking::admin_cap());
                            } else {
                                wp_roles()->remove_cap($role, TheBooking::admin_cap());
                            }
                        }
                        break;
                    case 'load_gmaps_library':
                        tbkg()->settings->load_gmaps_library(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'gmaps_api_key':
                        tbkg()->settings->gmaps_api_key(trim($value));
                        break;
                    case 'frontend_primary_color':
                        tbkg()->settings->frontend_primary_color(trim($value));
                        break;
                    case 'frontend_secondary_color':
                        tbkg()->settings->frontend_secondary_color(trim($value));
                        break;
                    case 'frontend_background_color':
                        tbkg()->settings->frontend_background_color(trim($value));
                        break;
                    case 'frontend_available_color':
                        tbkg()->settings->frontend_available_color(trim($value));
                        break;
                    case 'frontend_booked_color':
                        tbkg()->settings->frontend_booked_color(trim($value));
                        break;
                    case 'login_url':
                        tbkg()->settings->login_url(trim($value));
                        break;
                    case 'registration_url':
                        tbkg()->settings->registration_url(trim($value));
                        break;
                    case 'order_status_page':
                        tbkg()->settings->order_status_page($value);
                        break;
                    case 'retain_plugin_data':
                        tbkg()->settings->retain_plugin_data(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'reservation_records_lifecycle':
                        tbkg()->settings->reservation_records_lifecycle($value);
                        break;
                    case 'cart_is_active':
                        tbkg()->settings->cart_is_active(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'show_cart_in_menu':
                        tbkg()->settings->show_cart_in_menu(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'show_cart_in_widget':
                        tbkg()->settings->show_cart_in_widget(filter_var($value, FILTER_VALIDATE_BOOLEAN));
                        break;
                    case 'cart_expiration_time':
                        tbkg()->settings->cart_expiration_time($value);
                        break;
                    default:
                        /**
                         * Hook for custom settings logic.
                         */
                        do_action('tbk-backend-settings-save-single', $settingId, $value);
                        break;
                }
            }

            add_filter('tbk-backend-settings-save-response', static function ($response) {
                $response['settings'] = _tbk_settings();

                return $response;
            });
        }

    }
}