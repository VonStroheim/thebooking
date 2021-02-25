<?php

namespace TheBooking\Classes;
defined('ABSPATH') || exit;

/**
 * Class Shortcode (boilerplate)
 *
 * @package TheBooking\Classes
 * @author  VonStroheim
 */
abstract class Shortcode
{
    /**
     * The shortcode name [this-one]
     */
    const SHORTCODE = '';

    /**
     * @param $atts
     *
     * @return string
     */
    public static function render($atts)
    {
        return '';
    }

    /**
     * @return array
     */
    protected static function defaults()
    {
        return [];
    }

}
