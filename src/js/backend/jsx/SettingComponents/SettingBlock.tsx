// @ts-ignore
import styles from "./SettingBlock.css";

import React from "react";
import {SettingPanelBlockBackend} from "../../../typedefs";

export default class SettingBlock extends React.Component<SettingPanelBlockBackend> {

    render() {
        return (
            <div className={styles.settingBlock}>
                <h4>{this.props.title}</h4>
                <p>{this.props.description}</p>
                <div className={styles.setting}>
                    {this.props.children}
                </div>
            </div>
        );
    }

}