<?php

namespace TheBooking\Modules;

use TheBooking\Bus\Commands\ChangeReservationDates;
use TheBooking\Bus\Commands\ChangeReservationStatus;
use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Bus\Commands\SendEmail;
use TheBooking\Classes\DateTimeTbk;
use TheBooking\Classes\ValueTypes\Status;
use TheBooking\Classes\ValueTypes\UserInput;

defined('ABSPATH') || exit;

/**
 * Class NotificationsModule
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class NotificationsModule
{
    const CUSTOMER_CONFIRMATION_EMAIL_META         = 'userNotificationEmail';
    const CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META = self::CUSTOMER_CONFIRMATION_EMAIL_META . 'Content';
    const CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META = self::CUSTOMER_CONFIRMATION_EMAIL_META . 'Subject';
    const ADMIN_CONFIRMATION_EMAIL_META            = 'adminNotificationEmail';
    const ADMIN_CONFIRMATION_EMAIL_CONTENT_META    = self::ADMIN_CONFIRMATION_EMAIL_META . 'Content';
    const ADMIN_CONFIRMATION_EMAIL_SUBJECT_META    = self::ADMIN_CONFIRMATION_EMAIL_META . 'Subject';
    const CUSTOMER_CANCELLATION_EMAIL_META         = 'userCancellationEmail';
    const CUSTOMER_CANCELLATION_EMAIL_CONTENT_META = self::CUSTOMER_CANCELLATION_EMAIL_META . 'Content';
    const CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META = self::CUSTOMER_CANCELLATION_EMAIL_META . 'Subject';
    const CUSTOMER_APPROVAL_EMAIL_META             = 'userApprovalEmail';
    const CUSTOMER_APPROVAL_EMAIL_CONTENT_META     = self::CUSTOMER_APPROVAL_EMAIL_META . 'Content';
    const CUSTOMER_APPROVAL_EMAIL_SUBJECT_META     = self::CUSTOMER_APPROVAL_EMAIL_META . 'Subject';
    const CUSTOMER_DECLINE_EMAIL_META              = 'userDeclineEmail';
    const CUSTOMER_DECLINE_EMAIL_CONTENT_META      = self::CUSTOMER_DECLINE_EMAIL_META . 'Content';
    const CUSTOMER_DECLINE_EMAIL_SUBJECT_META      = self::CUSTOMER_DECLINE_EMAIL_META . 'Subject';
    const CUSTOMER_RESCHEDULE_EMAIL_META           = 'userRescheduleEmail';
    const CUSTOMER_RESCHEDULE_EMAIL_CONTENT_META   = self::CUSTOMER_RESCHEDULE_EMAIL_META . 'Content';
    const CUSTOMER_RESCHEDULE_EMAIL_SUBJECT_META   = self::CUSTOMER_RESCHEDULE_EMAIL_META . 'Subject';

    public static function bootstrap()
    {
        tbkg()->loader->add_filter('tbk_backend_service_setting_panels', self::class, 'notificationsPanel');
        tbkg()->loader->add_action('tbk_save_service_settings', self::class, 'notificationsSaveServiceSettings', 10, 3);
        tbkg()->loader->add_action('tbk_dispatched_CreateReservation', self::class, 'notificationSend', 10, 2);
        tbkg()->loader->add_filter('tbk_notification_template_hooks', self::class, 'templateHooks', 10, 2);
        tbkg()->loader->add_filter('tbk_notification_template_hooks_spec', self::class, 'templateHooksSpec', 10, 2);
        tbkg()->loader->add_action('tbk_reservation_status_change_actions', self::class, 'triggerNotificationsAfterUpdate');
        tbkg()->loader->add_action('tbk_success_booking_message', self::class, 'successBookingMessage', 10, 2);
        tbkg()->loader->add_action('tbk_reservation_rescheduled_actions', self::class, 'rescheduledMessage', 10, 3);
        tbkg()->loader->add_filter('tbk_loaded_modules', self::class, 'isLoaded');
    }

    /**
     * @param array $modules
     *
     * @return array
     */
    public static function isLoaded($modules)
    {
        $modules[] = 'notifications';

        return $modules;
    }

    public static function successBookingMessage($message, CreateReservation $command)
    {
        $send = (bool)tbkg()->services->get($command->getServiceId())->getMeta(self::CUSTOMER_CONFIRMATION_EMAIL_META);
        if ($send) {
            $message = __('You will receive an email shortly.', 'thebooking');
        }

        return $message;
    }

    public static function notificationsPanel($panels)
    {
        $panels[] = [
            'panelRef'   => 'notifications',
            'panelLabel' => __('Notifications', 'thebooking'),
            'icon'       => 'pi pi-envelope',
            'blocks'     => [
                [
                    'title'       => __('User confirmation email', 'thebooking'),
                    'description' => __('User will receive this message right after the booking process.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_META,
                            'type'      => 'toggle',
                        ],
                        [
                            'settingId'    => 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META,
                            'type'         => 'text',
                            'label'        => __('Email subject', 'thebooking'),
                            'dependencies' => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ],
                        [
                            'settingId'         => 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META,
                            'type'              => 'email',
                            'templateHooks'     => apply_filters('tbk_notification_template_hooks', [], self::CUSTOMER_CONFIRMATION_EMAIL_META),
                            'templateHooksSpec' => apply_filters('tbk_notification_template_hooks_spec', [], self::CUSTOMER_CONFIRMATION_EMAIL_META),
                            'dependencies'      => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ]
                    ]
                ],
                [
                    'title'        => __('User approved reservation email', 'thebooking'),
                    'description'  => __('User will receive this message right after the approval of the reservation.', 'thebooking'),
                    'components'   => [
                        [
                            'settingId' => 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_META,
                            'type'      => 'toggle',
                        ],
                        [
                            'settingId'    => 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_SUBJECT_META,
                            'type'         => 'text',
                            'label'        => __('Email subject', 'thebooking'),
                            'dependencies' => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ],
                        [
                            'settingId'         => 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_CONTENT_META,
                            'type'              => 'email',
                            'templateHooks'     => apply_filters('tbk_notification_template_hooks', [], self::CUSTOMER_APPROVAL_EMAIL_META),
                            'templateHooksSpec' => apply_filters('tbk_notification_template_hooks_spec', [], self::CUSTOMER_APPROVAL_EMAIL_META),
                            'dependencies'      => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ]
                    ],
                    'dependencies' => [
                        [
                            'on'    => 'meta::requiresApproval',
                            'being' => TRUE
                        ]
                    ]
                ],
                [
                    'title'        => __('User declined reservation email', 'thebooking'),
                    'description'  => __('User will receive this message right after the reservation is declined.', 'thebooking'),
                    'components'   => [
                        [
                            'settingId' => 'meta::' . self::CUSTOMER_DECLINE_EMAIL_META,
                            'type'      => 'toggle',
                        ],
                        [
                            'settingId'    => 'meta::' . self::CUSTOMER_DECLINE_EMAIL_SUBJECT_META,
                            'type'         => 'text',
                            'label'        => __('Email subject', 'thebooking'),
                            'dependencies' => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_DECLINE_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ],
                        [
                            'settingId'         => 'meta::' . self::CUSTOMER_DECLINE_EMAIL_CONTENT_META,
                            'type'              => 'email',
                            'templateHooks'     => apply_filters('tbk_notification_template_hooks', [], self::CUSTOMER_DECLINE_EMAIL_META),
                            'templateHooksSpec' => apply_filters('tbk_notification_template_hooks_spec', [], self::CUSTOMER_DECLINE_EMAIL_META),
                            'dependencies'      => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_DECLINE_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ]
                    ],
                    'dependencies' => [
                        [
                            'on'    => 'meta::requiresApproval',
                            'being' => TRUE
                        ]
                    ]
                ],
                [
                    'title'       => __('Admin notification email', 'thebooking'),
                    'description' => __('Administrator will receive this message right after the booking process.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_META,
                            'type'      => 'toggle',
                        ],
                        [
                            'settingId'    => 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_SUBJECT_META,
                            'type'         => 'text',
                            'label'        => __('Email subject', 'thebooking'),
                            'dependencies' => [
                                [
                                    'on'    => 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ],
                        [
                            'settingId'         => 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_CONTENT_META,
                            'type'              => 'email',
                            'templateHooks'     => apply_filters('tbk_notification_template_hooks', [], self::ADMIN_CONFIRMATION_EMAIL_META),
                            'templateHooksSpec' => apply_filters('tbk_notification_template_hooks_spec', [], self::ADMIN_CONFIRMATION_EMAIL_META),
                            'dependencies'      => [
                                [
                                    'on'    => 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ]
                    ]
                ],
                [
                    'title'       => __('User cancellation email', 'thebooking'),
                    'description' => __('User will receive this message when a booking is cancelled.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_META,
                            'type'      => 'toggle',
                        ],
                        [
                            'settingId'    => 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META,
                            'type'         => 'text',
                            'label'        => __('Email subject', 'thebooking'),
                            'dependencies' => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ],
                        [
                            'settingId'         => 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META,
                            'type'              => 'email',
                            'templateHooks'     => apply_filters('tbk_notification_template_hooks', [], self::CUSTOMER_CANCELLATION_EMAIL_META),
                            'templateHooksSpec' => apply_filters('tbk_notification_template_hooks_spec', [], self::CUSTOMER_CANCELLATION_EMAIL_META),
                            'dependencies'      => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ]
                    ]
                ],
                [
                    'title'       => __('User reschedule email', 'thebooking'),
                    'description' => __('User will receive this message when a booking is rescheduled.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_META,
                            'type'      => 'toggle',
                        ],
                        [
                            'settingId'    => 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_SUBJECT_META,
                            'type'         => 'text',
                            'label'        => __('Email subject', 'thebooking'),
                            'dependencies' => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ],
                        [
                            'settingId'         => 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_CONTENT_META,
                            'type'              => 'email',
                            'templateHooks'     => apply_filters('tbk_notification_template_hooks', [], self::CUSTOMER_RESCHEDULE_EMAIL_META),
                            'templateHooksSpec' => apply_filters('tbk_notification_template_hooks_spec', [], self::CUSTOMER_RESCHEDULE_EMAIL_META),
                            'dependencies'      => [
                                [
                                    'on'    => 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_META,
                                    'being' => TRUE
                                ]
                            ]
                        ]
                    ]
                ],
            ]
        ];

        return $panels;
    }

    public static function notificationsSaveServiceSettings($settingId, $value, $serviceId)
    {
        if ($settingId === 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CONFIRMATION_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_APPROVAL_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_DECLINE_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_DECLINE_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CANCELLATION_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::ADMIN_CONFIRMATION_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_RESCHEDULE_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_APPROVAL_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_DECLINE_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_DECLINE_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::ADMIN_CONFIRMATION_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_RESCHEDULE_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_APPROVAL_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_APPROVAL_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_DECLINE_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_DECLINE_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::ADMIN_CONFIRMATION_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_RESCHEDULE_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_RESCHEDULE_EMAIL_SUBJECT_META, trim($value));
        }
    }

    private static function _notification_cancellation_send($uid)
    {
        $reservation    = tbkg()->reservations->all()[ $uid ];
        $service        = tbkg()->services->get($reservation->service_id());
        $preparedValues = self::_prepare_placeholders($uid);

        if ($service->getMeta(self::CUSTOMER_CANCELLATION_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META), $preparedValues)),
                self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META), $preparedValues),
                tbkg()->customers->get($reservation->customer_id())->email(),
                [
                    'address' => get_option('admin_email'),
                    'name'    => get_option('blogname')
                ]
            ));
        }
    }

    public static function rescheduledMessage(ChangeReservationDates $command, $prevStart, $prevEnd)
    {
        $reservation    = tbkg()->reservations->all()[ $command->getUid() ];
        $service        = tbkg()->services->get($reservation->service_id());
        $preparedValues = self::_prepare_placeholders($command->getUid());
        $preparedValues = array_merge($preparedValues, [
            'reservation::startTime::old' => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $prevStart)->localized_time(),
            'reservation::startDate::old' => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $prevStart)->localized_date(),
            'reservation::endTime::old'   => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $prevEnd)->localized_time(),
            'reservation::endDate::old'   => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $prevEnd)->localized_date(),
            'reservation::duration::old'  => '' // TODO
        ]);
        if ($service->getMeta(self::CUSTOMER_RESCHEDULE_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_RESCHEDULE_EMAIL_SUBJECT_META), $preparedValues)),
                self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_RESCHEDULE_EMAIL_CONTENT_META), $preparedValues),
                tbkg()->customers->get($reservation->customer_id())->email(),
                [
                    'address' => get_option('admin_email'),
                    'name'    => get_option('blogname')
                ]
            ));
        }
    }

    private static function _notification_admin_send($uid)
    {
        $reservation    = tbkg()->reservations->all()[ $uid ];
        $service        = tbkg()->services->get($reservation->service_id());
        $preparedValues = self::_prepare_placeholders($uid);

        if ($service->getMeta(self::ADMIN_CONFIRMATION_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::ADMIN_CONFIRMATION_EMAIL_SUBJECT_META), $preparedValues)),
                self::_findAndReplaceHooks($service->getMeta(self::ADMIN_CONFIRMATION_EMAIL_CONTENT_META), $preparedValues),
                [get_option('admin_email')],
                [
                    'address' => tbkg()->customers->get($reservation->customer_id())->email(),
                    'name'    => tbkg()->customers->get($reservation->customer_id())->name()
                ]
            ));
        }
    }


    /**
     * @param string $reservation_id
     *
     * @return array
     */
    private static function _prepare_placeholders($reservation_id)
    {
        $reservation  = tbkg()->reservations->all()[ $reservation_id ];
        $customer     = tbkg()->customers->get($reservation->customer_id());
        $service      = tbkg()->services->get($reservation->service_id());
        $status_link  = \VSHM_Framework\REST_Controller::get_root_rest_url() . '/redirect/reservationStatusPage';
        $activeFields = $service->getMeta('formFieldsActive') ?: [];
        $locationId   = $reservation->getMeta('location');

        $preparedValues = [
            'status_link'                  => add_query_arg('hash', md5($customer->access_token()), $status_link),
            'service::name'                => $service->name(),
            'service::description'         => $service->description(),
            'service::shortDescription'    => $service->short_description(),
            'reservation::startTime'       => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start())->localized_time(),
            'reservation::startDate'       => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start())->localized_date(),
            'reservation::endTime'         => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end())->localized_time(),
            'reservation::endDate'         => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end())->localized_date(),
            'reservation::locationName'    => $locationId ? tbkg()->availability->locations()[ $locationId ]['l_name'] : '',
            'reservation::locationAddress' => $locationId ? tbkg()->availability->locations()[ $locationId ]['address'] : '',
            'reservation::duration'        => '' // TODO
        ];

        $hooksSpec = array_filter($service->metadata(), static function ($meta, $key) use ($activeFields) {

            return $meta instanceof Classes\ValueTypes\FormField
                && in_array($key, $activeFields, TRUE)
                && !empty($meta->getValue()['hook']);
        }, ARRAY_FILTER_USE_BOTH);

        foreach ($hooksSpec as $key => $item) {
            if (NULL !== $item->getValue()['hook']) {
                /** @var $value UserInput */
                $value = $reservation->getMeta($key) ?: new UserInput(['value' => '', 'type' => UserInput::TEXT, 'label' => '']);

                $preparedValues[ $item->getValue()['hook'] ] = $value->getValue();
            }
        }

        return $preparedValues;
    }

    /**
     * Sends notification to the customer
     *
     * @param $uid
     */
    private static function _notification_send($uid)
    {
        $reservation    = tbkg()->reservations->all()[ $uid ];
        $service        = tbkg()->services->get($reservation->service_id());
        $preparedValues = self::_prepare_placeholders($uid);

        if ($service->getMeta(self::CUSTOMER_CONFIRMATION_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META), $preparedValues)),
                self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META), $preparedValues),
                [tbkg()->customers->get($reservation->customer_id())->email()],
                [
                    'address' => get_option('admin_email'),
                    'name'    => get_option('blogname')
                ]
            ));
        }
    }

    /**
     * Sends notification when a reservation is CONFIRMED
     *
     * @param $uid
     */
    private static function _approval_send($uid)
    {
        $reservation    = tbkg()->reservations->all()[ $uid ];
        $service        = tbkg()->services->get($reservation->service_id());
        $preparedValues = self::_prepare_placeholders($uid);

        if ($service->getMeta(self::CUSTOMER_APPROVAL_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_APPROVAL_EMAIL_SUBJECT_META), $preparedValues)),
                self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_APPROVAL_EMAIL_CONTENT_META), $preparedValues),
                [tbkg()->customers->get($reservation->customer_id())->email()],
                [
                    'address' => get_option('admin_email'),
                    'name'    => get_option('blogname')
                ]
            ));
        }
    }

    /**
     * Sends notification when a reservation is CONFIRMED
     *
     * @param $uid
     */
    private static function _decline_send($uid)
    {
        $reservation    = tbkg()->reservations->all()[ $uid ];
        $service        = tbkg()->services->get($reservation->service_id());
        $preparedValues = self::_prepare_placeholders($uid);

        if ($service->getMeta(self::CUSTOMER_DECLINE_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_DECLINE_EMAIL_SUBJECT_META), $preparedValues)),
                self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_DECLINE_EMAIL_CONTENT_META), $preparedValues),
                [tbkg()->customers->get($reservation->customer_id())->email()],
                [
                    'address' => get_option('admin_email'),
                    'name'    => get_option('blogname')
                ]
            ));
        }
    }

    public static function notificationSend(CreateReservation $command)
    {
        self::_notification_send($command->getUid());
        self::_notification_admin_send($command->getUid());
    }

    public static function triggerNotificationsAfterUpdate(ChangeReservationStatus $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $service     = tbkg()->services->get($reservation->service_id());
        switch ($command->getStatus()) {
            case Status::CONFIRMED:
                if ($service->getMeta('requiresApproval')) {
                    self::_approval_send($command->getUid());
                } else {
                    self::_notification_send($command->getUid());
                }
                break;
            case Status::DECLINED:
                if ($service->getMeta('requiresApproval')) {
                    self::_decline_send($command->getUid());
                }
                break;
            case Status::CANCELLED:
                self::_notification_cancellation_send($command->getUid());
                break;
            default:
                break;
        }
    }

    /**
     * Find and replace hooks in a string.
     *
     * Hooks must be in the form: [hook] or [hook]SOME TEXT[/hook]
     *
     * @param mixed $string    String with hooks
     * @param array $variables Hooks values
     *
     * @return string String with hooks replaced by values
     */
    private static function _findAndReplaceHooks($string, array $variables)
    {
        // Lowercase conversion
        $convertedVariables = [];
        foreach ($variables as $array_key => $array_value) {
            $convertedVariables[ strtolower($array_key) ] = $array_value;
        }

        // Enclosure hooks (WordPress 4.4.0+ only)
        $pattern = get_shortcode_regex(['status_link']);
        $string  = preg_replace_callback("/$pattern/s", static function ($matches) use ($convertedVariables) {
            if (isset($convertedVariables[ strtolower(trim($matches[2], '[]')) ])) {
                $link = $convertedVariables[ strtolower(trim($matches[2], '[]')) ];
                unset($convertedVariables[ strtolower(trim($matches[2], '[]')) ]);

                return '<a href="' . $link . '">' . $matches[5] . '</a>';
            }

            return $matches[0];
        }, $string);

        // Single hooks
        $regex  = "/(\[.*?\])/";
        $return = preg_replace_callback($regex, static function ($matches) use ($convertedVariables) {
            if (isset($convertedVariables[ strtolower(trim($matches[1], '[]')) ])) {
                return self::_email_hook_replace(strtolower(trim($matches[1], '[]')), $convertedVariables);
            }

            return self::_email_hook_replace($matches[1], $convertedVariables);
        }, $string);

        return $return;
    }

    private static function _email_hook_replace($hook, $all_values)
    {
        return apply_filters('tbk_email_hook_replace', isset($all_values[ $hook ]) ? $all_values[ $hook ] : $hook, $hook, $all_values);
    }

    public static function templateHooks($hooks, $notificationType)
    {
        $hooks[] = [
            'value'        => 'service::name',
            'label'        => __('Name', 'thebooking'),
            'context'      => 'service',
            'contextLabel' => __('Service', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'service::description',
            'label'        => __('Description', 'thebooking'),
            'context'      => 'service',
            'contextLabel' => __('Service', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'service::shortDescription',
            'label'        => __('Short description', 'thebooking'),
            'context'      => 'service',
            'contextLabel' => __('Service', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::startTime',
            'label'        => __('Start time', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::startDate',
            'label'        => __('Start date', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::endTime',
            'label'        => __('End time', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::endDate',
            'label'        => __('End date', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::locationName',
            'label'        => __('Location (name)', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::locationAddress',
            'label'        => __('Location (address)', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];
        $hooks[] = [
            'value'        => 'reservation::duration',
            'label'        => __('Duration', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];

        if ($notificationType === self::CUSTOMER_RESCHEDULE_EMAIL_META) {
            $hooks[] = [
                'value'        => 'reservation::startTime::old',
                'label'        => __('Start time (old)', 'thebooking'),
                'context'      => 'reservation',
                'contextLabel' => __('Reservation', 'thebooking')
            ];
            $hooks[] = [
                'value'        => 'reservation::startDate::old',
                'label'        => __('Start date (old)', 'thebooking'),
                'context'      => 'reservation',
                'contextLabel' => __('Reservation', 'thebooking')
            ];
            $hooks[] = [
                'value'        => 'reservation::endTime::old',
                'label'        => __('End time (old)', 'thebooking'),
                'context'      => 'reservation',
                'contextLabel' => __('Reservation', 'thebooking')
            ];
            $hooks[] = [
                'value'        => 'reservation::endDate::old',
                'label'        => __('End date (old)', 'thebooking'),
                'context'      => 'reservation',
                'contextLabel' => __('Reservation', 'thebooking')
            ];
            $hooks[] = [
                'value'        => 'reservation::duration::old',
                'label'        => __('Duration (old)', 'thebooking'),
                'context'      => 'reservation',
                'contextLabel' => __('Reservation', 'thebooking')
            ];
        }

        return $hooks;
    }

    public static function templateHooksSpec($hooks, $notificationType)
    {
        foreach (tbkg()->services->all() as $service) {
            $hooksSpecReturn = [];
            /** @var $hooksSpec Classes\ValueTypes\FormField[] */
            $hooksSpec = array_filter($service->metadata(), static function ($meta, $key) {
                return $meta instanceof Classes\ValueTypes\FormField;
            }, ARRAY_FILTER_USE_BOTH);
            foreach ($hooksSpec as $item) {
                if (NULL !== $item->getValue()['hook']) {
                    $hooksSpecReturn[] = [
                        'value'        => $item->getValue()['hook'],
                        'label'        => $item->getValue()['label'],
                        'context'      => 'form',
                        'contextLabel' => __('Form', 'thebooking')
                    ];
                }
            }
            $hooks[ $service->id() ] = $hooksSpecReturn;
        }

        return $hooks;
    }

}