<?php

namespace TheBooking\Classes\ValueTypes;

defined('ABSPATH') || exit;

/**
 * Class FormField
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class FormField
{
    const TEXT      = 'text';
    const OPTION    = 'options';
    const NUMBER    = 'number';
    const BOOLEAN   = 'boolean';
    const FILE      = 'file';
    const PARAGRAPH = 'paragraph';

    /**
     * @var string
     */
    private $type;

    /**
     * @var string
     */
    private $label;

    /**
     * @var string
     */
    private $description;

    /**
     * @var array
     */
    private $options;

    /**
     * @var string
     */
    private $uiType;

    /**
     * @var int
     */
    private $minimum;

    /**
     * @var int
     */
    private $maximum;

    /**
     * @var int
     */
    private $maxSize;

    /**
     * @var array
     */
    private $mimeTypes;

    /**
     * @var string|bool
     */
    private $defaultValue;

    /**
     * @var string
     */
    private $pattern;

    /**
     * @var string
     */
    private $metakey;

    /**
     * @var string
     */
    private $hook;

    /**
     * @var bool
     */
    private $hideIfRegistered;

    /**
     * @var bool
     */
    private $required;

    public function __construct($data)
    {
        if (!isset($data['type'])) {
            throw new \InvalidArgumentException("Data type must be defined.");
        }
        $this->type             = $data['type'];
        $this->label            = isset($data['label']) ? $data['label'] : NULL;
        $this->description      = isset($data['description']) ? $data['description'] : NULL;
        $this->options          = isset($data['options']) ? $data['options'] : NULL;
        $this->uiType           = isset($data['uiType']) ? $data['uiType'] : NULL;
        $this->minimum          = isset($data['minimum']) ? $data['minimum'] : NULL;
        $this->maximum          = isset($data['maximum']) ? $data['maximum'] : NULL;
        $this->maxSize          = isset($data['maxSize']) ? $data['maxSize'] : NULL;
        $this->mimeTypes        = isset($data['mimeTypes']) ? $data['mimeTypes'] : NULL;
        $this->defaultValue     = isset($data['defaultValue']) ? $data['defaultValue'] : NULL;
        $this->pattern          = isset($data['pattern']) ? $data['pattern'] : NULL;
        $this->hook             = isset($data['hook']) ? $data['hook'] : NULL;
        $this->metakey          = isset($data['metakey']) ? $data['metakey'] : NULL;
        $this->required         = isset($data['required']) ? $data['required'] : NULL;
        $this->hideIfRegistered = isset($data['hideIfRegistered']) ? $data['hideIfRegistered'] : NULL;
    }

    /**
     * @return array
     */
    public function getValue()
    {
        $common = [
            'type'             => $this->type,
            'label'            => $this->label,
            'description'      => $this->description,
            'defaultValue'     => $this->defaultValue,
            'hook'             => $this->hook,
            'hideIfRegistered' => $this->hideIfRegistered,
        ];
        switch ($this->type) {
            case self::BOOLEAN:
                return [
                        'required' => $this->required
                    ] + $common;
                break;
            case self::TEXT:
                return [
                        'pattern'  => $this->pattern,
                        'uiType'   => $this->uiType,
                        'metakey'  => $this->metakey,
                        'required' => $this->required
                    ] + $common;
                break;
            case self::NUMBER:
                return [
                        'minimum'  => $this->minimum,
                        'maximum'  => $this->maximum,
                        'metakey'  => $this->metakey,
                        'required' => $this->required
                    ] + $common;
                break;
            case self::OPTION:
                return [
                        'options'  => $this->options,
                        'uiType'   => $this->uiType,
                        'required' => $this->required
                    ] + $common;
                break;
            case self::FILE:
                return [
                        'maxSize'   => $this->maxSize,
                        'mimeTypes' => $this->mimeTypes,
                        'required'  => $this->required
                    ] + $common;
                break;
            default:
                return $common;
                break;
        }
    }

    /**
     * @return array
     */
    public function getData()
    {
        return array_filter([
            'type'             => $this->type,
            'label'            => $this->label,
            'description'      => $this->description,
            'options'          => $this->options,
            'uiType'           => $this->uiType,
            'minimum'          => $this->minimum,
            'maximum'          => $this->maximum,
            'maxSize'          => $this->maxSize,
            'mimeTypes'        => $this->mimeTypes,
            'defaultValue'     => $this->defaultValue,
            'pattern'          => $this->pattern,
            'hook'             => $this->hook,
            'metakey'          => $this->metakey,
            'required'         => $this->required,
            'hideIfRegistered' => $this->hideIfRegistered,
        ], function ($value) {
            return $value !== NULL;
        });
    }
}
