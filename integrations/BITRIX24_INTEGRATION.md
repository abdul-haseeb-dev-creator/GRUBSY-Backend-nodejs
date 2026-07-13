# Bitrix24 Integration

This document outlines the integration between the Grubsy backend and the Bitrix24 CRM.

## Overview

The Bitrix24 integration is responsible for syncing order and customer data from the Grubsy platform to the Bitrix24 CRM. This allows the Grubsy team to manage customer relationships, track sales, and handle support requests from a centralized location.

## Configuration

The Bitrix24 integration is configured using the following environment variable:

-   `BITRIX24_URL`: The webhook URL for your Bitrix24 instance. This should be in the format `https://your-bitrix24-domain.bitrix24.com/rest/your_user_id/your_webhook_code`.

**Important:** The `BITRIX24_URL` should **not** have a trailing slash.

## API Methods

The following API methods are used to interact with the Bitrix24 API:

-   `crm.deal.list`: Get a list of all deals (orders).
-   `crm.deal.add`: Create a new deal (order).
-   `crm.deal.get`: Get a single deal (order) by its ID.
-   `crm.deal.update`: Update an existing deal (order).

## Data Sync

The `syncService.js` file is responsible for periodically syncing data between SheetBest and Bitrix24. This service runs automatically and ensures that all new orders and customer information are promptly updated in the CRM.

## Troubleshooting

-   **"Method not found!" error:** This is typically caused by an incorrect `BITRIX24_URL`. Ensure that the URL is correctly formatted and does not contain a trailing slash.
-   **Authentication errors:** Verify that your Bitrix24 webhook has the necessary permissions to access the CRM API.
-   **500 Internal Server Error:** Check the backend logs for more detailed error messages. This may indicate a problem with the Bitrix24 API or a bug in the integration code.