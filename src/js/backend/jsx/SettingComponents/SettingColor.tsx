// @ts-ignore
import styles from "./SettingColor.css";
import {TwitterPicker} from 'react-color';

import React from "react";

export interface SettingColorProps {
    settingId: string,
    value: string | null,

    onChange(value: { [key: string]: any }): any
}

interface SettingColorState {
    isOpen: boolean
}

class SettingColor extends React.Component<SettingColorProps, SettingColorState> {

    constructor(props: SettingColorProps) {

        super(props);

        this.state = {
            isOpen: false
        }
    }

    handleChange = (color: { [key: string]: any }) => {
        this.props.onChange({
            [this.props.settingId]: color.hex
        })
    }

    render() {

        return (
            <div className={styles.settingColor} id={'settingID_' + this.props.settingId}>
                <button className={'button'}
                        style={{background: this.props.value}}
                        onClick={() => {
                            this.setState({isOpen: !this.state.isOpen})
                        }}>
                </button>
                {this.state.isOpen && (
                    <div className={styles.pickerContainer}>
                        <TwitterPicker color={this.props.value} onChangeComplete={this.handleChange}/>
                    </div>
                )}
                {this.state.isOpen && (
                    <Cover onClick={() => {
                        this.setState({isOpen: false})
                    }}/>
                )}

            </div>
        );
    }

}

function Cover(props: any) {
    return <div className={styles.cover} {...props}/>
}

export default SettingColor;