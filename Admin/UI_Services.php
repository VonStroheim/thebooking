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
                'panelLabel' => __('General', 'thebooking'),
                'icon'       => 'pi pi-cog',
                'blocks'     => [
                    [
                        'title'      => __('Name', 'thebooking'),
                        'components' => [
                            [
                                'settingId' => 'name',
                                'type'      => 'text',
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Short description', 'thebooking'),
                        'description' => __('Brief description of the service, text only. It will be shown in places that require short text.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'shortDescription',
                                'type'      => 'text',
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Description', 'thebooking'),
                        'description' => __('A full description of the service. You can use HTML.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'description',
                                'type'      => 'html',
                            ]
                        ]
                    ],
                    [
                        'title'      => __('Color', 'thebooking'),
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
                'panelLabel' => __('Duration', 'thebooking'),
                'icon'       => 'pi pi-clock',
                'blocks'     => [
                    [
                        'title'       => __('Time slot duration', 'thebooking'),
                        'description' => __('Configure the duration of the appointment.', 'thebooking'),
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
                'panelLabel' => __('Data collection', 'thebooking'),
                'icon'       => 'pi pi-inbox',
                'blocks'     => [
                    [
                        'title'       => __('Booking data', 'thebooking'),
                        'description' => __('Configure the data users need to provide during the booking process of this service.', 'thebooking'),
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
                'panelLabel' => __('User and permissions', 'thebooking'),
                'icon'       => 'pi pi-lock-open',
                'blocks'     => [
                    [
                        'title'       => __('Registered users only', 'thebooking'),
                        'description' => __('If turned on, only registered users can book this service.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'registeredOnly',
                                'type'      => 'toggle',
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Log unregistered users IP', 'thebooking'),
                        'description' => __('Please consider any privacy implication before turning this feature on', 'thebooking'),
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
                'panelLabel' => __('Locations', 'thebooking'),
                'icon'       => 'pi pi-map-marker',
                'blocks'     => [
                    [
                        'title'       => __('Service locations', 'thebooking'),
                        'description' => __('If this service is offered in specific locations, select one or more of them.', 'thebooking'),
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
