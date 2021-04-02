import {AvailabilityRecord, ReservationRecord, ReservationRecordBackend, ServiceRecord, ServiceRecordBackend, tbkCommonB, tbkCommonF, TimeSlot} from "./typedefs";
import {
    add as addToDate, addMilliseconds,
    areIntervalsOverlapping,
    compareAsc as compareAscDate,
    endOfDay,
    formatRFC3339,
    isFuture,
    isWithinInterval,
    startOfDay,
    subMilliseconds,
    subSeconds
} from "date-fns";
import {getTimezoneOffset, toDate} from "date-fns-tz";
import {RRuleSet, rrulestr} from "rrule";
import globals from "./globals";

interface SProps {
    availability: AvailabilityRecord[],
    reservations: ReservationRecord[] | ReservationRecordBackend[],
    services: { [key: string]: ServiceRecord | ServiceRecordBackend }
}

export default class Scheduler {

    private readonly services;
    private readonly reservations;
    private readonly availability;

    constructor(props: SProps) {
        this.services = props.services;
        this.reservations = props.reservations;
        this.availability = props.availability;
    }

    /**
     * Checks if a time slot is outside date/time boundaries.
     *
     * @param start
     * @param end
     * @param service
     */
    isItemInTime = (start: Date, end: Date, service: ServiceRecord | ServiceRecordBackend): boolean => {
        let eligible = isFuture(start);
        if ('closeReservations' in service.meta && service.meta.closeReservations && eligible) {
            eligible = isFuture(subSeconds(start, parseInt(service.meta.closeReservationsPeriod)));
        }
        if ('openReservations' in service.meta && service.meta.openReservations && eligible) {
            eligible = !isFuture(subSeconds(start, parseInt(service.meta.openReservationsPeriod)));
        }
        return eligible;
    }

    /**
     * Handles overlapping criteria.
     */
    applyBlockingRules = (item: TimeSlot, blockingItems: ReservationRecord[] | ReservationRecordBackend[]) => {

        const itemStart = item.start ? toDate(item.start) : null;
        const itemEnd = item.end ? toDate(item.end) : itemStart;

        for (let blockingItem of blockingItems) {

            const blockingItemStart = blockingItem.start;
            const blockingItemEnd = blockingItem.end;

            if (typeof blockingItemStart === 'undefined' || typeof blockingItemEnd === 'undefined') {
                console.log('No end or start meta found in reservation ' + blockingItem.uid);
                continue;
            }

            const blockingItemInterval = {
                start: toDate(blockingItemStart),
                end  : blockingItemEnd ? toDate(blockingItemEnd) : toDate(blockingItemStart)
            }

            if (areIntervalsOverlapping(
                blockingItemInterval,
                {start: itemStart, end: itemEnd}
            )) {

                // "Reservation is for this slot" criterion
                if (item.serviceId === blockingItem.serviceId) {
                    item.soldOut = true;

                    /**
                     * We are returning false here, because soldout items
                     * should not be affected by blocking items
                     * (i.e. they can still be visible in the frontend)
                     */
                    return false;
                }

                if ('blocksOther' in this.services[blockingItem.serviceId].meta) {
                    let blocksOther = this.services[blockingItem.serviceId].meta.blocksOther;

                    // TODO: this is not acceptable long term. There should be no difference between frontend and backend meta types.
                    if (typeof blocksOther === 'string') {
                        const list = this.services[blockingItem.serviceId].meta.blocksOtherList || [];
                        blocksOther = [{
                            rule: blocksOther === 'all' ? 'all' : list,
                            by  : 'serviceId'
                        }]
                    }

                    for (let rule of blocksOther) {
                        switch (rule.by) {
                            case 'serviceId':
                                if (rule.rule === 'all') {
                                    return true;
                                }
                                if (Array.isArray(rule.rule) && rule.rule.includes(item.serviceId)) {
                                    return true;
                                }
                                break;
                            case 'meta':
                                // TODO
                                //for (let itemMeta of item.meta) {
                                //    if (itemMeta.id === rule.rule.id && itemMeta.text === rule.rule.text) {
                                //        return true;
                                //    }
                                //}
                                break;
                        }
                    }
                }
            }
        }
        return false;
    }

    public getItemsBetween(start: Date, end: Date): TimeSlot[] {
        const items: TimeSlot[] = [];
        for (let availability of this.availability) {

            const rule = rrulestr(availability.rrule, {forceset: true}) as RRuleSet;
            const dtStart = rule.dtstart();
            const instances = rule.between(startOfDay(start), endOfDay(end), true);

            const service = this.services[availability.serviceId];

            if (!service) {
                continue;
            }

            // TODO:
            if (!service.duration) {
                continue;
            }

            const eventDuration = globals.secondsToDurationObj(service.duration);

            instances.forEach(instanceWP => {

                /**
                 * What needs to be done to survive to DST...
                 */
                const diffStart = getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone, dtStart);
                const diffNow = getTimezoneOffset(Intl.DateTimeFormat().resolvedOptions().timeZone, instanceWP);
                let instance = addMilliseconds(instanceWP, diffStart - diffNow);

                let endOfLoop;

                if (availability.containerDuration) {
                    endOfLoop = addToDate(instance, availability.containerDuration);
                } else {
                    endOfLoop = addToDate(instance, eventDuration);
                }
                let eventStart = instance;
                let eventEnd = addToDate(instance, eventDuration);
                while (eventEnd <= endOfLoop) {
                    if (this.isItemInTime(eventStart, eventEnd, service)) {

                        const bookableItem = {
                            id            : availability.uid + '_' + formatRFC3339(eventStart) + '_' + availability.serviceId,
                            availabilityId: availability.uid,
                            serviceId     : availability.serviceId,
                            start         : formatRFC3339(eventStart),
                            end           : formatRFC3339(eventEnd),
                            soldOut       : false,
                            //meta          : availability.meta
                        };

                        if (!this.applyBlockingRules(bookableItem, this.reservations)) {
                            items.push(bookableItem);
                        }

                        /**
                         * TODO: collisions
                         */


                    }
                    eventStart = addToDate(eventStart, eventDuration);
                    eventEnd = addToDate(eventEnd, eventDuration);
                }
            })
        }

        items.sort((a, b) => {
            if (!a.start) return 0;
            return compareAscDate(toDate(a.start), toDate(b.start));
        })

        return items;
    }

    public isIntervalAvailable(start: Date, end: Date,) {
        const items = this.getItemsBetween(start, end);
        for (const item of items) {
            if (item.soldOut) {
                continue;
            }
            if (isWithinInterval(start, {
                    start: toDate(item.start),
                    end  : toDate(item.end)
                })
                && isWithinInterval(end, {
                    start: toDate(item.start),
                    end  : toDate(item.end)
                })) {
                return true;
            }
        }
        return false;
    }

    public getFirstUpcomingItem() {
        const items: TimeSlot[] = [];
        for (let availabilityRecord of this.availability) {
            const rule = rrulestr(availabilityRecord.rrule, {forceset: true}) as RRuleSet;
            const instance = rule.after(startOfDay(new Date()), true);
            const service = this.services[availabilityRecord.serviceId];

            // TODO:
            if (!service.duration) {
                continue;
            }

            const eventDuration = globals.secondsToDurationObj(service.duration);

            let endOfLoop;
            if (availabilityRecord.containerDuration) {
                endOfLoop = addToDate(instance, availabilityRecord.containerDuration);
            } else {
                endOfLoop = addToDate(instance, eventDuration);
            }
            let eventStart = instance;
            let eventEnd = addToDate(instance, eventDuration);
            while (eventEnd <= endOfLoop) {
                if (isFuture(eventStart)) {
                    const bookableItem = {
                        id            : availabilityRecord.uid + '_' + formatRFC3339(eventStart),
                        availabilityId: availabilityRecord.uid,
                        serviceId     : availabilityRecord.serviceId,
                        start         : formatRFC3339(eventStart),
                        end           : formatRFC3339(eventEnd),
                        soldOut       : false,
                        //meta          : availability.meta
                    };

                    if (!this.applyBlockingRules(bookableItem, this.reservations)) {
                        items.push(bookableItem);
                        break;
                    }
                }
                eventStart = addToDate(eventStart, eventDuration);
                eventEnd = addToDate(eventEnd, eventDuration);
            }
        }
        items.sort((a, b) => {
            if (!a.start) return 0;
            return compareAscDate(toDate(a.start), toDate(b.start));
        })

        return items.shift();
    }
}