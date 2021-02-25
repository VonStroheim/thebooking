<?php

namespace VSHM_Framework;

defined('ABSPATH') || exit;

/**
 * Class Strings
 *
 * Tools for string manipulations
 *
 * @package VSHM_Framework
 * @author  VonStroheim
 */
class Strings
{
    const ENCODING        = 'UTF-8';
    const FILTER_DEFAULTS = 0;
    const FILTER_TAGS     = 0x01;
    const FILTER_ALL_TAGS = 0x02;
    const FILTER_ID       = 0x04;
    const FILTER_TOUPPER  = 0x08;
    const FILTER_TOLOWER  = 0x10;

    /**
     * @param string $text
     * @param int    $flags
     *
     * @return string
     */
    public static function filter_input($text, $flags = 0)
    {
        if (($flags & self::FILTER_TAGS) && !($flags & self::FILTER_ALL_TAGS)) {
            $default_attr = [
                'id'    => [],
                'class' => [],
                'title' => [],
                'style' => [],
            ];
            $allowedtags  = [
                'a'      => array_merge([
                    'href' => TRUE,
                ], $default_attr),
                'img'    => array_merge([
                    'src'    => TRUE,
                    'width'  => TRUE,
                    'height' => TRUE,
                ], $default_attr),
                'style'  => [],
                'b'      => [$default_attr],
                'p'      => [$default_attr],
                'code'   => [$default_attr],
                'em'     => [$default_attr],
                'i'      => [$default_attr],
                'strong' => [],
                'ul'     => [$default_attr],
                'ol'     => [$default_attr],
                'li'     => [$default_attr],
                'div'    => [$default_attr],
                'span'   => [$default_attr],
                'table'  => [$default_attr],
                'td'     => [$default_attr],
                'th'     => [$default_attr],
                'tr'     => [$default_attr],
                'pre'    => [$default_attr],
            ];
            $text         = wp_kses($text, $allowedtags);
        }
        if ($flags & self::FILTER_ALL_TAGS) {
            $text = filter_var($text, FILTER_SANITIZE_STRING);
        }
        if ($flags & self::FILTER_ID) {
            $text = str_replace(' ', '-', $text); // Replaces all spaces with hyphens.
            $text = (string)preg_replace('/[^A-Za-z0-9\-\_]/', '', $text); // Removes special chars except underscores
            $text = (string)preg_replace('/-+/', '-', $text); // Replaces multiple hyphens with single one.
            $text = strtolower($text); // Lowercase all
        }
        if ($flags & self::FILTER_TOLOWER) {
            $text = self::vshm_mb_strtolower($text);
        }
        if ($flags & self::FILTER_TOUPPER) {
            $text = self::vshm_mb_strtoupper($text);
        }

        return htmlentities($text, ENT_QUOTES, self::ENCODING, FALSE);
    }

    /**
     * @param string $text
     *
     * @return string
     */
    public static function unfilter_input($text)
    {
        return html_entity_decode($text, ENT_QUOTES, self::ENCODING);
    }

    /**
     * @param $string
     *
     * @return mixed
     */
    public static function vshm_mb_strtolower($string)
    {
        if (function_exists('mb_strtolower')) {
            return mb_strtolower($string, self::ENCODING);
        }

        return strtolower($string);
    }

    /**
     * @param $string
     *
     * @return mixed
     */
    public static function vshm_mb_strtoupper($string)
    {
        if (function_exists('mb_strtoupper')) {
            return mb_strtoupper($string, self::ENCODING);
        }

        return strtoupper($string);
    }

    /**
     * @param string $string
     * @param string $search
     * @param int    $offset
     *
     * @return bool|false|int
     */
    public static function vshm_mb_stripos($string, $search, $offset = 0)
    {
        if (function_exists('mb_stripos')) {
            return mb_stripos($string, $search, $offset, self::ENCODING);
        }

        return stripos($string, $search, $offset);
    }

    /**
     * @param string $string
     * @param string $search
     * @param int    $offset
     *
     * @return bool|false|int
     */
    public static function vshm_mb_strpos($string, $search, $offset = 0)
    {
        if (function_exists('mb_strpos')) {
            return mb_strpos($string, $search, $offset, self::ENCODING);
        }

        return strpos($string, $search, $offset);
    }

    /**
     * @param string $string
     * @param string $search
     * @param int    $offset
     *
     * @return bool|false|int
     */
    public static function vshm_mb_strrpos($string, $search, $offset = 0)
    {
        if (function_exists('mb_strrpos')) {
            return mb_strrpos($string, $search, $offset, self::ENCODING);
        }

        return strrpos($string, $search, $offset);
    }

    /**
     * @param $string
     *
     * @return int
     */
    public static function vshm_mb_strlen($string)
    {
        if (function_exists('mb_strlen')) {
            return mb_strlen($string, self::ENCODING);
        }

        return strlen($string);
    }

    /**
     * @param string $string
     * @param int    $start
     * @param int    $len
     *
     * @return bool|string
     */
    public static function vshm_mb_substr($string, $start, $len = NULL)
    {
        if (function_exists('mb_substr')) {
            return mb_substr($string, $start, $len, self::ENCODING);
        }

        return substr($string, $start, $len);
    }

    /**
     * Returns the part of this string between the two specified substrings
     *
     * If there are multiple occurrences, the part with the maximum length will be returned
     *
     * @param string $string the main string
     * @param string $start  the substring whose first occurrence should delimit the start
     * @param string $end    the substring whose last occurrence should delimit the end
     *
     * @return string
     */
    public static function between($string, $start, $end)
    {
        $beforeStart  = self::vshm_mb_strpos($string, $start);
        $returnString = '';
        if ($beforeStart !== FALSE) {
            $afterStart = $beforeStart + self::vshm_mb_strlen($start);
            $beforeEnd  = self::vshm_mb_strrpos($string, $end, $afterStart);
            if ($beforeEnd !== FALSE) {
                $returnString = self::vshm_mb_substr($string, $afterStart, $beforeEnd - $afterStart);
            }
        }

        return $returnString;
    }

    /**
     * @param string $text
     * @param int    $flags
     *
     * @return string
     */
    public static function filter_text_field($text, $flags = 0)
    {
        return self::filter_input(filter_var($text, FILTER_SANITIZE_STRING), $flags);
    }

    /**
     *
     * @param string $text
     *
     * @return string
     */
    public static function sanitize_text_field($text)
    {
        return filter_var(trim($text), FILTER_SANITIZE_STRING);
    }

    /**
     * @param string $string
     * @param int    $wordsreturned
     *
     * @return string
     */
    public static function shorten_string($string, $wordsreturned)
    {
        $string = preg_replace('/(?<=\S,)(?=\S)/', ' ', $string);
        $string = str_replace("\n", ' ', $string);
        $array  = explode(' ', $string);
        if (count($array) <= $wordsreturned) {
            return $string;
        }

        array_splice($array, $wordsreturned);

        return implode(' ', $array) . ' ...';
    }

    /**
     * @param $string
     *
     * @return string|string[]
     */
    public static function remove_line_breaks($string)
    {
        return str_replace(["\r", "\n"], '', $string);
    }
}
