<?php

namespace TheBooking\Bus\Commands;

use TheBooking\Bus\Command;

defined('ABSPATH') || exit;

/**
 * SendEmail
 *
 * $subject = '',
 * $body = '',
 * $to = [],
 * $from = [],
 * $attachments = [],
 * $cc = [],
 * $bcc = [],
 * $replyTo = []
 *
 * @package TheBooking\Classes
 */
class SendEmail implements Command
{

    /**
     * @var string
     */
    private $subject;
    /**
     * @var string
     */
    private $body;
    /**
     * @var array
     */
    private $to;
    /**
     * @var array
     */
    private $from;
    /**
     * @var array
     */
    private $attachments;

    /**
     * @var array
     */
    private $cc;
    /**
     * @var array
     */
    private $bcc;
    /**
     * @var array
     */
    private $replyTo;

    public function __construct($subject = '', $body = '', $to = [], $from = [], $attachments = [], $cc = [], $bcc = [], $replyTo = [])
    {
        $this->subject     = $subject;
        $this->body        = $body;
        $this->to          = $to;
        $this->from        = $from;
        $this->attachments = $attachments;
        $this->cc          = $cc;
        $this->bcc         = $bcc;
        $this->replyTo     = $replyTo;
    }

    /**
     * @return string
     */
    public function getSubject()
    {
        return $this->subject;
    }

    /**
     * @return string
     */
    public function getBody()
    {
        return $this->body;
    }

    /**
     * @return array
     */
    public function getFrom()
    {
        return $this->from;
    }

    /**
     * @return array
     */
    public function getTo()
    {
        return $this->to;
    }

    /**
     * @return array
     */
    public function getAttachments()
    {
        return $this->attachments;
    }

    /**
     * @return array
     */
    public function getBcc()
    {
        return $this->bcc;
    }

    /**
     * @return array
     */
    public function getCc()
    {
        return $this->cc;
    }

    /**
     * @return array
     */
    public function getReplyTo()
    {
        return $this->replyTo;
    }
}