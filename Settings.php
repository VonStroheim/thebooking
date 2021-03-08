<?php

namespace TheBooking;

defined('ABSPATH') || exit;

final class Settings extends \VSHM_Framework\Settings
{
    /**
     * @var string
     */
    protected static $tag = 'tbk_settings';

    /**
     * Dots logic (monthly view)
     */
    const DOTS_LOGIC__HIDDEN                   = 0;
    const DOTS_LOGIC__SLOTS                    = 1;
    const DOTS_LOGIC__TICKETS                  = 2;
    const DOTS_LOGIC__SERVICE_NAME             = 3;
    const DOTS_LOGIC__SERVICE_NAME_AND_SLOTS   = 4;
    const DOTS_LOGIC__SERVICE_NAME_AND_TICKETS = 5;

    /**
     * @param null|bool $bool
     *
     * @return bool
     */
    public function load_calendar_at_closest_slot($bool = NULL)
    {
        return $this->_option_bool($this->options['load_calendar_at_closest_slot'], $bool);
    }

    /**
     * @param null|int $days
     *
     * @return int
     */
    public function frontend_days_in_week($days = NULL)
    {
        return $this->_option_int($this->options['frontend_days_in_week'], $days);
    }

    /**
     * @param string $hex
     *
     * @return string
     */
    public function frontend_primary_color($hex = NULL)
    {
        return $this->_option_string($this->options['frontend_primary_color'], $hex);
    }

    /**
     * @param string $hex
     *
     * @return string
     */
    public function frontend_secondary_color($hex = NULL)
    {
        return $this->_option_string($this->options['frontend_secondary_color'], $hex);
    }

    /**
     * @param string $hex
     *
     * @return string
     */
    public function frontend_background_color($hex = NULL)
    {
        return $this->_option_string($this->options['frontend_background_color'], $hex);
    }

    /**
     * @param string $hex
     *
     * @return string
     */
    public function frontend_available_color($hex = NULL)
    {
        return $this->_option_string($this->options['frontend_available_color'], $hex);
    }

    /**
     * @param string $hex
     *
     * @return string
     */
    public function frontend_booked_color($hex = NULL)
    {
        return $this->_option_string($this->options['frontend_booked_color'], $hex);
    }

    /**
     * @param null|bool $bool
     *
     * @return bool
     */
    public function load_gmaps_library($bool = NULL)
    {
        return $this->_option_bool($this->options['load_gmaps_library'], $bool);
    }

    /**
     * @param null|string $key
     *
     * @return string
     */
    public function gmaps_api_key($key = NULL)
    {
        return $this->_option_string($this->options['gmaps_api_key'], $key);
    }

    /**
     * @param null|string $url
     *
     * @return string
     */
    public function login_url($url = NULL)
    {
        $url = $this->_option_string($this->options['login_url'], $url);
        if (!$url) {
            return wp_login_url();
        }

        return $url;
    }

    /**
     * @param null|string $url
     *
     * @return string
     */
    public function registration_url($url = NULL)
    {
        $url = $this->_option_string($this->options['registration_url'], $url);
        if (!$url) {
            return wp_registration_url();
        }

        return $url;
    }

    /**
     * @param null|int $page_id
     *
     * @return int
     */
    public function order_status_page($page_id = NULL)
    {
        return $this->_option_int($this->options['order_status_page'], $page_id);
    }

    /**
     * @param null|bool $bool
     *
     * @return bool
     */
    public function retain_plugin_data($bool = NULL)
    {
        return $this->_option_bool($this->options['retain_plugin_data'], $bool);
    }

    /**
     * @param null|int $page_id
     *
     * @return int
     */
    public function reservation_records_lifecycle($page_id = NULL)
    {
        return $this->_option_int($this->options['reservation_records_lifecycle'], $page_id);
    }

    /**
     * @param null|bool $bool
     *
     * @return bool
     */
    public function cart_is_active($bool = NULL)
    {
        return $this->_option_bool($this->options['cart_is_active'], $bool);
    }

    /**
     * @param null|bool $bool
     *
     * @return bool
     */
    public function show_cart_in_menu($bool = NULL)
    {
        return $this->_option_bool($this->options['show_cart_in_menu'], $bool);
    }

    /**
     * @param null|bool $bool
     *
     * @return bool
     */
    public function show_cart_in_widget($bool = NULL)
    {
        return $this->_option_bool($this->options['show_cart_in_widget'], $bool);
    }

    /**
     * @param null|int $seconds
     *
     * @return int
     */
    public function cart_expiration_time($seconds = NULL)
    {
        return $this->_option_int($this->options['cart_expiration_time'], $seconds);
    }

    public static function _defaults()
    {
        return [
            'load_calendar_at_closest_slot' => FALSE,
            'frontend_days_in_week'         => 7,
            'load_gmaps_library'            => TRUE,
            'frontend_primary_color'        => '#0693E3',
            'frontend_secondary_color'      => '#FCB900',
            'frontend_background_color'     => '#FAFAFA',
            'frontend_available_color'      => '#4CAF50',
            'frontend_booked_color'         => '#E85952',
            'gmaps_api_key'                 => NULL,
            'login_url'                     => '',
            'registration_url'              => '',
            'order_status_page'             => 0,
            'retain_plugin_data'            => FALSE,
            'reservation_records_lifecycle' => 0,
            'cart_is_active'                => FALSE,
            'show_cart_in_menu'             => TRUE,
            'show_cart_in_widget'           => TRUE,
            'cart_expiration_time'          => MINUTE_IN_SECONDS * 15
        ];
    }
}