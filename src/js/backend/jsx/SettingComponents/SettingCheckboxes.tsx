// @ts-ignore
import styles from "./SettingCheckboxes.css";
import globals from "../../../globals";
import {Checkbox} from 'primereact/checkbox';

import React from "react";
import {StateAction} from "../../../typedefs";

export interface SettingCheckboxesProps {
    settingId: string,
    selected: {
        [key: string]: boolean
    } | string[],
    disabled?: boolean,
    options: {
        label: string,
        value: any
    }[]

    onChange(value: { [key: string]: any }): any
}

interface SettingCheckboxesState {
    selected: {
        [key: string]: boolean
    } | string[]
}

export default class SettingCheckboxes extends React.Component<SettingCheckboxesProps, SettingCheckboxesState> {

    selectedReducer = (state: SettingCheckboxesState, action: StateAction) => {
        switch (action.type) {
            case 'CHANGE_VALUE_OBJ':
                return {
                    ...state, selected:
                        {...state.selected, [action.payload.value]: action.payload.checked}
                }
            case 'CHANGE_VALUE_ARRAY':
                let newValue = state.selected;

                if (Array.isArray(newValue)) {
                    newValue = newValue.filter(value => {
                        return value !== action.payload.value;
                    });
                    if (action.payload.checked) {
                        newValue.push(action.payload.value);
                    }
                }

                return {
                    ...state, selected: newValue
                }
            default:
                return state;
        }
    }

    constructor(props: SettingCheckboxesProps) {

        super(props);

        this.state = {
            selected: props.selected || []
        }
    }

    handleChange = (event: any) => {
        let actionType = 'CHANGE_VALUE_OBJ';
        if (Array.isArray(this.state.selected)) {
            actionType = 'CHANGE_VALUE_ARRAY';
        }
        this.setState(this.selectedReducer(this.state, {type: actionType, payload: {value: event.value, checked: event.checked}}),
            () => {
                this.props.onChange({
                    [this.props.settingId]: this.state.selected
                })
            });
    }

    render() {
        return (
            <div className={styles.checkboxes} id={'settingID_' + this.props.settingId}>
                {
                    this.props.options.map((option, i) => {
                        let checked;
                        if (Array.isArray(this.state.selected)) {
                            checked = this.state.selected.includes(option.value)
                        } else if (typeof this.props.selected === 'object' && this.props.selected !== null) {
                            // @ts-ignore
                            checked = this.props.selected[option.value]
                        }
                        const uid = globals.uuidDOM();
                        return (
                            <div key={uid}>
                                <Checkbox disabled={this.props.disabled} inputId={uid} value={option.value} checked={checked} onChange={this.handleChange}/>
                                <label htmlFor={uid}>{option.label}</label>
                            </div>
                        );
                    })
                }
            </div>
        );
    }

}