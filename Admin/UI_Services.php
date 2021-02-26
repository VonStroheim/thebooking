<?php

namespace TheBooking\Admin;

defined('ABSPATH') || exit;

/**
 * Class UI_Services
 *
 * @package TheBooking\Admin
 */
final class UI_Services
{
    /**
     * @return mixed
     */
    public static function _settings_panels()
    {
        return [
            [
                'panelRef'   => 'general',
                'panelLabel' => __('General', 'the-booking'),
                'icon'       => 'pi pi-cog',
                'blocks'     => [
                    [
                        'title'      => __('Name', 'the-booking'),
                        'components' => [
                            [
                                'settingId' => 'name',
                                'type'      => 'text',
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Short description', 'the-booking'),
                        'description' => __('Brief description of the service, text only. It will be shown in places that require short text.', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'shortDescription',
                                'type'      => 'text',
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Description', 'the-booking'),
                        'description' => __('A full description of the service. You can use HTML.', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'description',
                                'type'      => 'html',
                            ]
                        ]
                    ],
                    [
                        'title'      => __('Color', 'the-booking'),
                        'components' => [
                            [
                                'settingId' => 'color',
                                'type'      => 'colorPicker',
                            ]
                        ]
                    ]
                ]
            ],
            [
                'panelRef'   => 'duration',
                'panelLabel' => __('Duration', 'the-booking'),
                'icon'       => 'pi pi-clock',
                'blocks'     => [
                    [
                        'title'       => __('Time slot duration', 'the-booking'),
                        'description' => __('Configure the duration of the appointment.', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'duration',
                                'type'      => 'durationSelect',
                                'showDays'  => FALSE,
                            ]
                        ]
                    ],
                ]
            ],
            [
                'panelRef'   => 'reservation-data',
                'panelLabel' => __('Data collection', 'the-booking'),
                'icon'       => 'pi pi-inbox',
                'blocks'     => [
                    [
                        'title'       => __('Booking data', 'the-booking'),
                        'description' => __('Configure the data users need to provide during the booking process of this service.', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::reservationForm',
                                'type'      => 'formBuilder',
                            ]
                        ]
                    ],
                ]
            ],
            [
                'panelRef'   => 'user',
                'panelLabel' => __('User and permissions', 'the-booking'),
                'icon'       => 'pi pi-lock-open',
                'blocks'     => [
                    [
                        'title'       => __('Registered users only', 'the-booking'),
                        'description' => __('If turned on, only registered users can book this service.', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'registeredOnly',
                                'type'      => 'toggle',
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Log unregistered users IP', 'the-booking'),
                        'description' => __('Please consider any privacy implication before turning this feature on', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::saveIp',
                                'type'      => 'toggle',
                            ]
                        ]
                    ],
                ]
            ],
            [
                'panelRef'   => 'location',
                'panelLabel' => __('Locations', 'the-booking'),
                'icon'       => 'pi pi-map-marker',
                'blocks'     => [
                    [
                        'title'       => __('Service locations', 'the-booking'),
                        'description' => __('If this service is offered in specific locations, select one or more of them.', 'the-booking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::locations',
                                'type'      => 'multiselect',
                                'options'   => self::_locations()
                            ]
                        ]
                    ],
                ]
            ],
        ];
    }

    protected static function _locations()
    {
        $locations = [];
        foreach (tbkg()->availability->locations() as $uid => $location) {
            $locations[] = [
                'label' => $location['l_name'] . ' - ' . $location['address'],
                'value' => $location['uid'],
            ];
        }

        return $locations;
    }
}
