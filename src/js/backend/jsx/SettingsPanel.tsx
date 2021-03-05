// @ts-ignore
import styles from "./SettingsPanel.css";
import React from 'react';
import {Button} from 'primereact/button';
import {Card} from 'primereact/card';
import {tbkCommonB} from "../../typedefs";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface SettingsPanelProps {
    isBusy: boolean,
    panelRef: string,
    noSave?: boolean,

    onUpdate(): any
}

export default class SettingsPanel extends React.PureComponent<SettingsPanelProps> {

    constructor(props: SettingsPanelProps) {

        super(props);
    }

    render() {
        const icon = this.props.isBusy ? 'pi pi-spin pi-spinner' : 'pi pi-check';
        return (
            <Card className={styles.settingPanel} data-panel-ref={this.props.panelRef}>
                <div className={styles.content}>
                    {this.props.children}
                </div>
                {!this.props.noSave && (
                    <Button icon={icon}
                            label={__('Save', 'thebooking')}
                            onClick={this.props.onUpdate}
                            className={styles.saveButton}
                            disabled={this.props.isBusy}/>
                )}
            </Card>
        );
    }

}