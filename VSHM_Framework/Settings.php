<?php

namespace VSHM_Framework;

defined('ABSPATH') || exit;

if (!class_exists(Settings::class)) {
    /**
     * Class Settings
     *
     * @package VSHM_Framework
     * @author  VonStroheim
     */
    abstract class Settings
    {
        /**
         * @var string
         */
        protected static $tag = '';

        /**
         * @var bool
         */
        protected $dirty = FALSE;

        /**
         * @var array
         */
        protected $options = [];

        protected function __construct()
        {
            $this->options = get_option(static::$tag, static::_defaults()) + static::_defaults();

            add_action('shutdown', [$this, 'save'], 20);
        }

        /**
         * @return bool TRUE if options were saved.
         */
        public function save()
        {
            if ($this->dirty) {
                update_option(static::$tag, $this->options);

                return TRUE;
            }

            return FALSE;
        }

        /**
         * @param mixed    $option
         * @param int|null $int
         *
         * @return int
         */
        protected function _option_int(&$option, $int = NULL)
        {
            if (NULL !== $int) {
                $option      = (int)$int;
                $this->dirty = TRUE;
            }

            return $option;
        }

        /**
         * @param mixed     $option
         * @param bool|null $bool
         *
         * @return bool
         */
        protected function _option_bool(&$option, $bool = NULL)
        {
            if (NULL !== $bool) {
                $option      = (bool)$bool;
                $this->dirty = TRUE;
            }

            return $option;
        }

        /**
         * @param mixed       $option
         * @param string|null $string
         *
         * @return string
         */
        protected function _option_string(&$option, $string = NULL)
        {
            if (NULL !== $string) {
                $option      = $string;
                $this->dirty = TRUE;
            }

            return $option;
        }

        /**
         * Creates an option from defaults, if not set.
         *
         * @param string $option_key
         * @param mixed  $default_override
         */
        protected function _create_if_not_exists($option_key, $default_override = NULL)
        {
            if (!isset($this->options[ $option_key ])) {
                if (NULL === $default_override && isset(static::_defaults()[ $option_key ])) {
                    $this->options[ $option_key ] = static::_defaults()[ $option_key ];
                } else {
                    $this->options[ $option_key ] = $default_override;
                }
                $this->dirty = TRUE;
            }
        }

        public static function tag(){
            return static::$tag;
        }

        /**
         * Cloning is forbidden.
         */
        public function __clone()
        {
            _doing_it_wrong(__FUNCTION__, 'Cloning is forbidden.', '3.0');
        }

        /**
         * Unserializing instances of this class is forbidden.
         */
        public function __wakeup()
        {
            _doing_it_wrong(__FUNCTION__, __('Unserializing instances of this class is forbidden.', 'team-booking'), '3.0');
        }

        /**
         * Returns an array of default settings.
         *
         * @return array
         */
        protected static function _defaults()
        {
            _doing_it_wrong(__FUNCTION__, 'Method must be overridden.', '3.0');

            return [];
        }

        /**
         * @return Settings|static
         */
        public static function instance()
        {
            return new static();
        }
    }
}