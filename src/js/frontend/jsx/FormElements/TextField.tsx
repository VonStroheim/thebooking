import globals from '../../../globals';
import {TextField as TextFieldUI} from '@material-ui/core';

export interface TextFieldProps {
    label: string,
    type: string,
    required: boolean,
    multiline?: boolean,
    error: boolean,
    disabled: boolean,
    errorText: string,
    defaultValue?: string | number,
    value?: string | number,
    autoComplete?: string,
    min?: number,
    max?: number,
    step?: number,

    onChange(event: any): any
}

export default function TextField(props: TextFieldProps) {
    return (
        <div>
            <TextFieldUI autoComplete={props.autoComplete}
                         variant={'filled'}
                         inputProps={{
                             min : props.min || 0,
                             max : props.max,
                             step: props.step || 1
                         }}
                         id={globals.uuidv4()}
                         label={props.label}
                         fullWidth={true}
                         type={props.type}
                         onChange={props.onChange}
                         required={props.required}
                         multiline={props.multiline}
                         error={props.error}
                         value={props.value}
                         disabled={props.disabled}
                         color={'secondary'}
                         helperText={props.errorText}
            />
        </div>
    )
}