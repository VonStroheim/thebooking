// @ts-ignore
import styles from './MainMenu.css';
import React from 'react';
import {Menubar} from 'primereact/menubar';
import {Chip} from 'primereact/chip';
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
        const versionLabel: any = <Chip label="v1.0.0"/>;
        return (
            <div className={styles.mainMenu}>
                <Menubar start={logo} model={this.primeMap()} end={versionLabel}/>
            </div>
        );
    }
}

export default MainMenu;