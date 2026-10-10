# Ride Go → GoWise event reference

Every event the Ride Go web app sends through the GoWise Web SDK (`public/growise.js`, v1.1.0).
All custom events go through `app/composables/useTracking.ts` → `useGrowise().track()`; nothing calls
`window.growise` directly. The SDK is initialised once, in `app/plugins/growise.client.ts`.

**Delivery:** the app hands each event to `navigator.sendBeacon` for the configured endpoint
(`NUXT_PUBLIC_GROWISE_ENDPOINT`). Whether the GoWise backend accepts, stores or displays an event has
**not** been verified for this app. See "Verification status" at the end.

## Conventions

- Names are `snake_case`, past tense where they record something that happened (`booking_confirmed`).
- Money is in rupees (`INR`), as numbers. `currency: "INR"` accompanies fare amounts.
- **Ride context (RC)** is added to booking and trip events: `booking_id`, `ride_type`, `pickup_area`,
  `pickup_city`, `destination_area`, `destination_city`, `distance_km`, `estimated_fare`, `currency`.
- Every event also carries the SDK's own properties (`$session_id`, `$device_id`, `$url`, `$lib_version`,
  `$app_version`, …) and `$anon_id` (added by `useGrowise`).
- Not sent: payment details (none are collected), passwords (none exist), comments and support-ticket
  text, saved-place addresses (only `saved_places_count` goes to the profile).

## SDK automatic events

| Event | Trigger |
|---|---|
| `$init` | SDK initialised (once per page load) |
| `app_installed` | First load on a device |
| `app_opened` | Every full page load |
| `app_closed` | Browser `beforeunload` (SDK behaviour; also fires on refresh) |
| `$session_start` | New SDK session (30 min inactivity). Can be missed on the first load if the 100 ms timer fires before `init()` — an SDK issue, not fixed here |
| `$identify` | Sign-in/signup, and on load only when the SDK's stored user differs from the signed-in user |
| `$set` | Profile traits (`profilePush`): sign-in, profile edits, ride totals |

## Pages

| Event | Trigger | Properties |
|---|---|---|
| `page_viewed` | Each navigation and each full page load — **only** from the plugin (pages never send their own). Routes the booking-flow middleware redirects away from send none. | `page_name` (from the route pattern: `home`, `ride`, `ride_options`, `ride_booking`, `trip`, `payment`, `rating`, `activity`, `activity_id`, `wallet`, `offers`, `profile`, `auth_login`, `auth_signup`, `support`, `notifications`), `path` (no query string), `referrer`, `is_logged_in`, `booking_stage`, `booking_id` |

## Account

| Event | Trigger | Properties |
|---|---|---|
| `user_signed_up` | Signup form saved | `user_id`, `name`, `city`, `phone_masked` |
| `user_logged_in` | Demo account or email sign-in succeeds | `user_id`, `method` (`demo`/`email`), `is_returning_user` |
| `user_logged_out` | Sign Out on Account | `user_id`, `total_rides` |
| `profile_viewed` | Account page opened | — |
| `profile_updated` | Personal info saved **with changes** | `updated_fields` (only the changed ones) |
| `saved_place_added` | Home/Work/Other saved on Account | `place_type` |

Profile traits (`$set`): `total_rides`, `completed_rides`, `cancelled_rides`, `total_spend` (after payment),
`last_ride_date`, `favorite_ride_type`, `customer_type` (moves `new_user` → `active_user` → `frequent_rider`),
`wallet_balance` (live demo-wallet balance at sign-in), `last_rating_given`, `saved_places_count`.
Totals are always absolute (`$set`), never increments.

## Route and ride choice

| Event | Trigger | Properties |
|---|---|---|
| `ride_search_started` | Home booking card tapped | `pickup_city`, `destination_city` (from the draft, may be null) |
| `pickup_search_started` / `destination_search_started` | First query of 2+ characters in that field (once per search) | `query_length` |
| `pickup_search_completed` / `destination_search_completed` | A result from that search is picked | `query_length`, `results_count` |
| `pickup_location_selected` | Pickup chosen | `pickup_name`, `pickup_area`, `pickup_city`, `source` |
| `pickup_location_changed` | A different pickup replaces an existing one | `from_area`, `to_area`, `city` |
| `destination_selected` | Drop chosen | `destination_name`, `destination_area`, `destination_city`, `source` (`search`/`popular`/`saved`) |
| `saved_place_selected` | Saved place tapped (with `destination_selected`) | `place_type`, `area` |
| `ride_search_completed` | "See ride options" | `distance_km`, `duration_min`, `rides_count` |
| `route_viewed` | Ride options opened (route map shown) | `pickup_area`, `destination_area`, `distance_km` |
| `ride_options_viewed` | Ride options opened | `rides_count`, `cheapest_fare`, `distance_km` |
| `ride_type_selected` | A ride card is chosen (not re-sent for the already-selected card) | `ride_type`, `ride_label`, `estimated_fare`, `list_position`, `currency` |
| `ride_type_changed` | Selection moves to another ride type | `from_type`, `to_type`, `reason` |
| `ride_booked_again` | "Book again" from Home, My Rides or a receipt | `from_booking_id`, `pickup_area`, `destination_area`, `ride_type`, `source` (`home`/`history_list`/`receipt`) |

## Booking and coupons

| Event | Trigger | Properties |
|---|---|---|
| `booking_started` | "Book {ride}" on ride options | RC (`booking_id` null) |
| `booking_confirmation_viewed` | Confirm screen opened | RC |
| `fare_estimate_viewed` | Confirm screen opened (fare breakdown shown) | `ride_type`, `estimated_fare`, `distance_km`, `currency` |
| `payment_method_selected` | Rider picks a method. **Not** sent for the silent preselection of their last method, nor when re-picking the same one | `method`, `booking_id` |
| `coupon_selected` | Quick-coupon chip tapped | `coupon_code` |
| `coupon_applied` | Code passes every rule | `coupon_code`, `discount_amount`, `final_fare`, `currency` |
| `coupon_failed` | Unknown code or a rule fails | `coupon_code`, `failure_reason` (`invalid_code`, `min_fare_not_met`, `weekend_only`, `first_ride_only`) |
| `coupon_expired` | Expired code entered | `coupon_code` |
| `coupon_removed` | "Remove", or automatically when a route/ride change drops the fare below the coupon minimum | `coupon_code` |
| `booking_confirmed` | Booking created (once per booking; a second confirm is refused while one is active) | RC + `payment_method`, `final_fare`, `coupon_code`, `currency` |

## Trip lifecycle (simulated, timer-driven, resumes after refresh)

| Event | Trigger | Properties |
|---|---|---|
| `driver_search_started` | After confirmation | RC |
| `driver_assigned` | Driver matched (vehicle serves the ride type) | RC + `driver_id`, `driver_name`, `driver_rating`, `vehicle`, `vehicle_number`, `eta_minutes` |
| `driver_arriving` | Driver heading to pickup | `booking_id`, `eta_minutes` |
| `driver_arrived` | Driver at pickup | `booking_id`, `waited_seconds` (since confirmation) |
| `ride_started` | Trip starts | RC |
| `ride_in_progress` | Trip under way | `booking_id`, `elapsed_minutes` |
| `ride_completed` | Arrived at drop | RC + `duration_minutes`, `final_fare`, `currency` |
| `cancel_ride_started` | Cancel sheet opened | RC |
| `cancel_reason_selected` | Reason chosen (before pickup only) | RC + `reason` |
| `ride_cancelled` | Booking cancelled | RC + `cancellation_reason`, `cancelled_at_stage` |
| `checkout_abandoned` | A pre-booking draft untouched for 30 min — checked on start, navigation and tab focus, never on unload; once per draft | RC + `abandoned_at_stage`, `seconds_in_funnel` |

No lifecycle event is sent after `ride_cancelled` for that booking.

## Payment and wallet

| Event | Trigger | Properties |
|---|---|---|
| `payment_started` | Pay pressed (one attempt at a time) | RC + `method`, `attempt_number`, `amount`, `currency` |
| `payment_success` | Attempt succeeds (once per booking) | RC + `method`, `amount`, `currency` |
| `payment_failed` | Attempt fails | RC + `method`, `failure_reason` (`card_declined` via the dev panel, `insufficient_wallet`), `attempt_number` |
| `payment_retry` | "Try Again" after a failure | `booking_id`, `attempt_number` |
| `wallet_viewed` | Wallet opened | `balance`, `currency` |
| `wallet_money_added` | Demo top-up | `amount`, `new_balance`, `currency` |
| `wallet_payment_used` | Wallet debited for a ride (once per booking) | `amount`, `booking_id`, `currency` |

## Rating, receipts, offers, support, notifications

| Event | Trigger | Properties |
|---|---|---|
| `ride_rating_started` | Rating screen opened (paid rides only) | `booking_id`, `driver_id` |
| `driver_rated` + `ride_feedback_submitted` | Rating submitted (two events by design) | `booking_id`, `driver_id`, `rating`, `feedback_tags` / `booking_id`, `rating`, `has_comment` |
| `ride_receipt_viewed` | Trip detail page opened (receipt shown) | `booking_id`, `fare`, `currency` |
| `offers_viewed` | Offers opened | `offers_count` (active offers only) |
| `offer_claimed` | Offer card tapped (code copied) | `offer_id`, `coupon_code` |
| `help_opened` | Support opened (`general`) or a topic chosen | `topic`, `source_page` |
| `support_ticket_created` | Ticket saved (locally) | `topic`, `booking_id` |
| `notifications_viewed` / `notification_opened` | Notifications opened / one tapped | `notification_count` / `notification_id`, `type` |

## Defined but not sent

`user_profile_updated` (duplicate of `profile_updated`), `booking_failed` and `driver_assignment_failed`
(no failure paths exist in the simulation), `trip_details_viewed` (the receipt page sends `ride_receipt_viewed`),
`coupon_list_viewed` (the offers page sends `offers_viewed`).

## Verification status

- Verified in a real browser (headless Chrome against the production build): which events the SDK hands to
  `sendBeacon`, their properties, and that duplicate triggers are suppressed.
- **Not verified:** acceptance by the GoWise event service, persistence, and dashboard display. Locally the
  configured endpoint isn't running, so every beacon fails with `ERR_CONNECTION_REFUSED`.
