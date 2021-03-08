<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CreateService;
use TheBooking\Bus\Commands\SaveReservationForm;
use TheBooking\Bus\Handler;
use TheBooking\Classes\Service;
use TheBooking\Classes\Service_Appointment;

defined('ABSPATH') || exit;

/**
 * CreateServiceHandler
 *
 * @package TheBooking\Classes
 */
class CreateServiceHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command CreateService */

        $service = new Service_Appointment();
        $service->id($command->getUid());
        $service->name($command->getName());
        $service->duration(3600);
        $service->addMeta('blocksOther', 'all');
        tbkg()->services->insert($service);

        /**
         * Default form fields
         */
        $name_uid  = 'name';
        $email_uid = 'email';
        $phone_uid = 'phone';
        $command   = new SaveReservationForm(
            $service->id(),
            [
                $name_uid  => [
                    'type'  => 'text',
                    'hook'  => 'customer_name',
                    'label' => __('Name', 'thebooking')
                ],
                $email_uid => [
                    'type'  => 'text',
                    'hook'  => 'customer_email',
                    'label' => __('Email', 'thebooking')
                ],
                $phone_uid => [
                    'type'  => 'text',
                    'hook'  => 'customer_phone',
                    'label' => __('Phone', 'thebooking')
                ],
            ],
            [$name_uid, $email_uid, $phone_uid],
            [$name_uid, $email_uid, $phone_uid],
            [],
            [$name_uid, $email_uid, $phone_uid]
        );
        tbkg()->bus->dispatch($command);

    }
}