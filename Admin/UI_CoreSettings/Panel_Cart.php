<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Cart
{
    public static function get_panel()
    {
        $minutes            = [5, 10, 15, 30, 45];
        $hours              = [1, 2, 3, 4, 5, 6, 12];
        $days               = [1];
        $expiration_options = [
            [
                'value' => 0,
                'label' => __('No expiration', 'thebooking')
            ]
        ];

        foreach ($minutes as $minute) {
            $expiration_options[] = [
                'value' => $minute * MINUTE_IN_SECONDS,
                'label' => sprintf(_n('%d minute', '%d minutes', $minute, 'thebooking'), $minute)
            ];
        }
        foreach ($hours as $hour) {
            $expiration_options[] = [
                'value' => $hour * HOUR_IN_SECONDS,
                'label' => sprintf(_n('%d hour', '%d hours', $hour, 'team-booking'), $hour)
            ];
        }
        foreach ($days as $day) {
            $expiration_options[] = [
                'value' => $day * DAY_IN_SECONDS,
                'label' => sprintf(_n('%d day', '%d days', $day, 'team-booking'), $day)
            ];
        }

        return [
            'panelRef'   => 'section-cart',
            'panelLabel' => __('Cart settings', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Activate cart', 'thebooking'),
                    'description' => __('Customers will be able to add multiple reservations in the cart and book them in a single order.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'cart_is_active',
                            'type'      => 'toggle',
                        ]
                    ]
                ],
                [
                    'title'       => __('Show cart icon in website menu', 'thebooking'),
                    'description' => __('The plugin will add an item in your main website menu to display the cart.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'show_cart_in_menu',
                            'type'      => 'toggle',
                        ]
                    ]
                ],
                [
                    'title'       => __('Show cart icon inside the plugin widget', 'thebooking'),
                    'description' => __('A cart icon will be shown at the top of the booking widget if the cart is not empty.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'show_cart_in_widget',
                            'type'      => 'toggle',
                        ]
                    ]
                ],
                [
                    'title'       => __('Cart expiration time', 'thebooking'),
                    'description' => sprintf(
                        __('How long a reservation is allowed to remain in cart before being automatically removed. If set to "%s", reservations will remain in cart as long as the session cookie is valid.', 'thebooking'),
                        __('No expiration', 'thebooking')
                    ),
                    'components'  => [
                        [
                            'settingId' => 'cart_expiration_time',
                            'type'      => 'select',
                            'options'   => $expiration_options
                        ]
                    ]
                ],
            ]
        ];
    }
}