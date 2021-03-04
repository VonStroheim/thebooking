<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Redirects
{
    public static function get_panel()
    {
        $wp_login_url        = wp_login_url();
        $wp_registration_url = wp_registration_url();

        $args               = [
            'sort_order'   => 'asc',
            'sort_column'  => 'post_title',
            'hierarchical' => 1,
            'exclude'      => '',
            'include'      => '',
            'meta_key'     => '',
            'meta_value'   => '',
            'authors'      => '',
            'exclude_tree' => '',
            'number'       => '',
            'offset'       => 0,
            'post_type'    => 'page',
            'post_status'  => 'publish'
        ];
        $pages              = get_pages($args);
        $order_page_options = [
            [
                'value' => 0,
                'label' => __('No page selected', 'thebooking')
            ]
        ];
        foreach ($pages as $page) {
            $order_page_options[] = [
                'value' => $page->ID,
                'label' => $page->post_title
            ];
        }

        return [
            'panelRef'   => 'section-redirects',
            'panelLabel' => __('URLs and redirects', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Login URL', 'thebooking'),
                    'description' => __('Registered users only services will invite users to login from this page. Leave blank to use WordPress default.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId'   => 'login_url',
                            'type'        => 'text',
                            'placeholder' => $wp_login_url
                        ]
                    ]
                ],
                [
                    'title'       => __('Registration URL', 'thebooking'),
                    'description' => __('Registered users only services will invite users to register from this page. Leave blank to use WordPress default.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId'   => 'registration_url',
                            'type'        => 'text',
                            'placeholder' => $wp_registration_url
                        ]
                    ]
                ],
                [
                    'title'      => __('Reservation status page', 'thebooking'),
                    'components' => [
                        [
                            'settingId' => 'order_status_page',
                            'type'      => 'select',
                            'options'   => $order_page_options
                        ],
                        [
                            'type' => 'notice',
                            'text' => sprintf(__('The selected page must have the %s shortcode somewhere.', 'thebooking'), '[tbk-order-status]'),
                        ]
                    ]
                ],
            ]
        ];
    }
}