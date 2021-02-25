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
    },
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
    }
}

export default class SettingCheckboxes extends React.Component<SettingCheckboxesProps, SettingCheckboxesState> {

    selectedReducer = (state: SettingCheckboxesState, action: StateAction) => {
        switch (action.type) {
            case 'CHANGE_VALUE':
                return {
                    ...state, selected:
                        {...state.selected, [action.payload.value]: action.payload.checked}
                }
            default:
                return state;
        }
    }

    constructor(props: SettingCheckboxesProps) {

        super(props);

        this.state = {
            selected: props.selected || {}
        }
    }

    handleChange = (event: any) => {
        this.setState(this.selectedReducer(this.state, {type: 'CHANGE_VALUE', payload: {value: event.value, checked: event.checked}}),
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
                        const uid = globals.uuidDOM();
                        return (
                            <div key={uid}>
                                <Checkbox disabled={this.props.disabled} inputId={uid} value={option.value} checked={this.props.selected[option.value]} onChange={this.handleChange}/>
                                <label htmlFor={uid}>{option.label}</label>
                            </div>
                        );
                    })
                }
            </div>
        );
    }

}