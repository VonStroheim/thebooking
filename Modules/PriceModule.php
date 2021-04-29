<?php

namespace TheBooking\Modules;

use Money\Currencies\ISOCurrencies;
use Money\Currency;
use Money\Money;
use Money\Parser\DecimalMoneyParser;
use Money\Formatter\DecimalMoneyFormatter;

defined('ABSPATH') || exit;

/**
 * Class PriceModule
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class PriceModule
{
    const OPTIONS_TAG   = 'tbkg_price';
    const SRV_PRICE     = 'price';
    const SRV_HAS_PRICE = 'hasPrice';

    const CURRENCY = 'price_currency';

    public static function bootstrap()
    {
        tbkg()->loader->add_filter('tbk_backend_service_settings_panels', self::class, 'settings_panel');
        tbkg()->loader->add_filter('tbk_backend_core_settings_panels', self::class, 'currency_settings_panel');
        tbkg()->loader->add_filter('tbk_backend_settings', self::class, 'settings');
        tbkg()->loader->add_action('tbk_clean_uninstall', self::class, 'cleanup');
        tbkg()->loader->add_action('tbk-backend-settings-save-single', self::class, 'save_setting_callback', 10, 2);
        tbkg()->loader->add_action('tbk_save_service_settings', self::class, 'save_service_settings', 10, 3);
        tbkg()->loader->add_filter('tbk_service_as_array_mapping', self::class, 'meta_mapping', 10, 2);
        tbkg()->loader->add_filter('tbk_service_frontend_mapping', self::class, 'meta_mapping', 10, 2);
        tbkg()->loader->add_filter('tbk_frontend_js_data_common', self::class, 'frontend_settings');
        tbkg()->loader->add_filter('tbk_loaded_modules', self::class, 'isLoaded');
    }

    /**
     * @param array $modules
     *
     * @return array
     */
    public static function isLoaded($modules)
    {
        $modules[] = 'price';

        return $modules;
    }

    public static function frontend_settings($common_js)
    {
        $options                     = self::_get_options();
        $symbol                      = self::get_currencies($options[ self::CURRENCY ])['symbol'];
        $common_js['currency']       = $options[ self::CURRENCY ];
        $common_js['currencySymbol'] = $symbol;

        return $common_js;
    }

    public static function meta_mapping($mapped, $service_id)
    {
        if (isset($mapped['meta'][ self::SRV_PRICE ])) {
            $options                           = self::_get_options();
            $money                             = new Money($mapped['meta'][ self::SRV_PRICE ], new Currency($options[ self::CURRENCY ]));
            $currencies                        = new ISOCurrencies();
            $moneyFormatter                    = new DecimalMoneyFormatter($currencies);
            $mapped['meta'][ self::SRV_PRICE ] = $moneyFormatter->format($money);
        }

        return $mapped;
    }

    public static function save_service_settings($settingId, $value, $serviceId)
    {
        $options = self::_get_options();
        $service = tbkg()->services->get($serviceId);

        if ($settingId === 'meta::' . self::SRV_PRICE) {
            $currencies  = new ISOCurrencies();
            $moneyParser = new DecimalMoneyParser($currencies);
            $money       = $moneyParser->parse((string)$value, new Currency($options[ self::CURRENCY ]));
            $service->addMeta(self::SRV_PRICE, $money->getAmount());
        }

        if ($settingId === 'meta::' . self::SRV_HAS_PRICE) {
            $service->addMeta(self::SRV_HAS_PRICE, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
    }

    public static function save_setting_callback($settingId, $value)
    {
        $options = self::_get_options();

        switch ($settingId) {
            case self::CURRENCY:
                $options[ self::CURRENCY ] = trim($value);
                break;
            default:
                break;
        }

        update_option(self::OPTIONS_TAG, $options);
    }

    public function cleanup()
    {
        delete_option(self::OPTIONS_TAG);
    }

    private static function _get_options()
    {
        $defaults = [
            self::CURRENCY => 'USD',
        ];

        return get_option(self::OPTIONS_TAG, $defaults) + $defaults;
    }

    public static function settings($settings)
    {
        $options = self::_get_options();

        $settings[ self::CURRENCY ] = $options[ self::CURRENCY ];

        return $settings;
    }

    public static function currency_settings_panel($panels)
    {
        $currencies      = new ISOCurrencies();
        $currencyOptions = [];
        foreach ($currencies as $currency) {
            $code              = $currency->getCode();
            $num               = new \NumberFormatter(get_locale() . "@currency=$code", \NumberFormatter::CURRENCY);
            $sym               = $num->getSymbol(\NumberFormatter::CURRENCY_SYMBOL);
            $name              = self::get_currencies($code)['label'];
            $currencyOptions[] = [
                'label' => $code . ' - ' . $name . ($sym !== $code ? ' (' . $sym . ')' : ''),
                'value' => $code
            ];
        }

        $panels[] = [
            'panelRef'   => 'currency',
            'panelLabel' => __('Currency', 'thebooking'),
            'blocks'     => [
                [
                    'title'      => __('Select the currency', 'thebooking'),
                    'components' => [
                        [
                            'settingId' => self::CURRENCY,
                            'type'      => 'select',
                            'options'   => $currencyOptions
                        ]
                    ]
                ],
            ]
        ];

        return $panels;
    }

    public static function settings_panel($panels)
    {
        $options  = self::_get_options();
        $panels[] = [
            'panelRef'   => 'price',
            'panelLabel' => __('Price', 'thebooking'),
            'icon'       => 'pi pi-dollar',
            'blocks'     => [
                [
                    'title'      => __('Service has a price', 'thebooking'),
                    'components' => [
                        [
                            'settingId' => 'meta::' . self::SRV_HAS_PRICE,
                            'type'      => 'toggle',
                        ]
                    ]
                ],
                [
                    'title'        => __('Amount', 'thebooking'),
                    'components'   => [
                        [
                            'settingId'   => 'meta::' . self::SRV_PRICE,
                            'type'        => 'number',
                            'min'         => 0,
                            'step'        => 0.01,
                            'currency'    => $options[ self::CURRENCY ],
                            'showButtons' => TRUE
                        ]
                    ],
                    'dependencies' => [
                        [
                            'on'    => 'meta::' . self::SRV_HAS_PRICE,
                            'being' => '=',
                            'to'    => TRUE
                        ]
                    ]
                ],
            ]
        ];

        return $panels;
    }

    /**
     * A list of almost all currencies.
     *
     * @param string $code The code of the currency (optional)
     *
     * @return array|FALSE Array of all currencies, array of the requested currency.
     *                     Returns FALSE if the requested currency code is not valid.
     */
    public static function get_currencies($code = NULL)
    {
        $currencies = [
            'AED' => [
                'label'   => 'United Arab Emirates Dirham',
                'format'  => 'after',
                'locale'  => 'ar_AE',
                'symbol'  => '&#x62f;&#x2e;&#x625;',
                'decimal' => 2
            ],
            'AFN' => [
                'label'   => 'Afghan Afghani',
                'format'  => 'after',
                'locale'  => 'fa_AF',
                'symbol'  => '&#1547;',
                'decimal' => 2
            ],
            'ALL' => [
                'label'   => 'Albanian Lek',
                'format'  => 'before',
                'locale'  => 'sq_AL',
                'symbol'  => 'Lek',
                'decimal' => 2
            ],
            'AMD' => [
                'label'   => 'Armenian Dram',
                'format'  => 'before',
                'locale'  => 'hy_AM',
                'symbol'  => '&#1423;',
                'decimal' => 2
            ],
            'ANG' => [
                'label'   => 'Netherlands Antillean Gulden',
                'format'  => 'before',
                'locale'  => 'nl_SX',
                'symbol'  => '&#402;',
                'decimal' => 2
            ],
            'AOA' => [
                'label'   => 'Angolan Kwanza',
                'format'  => 'before',
                'locale'  => 'pt_AO',
                'symbol'  => 'Kz;',
                'decimal' => 2
            ],
            'ARS' => [
                'label'   => 'Argentine Peso',
                'format'  => 'before',
                'locale'  => 'es_AR',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'AUD' => [
                'label'   => 'Australian Dollar',
                'format'  => 'before',
                'locale'  => 'en_AU',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'AWG' => [
                'label'   => 'Aruban Florin',
                'format'  => 'before',
                'locale'  => 'nl_AW',
                'symbol'  => '&#402;',
                'decimal' => 2
            ],
            'AZN' => [
                'label'   => 'Azerbaijani Manat',
                'format'  => 'before',
                'locale'  => 'az_Latn_AZ',
                'symbol'  => '&#8380;',
                'decimal' => 2
            ],
            'BAM' => [
                'label'   => 'Bosnia & Herzegovina Convertible Mark',
                'format'  => 'before',
                'locale'  => 'hr_BA',
                'symbol'  => 'KM',
                'decimal' => 2
            ],
            'BBD' => [
                'label'   => 'Barbadian Dollar',
                'format'  => 'before',
                'locale'  => 'en_BB',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'BDT' => [
                'label'   => 'Bangladeshi Taka',
                'format'  => 'before',
                'locale'  => 'bn_BD',
                'symbol'  => '&#2547;',
                'decimal' => 2
            ],
            'BGN' => [
                'label'   => 'Bulgarian Lev',
                'format'  => 'after',
                'locale'  => 'bg_BG',
                'symbol'  => 'лв',
                'decimal' => 2
            ],
            'BIF' => [
                'label'   => 'Burundian Franc',
                'format'  => 'before',
                'locale'  => 'rn_BI',
                'symbol'  => 'FBu',
                'decimal' => 0
            ],
            'BMD' => [
                'label'   => 'Bermudian Dollar',
                'format'  => 'before',
                'locale'  => 'en_BM',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'BND' => [
                'label'   => 'Brunei Dollar',
                'format'  => 'before',
                'locale'  => 'ms_Latn_BN',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'BOB' => [
                'label'   => 'Bolivian Boliviano',
                'format'  => 'before',
                'locale'  => 'es_BO',
                'symbol'  => 'Bs.',
                'decimal' => 2
            ],
            'BRL' => [
                'label'   => 'Brazilian Real',
                'format'  => 'before',
                'locale'  => 'pt_BR',
                'symbol'  => 'R$',
                'decimal' => 2
            ],
            'BSD' => [
                'label'   => 'Bahamian Dollar',
                'format'  => 'before',
                'locale'  => 'en_BS',
                'symbol'  => 'B$',
                'decimal' => 2
            ],
            'BWP' => [
                'label'   => 'Botswana Pula',
                'format'  => 'before',
                'locale'  => 'en_BW',
                'symbol'  => 'P',
                'decimal' => 2
            ],
            'BZD' => [
                'label'   => 'Belize Dollar',
                'format'  => 'before',
                'locale'  => 'en_BZ',
                'symbol'  => 'BZ$',
                'decimal' => 2
            ],
            'CAD' => [
                'label'   => 'Canadian Dollar',
                'format'  => 'before',
                'locale'  => 'en_CA',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'CDF' => [
                'label'   => 'Congolese Franc',
                'format'  => 'before',
                'locale'  => 'fr_CD',
                'symbol'  => 'FC',
                'decimal' => 2
            ],
            'CHF' => [
                'label'   => 'Swiss Franc',
                'format'  => 'before',
                'locale'  => 'fr_CH',
                'symbol'  => 'Fr',
                'decimal' => 2
            ],
            'CLP' => [
                'label'   => 'Chilean Peso',
                'format'  => 'before',
                'locale'  => 'es_CL',
                'symbol'  => '$',
                'decimal' => 0
            ],
            'CNY' => [
                'label'   => 'Chinese Renminbi Yuan',
                'format'  => 'before',
                'locale'  => 'zh_Hans_CN',
                'symbol'  => '&#165;',
                'decimal' => 2
            ],
            'COP' => [
                'label'   => 'Colombian Peso',
                'format'  => 'before',
                'locale'  => 'es_CO',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'CRC' => [
                'label'   => 'Costa Rican Colón',
                'format'  => 'before',
                'locale'  => 'es_CR',
                'symbol'  => '&#8353;',
                'decimal' => 2
            ],
            'CVE' => [
                'label'   => 'Cape Verdean Escudo',
                'format'  => 'before',
                'locale'  => 'pt_CV',
                'symbol'  => 'Esc',
                'decimal' => 0
            ],
            'CZK' => [
                'label'   => 'Czech Koruna',
                'format'  => 'after',
                'locale'  => 'cs_CZ',
                'symbol'  => 'Kč',
                'decimal' => 2
            ],
            'DJF' => [
                'label'   => 'Djiboutian Franc',
                'format'  => 'before',
                'locale'  => 'fr_DJ',
                'symbol'  => 'Fdj',
                'decimal' => 0
            ],
            'DKK' => [
                'label'   => 'Danish Krone',
                'format'  => 'before',
                'locale'  => 'da_DK',
                'symbol'  => 'kr',
                'decimal' => 2
            ],
            'DOP' => [
                'label'   => 'Dominican Peso',
                'format'  => 'before',
                'locale'  => 'es_DO',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'DZD' => [
                'label'   => 'Algerian Dinar',
                'format'  => 'before',
                'locale'  => 'fr_DZ',
                'symbol'  => '&#1583;.&#1580;',
                'decimal' => 2
            ],
            'EGP' => [
                'label'   => 'Egyptian Pound',
                'format'  => 'before',
                'locale'  => 'ar_EG',
                'symbol'  => 'E&pound;',
                'decimal' => 2
            ],
            'ETB' => [
                'label'   => 'Ethiopian Birr',
                'format'  => 'before',
                'locale'  => 'so_ET',
                'symbol'  => 'Br',
                'decimal' => 2
            ],
            'EUR' => [
                'label'   => 'Euro',
                'format'  => 'before',
                'locale'  => '',
                'symbol'  => '&euro;',
                'decimal' => 2
            ],
            'FJD' => [
                'label'   => 'Fijian Dollar',
                'format'  => 'before',
                'locale'  => 'en_FJ',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'FKP' => [
                'label'   => 'Falkland Islands Pound',
                'format'  => 'before',
                'locale'  => 'en_FK',
                'symbol'  => '&pound;',
                'decimal' => 2
            ],
            'GBP' => [
                'label'   => 'British Pound',
                'format'  => 'before',
                'locale'  => 'en_UK',
                'symbol'  => '&pound;',
                'decimal' => 2
            ],
            'GEL' => [
                'label'   => 'Georgian Lari',
                'format'  => 'before',
                'locale'  => 'ka_GE',
                'symbol'  => '&#4314;',
                'decimal' => 2
            ],
            'GIP' => [
                'label'   => 'Gibraltar Pound',
                'format'  => 'before',
                'locale'  => 'en_GI',
                'symbol'  => '&pound;',
                'decimal' => 2
            ],
            'GMD' => [
                'label'   => 'Gambian Dalasi',
                'format'  => 'before',
                'locale'  => 'en_GM',
                'symbol'  => 'D',
                'decimal' => 2
            ],
            'GNF' => [
                'label'   => 'Guinean Franc',
                'format'  => 'before',
                'locale'  => 'fr_GN',
                'symbol'  => 'FG',
                'decimal' => 0
            ],
            'GTQ' => [
                'label'   => 'Guatemalan Quetzal',
                'format'  => 'before',
                'locale'  => 'es_GT',
                'symbol'  => 'Q',
                'decimal' => 2
            ],
            'GYD' => [
                'label'   => 'Guyanese Dollar',
                'format'  => 'before',
                'locale'  => 'en_GY',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'HKD' => [
                'label'   => 'Hong Kong Dollar',
                'format'  => 'before',
                'locale'  => 'en_HK',
                'symbol'  => 'HK$',
                'decimal' => 2
            ],
            'HNL' => [
                'label'   => 'Honduran Lempira',
                'format'  => 'before',
                'locale'  => 'es_HN',
                'symbol'  => 'L',
                'decimal' => 2
            ],
            'HRK' => [
                'label'   => 'Croatian Kuna',
                'format'  => 'before',
                'locale'  => 'hr_HR',
                'symbol'  => 'kn',
                'decimal' => 2
            ],
            'HTG' => [
                'label'   => 'Haitian Gourde',
                'format'  => 'before',
                'locale'  => 'fr_HT',
                'symbol'  => 'G',
                'decimal' => 2
            ],
            'HUF' => [
                'label'   => 'Hungarian Forint',
                'format'  => 'before',
                'locale'  => 'hu_HU',
                'symbol'  => 'Ft',
                'decimal' => 0
            ],
            'IDR' => [
                'label'   => 'Indonesian Rupiah',
                'format'  => 'before',
                'locale'  => 'id_ID',
                'symbol'  => 'Rp',
                'decimal' => 2
            ],
            'ILS' => [
                'label'   => 'Israeli New Sheqel',
                'format'  => 'before',
                'locale'  => 'he_IL',
                'symbol'  => '&#8362;',
                'decimal' => 2
            ],
            'INR' => [
                'label'   => 'Indian Rupee',
                'format'  => 'before',
                'locale'  => 'en_IN',
                'symbol'  => '&#8377;',
                'decimal' => 2
            ],
            'ISK' => [
                'label'   => 'Icelandic Króna',
                'format'  => 'before',
                'locale'  => 'is_IS',
                'symbol'  => 'kr',
                'decimal' => 0
            ],
            'JMD' => [
                'label'   => 'Jamaican Dollar',
                'format'  => 'before',
                'locale'  => 'en_JM',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'JPY' => [
                'label'   => 'Japanese Yen',
                'format'  => 'before',
                'locale'  => 'ja_JP',
                'symbol'  => '&yen;',
                'decimal' => 0
            ],
            'KES' => [
                'label'   => 'Kenyan Shilling',
                'format'  => 'before',
                'locale'  => 'en_KE',
                'symbol'  => 'KSh',
                'decimal' => 2
            ],
            'KGS' => [
                'label'   => 'Kyrgyzstani Som',
                'format'  => 'before',
                'locale'  => 'ru_KG',
                'symbol'  => '&#1083;&#1074;',
                'decimal' => 2
            ],
            'KHR' => [
                'label'   => 'Cambodian Riel',
                'format'  => 'before',
                'locale'  => 'km_KH',
                'symbol'  => '&#6107;',
                'decimal' => 2
            ],
            'KMF' => [
                'label'   => 'Comorian Franc',
                'format'  => 'before',
                'locale'  => 'fr_KM',
                'symbol'  => 'CF',
                'decimal' => 0
            ],
            'KRW' => [
                'label'   => 'South Korean Won',
                'format'  => 'before',
                'locale'  => 'ko_KR',
                'symbol'  => '&#8361;',
                'decimal' => 0
            ],
            'KYD' => [
                'label'   => 'Cayman Islands Dollar',
                'format'  => 'before',
                'locale'  => 'en_KY',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'KZT' => [
                'label'   => 'Kazakhstani Tenge',
                'format'  => 'before',
                'locale'  => 'ru_KZ',
                'symbol'  => '&#8376;',
                'decimal' => 2
            ],
            'LAK' => [
                'label'   => 'Lao Kipa',
                'format'  => 'before',
                'locale'  => 'lo_LA',
                'symbol'  => '&#8365;',
                'decimal' => 2
            ],
            'LBP' => [
                'label'   => 'Lebanese Pound',
                'format'  => 'after',
                'locale'  => 'ar_LB',
                'symbol'  => '&#1604;.&#1604;',
                'decimal' => 2
            ],
            'LKR' => [
                'label'   => 'Sri Lankan Rupee',
                'format'  => 'before',
                'locale'  => 'si_LK',
                'symbol'  => '&#588;s',
                'decimal' => 2
            ],
            'LRD' => [
                'label'   => 'Liberian Dollar',
                'format'  => 'before',
                'locale'  => 'en_LR',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'LSL' => [
                'label'   => 'Lesotho Loti',
                'format'  => 'before',
                'locale'  => '',
                'symbol'  => 'L',
                'decimal' => 2
            ],
            'MAD' => [
                'label'   => 'Moroccan Dirham',
                'format'  => 'before',
                'locale'  => 'ar_MA',
                'symbol'  => '&#1583;.&#1605;.',
                'decimal' => 2
            ],
            'MDL' => [
                'label'   => 'Moldovan Leu',
                'format'  => 'before',
                'locale'  => 'ro_MD',
                'symbol'  => 'L',
                'decimal' => 2
            ],
            'MGA' => [
                'label'   => 'Malagasy Ariary',
                'format'  => 'before',
                'locale'  => 'en_MG',
                'symbol'  => 'Ar',
                'decimal' => 0
            ],
            'MKD' => [
                'label'   => 'Macedonian Denar',
                'format'  => 'before',
                'locale'  => 'mk_MK',
                'symbol'  => '&#1076;&#1077;&#1085;',
                'decimal' => 2
            ],
            'MNT' => [
                'label'   => 'Mongolian Tögrög',
                'format'  => 'before',
                'locale'  => 'mn_Cyrl_MN',
                'symbol'  => '&#8366;',
                'decimal' => 2
            ],
            'MOP' => [
                'label'   => 'Macanese Pataca',
                'format'  => 'before',
                'locale'  => 'pt_MO',
                'symbol'  => 'MOP$',
                'decimal' => 2
            ],
            'MRO' => [
                'label'   => 'Mauritanian Ouguiya',
                'format'  => 'before',
                'locale'  => 'ar_MR',
                'symbol'  => 'UM',
                'decimal' => 0
            ],
            'MUR' => [
                'label'   => 'Mauritian Rupee',
                'format'  => 'before',
                'locale'  => 'en_MU',
                'symbol'  => '&#588;s',
                'decimal' => 2
            ],
            'MVR' => [
                'label'   => 'Maldivian Rufiyaa',
                'format'  => 'before',
                'locale'  => '',
                'symbol'  => 'Rf',
                'decimal' => 2
            ],
            'MWK' => [
                'label'   => 'Malawian Kwacha',
                'format'  => 'before',
                'locale'  => 'en_MW',
                'symbol'  => 'MK',
                'decimal' => 2
            ],
            'MXN' => [
                'label'   => 'Mexican Peso',
                'format'  => 'before',
                'locale'  => 'es_MX',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'MYR' => [
                'label'   => 'Malaysian Ringgit',
                'format'  => 'before',
                'locale'  => 'ta_MY',
                'symbol'  => 'RM',
                'decimal' => 2
            ],
            'MZN' => [
                'label'   => 'Mozambican Metical',
                'format'  => 'before',
                'locale'  => 'mgh_MZ',
                'symbol'  => 'MT',
                'decimal' => 2
            ],
            'NAD' => [
                'label'   => 'Namibian Dollar',
                'format'  => 'before',
                'locale'  => 'naq_NA',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'NGN' => [
                'label'   => 'Nigerian Naira',
                'format'  => 'before',
                'locale'  => 'en_NG',
                'symbol'  => '&#8358;',
                'decimal' => 2
            ],
            'NIO' => [
                'label'   => 'Nicaraguan Córdoba',
                'format'  => 'before',
                'locale'  => 'es_NI',
                'symbol'  => 'C$',
                'decimal' => 2
            ],
            'NOK' => [
                'label'   => 'Norwegian Krone',
                'format'  => 'before',
                'locale'  => 'se_NO',
                'symbol'  => 'kr',
                'decimal' => 2
            ],
            'NPR' => [
                'label'   => 'Nepalese Rupee',
                'format'  => 'before',
                'locale'  => 'ne_NP',
                'symbol'  => 'N&#588;s',
                'decimal' => 2
            ],
            'NZD' => [
                'label'   => 'New Zealand Dollar',
                'format'  => 'before',
                'locale'  => 'en_NZ',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'PAB' => [
                'label'   => 'Panamanian Balboa',
                'format'  => 'before',
                'locale'  => 'es_PA',
                'symbol'  => 'B/.',
                'decimal' => 2
            ],
            'PEN' => [
                'label'   => 'Peruvian Nuevo Sol',
                'format'  => 'before',
                'locale'  => 'es_PE',
                'symbol'  => 'S/.',
                'decimal' => 2
            ],
            'PGK' => [
                'label'   => 'Papua New Guinean Kina',
                'format'  => 'before',
                'locale'  => 'en_PG',
                'symbol'  => 'K',
                'decimal' => 2
            ],
            'PHP' => [
                'label'   => 'Philippine Peso',
                'format'  => 'before',
                'locale'  => 'en_PH',
                'symbol'  => '&#8369;',
                'decimal' => 2
            ],
            'PKR' => [
                'label'   => 'Pakistani Rupee',
                'format'  => 'before',
                'locale'  => 'en_PK',
                'symbol'  => '&#588;s',
                'decimal' => 2
            ],
            'PLN' => [
                'label'   => 'Polish Złoty',
                'format'  => 'after',
                'locale'  => 'pl_PL',
                'symbol'  => 'z&#322;',
                'decimal' => 2
            ],
            'PYG' => [
                'label'   => 'Paraguayan Guaraní',
                'format'  => 'before',
                'locale'  => 'es_PY',
                'symbol'  => '&#8370;',
                'decimal' => 0
            ],
            'QAR' => [
                'label'   => 'Qatari Riyal',
                'format'  => 'after',
                'locale'  => 'ar_QA',
                'symbol'  => '&#1585;.&#1602;',
                'decimal' => 2
            ],
            'RON' => [
                'label'   => 'Romanian Leu',
                'format'  => 'before',
                'locale'  => 'ro_RO',
                'symbol'  => 'L',
                'decimal' => 2
            ],
            'RSD' => [
                'label'   => 'Serbian Dinar',
                'format'  => 'before',
                'locale'  => 'sr_Latn_RS',
                'symbol'  => '&#1044;&#1080;&#1085;.',
                'decimal' => 2
            ],
            'RUB' => [
                'label'   => 'Russian Ruble',
                'format'  => 'before',
                'locale'  => 'ru_RU',
                'symbol'  => '&#8381;',
                'decimal' => 2
            ],
            'RWF' => [
                'label'   => 'Rwandan Franc',
                'format'  => 'before',
                'locale'  => 'en_RW',
                'symbol'  => 'RF',
                'decimal' => 0
            ],
            'SAR' => [
                'label'   => 'Saudi Riyal',
                'format'  => 'after',
                'locale'  => 'ar_SA',
                'symbol'  => '&#1585;.&#1587;',
                'decimal' => 2
            ],
            'SBD' => [
                'label'   => 'Solomon Islands Dollar',
                'format'  => 'before',
                'locale'  => 'en_SB',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'SCR' => [
                'label'   => 'Seychellois Rupee',
                'format'  => 'before',
                'locale'  => 'fr_SC',
                'symbol'  => '&#588;s',
                'decimal' => 2
            ],
            'SEK' => [
                'label'   => 'Swedish Krona',
                'format'  => 'after',
                'locale'  => 'sv_SE',
                'symbol'  => 'kr',
                'decimal' => 2
            ],
            'SGD' => [
                'label'   => 'Singapore Dollar',
                'format'  => 'before',
                'locale'  => 'en_SG',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'SHP' => [
                'label'   => 'Saint Helenian Pound',
                'format'  => 'before',
                'locale'  => 'en_SH',
                'symbol'  => '&pound;',
                'decimal' => 2
            ],
            'SLL' => [
                'label'   => 'Sierra Leonean Leone',
                'format'  => 'before',
                'locale'  => 'en_SL',
                'symbol'  => 'Le',
                'decimal' => 2
            ],
            'SOS' => [
                'label'   => 'Somali Shilling',
                'format'  => 'before',
                'locale'  => 'so_SO',
                'symbol'  => 'So. Sh.',
                'decimal' => 2
            ],
            'SRD' => [
                'label'   => 'Surinamese Dollar',
                'format'  => 'before',
                'locale'  => 'nl_SR',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'STD' => [
                'label'   => 'São Tomé and Príncipe Dobra',
                'format'  => 'before',
                'locale'  => 'pt_ST',
                'symbol'  => 'Db',
                'decimal' => 2
            ],
            'SZL' => [
                'label'   => 'Swazi Lilangeni',
                'format'  => 'before',
                'locale'  => 'en_SZ',
                'symbol'  => 'L',
                'decimal' => 2
            ],
            'THB' => [
                'label'   => 'Thai Baht',
                'format'  => 'before',
                'locale'  => 'th_TH',
                'symbol'  => '&#3647;',
                'decimal' => 2
            ],
            'TJS' => [
                'label'   => 'Tajikistani Somoni',
                'format'  => 'before',
                'locale'  => 'tg_Cyrl_TJ',
                'symbol'  => 'SM',
                'decimal' => 2
            ],
            'TOP' => [
                'label'   => 'Tongan Paʻanga',
                'format'  => 'before',
                'locale'  => 'en_TO',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'TRY' => [
                'label'   => 'Turkish Lira',
                'format'  => 'before',
                'locale'  => 'tr_TR',
                'symbol'  => '&#8378;',
                'decimal' => 2
            ],
            'TTD' => [
                'label'   => 'Trinidad and Tobago Dollar',
                'format'  => 'before',
                'locale'  => 'en_TT',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'TWD' => [
                'label'   => 'New Taiwan Dollar',
                'format'  => 'before',
                'locale'  => 'zh_Hant_TW',
                'symbol'  => 'NT$',
                'decimal' => 0
            ],
            'TZS' => [
                'label'   => 'Tanzanian Shilling',
                'format'  => 'before',
                'locale'  => 'en_TZ',
                'symbol'  => 'TSh',
                'decimal' => 2
            ],
            'UAH' => [
                'label'   => 'Ukrainian Hryvnia',
                'format'  => 'before',
                'locale'  => 'uk_UA',
                'symbol'  => '&#8372;',
                'decimal' => 2
            ],
            'UGX' => [
                'label'   => 'Ugandan Shilling',
                'format'  => 'before',
                'locale'  => 'en_UG',
                'symbol'  => 'USh',
                'decimal' => 0
            ],
            'USD' => [
                'label'   => 'United States Dollar',
                'format'  => 'before',
                'locale'  => 'en_US',
                'symbol'  => '$',
                'decimal' => 2
            ],
            'UYU' => [
                'label'   => 'Uruguayan Peso',
                'format'  => 'before',
                'locale'  => 'es_UY',
                'symbol'  => '$U',
                'decimal' => 2
            ],
            'UZS' => [
                'label'   => 'Uzbekistani Som',
                'format'  => 'before',
                'locale'  => 'uz_Latn_UZ',
                'symbol'  => '&#1083;&#1074;',
                'decimal' => 2
            ],
            'VEF' => [
                'label'   => 'Venezuelan Bolívar',
                'format'  => 'before',
                'locale'  => 'es_VE',
                'symbol'  => 'Bs',
                'decimal' => 2
            ],
            'VND' => [
                'label'   => 'Vietnamese Đồng',
                'format'  => 'after',
                'locale'  => 'vi_VN',
                'symbol'  => '&#8363;',
                'decimal' => 0
            ],
            'VUV' => [
                'label'   => 'Vanuatu Vatu',
                'format'  => 'after',
                'locale'  => 'en_VU',
                'symbol'  => 'VT',
                'decimal' => 0
            ],
            'WST' => [
                'label'   => 'Samoan Tala',
                'format'  => 'before',
                'locale'  => 'en_WS',
                'symbol'  => 'WS$',
                'decimal' => 2
            ],
            'XAF' => [
                'label'   => 'Central African Cfa Franc',
                'format'  => 'before',
                'locale'  => 'fr_CF',
                'symbol'  => 'CFA',
                'decimal' => 0
            ],
            'XCD' => [
                'label'   => 'East Caribbean Dollar',
                'format'  => 'before',
                'locale'  => 'en_AI',
                'symbol'  => 'EC$',
                'decimal' => 2
            ],
            'XOF' => [
                'label'   => 'West African Cfa Franc',
                'format'  => 'before',
                'locale'  => 'fr_BF',
                'symbol'  => 'CFA',
                'decimal' => 0
            ],
            'XPF' => [
                'label'   => 'Cfp Franc',
                'format'  => 'before',
                'locale'  => 'fr_PF',
                'symbol'  => 'F',
                'decimal' => 0
            ],
            'YER' => [
                'label'   => 'Yemeni Rial',
                'format'  => 'after',
                'locale'  => 'ar_YE',
                'symbol'  => '&#65020;',
                'decimal' => 2
            ],
            'ZAR' => [
                'label'   => 'South African Rand',
                'format'  => 'before',
                'locale'  => 'en_LS',
                'symbol'  => 'R',
                'decimal' => 2
            ],
            'ZMW' => [
                'label'   => 'Zambian Kwacha',
                'format'  => 'before',
                'locale'  => 'en_ZM',
                'symbol'  => 'ZMW',
                'decimal' => 2
            ],
        ];
        if (NULL === $code) {
            return $currencies;
        }

        return isset($currencies[ $code ]) ? $currencies[ $code ] : FALSE;
    }
}