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
     * @return array[]
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
                'panelLabel' => __('Duration and availability', 'thebooking'),
                'icon'       => 'pi pi-clock',
                'blocks'     => [
                    [
                        'title'       => __('Consider availability intervals as whole timeslots', 'thebooking'),
                        'description' => __('Choose whether a continuous availability interval is considered as a whole timeslot or subdivided into fixed duration timeslots.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::takeWholeAvailabilityIntervals',
                                'type'      => 'toggle',
                            ],
                            [
                                'type'         => 'notice',
                                'text'         => __('If Monday availability is from 8:00AM to 14:00PM and from 15:00PM to 18:00PM there will be 2 timeslots for this service (8:00AM - 14:00PM and 15:00PM - 18:00PM)', 'thebooking'),
                                'dependencies' => [
                                    [
                                        'on'    => 'meta::takeWholeAvailabilityIntervals',
                                        'being' => '=',
                                        'to'    => TRUE
                                    ]
                                ]
                            ],
                            [
                                'type'         => 'notice',
                                'text'         => __('If Monday availability is from 8:00AM to 14:00PM and from 15:00PM to 18:00PM those intervals will be subdivided into several timeslots of fixed duration.', 'thebooking'),
                                'dependencies' => [
                                    [
                                        'on'    => 'meta::takeWholeAvailabilityIntervals',
                                        'being' => 'FALSY'
                                    ]
                                ]
                            ]
                        ]
                    ],
                    [
                        'title'        => __('Time slot duration', 'thebooking'),
                        'description'  => __('Configure the duration of the appointment.', 'thebooking'),
                        'components'   => [
                            [
                                'settingId' => 'duration',
                                'type'      => 'durationSelect',
                                'showDays'  => FALSE
                            ]
                        ],
                        'dependencies' => [
                            [
                                'on'    => 'meta::takeWholeAvailabilityIntervals',
                                'being' => 'FALSY'
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Time slot capacity', 'thebooking'),
                        'description' => __('How many reservations a time slot can accept.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId'   => 'meta::timeslotCapacity',
                                'type'        => 'number',
                                'min'         => 1,
                                'step'        => 1,
                                'showButtons' => TRUE
                            ]
                        ],
                    ],

                    [
                        'title'       => __('Close reservations before', 'thebooking'),
                        'description' => __('Specify if the reservations should be closed within a certain period before the time slot date and time.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::closeReservations',
                                'type'      => 'toggle'
                            ],
                            [
                                'settingId'    => 'meta::closeReservationsPeriod',
                                'type'         => 'durationSelect',
                                'dependencies' => [
                                    [
                                        'on'    => 'meta::closeReservations',
                                        'being' => '=',
                                        'to'    => TRUE
                                    ]
                                ]
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Open reservations before', 'thebooking'),
                        'description' => __('Specify if the reservations should open only within a certain period before the time slot date and time.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::openReservations',
                                'type'      => 'toggle'
                            ],
                            [
                                'settingId'    => 'meta::openReservationsPeriod',
                                'type'         => 'durationSelect',
                                'dependencies' => [
                                    [
                                        'on'    => 'meta::openReservations',
                                        'being' => '=',
                                        'to'    => TRUE
                                    ]
                                ]
                            ]
                        ]
                    ],
                    [
                        'title'       => __('Override availability schedule', 'thebooking'),
                        'description' => __('Turn on to provide specific availability for this service. If turned off, the service will observe the availability provided in the Availability section of the main menu.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::overrideAvailability',
                                'type'      => 'toggle'
                            ]
                        ]
                    ],
                    [
                        'title'        => __('Specific service availability schedule', 'thebooking'),
                        'components'   => [
                            [
                                'settingId'   => 'availability::workingHours',
                                'type'        => 'hoursPlanner',
                                'toFetchFrom' => 'service_%%ID%%'
                            ],
                        ],
                        'dependencies' => [
                            [
                                'on'    => 'meta::overrideAvailability',
                                'being' => '=',
                                'to'    => TRUE
                            ]
                        ]
                    ],
                    [
                        'title'        => __('Specific service days off', 'thebooking'),
                        'components'   => [
                            [
                                'settingId'   => 'availability::workingHours',
                                'type'        => 'closingDatesPlanner',
                                'toFetchFrom' => 'service_%%ID%%'
                            ]
                        ],
                        'dependencies' => [
                            [
                                'on'    => 'meta::overrideAvailability',
                                'being' => '=',
                                'to'    => TRUE
                            ]
                        ]
                    ]
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
                'panelRef'   => 'interactions',
                'panelLabel' => __('Interactions', 'thebooking'),
                'icon'       => 'pi pi-share-alt',
                'blocks'     => [
                    [
                        'title'       => __('Overlapping time slots', 'thebooking'),
                        'description' => __('Configure how a reserved time slot of this service should interact with a free time slot of other services when they overlap.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::blocksOther',
                                'type'      => 'radios',
                                'options'   => [
                                    [
                                        'label' => __('Block any', 'thebooking'),
                                        'value' => 'all'
                                    ],
                                    [
                                        'label' => __('Block none', 'thebooking'),
                                        'value' => 'none'
                                    ],
                                    [
                                        'label' => __('Block some', 'thebooking'),
                                        'value' => 'some'
                                    ]
                                ]
                            ],
                            [
                                'settingId'    => 'meta::blocksOtherList',
                                'type'         => 'multiselect',
                                'options'      => self::_services(),
                                'dependencies' => [
                                    [
                                        'on'    => 'meta::blocksOther',
                                        'being' => '=',
                                        'to'    => 'some'
                                    ]
                                ]
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
                        'title'       => __('Reservations must be approved', 'thebooking'),
                        'description' => __('If turned on, any new reservation will be in a pending status upon approval.', 'thebooking'),
                        'components'  => [
                            [
                                'settingId' => 'meta::requiresApproval',
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
                                'type'      => 'checkboxes',
                                'options'   => self::_locations()
                            ]
                        ]
                    ],
                ]
            ],
        ];
    }

    protected static function _services()
    {
        $services = [];
        foreach (tbkg()->services->all() as $uid => $service) {
            $services[] = [
                'label' => $service->name(),
                'value' => $uid
            ];
        }

        return $services;
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
