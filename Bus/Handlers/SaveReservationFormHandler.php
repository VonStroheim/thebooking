<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\SaveReservationForm;
use TheBooking\Bus\Handler;
use TheBooking\Classes\ValueTypes\FormField;

defined('ABSPATH') || exit;

/**
 * SaveReservationFormHandler
 *
 * @package TheBooking\Classes
 */
class SaveReservationFormHandler implements Handler
{
    public function dispatch(Command $command)
    {
        /** @var $command SaveReservationForm */

        $service = tbk()->services->get($command->getServiceId());

        /**
         * Cleanup first
         */
        foreach ($service->metadata() as $key => $metadatum) {
            if ($metadatum instanceof FormField && !isset($command->getElements()[ $key ])) {
                $service->dropMeta($key);
            }
        }

        foreach ($command->getElements() as $key => $element) {
            $service->addMeta($key, new FormField($element));
        }

        /**
         * Ensure consistency
         */
        $order    = array_values(array_filter($command->getOrder(), static function ($ordered) use ($command) {
            return array_key_exists($ordered, $command->getElements());
        }));
        $required = array_values(array_filter($command->getRequired(), static function ($req) use ($command) {
            return array_key_exists($req, $command->getElements());
        }));
        $contact  = array_key_exists($command->getContactField(), $command->getElements()) ? $command->getContactField() : NULL;

        $service->addMeta('formFieldsOrder', $order);
        $service->addMeta('formFieldsRequired', $required);
        $service->addMeta('formFieldsConditions', $command->getConditions());
        $service->addMeta('formFieldContact', $contact);
        $factory = tbk()->services;
        $factory::update($service);
    }
}