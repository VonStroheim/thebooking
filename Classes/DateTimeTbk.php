<?php

namespace TheBooking\Classes;

defined('ABSPATH') || exit;

/**
 * Class DateTimeTbk
 *
 * @package TheBooking\Classes
 * @author  VonStroheim
 * @since   3.0.0
 */
class DateTimeTbk extends \DateTimeImmutable
{
    /**
     * DateTimeTbk constructor.
     *
     * It runs the parent constructor plus the ability to "recover" in case of timestamps
     * passed without prepending "@"
     *
     * @param string|int         $time
     * @param \DateTimeZone|NULL $timezone
     */
    public function __construct($time = 'now', \DateTimeZone $timezone = NULL)
    {
        try {
            parent::__construct($time, $timezone);
        } catch (\Exception $e) {
            if (is_int($time)) {
                try {
                    parent::__construct('@' . $time, $timezone);
                } catch (\Exception $e) {
                    if (defined('WP_DEBUG') && WP_DEBUG) {
                        trigger_error(sanitize_text_field("Something were wrong with DateTimeTbk construction: {$e->getMessage()}"));
                    }
                }
            }
        }
    }

    /**
     * It fixes the 2038 bug and it's apparently faster.
     *
     * @return int|string
     */
    public function getTimestamp()
    {
        return $this->format('U');
    }

    /**
     * @return string
     */
    public function localized_date()
    {
        return wp_date(get_option('date_format'), $this->getTimestamp());
    }

    /**
     * @param bool $allDay
     *
     * @return string
     */
    public function localized_time($allDay = FALSE)
    {
        if ($allDay) {
            return esc_html__('All day', 'team-booking');
        }

        return wp_date(get_option('time_format'), $this->getTimestamp());
    }

    /**
     * @param bool   $allDay
     * @param string $separator
     *
     * @return string
     */
    public function localized_date_time($allDay = FALSE, $separator = '@')
    {
        return $this->localized_date() . ' ' . $separator . ' ' . $this->localized_time($allDay);
    }

    /**
     * @param string             $format
     * @param string             $time
     * @param \DateTimeZone|NULL $timezone
     *
     * @return bool|\DateTime|static
     */
    public static function createFromFormatSilently($format, $time, \DateTimeZone $timezone = NULL)
    {
        $ext_dt = new static();
        $dt     = self::createFromFormat($format, $time, $timezone);

        /**
         * Must fail silently?
         */
        if (!$dt) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                trigger_error(sanitize_text_field("Time '{$time}' and format '{$format}' are not valid for a DateTime object."));
            }

            return $ext_dt;
        }

        return $ext_dt->setTimestamp($dt->getTimestamp());
    }

    /**
     * @param string             $string
     * @param \DateTimeZone|NULL $timezone
     *
     * @return DateTimeTbk
     */
    public static function create($string, \DateTimeZone $timezone = NULL)
    {
        return new self($string, $timezone);
    }
}