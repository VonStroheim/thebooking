// @ts-ignore
import styles from './SettingCheckboxes.css'
import globals from "../../../globals";
import {RadioButton} from 'primereact/radiobutton';

import React from "react";
import {StateAction} from "../../../typedefs";

export interface RProps {
    settingId: string,
    value: string | number,
    disabled?: boolean,
    options: {
        label: string,
        value: string | number
    }[]

    onChange(value: { [key: string]: any }): any
}

interface RState {
    value: string | number
}

export default class SettingCheckboxes extends React.Component<RProps, RState> {

    selectedReducer = (state: RState, action: StateAction) => {
        switch (action.type) {
            case 'CHANGE_VALUE':
                return {
                    ...state, value: action.payload
                }
            default:
                return state;
        }
    }

    constructor(props: RProps) {

        super(props);

        this.state = {
            value: props.value
        }
    }

    handleChange = (event: any) => {
        this.setState(this.selectedReducer(this.state, {type: 'CHANGE_VALUE', payload: event.value}),
            () => {
                this.props.onChange({
                    [this.props.settingId]: this.state.value
                })
            });
    }

    render() {
        return (
            <div id={'settingID_' + this.props.settingId} className={styles.checkboxes}>
                {
                    this.props.options.map((option, i) => {
                        const uid = globals.uuidDOM();
                        return (
                            <div key={uid}>
                                <RadioButton
                                    name={this.props.settingId}
                                    disabled={this.props.disabled}
                                    inputId={uid}
                                    value={option.value}
                                    checked={this.state.value === option.value}
                                    onChange={this.handleChange}/>
                                <label htmlFor={uid}>{option.label}</label>
                            </div>
                        );
                    })
                }
            </div>
        );
    }

}