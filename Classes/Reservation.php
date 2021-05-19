<?php

namespace TheBooking\Classes;

use TheBooking\Classes\ValueTypes\Status;
use TheBooking\Classes\ValueTypes\UserInput;
use VSHM_Framework\db;
use VSHM_Framework\Strings;
use function TheBooking\meta_to_storage;

defined('ABSPATH') || exit;

/**
 * Class Reservation
 *
 * @package TheBooking
 * @author  VonStroheim
 */
class Reservation extends Resource
{
    /**
     * WordPress user ID of the customer, if available
     *
     * @var int
     */
    protected $customer_id = 0;

    /**
     * @var string
     */
    protected $service_id = '';

    /**
     * @var string
     */
    protected $start;

    /**
     * @var string
     */
    protected $end;

    public function __construct()
    {
        $this->status(new Status(Status::DRAFT));
    }

    /**
     * @param int $id
     *
     * @return int
     */
    public function customer_id($id = NULL)
    {
        return $this->_get_or_set_int(__FUNCTION__, $id);
    }

    /**
     * @param string $id
     *
     * @return string
     */
    public function service_id($id = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $id);
    }

    /**
     * @param string $datetime
     *
     * @return string
     */
    public function start($datetime = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $datetime);
    }

    /**
     * @param string $datetime
     *
     * @return string
     */
    public function end($datetime = NULL)
    {
        return $this->_get_or_set(__FUNCTION__, $datetime);
    }

    /**
     * @return array
     */
    public function as_array()
    {
        $meta = [];
        foreach ($this->metadata() as $key => $metadatum) {
            switch (TRUE) {
                case $metadatum instanceof UserInput:
                    $meta[ $key ] = $metadatum->getData();
                    if ($metadatum->getType() === UserInput::FILE) {
                        $fileInfo = db::select('tbkl_uploaded_files', '*', [
                            'hash' => $metadatum->getValue()
                        ]);
                        if ($fileInfo) {
                            $meta[ $key ]['value'] = [
                                'url'      => $fileInfo[0]->url,
                                'mimeType' => $fileInfo[0]->mime,
                            ];
                        }
                    }
                    break;
                default:
                    $meta[ $key ] = $metadatum;
            }
        }

        return apply_filters('tbk_reservation_as_array_mapping', [
            'uid'        => $this->id,
            'serviceId'  => $this->service_id,
            'customerId' => $this->customer_id,
            'start'      => $this->start,
            'end'        => $this->end,
            'status'     => $this->status->getValue(),
            'meta'       => $meta,
            'created'    => $this->created,
            'updated'    => $this->updated
        ], $this->id);
    }
}