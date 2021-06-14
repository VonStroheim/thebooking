=== WordPress Booking Plugin - TheBooking ===
Contributors: vonstroheim
Tags: booking system, reservation, appointment, schedule, booking calendar, booking, calendar, events, appointment system
Requires at least: 5.3
Tested up to: 5.7
Stable tag: 1.4.4
Requires PHP: 5.6
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

TheBooking is a modern booking plugin to manage appointments and reservations, focused on usability and nice-looking user interface.

== Description ==

**TheBooking** is a modern **booking plugin** to manage appointments and reservations, focused on usability and nice-looking user interface.

#### User friendly booking plugin

With its reactive calendar widget and a step-by-step reservation process, TheBooking allows customers to book your services in a snap!

#### Availability schedule

TheBooking implements an intuitive weekly planner to define availability hours, vacations and day offs.

* **Weekly working hours**: define the available time intervals for each day of the week.
* **Closing dates**: configure the day offs.
* **Booking time frame**: define (if needed) both reservation opening and closing time independently for any of your services

#### Reservation form

Define and customize a reservation form for each one of your services. TheBooking ships with a flexible **form builder**.

* **Custom fields**: add your desired fields in the reservation form to collect the data you need (even **files**!)
* **Conditional fields**: fields can be configured to show/hide or being required in consequence of values of other fields.
* **Validation**: apply the desired validation rule to any text field, if needed.

#### Zoom meetings and Google Meet

TheBooking integrates with Zoom and Google Meet to automate meetings creation and management for your services.

#### Google Calendar 2-ways and 3-ways integration

Connect your Google Calendar to see all your reservations there and to block available timeslots when busy. TheBooking is the **only** plugin that also allows you to **plan the availability directly through Google Calendar** (3-way) without the need to use the plugin backend to define time slots and opening hours.

#### Locations

Each service can have one or more locations that customer will be able to select during the booking process.

**Google Maps** is also supported.

#### Notification email messages

TheBooking is very powerful when it comes to build the perfect notification system for your booking system.

* **Complete stack** of notifications for any action: confirm, cancel, reschedule, approve, decline etc.
* **Differentiate by service**: any notification can be configured independently for each service
* **Dynamic content**: use placeholders to put dynamic data inside notification templates, such as service details, reservation details and customer's data
* **Advanced email content editor**: create amazing HTML email content thanks to the clarity and power of TinyMCE editor

#### Service restrictions

You can configure services to be booked by registered users only. Services can also be configured to require **approval** of the bookings.

#### Data export

Reservations and customers can be **conveniently exported** in *.CSV format.

To know more, see the [documentation](https://docs.thebookingplugin.com/ "TheBooking documentation").

== Contribute ==

Source code can be found [here](https://github.com/VonStroheim/thebooking "TheBooking repository")

== Frequently Asked Questions ==

= Does it support Google Calendar? =

Yes, 2-ways and 3-ways Google Calendar integrations are implemented. You can configure them as you please.

= Can I create virtual meetings? =

Yes, TheBooking integrates with Zoom. Just provide the API keys, and you will be able to offer virtual meetings to your customers to book. Meeting creation and management is automated.

= Can I change the customer or reschedule a reservation? =

Yes, any aspect of a reservation can be edited in the convenient backend dashboard. The plugin will take care of consistency across resources.

= Do all my services share the same availability schedule? =

Not necessarily. TheBooking is very flexible, so you can set a global availability schedule, or you can provide specific availabilities for some of your services.

= Do I need to provide time slots of the same duration for a given service? =

Not necessarily. The availability intervals can be either subdivided into fixed duration time slots, or each interval considered as a whole time slot.

= Do customers need to be registered in WordPress? =

This is configurable and up to you. The plugin can be configured in such a way that any new customer will be automatically linked to a new WordPress user or not. You can also restrict some of your services to be booked by registered users only.

= Can I suggest features and/or enhancements? =

Yes, please do so! You can do that via [GitHub](https://github.com/VonStroheim/thebooking "TheBooking repository")

== Screenshots ==

1. The frontend calendar
2. Reservations list
3. Availability settings
4. Booking process
5. Form builder
6. Reservation details
7. Frontend reservations list

== Installation ==

= Minimum Requirements =

* WordPress 5.3 or greater
* PHP version 5.6 or greater
* MySQL version 5.0 or greater

= Automatic installation =

To install TheBooking automatically, go in to your WordPress admin panel, navigate to the Plugins menu and click Add New.

In the search field type "TheBooking" and click Search Plugins. Clicking Install Now. After clicking that link you will be asked if you are sure you want to install the plugin. Click yes and WordPress will automatically complete the installation.

= Manual installation =

The manual installation method involves downloading our plugin and uploading it to your web server via your favorite FTP application.

1. Download the plugin file to your computer and unzip it
2. Using an FTP program, or your hosting control panel, upload the unzipped plugin folder to your WordPress installations wp-content/plugins/ directory.
3. Activate the plugin from the Plugins menu within the WordPress admin panel.

== Getting started ==

See the [documentation](https://docs.thebookingplugin.com/ "TheBooking documentation") for all the info.

== Changelog ==
= 1.4.4 =
* [Fix] Fatal error when the Gcal Advanced module is active

= 1.4.3 =
* [Enhancement] Google Calendar 3-way integration
* [Enhancement] Support for Google Meet
* [Fix] Minor bug fixes

= 1.4.2 =
* [Fix] Zoom meetings were not created due to password length requirement
* [Fix] Wrong default reservations sorting
  
= 1.4.1 =
* [Enhancement] Time slots can accept multiple reservations
* [Fix] Minor bug fixes

= 1.4.0 =
* [Feature] Zoom meetings integration
* [Feature] Availability schedule can be set per-service
* [Enhancement] Customers table now shows the incoming and total number of reservations for each customer
* [Enhancement] Reservation details screen restyled
* [Enhancement] Frontend reservations list restyled
* [Fix] Minor bug fixes

= 1.3.1 =
* [Fix] File types selector in form builder file upload field wasn't providing feedback
* [Fix] Enfold theme frontend style conflicts
* [Fix] Elementor preview and block builder preview were not working
* [Fix] Minor bug fixes

= 1.3 =
* [Feature] Google Calendar 2-way sync
* [Feature] Services can have a price
* [Fix] Minor bug fixes

= 1.2 =
* [Feature] Reminder email
* [Fix] DST are handled correctly in frontend
* [Fix] Minor bug fixes

= 1.1 =
* [Feature] Approval system 
* [Feature] Rescheduling
* [Feature] Reservations table edit mode, column filtering, today/tomorrow shortcuts
* [Feature] Ability to re-send notifications
* [Fix] Minor bug fixes

= 1.0 =
* First release.

== Credits ==
This plugin uses the following libraries/products:

+ [Material-UI](https://github.com/mui-org/material-ui "Material-UI")
+ [TinyMCE](https://github.com/tinymce/tinymce "TinyMCE")
+ [date-fns](https://github.com/date-fns/date-fns "date-fns")
+ [PrimeReact](https://github.com/primefaces/primereact "PrimeReact")
+ [Axios](https://github.com/axios/axios "Axios")
+ [noUiSlider](https://github.com/leongersen/noUiSlider "noUiSlider")
+ [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd "react-beautiful-dnd")
+ [DOMPurify](https://github.com/cure53/DOMPurify "DOMPurify")
+ [react-google-maps-api](https://github.com/JustFly1984/react-google-maps-api "react-google-maps-api")
+ [react-phone-input-2](https://github.com/bl00mber/react-phone-input-2 "react-phone-input-2")
+ [rrule.js](https://github.com/jakubroztocil/rrule "rrule.js")
+ [react-color](https://github.com/casesandberg/react-color "react-color")
+ [export-to-csv](https://github.com/alexcaza/export-to-csv "export-to-csv")
+ [autosuggest-highlight](https://github.com/moroshko/autosuggest-highlight "autosuggest-highlight")
+ [React-Clock](https://github.com/wojtekmaj/react-clock "React-Clock")
+ [Money](https://github.com/moneyphp/money "Money")