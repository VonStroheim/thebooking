import {RadioGroup as RadioGroupUI, Radio, FormControlLabel, FormLabel, FormControl} from '@material-ui/core';

export interface RadioGroupOption {
    value: string | number,
    label: string
}

export interface RadioGroupProps {
    required: boolean,
    error: boolean,
    disabled: boolean,
    label: string,
    name: string,
    defaultValue: string | number,
    options: Array<RadioGroupOption>,

    onChange(event: any): Function
}

export default function RadioGroup(props: RadioGroupProps) {
    return (
        <FormControl required={props.required} error={props.error} disabled={props.disabled}>
            <FormLabel component={'legend'}>{props.label}</FormLabel>
            <RadioGroupUI aria-label={props.label}
                          name={props.name}
                          defaultValue={props.defaultValue}
                          onChange={props.onChange}>
                {props.options.map(option => {
                    return (
                        <FormControlLabel key={'' + option.value} value={'' + option.value} control={<Radio/>} label={option.label}/>
                    );
                })}
            </RadioGroupUI>
        </FormControl>
    )
}