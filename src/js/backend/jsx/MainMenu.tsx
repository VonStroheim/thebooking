// @ts-ignore
import styles from './MainMenu.css';
import React from 'react';
import {Menubar} from 'primereact/menubar';
import {Tag} from 'primereact/tag';
import {BackendMainMenuItem, tbkCommonB} from "../../typedefs";

declare const tbkCommon: tbkCommonB;

export interface MainMenuProps {
    items: BackendMainMenuItem[]
}

class MainMenu extends React.Component<MainMenuProps> {

    constructor(props: MainMenuProps) {

        super(props);
    }

    primeMap = () => {
        const urlParams = new URLSearchParams(window.location.search).get('page');
        return this.props.items.map(item => {
            return {
                label    : item.label,
                url      : item.href,
                className: urlParams === item.slug ? styles.selected : ''
            };
        })
    }

    render() {
        const logo: any = <img src={tbkCommon.pluginUrl + 'assets/full_logo_black.svg'} width={120} className={styles.logo}/>;
        const versionLabel: any = <Tag style={{
            background: 'var(--bluegray-100)',
            color     : 'var(--bluegray-700)',
        }} icon="pi pi-tag" value={tbkCommon.pluginVersion}/>;
        return (
            <div className={styles.mainMenu}>
                <Menubar start={logo} model={this.primeMap()} end={versionLabel}/>
            </div>
        );
    }
}

export default MainMenu;