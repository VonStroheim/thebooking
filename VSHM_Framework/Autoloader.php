<?php

namespace VSHM_Framework;

defined('ABSPATH') || exit;

if (!class_exists(Autoloader::class)) {

    /**
     * Class Autoloader
     *
     * @package       VSHM_Framework
     * @author        VonStronheim (based on work by David Pennington)
     * @license       MIT License (http://www.opensource.org/licenses/mit-license.php)
     */
    class Autoloader
    {
        public static $namespaces;
        public static $classes;
        public static $fileExt = '.php';

        /**
         * Add a namespace path to the autoloader
         *
         * @param string $namespace The namespace the path is for
         * @param array  $args      The file path is the first element
         */
        public static function __callStatic($namespace, $args)
        {
            static::$namespaces[ $namespace ] = rtrim($args[0], '/');
        }

        /**
         * Map a class to a direct file location
         *
         * @param string $class The class the path is for
         * @param string $path  The file path of the class
         */
        public static function map($class, $path)
        {
            static::$classes[ $class ] = $path;
        }

        public static function run()
        {
            spl_autoload_register([Autoloader::class, 'autoload']);
        }

        /**
         * @param string
         *
         * @return mixed
         */
        public static function autoload($class)
        {
            if (isset(static::$classes[ $class ])) {
                require static::$classes[ $class ];

                return TRUE;
            }
            $directory = explode(DIRECTORY_SEPARATOR, str_replace('\\', DIRECTORY_SEPARATOR, ltrim($class, '\\')));
            $class     = array_pop($directory);
            if (!$directory && isset(static::$namespaces[ $class ])) {
                $directory = static::$namespaces[ $class ];
            } elseif ($directory) {
                $namespace = array_shift($directory);
                if (isset(static::$namespaces[ $namespace ])) {
                    $namespace = static::$namespaces[ $namespace ];
                } else {
                    // not a registered namespace, skipping
                    return TRUE;
                }
                $directory = rtrim($namespace . DIRECTORY_SEPARATOR . implode(DIRECTORY_SEPARATOR, $directory), DIRECTORY_SEPARATOR);

            } else {
                // not a registered namespace nor class, skipping
                return TRUE;
            }
            if (is_file($path = $directory . DIRECTORY_SEPARATOR . $class . static::$fileExt)) {
                return require $path;
            }

            if (is_file($path = $directory . DIRECTORY_SEPARATOR . strtolower($class) . static::$fileExt)) {
                return require $path;
            }

            return FALSE;
        }

        /**
         * @param string ...$parts
         *
         * @return string
         */
        public static function build_path(...$parts)
        {
            return implode(DIRECTORY_SEPARATOR, $parts);
        }
    }
}