// @ts-ignore
import styles from './MainMenu.css';
import React from 'react';
import {Menubar} from 'primereact/menubar';
// @ts-ignore
import Clock from 'react-clock';
import {BackendMainMenuItem, tbkCommonB} from "../../typedefs";

declare const tbkCommon: tbkCommonB;
declare const wp: any;
const {__, _x, _n, _nx, sprintf} = wp.i18n;

export interface MainMenuProps {
    items: BackendMainMenuItem[]
}

interface MState {
    clock: Date,
    clockPosition: 'left' | 'right'
}

class MainMenu extends React.Component<MainMenuProps, MState> {
    private interval: number;

    constructor(props: MainMenuProps) {

        super(props);

        this.state = {
            clock        : new Date(),
            clockPosition: 'right'
        }
    }

    componentDidMount() {
        this.interval = setInterval(
            () => this.setState({clock: new Date()}),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.interval);
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

    getEnd = (): any => {
        return (
            <div className={'p-d-flex p-ai-center'}>
                {this.state.clockPosition === 'left' && <Clock value={new Date()} size={30}/>}
                <div className={'p-ml-2 p-mr-2'} style={{fontSize: '0.85rem', color: 'var(--bluegray-400)'}}>
                    {sprintf(__('All times are local: %s'), Intl.DateTimeFormat().resolvedOptions().timeZone)}
                </div>
                {this.state.clockPosition === 'right' && <Clock value={new Date()} size={30}/>}
            </div>

        )
    }

    render() {
        const logo: any =
            <div className={styles.logoContainer}>
                <img src={tbkCommon.pluginUrl + 'assets/full_logo_black.svg'} width={120} className={styles.logo}/>
                <div className={styles.versionTag}>
                    v{tbkCommon.pluginVersion}
                </div>
            </div>;

        return (
            <div className={styles.mainMenu}>
                <Menubar start={logo} model={this.primeMap()} end={this.getEnd()}/>
            </div>
        );
    }
}

export default MainMenu;