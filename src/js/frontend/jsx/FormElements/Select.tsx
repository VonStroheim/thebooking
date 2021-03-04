import globals from '../../../globals';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {TextField} from '@material-ui/core';
import {tbkCommonF} from '../../../typedefs';

declare const TBK: tbkCommonF;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface SelectOption {
    value: string,
    label: string,
    additional?: string
}

export interface SelectProps {
    required: boolean,
    error: boolean,
    disabled: boolean,
    label: string,
    errorText: string,
    value: SelectOption,
    options: SelectOption[],

    onChange(event: any, value: SelectOption): any
}

export default function Select(props: SelectProps) {

    return (
        <Autocomplete
            defaultValue={props.value}
            onChange={props.onChange}
            noOptionsText={__('No options', 'thebooking')}
            disabled={props.disabled}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={props.label}
                    variant={'filled'}
                    id={globals.uuidDOM()}
                    fullWidth={true}
                    error={props.error}
                    color={'secondary'}
                    inputProps={{...params.inputProps}}
                />
            )}
            options={props.options}
            getOptionLabel={(option) => option.label}
            getOptionSelected={(option, value) => (
                option === value
            )}
            renderOption={(option, {selected}) => (
                <>
                    <span>{option.additional}</span>
                    {option.label}
                </>
            )}
        />
    )
}