<?php

namespace VSHM_Framework;

defined('ABSPATH') || exit;

if (!class_exists(REST_Controller::class)) {

    /**
     * Class REST_Controller
     *
     * @author  VonStroheim
     * @package VSHM_Framework
     */
    class REST_Controller
    {
        const API_VERSION = '1';
        const NAME_SPACE  = 'thebooking/v';

        /**
         * @return array
         */
        public static function route_args_default()
        {
            return [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [],
                'permission_callback' => '__return_true',
                'args'                => []
            ];
        }

        /**
         * @param array $routes
         *
         * @noinspection AdditionOperationOnArraysInspection
         */
        public static function register_routes(array $routes)
        {
            add_action('rest_api_init', static function () use ($routes) {
                foreach ($routes as $route => $args) {
                    if (Tools::array_is_assoc($args)) {
                        $args += self::route_args_default();
                    } else {
                        foreach ($args as $key => $args_group) {
                            $args[ $key ] += self::route_args_default();
                        }
                    }

                    register_rest_route(self::NAME_SPACE . self::API_VERSION, $route, $args);
                }
            });
        }

        /**
         * @return string
         */
        public static function get_root_rest_url()
        {
            return get_rest_url(get_current_blog_id(), self::NAME_SPACE . self::API_VERSION);
        }
    }
}