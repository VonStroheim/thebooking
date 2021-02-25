// @ts-ignore
import styles from './MainMenu.css';
import React from 'react';
import {Menubar} from 'primereact/menubar';
import {BackendMainMenuItem, tbkCommonB} from "../../typedefs";

declare const tbkCommon: tbkCommonB;

export interface MainMenuProps {
    items: BackendMainMenuItem[]
}

interface MainMenuState {
    items: BackendMainMenuItem[]
}

class MainMenu extends React.Component<MainMenuProps, MainMenuState> {

    constructor(props: MainMenuProps) {

        super(props);

        this.state = {
            items: props.items || []
        }
    }

    componentDidMount() {
        document.addEventListener("tbk:backend.main_menu.add_item", this.addItem);
    }

    componentWillUnmount() {
        document.removeEventListener("tbk:backend.main_menu.add_item", this.addItem);
    }

    /**
     * Dinamycally adds an item to the main menu.
     *
     * API usage:
     *
     * document.dispatchEvent(new CustomEvent('tbk:backend.main_menu.add_item',
     *   {'detail' :
     *    {
     *      href : string | URL the menu item points to,
     *      icon : string | dashicons specific class, e.g. "dashicons-calendar",
     *      label: string | text of the menu item
     *      slug : string | slug of the menu item
     *    }
     *   }
     *  )
     * )
     *
     * @param event
     */
    addItem = (event: CustomEvent) => {
        console.log(event);
        let items = this.state.items;
        const item = {
            href : "#",
            icon : '',
            label: '',
            slug : ''
        }
        if (typeof event.detail.href !== 'undefined') {
            item.href = event.detail.href;
        }
        if (typeof event.detail.icon !== 'undefined') {
            item.icon = event.detail.icon;
        }
        if (typeof event.detail.label !== 'undefined') {
            item.label = event.detail.label;
        }
        if (typeof event.detail.slug !== 'undefined') {
            item.slug = event.detail.slug;
        }
        items.push(item);
        this.setState({items: items});
    }

    primeMap = () => {
        const urlParams = new URLSearchParams(window.location.search).get('page');
        return this.state.items.map(item => {
            return {
                label    : item.label,
                url      : item.href,
                className: urlParams === item.slug ? styles.selected : ''
            };
        })
    }

    render() {
        const logo: any = <img src={tbkCommon.pluginUrl + 'assets/full_logo_black.svg'} width={120} className={styles.logo}/>;
        return (
            <div className={styles.mainMenu}>
                <Menubar start={logo} model={this.primeMap()}/>
            </div>
        );
    }
}

export default MainMenu;