// @ts-ignore
import styles from './ScheduleItem.css';
import React from 'react';
import {toDate} from 'date-fns-tz';
import {
    Card, CardHeader, CardContent, CardActions, Typography, Collapse, IconButton, Button
} from '@material-ui/core';
import {
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationOnIcon,
    Person as PersonIcon,
    People as PeopleIcon,
    MoreVert as MoreVertIcon
} from '@material-ui/icons';
import {ToggleButton, ToggleButtonGroup} from '@material-ui/lab';
import {DurationObject, ServiceRecord, tbkCommonF, TimeSlot} from "../../typedefs";

declare const TBK: tbkCommonF;
declare const lodash: any;
declare const wp: any;
const {__, _x, _n, _nx} = wp.i18n;

export interface ScheduleItemProps {
    item: TimeSlot,
    services: {
        [key: string]: ServiceRecord
    },
    collapsedContent?: string,
    underContent?: string,

    onBookingIntent?(item: TimeSlot): any
}

interface ScheduleItemState {
    selectedVariant: number | 'main',
    expanded: boolean
}

export default class ScheduleItem extends React.Component<ScheduleItemProps, ScheduleItemState> {

    constructor(props: ScheduleItemProps) {

        super(props);

        let selectedVariant: number | 'main' = 'main';

        if (this.props.item.soldOut && this.props.item.variants) {
            for (const [i, variant] of this.props.item.variants.entries()) {
                if (!variant.soldOut) {
                    selectedVariant = i;
                    break;
                }
            }
        }

        this.state = {
            expanded       : false,
            selectedVariant: selectedVariant,
        }
    }

    getCurrentItem = (): TimeSlot => {
        if (this.state.selectedVariant === 'main') {
            return this.props.item;
        } else {
            return {...this.props.item, ...this.props.item.variants[this.state.selectedVariant]};
        }
    }

    handleExpand = () => {
        this.setState({
            expanded: !this.state.expanded
        })
    }

    handleSelect = () => {
        this.props.onBookingIntent(this.getCurrentItem());
    }

    getMetaIcon = (icon: string) => {
        const classes = {root: styles.icon};
        switch (icon) {
            case 'location':
                return <LocationOnIcon classes={classes}/>;
            case 'user':
                return <PersonIcon classes={classes}/>;
            case 'guests':
                return <PeopleIcon classes={classes}/>;
        }
    }

    getVariantsContainer = (variants: any, i: number) => {
        return (
            <ToggleButtonGroup
                key={i}
                size={'small'}
                value={this.state.selectedVariant}
                onChange={(e, newValue) => {
                    if (newValue !== null) {
                        this.setState({selectedVariant: newValue})
                    }
                }}
                exclusive
            >
                {variants}
            </ToggleButtonGroup>
        );
    }

    getVariants = () => {
        const start = this.props.item.start ? toDate(this.props.item.start) : null;
        const variantButtons = [
            <ToggleButton value={'main'} key={'main'}>
                <div>
                    {start && (
                        new Intl.DateTimeFormat(TBK.i18n.locale, {
                            hour  : 'numeric',
                            minute: 'numeric',
                        }).format(start)
                    )}
                    <div className={styles.underTimeslot}>
                        {this.props.item.soldOut ? <span className={styles.soldOutSlotString}>{__('Sold-out', 'the-booking')}</span> : <span>{__('Available', 'the-booking')}</span>}
                    </div>
                </div>
            </ToggleButton>
        ];

        this.props.item.variants.forEach((variant, index) => {
            const start = variant.start ? toDate(variant.start) : null;
            variantButtons.push(
                <ToggleButton value={index} key={variant.id}>
                    <div>
                        {start && (
                            new Intl.DateTimeFormat(TBK.i18n.locale, {
                                hour  : 'numeric',
                                minute: 'numeric',
                            }).format(start)
                        )}
                        <div className={styles.underTimeslot}>
                            {variant.soldOut ? <span className={styles.soldOutSlotString}>{__('Sold-out', 'the-booking')}</span> : <span>{__('Available', 'the-booking')}</span>}
                        </div>
                    </div>
                </ToggleButton>
            );
        })

        return lodash.chunk(variantButtons, 10).map((variants: any, i: number) => {
            return this.getVariantsContainer(variants, i);
        });
    }

    getLoginButton = () => {
        return (
            <>
                <Button
                    size={'small'}
                    aria-label={__('Log-in', 'the-booking')}
                    onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('redirect_to', TBK.loginUrl);
                        window.location.href = url.toString();
                    }}
                >
                    {__('Log-in', 'the-booking')}
                </Button>
                <Button
                    disableElevation
                    aria-label={__('Register to book', 'the-booking')}
                    color={'primary'}
                    variant={'contained'}
                    size={'small'}
                    className={styles.actionButton}
                    onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('redirect_to', TBK.registrationUrl);
                        window.location.href = url.toString();
                    }}
                >
                    {__('Register to book', 'the-booking')}
                </Button>
            </>
        );
    }

    getBookButton = () => {
        let soldOut = false;
        if (this.state.selectedVariant === 'main') {
            if (this.props.item.soldOut) {
                soldOut = true;
            }
        } else {
            if (this.props.item.variants[this.state.selectedVariant].soldOut) {
                soldOut = true;
            }
        }
        return (
            <Button
                disableElevation
                aria-label={__('Select', 'the-booking')}
                onClick={soldOut ? undefined : this.handleSelect}
                color={'primary'}
                disabled={soldOut}
                variant={'contained'}
                size={'small'}
                className={styles.actionButton}
            >
                {soldOut ? __('Sold-out', 'the-booking') : __('Book', 'the-booking')}
            </Button>
        );
    }

    formatTime = (date: Date) => {
        return new Intl.DateTimeFormat(TBK.i18n.locale, {
            hour  : 'numeric',
            minute: 'numeric',
        }).format(date);
    }

    render() {
        const currentStart = this.getCurrentItem().start ? toDate(this.getCurrentItem().start) : null;
        const currentEnd = this.getCurrentItem().end ? toDate(this.getCurrentItem().end) : null;

        return (
            <Card className={styles.item}>
                <CardHeader
                    className={styles.content}
                    title={
                        <div>
                            {this.props.services[this.props.item.serviceId].name}
                        </div>
                    }
                    titleTypographyProps={{variant: 'body2'}}
                    avatar={
                        <div className={styles.times}>
                            {currentStart && (
                                <div className={styles.startTime}>
                                    {this.formatTime(currentStart)}
                                </div>
                            )}
                            {currentEnd && currentStart && <MoreVertIcon classes={{root: styles.timeDivider}}/>}
                            {currentEnd && (
                                <div className={styles.endTime}>
                                    {this.formatTime(currentEnd)}
                                </div>
                            )}
                            <div>
                        <span className={styles.dot} style={{background: this.props.services[this.props.item.serviceId].color}}>

                        </span>
                            </div>
                        </div>
                    }
                    // subheader={this.props.meta.map((meta) => {
                    //     return (
                    //         <div className={styles.meta} key={meta.id}>
                    //             {meta.icon && (
                    //                 <div className={styles.iconContainer}>
                    //                     {this.getMetaIcon(meta.icon)}
                    //                 </div>
                    //             )}
                    //             {meta.text}
                    //         </div>
                    //     );
                    // })}
                    action={
                        <div className={styles.itemActions}>
                            {this.props.collapsedContent && (
                                <IconButton
                                    className={this.state.expanded ? [styles.iconExpanded, styles.icon].join(' ') : styles.icon}
                                    onClick={this.handleExpand}
                                    aria-expanded={this.state.expanded}
                                    aria-label={__('Show more', 'the-booking')}
                                >
                                    <ExpandMoreIcon/>
                                </IconButton>
                            )}
                            {(!this.props.services[this.props.item.serviceId].registeredOnly || TBK.currentUser > 0) && this.getBookButton()}
                            {this.props.services[this.props.item.serviceId].registeredOnly && TBK.currentUser === 0 && this.getLoginButton()}
                        </div>
                    }
                />
                {this.props.item.variants && (
                    <CardContent>
                        <Typography variant={'body2'} component={'div'}>
                            <div className={styles.variants}>
                                {this.getVariants()}
                            </div>
                        </Typography>
                    </CardContent>
                )}

                {this.props.collapsedContent && (
                    <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                        <CardContent>
                            <Typography variant={'body2'}>
                                {this.props.collapsedContent}
                            </Typography>
                        </CardContent>
                    </Collapse>
                )}
                {this.props.underContent && (
                    <CardActions>
                        <Typography variant={'body2'}>
                            {this.props.underContent}
                        </Typography>
                    </CardActions>
                )}
            </Card>
        );
    }

    durationToMinutes = (duration: DurationObject) => {
        return duration['minutes'] + duration['hours'] * 60 + duration['days'] * 1440;
    }


}