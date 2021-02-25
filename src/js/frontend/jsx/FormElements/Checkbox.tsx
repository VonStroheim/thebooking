import {Checkbox as CheckboxUI, FormControlLabel, FormLabel, FormControl, FormHelperText} from '@material-ui/core';

export interface CheckboxProps {
    required: boolean,
    error: boolean,
    disabled: boolean,
    label: string,
    errorText: string,
    checked: boolean,

    onChange(event: any): any
}

export default function Checkbox(props: CheckboxProps) {
    return (
        <FormControl required={props.required} error={props.error} disabled={props.disabled}>
            <FormLabel component={'legend'}>{props.label}</FormLabel>
            <FormControlLabel control={<CheckboxUI checked={props.checked} onChange={props.onChange}/>} label={null}/>
            {props.error && (
                <FormHelperText>{props.errorText}</FormHelperText>
            )}
        </FormControl>
    )
}