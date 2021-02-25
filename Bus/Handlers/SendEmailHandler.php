<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\SendEmail;
use TheBooking\Bus\Handler;

defined('ABSPATH') || exit;

/**
 * SendEmailHandler
 *
 * @package TheBooking\Classes
 */
class SendEmailHandler implements Handler
{

    /**
     * @var SendEmail
     */
    private $command;

    /**
     * @return string
     */
    public static function html_content_type()
    {
        return 'text/html';
    }

    public function get_from_address()
    {
        return isset($this->command->getFrom()['address']) ? $this->command->getFrom()['address'] : NULL;
    }

    public function get_from_name()
    {
        return isset($this->command->getFrom()['name']) ? $this->command->getFrom()['name'] : NULL;
    }

    public function dispatch(Command $command)
    {
        /** @var $command SendEmail */

        $this->command = $command;

        $body = $command->getBody();

        add_filter('wp_mail_content_type', [__CLASS__, 'html_content_type']);

        /**
         * Set FROM filters
         */
        if ($this->get_from_address()) {
            add_filter('wp_mail_from', [$this, 'get_from_address']);
        }
        if ($this->get_from_name()) {
            add_filter('wp_mail_from_name', [$this, 'get_from_name']);
        }

        /**
         * Send e-mail
         */
        if ($command->getAttachments()) {
            wp_mail($command->getTo(), $command->getSubject(), $body, [], $command->getAttachments());
        } else {
            wp_mail($command->getTo(), $command->getSubject(), $body, []);
        }

        /**
         * Remove content-type to avoid conflicts -- http://core.trac.wordpress.org/ticket/23578
         */
        remove_filter('wp_mail_content_type', [__CLASS__, 'html_content_type']);

        /**
         * Remove FROM filters
         */
        if ($this->get_from_address()) {
            remove_filter('wp_mail_from', [$this, 'get_from_address']);
        }
        if ($this->get_from_name()) {
            remove_filter('wp_mail_from_name', [$this, 'get_from_name']);
        }

    }
}