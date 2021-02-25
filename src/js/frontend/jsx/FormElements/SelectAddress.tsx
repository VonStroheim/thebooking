import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {LocationOn as LocationOnIcon} from '@material-ui/icons';
// @ts-ignore
import parse from 'autosuggest-highlight/parse';
import {TextField, Grid, Typography} from '@material-ui/core';
import {tbkCommonF} from "../../../typedefs";
import PredictionSubstring = google.maps.places.PredictionSubstring;
import AutocompleteService = google.maps.places.AutocompleteService;
import AutocompletionRequest = google.maps.places.AutocompletionRequest;
import AutocompletePrediction = google.maps.places.AutocompletePrediction;
import React from "react";

import {SelectOption} from "./Select";

declare const TBK: tbkCommonF;
declare const lodash: { throttle: (arg0: (request: AutocompletionRequest, callback: any) => void, arg1: number) => any; };
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

const mapsKey = TBK.gMapsApiKey;
const elementId = globals.uuidDOM();

function loadScript(src: string, position: HTMLElement, id: string) {
    if (!position) {
        return;
    }

    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('id', id);
    script.src = src;
    position.appendChild(script);
}

const autocompleteService: { current: AutocompleteService } = {current: null};

export interface SelectAddressProps {
    error: boolean,
    disabled: boolean,
    label: string,
    errorText: string,
    value: SelectOption,

    onChange(event: any, newValue: any): any
}

export default function SelectAddress(props: SelectAddressProps) {

    const [value, setValue] = React.useState(null);
    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState([]);
    const loaded = React.useRef(false);

    if (typeof window !== 'undefined' && !loaded.current) {
        if (!document.querySelector('#' + elementId)) {
            loadScript(
                `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places`,
                document.querySelector('head'),
                'tbk-google-maps-autocomplete',
            );
        }

        loaded.current = true;
    }

    const fetch = React.useMemo(
        () =>
            lodash.throttle((request: AutocompletionRequest, callback) => {
                autocompleteService.current.getPlacePredictions(request, callback);
            }, 200),
        [],
    );

    React.useEffect(() => {
        let active = true;

        if (!autocompleteService.current && window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        if (!autocompleteService.current) {
            return undefined;
        }

        if (inputValue === '') {
            setOptions(value ? [value] : []);
            return undefined;
        }

        fetch({input: inputValue}, (results: Array<AutocompletePrediction>) => {
            if (active) {
                let newOptions: Array<AutocompletePrediction | string> = [];

                if (value) {
                    newOptions = [value];
                }

                if (results) {
                    newOptions = [...newOptions, ...results];
                }

                setOptions(newOptions);
            }
        });

        return () => {
            active = false;
        };
    }, [value, inputValue, fetch]);

    return (
        <Autocomplete
            id={elementId}
            defaultValue={props.value}
            noOptionsText={__('No location', 'the-booking')}
            disabled={props.disabled}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={props.label}
                    variant={'filled'}
                    id={globals.uuidDOM()}
                    fullWidth
                    error={props.error}
                    color={'secondary'}
                    inputProps={{...params.inputProps}}
                />
            )}
            getOptionLabel={(option: AutocompletePrediction | string) => typeof option === 'string' ? option : option.description}
            filterOptions={(x) => x}
            options={options}
            autoComplete
            includeInputInList
            filterSelectedOptions
            value={value}
            onChange={(event, newValue) => {
                setOptions(newValue ? [newValue, ...options] : options);
                setValue(newValue);
                props.onChange(event, newValue);
            }}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            renderOption={(option, {selected}) => {
                const matches = option.structured_formatting.main_text_matched_substrings;
                const parts = parse(
                    option.structured_formatting.main_text,
                    matches.map((match: PredictionSubstring) => [match.offset, match.offset + match.length]),
                );

                return (
                    <Grid container alignItems="center">
                        <Grid item>
                            <LocationOnIcon/>
                        </Grid>
                        <Grid item xs>
                            {parts.map((part: { highlight: boolean, text: string }, index: number) => (
                                <span key={index} style={{fontWeight: part.highlight ? 700 : 400}}>
                                    {part.text}
                                </span>
                            ))}

                            <Typography variant={'body2'} color={'textSecondary'}>
                                {option.structured_formatting.secondary_text}
                            </Typography>
                        </Grid>
                    </Grid>
                );

            }}
        />
    )
}