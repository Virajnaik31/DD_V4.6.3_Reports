# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: orderFulFilmentChecklist\case-048.spec.ts >> Case 048 - Order Fulfilment Flow
- Location: tests\orderFulFilmentChecklist\case-048.spec.ts:13:5

# Error details

```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /RELEASE MANIFEST/i }).first() to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Logo" [ref=e9]
      - generic [ref=e10]: MENU
      - list [ref=e12]:
        - link "Dashboard" [ref=e13] [cursor=pointer]:
          - /url: /oft-manager/dashboard
      - generic [ref=e18]: PAGES
      - list [ref=e20]:
        - link "Manifest Requests" [ref=e21] [cursor=pointer]:
          - /url: /oft-manager/manifest-request
        - link "Manifest Released" [ref=e26] [cursor=pointer]:
          - /url: /oft-manager/manifest-released
        - link "Payment Change Request" [ref=e31] [cursor=pointer]:
          - /url: /oft-manager/payment-change-request
        - link "Payment Change Accepted" [ref=e36] [cursor=pointer]:
          - /url: /oft-manager/payment-change-accepted
        - link "Payment Change Rejected" [ref=e41] [cursor=pointer]:
          - /url: /oft-manager/payment-change-rejected
      - paragraph [ref=e47]: © 2026 DealsDray
    - generic [ref=e48]:
      - banner [ref=e49]:
        - generic [ref=e50]:
          - generic [ref=e51]:
            - button [ref=e52] [cursor=pointer]
            - img "Logo" [ref=e55]
            - separator [ref=e56]
            - paragraph [ref=e57]: OFT MANAGER PANEL
          - generic [ref=e58]:
            - button [ref=e59] [cursor=pointer]
            - generic "Switch to dark mode" [ref=e63]:
              - checkbox "toggle dark mode" [ref=e68] [cursor=pointer]
            - paragraph [ref=e71]: OFT MGR AX
            - button "Account" [ref=e72] [cursor=pointer]:
              - generic [ref=e73]: O
      - main [ref=e74]:
        - generic [ref=e75]:
          - generic [ref=e76]:
            - generic [ref=e81]:
              - heading "Manifest Request" [level=6] [ref=e82]
              - text: OFT Manager Panel / Manifest Request
            - generic [ref=e85]:
              - textbox "Search" [ref=e89]: T2709000078
              - img [ref=e91] [cursor=pointer]
              - group
          - generic [ref=e96]:
            - text: Filters active •
            - strong [ref=e97]: "1"
            - text: results
          - generic [ref=e98]:
            - table [ref=e100]:
              - rowgroup [ref=e101]:
                - row [ref=e102]:
                  - columnheader "RECORD NO" [ref=e103]
                  - columnheader "SHIPPING MANIFEST" [ref=e104]
                  - columnheader "SHIPPING MODE INFO" [ref=e105]
                  - columnheader "NO. OF ORDERS" [ref=e106]
                  - columnheader "NO. OF UNITS" [ref=e107]
                  - columnheader "REQUESTED BY" [ref=e108]
                  - columnheader "MANIFEST REQUEST DATE" [ref=e109]
                  - columnheader "ACTION" [ref=e110]
              - rowgroup [ref=e111]:
                - row [ref=e112]:
                  - cell "1" [ref=e113]
                  - cell "# 19-09-26\\051" [ref=e114]
                  - cell "Local Delivery" [ref=e115]
                  - cell "1" [ref=e116]
                  - cell "1" [ref=e117]
                  - cell "OFT Alex" [ref=e118]
                  - cell "19/09/2026, 7:21:34 pm" [ref=e119]
                  - cell [ref=e120]:
                    - button "View Orders" [active] [ref=e121] [cursor=pointer]
            - generic [ref=e123]:
              - paragraph [ref=e124]: "Rows per page:"
              - generic [ref=e125]:
                - 'combobox "Rows per page: 25" [ref=e126] [cursor=pointer]': "25"
                - textbox: "25"
              - paragraph [ref=e127]: 1–1 of 1
              - generic [ref=e128]:
                - button "Go to previous page" [disabled]
                - button "Go to next page" [disabled]
      - contentinfo [ref=e129]: 2026 © DealsDray.
  - generic: 📍 https://appv4-6-3.dealsdray.com/oft-manager/manifest-request
```

# Test source

```ts
  467 | 
  468 |         const isDuplicate = await page.locator('text=Duplicate Invoice').isVisible().catch(() => false);
  469 |         await okBtnPackingSubmit.click();
  470 | 
  471 |         if (!isDuplicate) {
  472 |             invoiceSuccess = true;
  473 |             break;
  474 |         }
  475 |         console.log(`⚠️ Invoice ${correctInvoice} was duplicate, retrying with fresh unique invoice...`);
  476 |         await page.waitForTimeout(1000);
  477 |     }
  478 | 
  479 |     await page.getByRole('link', { name: 'Dashboard' }).click();
  480 |     await page.getByRole('link', { name: 'Orders Packed And Sent To OFT' }).click();
  481 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  482 |     await page.getByRole('columnheader', { name: 'ACTION' }).click();
  483 |     const viewDetailsPackedFinal = page.locator('table tbody tr').filter({ hasText: intentId }).getByRole('button', { name: /View Details/i }).first().or(page.getByRole('button', { name: 'View Details' }).first());
  484 |     await viewDetailsPackedFinal.scrollIntoViewIfNeeded().catch(() => { });
  485 |     await viewDetailsPackedFinal.click();
  486 |     await page.getByRole('heading', { name: 'SHIPPING / BILLING ADDRESS' }).click();
  487 |     await screenshot('packing_final_details');
  488 |     await page.getByRole('button', { name: 'Account' }).click();
  489 |     await page.getByRole('menuitem', { name: 'Sign out' }).click();
  490 | 
  491 |     // ── OFT login (Local Delivery Flow) ──────────────────────────────────────
  492 |     await page.getByRole('textbox', { name: 'Email Address' }).fill('oft+3025.alex.john@gmail.com');
  493 |     await page.getByRole('textbox', { name: 'Password' }).fill('oft+3025.alex.john@gmail.com');
  494 |     await page.getByRole('button', { name: 'Sign In' }).click();
  495 |     await page.getByRole('button', { name: 'Order Packing Status' }).click();
  496 |     await page.getByRole('link', { name: 'Order Packed', exact: true }).click();
  497 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  498 |     await page.getByRole('columnheader', { name: 'ACTION' }).click();
  499 | 
  500 |     const viewDetailsPacked = page.locator('table tbody tr').filter({ hasText: intentId }).getByRole('button', { name: /View Details/i }).first().or(page.getByRole('button', { name: 'View Details' }).first());
  501 |     await viewDetailsPacked.scrollIntoViewIfNeeded().catch(() => { });
  502 |     await viewDetailsPacked.click();
  503 |     await screenshot('oft_order_packed_details');
  504 | 
  505 |     await page.getByRole('textbox', { name: 'Remark' }).fill('Confirmed');
  506 |     await screenshot('oft_process_remark_filled');
  507 | 
  508 |     await page.getByRole('button', { name: 'READY TO SHIP', exact: true }).click();
  509 |     const okReadyToShip = page.getByRole('button', { name: 'OK' }).or(page.getByRole('button', { name: 'Ok' }));
  510 |     await okReadyToShip.waitFor({ state: 'visible' });
  511 |     await screenshot('oft_process_ready_to_ship_success');
  512 |     await okReadyToShip.click();
  513 | 
  514 |     let selectedRunnerName = '';
  515 |     const localOrderReadyLink = page.getByRole('link', { name: 'Local Order Ready To Ship', exact: true });
  516 |     if (!(await localOrderReadyLink.isVisible().catch(() => false))) {
  517 |         const orderReadyBtn = page.getByRole('button', { name: 'Order Ready To Ship Status', exact: true });
  518 |         await orderReadyBtn.scrollIntoViewIfNeeded().catch(() => { });
  519 |         await orderReadyBtn.click().catch(() => { });
  520 |     }
  521 |     await localOrderReadyLink.scrollIntoViewIfNeeded().catch(() => { });
  522 |     await localOrderReadyLink.click();
  523 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  524 | 
  525 |     const logisticsCombo = page.getByRole('combobox', { name: 'Logistics' });
  526 |     await logisticsCombo.click();
  527 |     await page.getByRole('option', { name: 'LOCAL DELIVERY' }).click();
  528 | 
  529 |     const selectDeliveryCombo = page.getByRole('combobox', { name: 'Select Delivery' });
  530 |     await selectDeliveryCombo.click();
  531 |     await page.getByRole('option').first().click();
  532 | 
  533 |     const oftDateButtons = page.getByRole('button', { name: 'Choose date' });
  534 |     if (await oftDateButtons.count() > 0) {
  535 |         await oftDateButtons.first().click().catch(() => { });
  536 |         await page.getByRole('gridcell', { name: todayDay, exact: true }).first().click().catch(() => { });
  537 |     }
  538 | 
  539 |     await page.getByRole('button', { name: 'SEARCH' }).click();
  540 |     await page.locator('tr').filter({ hasText: intentId }).getByRole('checkbox').check();
  541 |     await screenshot('oft_local_manifest_checked');
  542 | 
  543 |     await page.getByRole('button', { name: 'REQUEST MANIFEST' }).click();
  544 |     const okReqManifest = page.getByRole('button', { name: 'OK' }).or(page.getByRole('button', { name: 'Ok' }));
  545 |     await okReqManifest.waitFor({ state: 'visible' });
  546 |     await screenshot('oft_local_request_manifest_success');
  547 |     await okReqManifest.click();
  548 | 
  549 |     await page.getByRole('button', { name: 'Account' }).click();
  550 |     await page.getByRole('menuitem', { name: 'Sign out' }).click();
  551 | 
  552 |     // ── OFTMGR login (Release Manifest) ──────────────────────────────────────
  553 |     await page.getByRole('textbox', { name: 'Email Address' }).fill('oftmgr+3025.alex.john@gmail.com');
  554 |     await page.getByRole('textbox', { name: 'Password' }).fill('oftmgr+3025.alex.john@gmail.com');
  555 |     await page.getByRole('button', { name: 'Sign In' }).click();
  556 | 
  557 |     await page.getByRole('link', { name: 'Manifest Requests', exact: true }).click();
  558 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  559 |     await screenshot('oftmgr_manifest_requests_list');
  560 | 
  561 |     const viewOrdersPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
  562 |     await page.getByRole('button', { name: 'View Orders' }).click();
  563 |     const viewOrdersPage = await viewOrdersPromise;
  564 |     const targetPage = viewOrdersPage || page;
  565 |     await screenshot('oftmgr_manifest_orders_popup');
  566 |     const releaseBtn = targetPage.getByRole('button', { name: /RELEASE MANIFEST/i }).first();
> 567 |     await releaseBtn.waitFor({ state: 'visible', timeout: 15000 });
      |                      ^ TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
  568 |     await releaseBtn.click({ force: true });
  569 | 
  570 |     const okReleaseBtn = targetPage.getByRole('button', { name: 'OK' }).or(targetPage.getByRole('button', { name: 'Ok' })).or(targetPage.getByRole('button', { name: /OK/i })).first();
  571 |     await okReleaseBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
  572 |     if (await okReleaseBtn.isVisible().catch(() => false)) {
  573 |         await okReleaseBtn.click().catch(() => { });
  574 |         await targetPage.locator('.MuiBackdrop-root, [role="dialog"]').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => { });
  575 |     }
  576 |     await page.waitForTimeout(1500);
  577 | 
  578 |     if (targetPage && !targetPage.isClosed()) {
  579 |         await targetPage.close().catch(() => { });
  580 |     }
  581 | 
  582 |     await page.getByRole('link', { name: 'Dashboard' }).click();
  583 |     await page.getByRole('link', { name: 'Manifest Released', exact: true }).click();
  584 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  585 |     await page.getByRole('columnheader', { name: 'ACTION' }).click();
  586 |     await screenshot('oftmgr_manifest_released_verified');
  587 | 
  588 |     await page.getByRole('button', { name: 'Account' }).click();
  589 |     await page.getByRole('menuitem', { name: 'Sign out' }).click();
  590 | 
  591 |     // ── OFT login (Print Manifest & Shipped) ──────────────────────────────────
  592 |     await page.getByRole('textbox', { name: 'Email Address' }).fill('oft+3025.alex.john@gmail.com');
  593 |     await page.getByRole('textbox', { name: 'Password' }).fill('oft+3025.alex.john@gmail.com');
  594 |     await page.getByRole('button', { name: 'Sign In' }).click();
  595 | 
  596 |     const localOrderPrintLink = page.getByRole('link', { name: 'Local Order Pending For Manifest Print', exact: true });
  597 |     if (!(await localOrderPrintLink.isVisible().catch(() => false))) {
  598 |         const orderReadyBtn = page.getByRole('button', { name: 'Order Ready To Ship Status', exact: true });
  599 |         await orderReadyBtn.scrollIntoViewIfNeeded().catch(() => { });
  600 |         await orderReadyBtn.click().catch(() => { });
  601 |     }
  602 |     await localOrderPrintLink.scrollIntoViewIfNeeded().catch(() => { });
  603 |     await localOrderPrintLink.click();
  604 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  605 |     await page.getByRole('combobox', { name: 'Logistics' }).click();
  606 |     await page.getByRole('option', { name: 'LOCAL DELIVERY' }).click();
  607 | 
  608 |     const printDeliveryCombo = page.getByRole('combobox', { name: 'Select Delivery' });
  609 |     await printDeliveryCombo.click();
  610 |     await page.getByRole('option').first().click();
  611 | 
  612 |     const printDateButtons = page.getByRole('button', { name: 'Choose date' });
  613 |     if (await printDateButtons.count() > 0) {
  614 |         await printDateButtons.first().click().catch(() => { });
  615 |         await page.getByRole('gridcell', { name: todayDay, exact: true }).first().click().catch(() => { });
  616 |     }
  617 | 
  618 |     await page.getByRole('button', { name: 'SEARCH' }).click();
  619 |     await screenshot('oft_print_manifest_searched');
  620 | 
  621 |     const matchRow2 = page.locator('tr').filter({ hasText: intentId }).first();
  622 |     await matchRow2.waitFor({ state: 'visible', timeout: 15000 });
  623 |     const chk2 = matchRow2.getByRole('checkbox').or(matchRow2.locator('.MuiCheckbox-root, input[type="checkbox"]')).first();
  624 |     await chk2.click({ force: true }).catch(() => { });
  625 |     const chkInput2 = matchRow2.locator('input[type="checkbox"]').first();
  626 |     if (await chkInput2.count() > 0) {
  627 |         await chkInput2.check({ force: true }).catch(() => { });
  628 |     }
  629 | 
  630 |     const printManifestBtn = page.getByRole('button', { name: 'PRINT MANIFEST' });
  631 |     if (await printManifestBtn.isDisabled().catch(() => false)) {
  632 |         await matchRow2.locator('td').first().click({ force: true }).catch(() => { });
  633 |         await chk2.click({ force: true }).catch(() => { });
  634 |     }
  635 | 
  636 |     const printManifestPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null);
  637 |     await printManifestBtn.click();
  638 |     const printManifestPage = await printManifestPromise;
  639 |     if (printManifestPage && !printManifestPage.isClosed()) {
  640 |         await printManifestPage.waitForLoadState('domcontentloaded').catch(() => { });
  641 |         await printManifestPage.waitForTimeout(1000);
  642 |         await printManifestPage.close().catch(() => { });
  643 |     }
  644 |     await page.bringToFront().catch(() => { });
  645 |     await page.waitForTimeout(2500);
  646 | 
  647 |     // Direct sidebar transition to Local Order Assigned To Runner
  648 |     const localOrderRunnerLink = page.getByRole('link', { name: 'Local Order Assigned To Runner', exact: true });
  649 |     if (!(await localOrderRunnerLink.isVisible().catch(() => false))) {
  650 |         const orderShippedBtn = page.getByRole('button', { name: 'Order Shipped Status' });
  651 |         await orderShippedBtn.scrollIntoViewIfNeeded().catch(() => { });
  652 |         await orderShippedBtn.click().catch(() => { });
  653 |     }
  654 |     await localOrderRunnerLink.scrollIntoViewIfNeeded().catch(() => { });
  655 |     await localOrderRunnerLink.click();
  656 |     await page.getByRole('textbox', { name: 'Search' }).fill(intentId);
  657 |     await screenshot('oft_shipped_searched');
  658 | 
  659 |     const targetPickupRow = page.locator('tr').filter({ hasText: intentId }).first();
  660 |     const pickupChk = targetPickupRow.getByRole('checkbox').or(targetPickupRow.locator('.MuiCheckbox-root, input[type="checkbox"]')).first();
  661 |     const isChecked = await targetPickupRow.locator('input[type="checkbox"]').isChecked().catch(() => false);
  662 |     if (!isChecked) {
  663 |         await pickupChk.click({ force: true }).catch(() => { });
  664 |     }
  665 | 
  666 |     const shippedBtn = page.getByRole('button', { name: /^SHIPPED$/i })
  667 |         .or(page.locator('button').filter({ hasText: /^SHIPPED$/i }))
```