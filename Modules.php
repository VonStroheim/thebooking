<?php

namespace TheBooking;

use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Bus\Commands\SendEmail;
use TheBooking\Classes\DateTimeTbk;
use TheBooking\Classes\ValueTypes\Status;
use TheBooking\Classes\ValueTypes\UserInput;

defined('ABSPATH') || exit;

final class Modules
{
    public static function load_modules()
    {
        /**
         * NOTIFICATIONS MODULE
         */
        tbkg()->loader->add_filter('tbk_backend_service_setting_panels', self::class, 'notificationsPanel');
        tbkg()->loader->add_action('tbk_save_service_settings', self::class, 'notificationsSaveServiceSettings', 10, 3);
        tbkg()->loader->add_action('tbk_dispatched_CreateReservation', self::class, 'notificationSend', 10, 2);
        tbkg()->loader->add_filter('tbk_notification_template_hooks', self::class, 'templateHooks', 10, 2);
        tbkg()->loader->add_filter('tbk_notification_template_hooks_spec', self::class, 'templateHooksSpec', 10, 2);
        tbkg()->loader->add_action('tbk_reservation_status_updated_actions', self::class, 'triggerNotificationsAfterUpdate');
    }

    /**
     * NOTIFICATIONS MODULE
     */

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
        if ($settingId === 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CANCELLATION_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::ADMIN_CONFIRMATION_EMAIL_META, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CONFIRMATION_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_CONTENT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::ADMIN_CONFIRMATION_EMAIL_CONTENT_META, $value);
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CONFIRMATION_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META, trim($value));
        }
        if ($settingId === 'meta::' . self::ADMIN_CONFIRMATION_EMAIL_SUBJECT_META) {
            $service = tbkg()->services->get($serviceId);
            $service->addMeta(self::ADMIN_CONFIRMATION_EMAIL_SUBJECT_META, trim($value));
        }
    }

    private static function _notification_cancellation_send($uid)
    {
        $reservation = tbkg()->reservations->all()[ $uid ];
        $service     = tbkg()->services->get($reservation->service_id());

        if ($service->getMeta(self::CUSTOMER_CANCELLATION_EMAIL_META)) {

            tbkg()->bus->dispatch(new SendEmail(
                wp_strip_all_tags(self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_CANCELLATION_EMAIL_SUBJECT_META), [])),
                self::_findAndReplaceHooks($service->getMeta(self::CUSTOMER_CANCELLATION_EMAIL_CONTENT_META), []),
                tbkg()->customers->get($reservation->customer_id())->email(),
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
    private static function _notification_send($uid)
    {
        $reservation = tbkg()->reservations->all()[ $uid ];
        $service     = tbkg()->services->get($reservation->service_id());

        $preparedValues = [
            'status_link'               => \VSHM_Framework\REST_Controller::get_root_rest_url() . '/redirect/reservationStatusPage',
            'service::name'             => $service->name(),
            'service::description'      => $service->description(),
            'service::shortDescription' => $service->short_description(),
            'reservation::startTime'    => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start())->localized_time(),
            'reservation::startDate'    => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start())->localized_date(),
            'reservation::endTime'      => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end())->localized_time(),
            'reservation::endDate'      => DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end())->localized_date(),
            'reservation::duration'     => '' // TODO
        ];

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

        if ($service->getMeta(self::CUSTOMER_CONFIRMATION_EMAIL_META) && $reservation->status()->getValue() === Status::CONFIRMED) {

            $hooksSpec = array_filter($service->metadata(), static function ($meta, $key) {
                return $meta instanceof Classes\ValueTypes\FormField;
            }, ARRAY_FILTER_USE_BOTH);
            foreach ($hooksSpec as $key => $item) {
                if (NULL !== $item->getValue()['hook']) {
                    /** @var $value UserInput */
                    $value                                       = $reservation->getMeta($key) ?: '';
                    $preparedValues[ $item->getValue()['hook'] ] = $value->getValue();
                }
            }

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

    public static function notificationSend(CreateReservation $command)
    {
        self::_notification_send($command->getUid());
    }

    public static function triggerNotificationsAfterUpdate($uids)
    {
        foreach ($uids as $uid) {
            $reservation = tbkg()->reservations->all()[ $uid ];
            switch ($reservation->status()->getValue()) {
                case Status::CONFIRMED:
                    self::_notification_send($uid);
                    break;
                case Status::CANCELLED:
                    self::_notification_cancellation_send($uid);
                    break;
                default:
                    break;
            }
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
        // Enclosure hooks (WordPress 4.4.0+ only)
        $pattern = get_shortcode_regex(['status_link']);
        $string  = preg_replace_callback("/$pattern/s", static function ($matches) use ($variables) {
            if (isset($variables[ strtolower(trim($matches[2], '[]')) ])) {
                $link = $variables[ strtolower(trim($matches[2], '[]')) ];
                unset($variables[ strtolower(trim($matches[2], '[]')) ]);

                return '<a href="' . $link . '">' . $matches[5] . '</a>';
            }

            return $matches[0];
        }, $string);

        // Single hooks
        $regex  = "/(\[.*?\])/";
        $return = preg_replace_callback($regex, static function ($matches) use ($variables) {
            if (isset($variables[ strtolower(trim($matches[1], '[]')) ])) {
                return self::_email_hook_replace(strtolower(trim($matches[1], '[]')), $variables);
            }

            return self::_email_hook_replace($matches[1], $variables);
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
            'value'        => 'reservation::duration',
            'label'        => __('Duration', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];

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

