-- Apply once to an existing database created before overnight adjustments were added.
-- These two quantities are added back to physical stock for the prior business-day reconciliation.
alter table drink_audit_lines add column if not exists after_midnight_sales_quantity numeric(12,2) not null default 0;
alter table drink_audit_lines add column if not exists open_table_quantity numeric(12,2) not null default 0;

alter table drink_audit_lines drop column if exists variance;
alter table drink_audit_lines add column variance numeric(12,2) generated always as (
  opening_quantity + receipt_quantity - sales_quantity - loss_quantity
  - coalesce(actual_remaining, 0) - after_midnight_sales_quantity - open_table_quantity
) stored;
