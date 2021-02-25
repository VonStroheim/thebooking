<?php

namespace TheBooking\Classes\ValueTypes;

defined('ABSPATH') || exit;

/**
 * Class UserInput
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class UserInput
{
    const TEXT    = 'text';
    const OPTION  = 'option';
    const NUMBER  = 'number';
    const BOOLEAN = 'boolean';
    const FILE    = 'file';

    /**
     * @var string
     */
    private $value;

    /**
     * @var string
     */
    private $type;

    /**
     * Form field label.
     *
     * @var string
     */
    private $label;

    public function __construct($data)
    {
        if (!(isset($data['type'], $data['label']) && array_key_exists('value', $data))) {
            throw new \InvalidArgumentException('Data must be complete.');
        }
        $this->value = $data['value'];
        $this->type  = $data['type'];
        $this->label = $data['label'];
    }

    /**
     * @return string
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @return string
     */
    public function getLabel()
    {
        return $this->label;
    }

    /**
     * @return array
     */
    public function getData()
    {
        return [
            'value' => $this->value,
            'type'  => $this->type,
            'label' => $this->label
        ];
    }
}
