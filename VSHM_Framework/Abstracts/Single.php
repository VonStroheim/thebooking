<?php

namespace VSHM_Framework\Abstracts;

defined('ABSPATH') || exit;

/**
 * Class Single
 *
 * @package VSHM_Framework\Abstracts
 */
abstract class Single
{
    /**
     * The single instance of the class.
     *
     * @var static
     */
    private static $instance;

    /**
     * Main Instance.
     *
     * Ensures only one instance is loaded or can be loaded.
     *
     * @return static - Main instance.
     */
    public static function instance()
    {
        if (NULL === self::$instance) {
            self::$instance = new static();
        }
        return self::$instance;
    }
}