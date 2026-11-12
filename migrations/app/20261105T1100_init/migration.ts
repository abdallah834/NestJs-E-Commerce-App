#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2131d324dafb5643deb2d2f50f60af13e51f42a3dac4e1bcbeb4f0de0fe470e3/contract';
import endContract from '../../snapshots/2131d324dafb5643deb2d2f50f60af13e51f42a3dac4e1bcbeb4f0de0fe470e3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Coupon',
        columns: [
          col('couponName', 'character varying(50)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('couponType', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('createdBy', 'character varying(24)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
          col('deletedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('discount', 'numeric(5,2)', {
            notNull: true,
            default: fn(sql`0`),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('end_date', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('image', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('restoredAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('slug', 'character varying(50)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 50 } },
          }),
          col('start_date', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('updatedBy', 'character varying(24)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
          col('usage_amount', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('coupon_dates_valid_2e1151ac', sql`end_date > start_date`),
          checkExpression('coupon_discount_range_3d9ec299', sql`discount >= 0 AND discount <= 100`),
          checkExpression('coupon_name_length_7d438324', sql`char_length("couponName") >= 2`),
          checkExpression(
            'coupon_usage_amount_range_3b975147',
            sql`usage_amount >= 1 AND usage_amount <= 5`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'CouponUsage',
        columns: [
          col('couponId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('usedAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('userId', 'character varying(24)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Order',
        columns: [
          col('address', 'character varying(250)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 250 } },
          }),
          col('canceledAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('canceledByUserId', 'character varying(24)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
          col('canceledNote', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('couponId', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('createdBy', 'character varying(24)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
          col('currency', 'character varying(3)', {
            notNull: true,
            default: lit('EGP'),
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 3 } },
          }),
          col('deletedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('discount_percentage', 'numeric(5,2)', {
            notNull: true,
            default: fn(sql`0`),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('intentId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paidAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('paymentType', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('phoneNumber', 'character varying(11)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 11 } },
          }),
          col('refundedAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('restoredAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('status', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('sub_total', 'numeric(12,2)', {
            notNull: true,
            default: fn(sql`0`),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('total', 'numeric(12,2)', {
            notNull: true,
            default: fn(sql`0`),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('updatedBy', 'character varying(24)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('order_address_length_304ae6c8', sql`char_length(address) >= 10`),
          checkExpression(
            'order_discount_range_778f9eb7',
            sql`discount_percentage >= 0 AND discount_percentage <= 100`,
          ),
          checkExpression('order_phone_length_aeb499b4', sql`char_length("phoneNumber") = 11`),
          checkExpression('order_totals_non_negative_bcd828df', sql`sub_total >= 0 AND total >= 0`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'OrderItem',
        columns: [
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('orderId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('productId', 'character varying(24)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
          col('productName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('total', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
          col('unit_amount', 'numeric(12,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 12, scale: 2 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'order_item_amounts_non_negative_2b7bf382',
            sql`unit_amount >= 0 AND total >= 0`,
          ),
          checkExpression('order_item_quantity_positive_2a0d32c1', sql`quantity >= 1`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Stock',
        columns: [
          col('productId', 'character varying(24)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 24 } },
          }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['productId']),
          checkExpression('stock_quantity_non_negative_6553cc0b', sql`quantity >= 0`),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Coupon',
        constraint: 'Coupon_couponName_key',
        columns: ['couponName'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Order',
        constraint: 'Order_orderId_key',
        columns: ['orderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Order',
        constraint: 'Order_intentId_key',
        columns: ['intentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Coupon',
        index: 'Coupon_deletedAt_idx_a39f721c',
        columns: ['deletedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CouponUsage',
        index: 'CouponUsage_couponId_idx_a9dd19dc',
        columns: ['couponId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CouponUsage',
        index: 'CouponUsage_couponId_userId_idx_20f660ed',
        columns: ['couponId', 'userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'CouponUsage',
        index: 'CouponUsage_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_couponId_idx_a9dd19dc',
        columns: ['couponId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_createdBy_createdAt_idx_4fe3bb15',
        columns: ['createdBy', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_deletedAt_idx_a39f721c',
        columns: ['deletedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrderItem',
        index: 'OrderItem_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrderItem',
        index: 'OrderItem_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CouponUsage',
        foreignKey: {
          name: 'CouponUsage_couponId_fkey',
          columns: ['couponId'],
          references: { schema: 'public', table: 'Coupon', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'CouponUsage',
        foreignKey: {
          name: 'CouponUsage_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'Order', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Order',
        foreignKey: {
          name: 'Order_couponId_fkey',
          columns: ['couponId'],
          references: { schema: 'public', table: 'Coupon', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrderItem',
        foreignKey: {
          name: 'OrderItem_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'Order', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
